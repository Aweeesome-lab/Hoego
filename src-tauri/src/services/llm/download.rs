use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_id: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percentage: f32,
    pub speed: f32, // MB/s
    pub eta_seconds: Option<u64>,
    pub status: DownloadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed(String),
    Verifying,
}

pub struct ModelDownloader {
    client: Client,
    active_downloads: Arc<Mutex<Vec<ActiveDownload>>>,
}

#[allow(dead_code)]
struct ActiveDownload {
    model_id: String,
    cancelled: Arc<AtomicBool>,
    progress: Arc<Mutex<DownloadProgress>>,
}

impl Default for ModelDownloader {
    fn default() -> Self {
        Self::new()
    }
}

impl ModelDownloader {
    pub fn new() -> Self {
        Self {
            // Use no timeout for streaming downloads (timeout per chunk is handled by stream)
            client: Client::builder()
                .connect_timeout(std::time::Duration::from_secs(30))
                .timeout(std::time::Duration::from_secs(3600)) // 1 hour for very large models
                .build()
                .unwrap(),
            active_downloads: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub async fn download_model<F>(
        &self,
        model_id: String,
        url: String,
        dest: PathBuf,
        progress_callback: F,
    ) -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>>
    where
        F: Fn(DownloadProgress) + Send + 'static,
    {
        let partial_path = dest.with_extension("part");

        // Check if partial download exists
        let resume_from = if partial_path.exists() {
            std::fs::metadata(&partial_path)?.len()
        } else {
            0
        };

        // Create progress tracker
        let progress = Arc::new(Mutex::new(DownloadProgress {
            model_id: model_id.clone(),
            bytes_downloaded: resume_from,
            total_bytes: 0,
            percentage: 0.0,
            speed: 0.0,
            eta_seconds: None,
            status: DownloadStatus::Pending,
        }));

        // Create cancellation flag
        let cancelled = Arc::new(AtomicBool::new(false));

        // Register active download
        {
            let mut downloads = self.active_downloads.lock().await;
            downloads.push(ActiveDownload {
                model_id: model_id.clone(),
                cancelled: cancelled.clone(),
                progress: progress.clone(),
            });
        }

        // Build request with resume support
        let mut request = self.client.get(&url);
        if resume_from > 0 {
            request = request.header("Range", format!("bytes={}-", resume_from));
        }

        // Send request with retry logic
        let mut retry_count = 0;
        let max_retries = 3;
        let response = loop {
            match request.try_clone().unwrap().send().await {
                Ok(resp) => break resp,
                Err(e) => {
                    retry_count += 1;
                    if retry_count >= max_retries {
                        return Err(format!(
                            "Failed to download after {} retries: {}",
                            max_retries, e
                        )
                        .into());
                    }
                    eprintln!(
                        "Download attempt {} failed: {}. Retrying...",
                        retry_count, e
                    );
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                }
            }
        };

        // Get total size
        let total_size = response.content_length().unwrap_or(0) + resume_from;

        // Update progress
        {
            let mut p = progress.lock().await;
            p.total_bytes = total_size;
            p.status = DownloadStatus::Downloading;
        }

        // Open file for writing
        let mut file = tokio::fs::OpenOptions::new()
            .create(true)
            .write(true)
            .append(resume_from > 0)
            .open(&partial_path)
            .await?;

        // Download with progress
        let mut stream = response.bytes_stream();
        let mut downloaded = resume_from;
        let start_time = std::time::Instant::now();
        let mut last_update = std::time::Instant::now();

        while let Some(chunk) = stream.next().await {
            // Check for cancellation
            if cancelled.load(Ordering::Relaxed) {
                return Err("Download cancelled".into());
            }

            let chunk = match chunk {
                Ok(data) => data,
                Err(e) => {
                    eprintln!(
                        "Error downloading chunk: {}. Download may resume from current position.",
                        e
                    );
                    return Err(format!(
                        "Download interrupted: {}. Please try again to resume.",
                        e
                    )
                    .into());
                }
            };
            tokio::io::AsyncWriteExt::write_all(&mut file, &chunk).await?;
            downloaded += chunk.len() as u64;

            // Update progress every 100ms
            if last_update.elapsed() > std::time::Duration::from_millis(100) {
                let elapsed = start_time.elapsed().as_secs_f32();
                let speed = (downloaded - resume_from) as f32 / elapsed / 1024.0 / 1024.0; // MB/s
                let eta = if speed > 0.0 {
                    Some(((total_size - downloaded) as f32 / (speed * 1024.0 * 1024.0)) as u64)
                } else {
                    None
                };

                let mut p = progress.lock().await;
                p.bytes_downloaded = downloaded;
                p.percentage = (downloaded as f32 / total_size as f32) * 100.0;
                p.speed = speed;
                p.eta_seconds = eta;

                progress_callback(p.clone());
                last_update = std::time::Instant::now();
            }
        }

        // Flush and sync
        file.sync_all().await?;
        drop(file);

        // Update status
        {
            let mut p = progress.lock().await;
            p.status = DownloadStatus::Verifying;
            p.percentage = 100.0;
            progress_callback(p.clone());
        }

        // Move file to final destination
        tokio::fs::rename(&partial_path, &dest).await?;

        // Update final status
        {
            let mut p = progress.lock().await;
            p.status = DownloadStatus::Completed;
            progress_callback(p.clone());
        }

        // Remove from active downloads
        {
            let mut downloads = self.active_downloads.lock().await;
            downloads.retain(|d| d.model_id != model_id);
        }

        Ok(dest)
    }

    #[allow(dead_code)]
    pub async fn cancel_download(
        &self,
        model_id: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let downloads = self.active_downloads.lock().await;

        if let Some(download) = downloads.iter().find(|d| d.model_id == model_id) {
            download.cancelled.store(true, Ordering::Relaxed);
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn get_active_downloads(&self) -> Vec<DownloadProgress> {
        let downloads = self.active_downloads.lock().await;
        let mut result = Vec::new();

        for download in downloads.iter() {
            let progress = download.progress.lock().await;
            result.push(progress.clone());
        }

        result
    }
}

// Public function for easier access
pub async fn download_model(
    model_id: String,
    url: String,
    dest: PathBuf,
    progress_callback: impl Fn(DownloadProgress) + Send + 'static,
) -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    let downloader = ModelDownloader::new();
    downloader
        .download_model(model_id, url, dest, progress_callback)
        .await
}
