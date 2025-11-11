use chrono;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub size: u64,
    pub url: String,
    pub quantization: String,
    pub description: String,
    pub requirements: ModelRequirements,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRequirements {
    pub min_ram: u64, // in MB
    pub recommended_ram: u64,
    pub supports_gpu: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModel {
    pub info: ModelInfo,
    pub path: PathBuf,
    pub downloaded_at: String,
    pub size_on_disk: u64,
}

pub struct ModelManager {
    models_dir: PathBuf,
    available_models: Arc<RwLock<Vec<ModelInfo>>>,
    local_models: Arc<RwLock<HashMap<String, LocalModel>>>,
    default_model_id: Arc<RwLock<Option<String>>>,
}

impl ModelManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let models_dir = dirs::data_dir()
            .ok_or("Could not determine data directory")?
            .join("otra")
            .join("models");

        std::fs::create_dir_all(&models_dir)?;

        let manager = Self {
            models_dir: models_dir.clone(),
            available_models: Arc::new(RwLock::new(Self::get_default_models())),
            local_models: Arc::new(RwLock::new(HashMap::new())),
            default_model_id: Arc::new(RwLock::new(None)),
        };

        // Load local models from disk
        let _ = manager.scan_local_models();

        // Load default model preference
        let _ = manager.load_default_model_preference();

        Ok(manager)
    }

    fn get_default_models() -> Vec<ModelInfo> {
        vec![
            ModelInfo {
                id: "qwen2.5-0.5b-q4".to_string(),
                name: "Qwen 2.5 0.5B (Q4_K_M)".to_string(),
                size: 350 * 1024 * 1024, // 350MB
                url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Smallest and fastest model, good for quick summaries".to_string(),
                requirements: ModelRequirements {
                    min_ram: 512,
                    recommended_ram: 1024,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "phi-3.5-mini-q4".to_string(),
                name: "Phi-3.5 Mini (Q4_K_M)".to_string(),
                size: 1024 * 1024 * 1024, // 1GB
                url: "https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Balanced model with good performance".to_string(),
                requirements: ModelRequirements {
                    min_ram: 2048,
                    recommended_ram: 4096,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "llama-3.2-1b-q4".to_string(),
                name: "Llama 3.2 1B (Q4_K_M)".to_string(),
                size: 700 * 1024 * 1024, // 700MB
                url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Latest Llama model with excellent quality".to_string(),
                requirements: ModelRequirements {
                    min_ram: 1024,
                    recommended_ram: 2048,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "qwen2.5-3b-q4".to_string(),
                name: "Qwen 2.5 3B (Q4_K_M) - Korean Optimized".to_string(),
                size: 2 * 1024 * 1024 * 1024, // 2GB
                url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Larger model with excellent Korean language support and multilingual capabilities".to_string(),
                requirements: ModelRequirements {
                    min_ram: 4096,
                    recommended_ram: 8192,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "qwen2.5-7b-q4".to_string(),
                name: "Qwen 2.5 7B (Q4_K_M) - Multilingual".to_string(),
                size: 4681944064, // ~4.36GB
                url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Excellent multilingual support for 29+ languages including Korean, balanced size/quality".to_string(),
                requirements: ModelRequirements {
                    min_ram: 6144,
                    recommended_ram: 8192,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "phi4-mini-q4".to_string(),
                name: "Phi-4 Mini (Q4_K_M) - Microsoft".to_string(),
                size: 8063647744, // ~7.5GB
                url: "https://huggingface.co/microsoft/phi-4-gguf/resolve/main/phi-4-q4.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Microsoft's latest with strong multilingual support including Korean, efficient architecture".to_string(),
                requirements: ModelRequirements {
                    min_ram: 8192,
                    recommended_ram: 12288,
                    supports_gpu: true,
                },
            },
            ModelInfo {
                id: "qwen3-8b-q4".to_string(),
                name: "Qwen 3 8B (Q4_K_M) - Enhanced Reasoning".to_string(),
                size: 5396266624, // ~5GB
                url: "https://huggingface.co/bartowski/Qwen_Qwen3-8B-GGUF/resolve/main/Qwen_Qwen3-8B-Q4_K_M.gguf".to_string(),
                quantization: "Q4_K_M".to_string(),
                description: "Latest Qwen3 with improved reasoning, thinking mode support, excellent Korean/multilingual".to_string(),
                requirements: ModelRequirements {
                    min_ram: 6144,
                    recommended_ram: 8192,
                    supports_gpu: true,
                },
            },
        ]
    }

    pub async fn get_available_models(&self) -> Result<Vec<ModelInfo>, Box<dyn std::error::Error>> {
        Ok(self.available_models.read().await.clone())
    }

    pub async fn get_local_models(&self) -> Result<Vec<LocalModel>, Box<dyn std::error::Error>> {
        Ok(self.local_models.read().await.values().cloned().collect())
    }

    pub async fn get_model_by_id(&self, id: &str) -> Option<ModelInfo> {
        self.available_models
            .read()
            .await
            .iter()
            .find(|m| m.id == id)
            .cloned()
    }

    #[allow(dead_code)]
    pub async fn get_local_model(&self, id: &str) -> Option<LocalModel> {
        self.local_models.read().await.get(id).cloned()
    }

    pub async fn get_default_model(
        &self,
    ) -> Result<Option<LocalModel>, Box<dyn std::error::Error>> {
        let default_id = self.default_model_id.read().await;
        let local_models = self.local_models.read().await;

        // If a default is set, try to return it
        if let Some(id) = default_id.as_ref() {
            if let Some(model) = local_models.get(id) {
                return Ok(Some(model.clone()));
            }
        }

        // Otherwise return first available local model
        Ok(local_models.values().next().cloned())
    }

    pub async fn get_default_model_id(&self) -> Option<String> {
        self.default_model_id.read().await.clone()
    }

    pub async fn set_default_model(&self, model_id: String) -> Result<(), Box<dyn std::error::Error>> {
        // Verify the model exists locally
        let local_models = self.local_models.read().await;
        if !local_models.contains_key(&model_id) {
            return Err("Model not found locally".into());
        }
        drop(local_models);

        // Set the default
        *self.default_model_id.write().await = Some(model_id);

        // Save to disk
        self.save_default_model_preference().await
    }

    fn load_default_model_preference(&self) -> Result<(), Box<dyn std::error::Error>> {
        let pref_path = self.models_dir.join("default_model.txt");
        if pref_path.exists() {
            let content = std::fs::read_to_string(&pref_path)?;
            let model_id = content.trim().to_string();
            if !model_id.is_empty() {
                *self.default_model_id.blocking_write() = Some(model_id);
            }
        }
        Ok(())
    }

    async fn save_default_model_preference(&self) -> Result<(), Box<dyn std::error::Error>> {
        let pref_path = self.models_dir.join("default_model.txt");
        let default_id = self.default_model_id.read().await;

        if let Some(id) = default_id.as_ref() {
            std::fs::write(pref_path, id)?;
        } else {
            // Remove file if no default is set
            if pref_path.exists() {
                std::fs::remove_file(pref_path)?;
            }
        }

        Ok(())
    }

    pub fn get_model_path(&self, model_id: &str) -> PathBuf {
        self.models_dir.join(format!("{}.gguf", model_id))
    }

    pub async fn register_downloaded_model(
        &self,
        info: ModelInfo,
        path: PathBuf,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let size_on_disk = std::fs::metadata(&path)?.len();

        let local_model = LocalModel {
            info: info.clone(),
            path,
            downloaded_at: chrono::Local::now().to_rfc3339(),
            size_on_disk,
        };

        self.local_models.write().await.insert(info.id, local_model);
        self.save_local_models_index().await?;

        Ok(())
    }

    pub async fn delete_model(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut local_models = self.local_models.write().await;

        if let Some(model) = local_models.remove(id) {
            // Delete the file
            if model.path.exists() {
                std::fs::remove_file(model.path)?;
            }

            // Delete any partial downloads
            let partial_path = self.models_dir.join(format!("{}.gguf.part", id));
            if partial_path.exists() {
                std::fs::remove_file(partial_path)?;
            }
        }

        drop(local_models);
        self.save_local_models_index().await?;

        Ok(())
    }

    fn scan_local_models(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Load the models index from disk
        let index_path = self.models_dir.join("models.json");

        if index_path.exists() {
            let json_data = std::fs::read_to_string(&index_path)?;
            if let Ok(models_map) = serde_json::from_str::<HashMap<String, LocalModel>>(&json_data)
            {
                // Load the models into memory
                let mut local_models = self.local_models.blocking_write();
                *local_models = models_map;
            }
        }

        // Also scan for GGUF files that might not be in the index
        if let Ok(entries) = std::fs::read_dir(&self.models_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("gguf") {
                        // Check if this model is already loaded
                        let file_name = path
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("")
                            .to_string();

                        let local_models = self.local_models.blocking_read();
                        if !local_models.contains_key(&file_name) {
                            drop(local_models);

                            // Try to find matching model info by id; otherwise register as generic local model
                            let available_models = self.available_models.blocking_read();
                            let matched = available_models.iter().find(|m| m.id == file_name).cloned();
                            drop(available_models);

                            let size_on_disk = std::fs::metadata(&path)?.len();

                            let info = matched.unwrap_or(ModelInfo {
                                id: file_name.clone(),
                                name: file_name.clone(),
                                size: size_on_disk,
                                url: String::new(),
                                quantization: "unknown".to_string(),
                                description: "Detected local GGUF model".to_string(),
                                requirements: ModelRequirements {
                                    min_ram: 512,
                                    recommended_ram: 1024,
                                    supports_gpu: true,
                                },
                            });

                            let local_model = LocalModel {
                                info: info.clone(),
                                path: path.clone(),
                                downloaded_at: chrono::Local::now().to_rfc3339(),
                                size_on_disk,
                            };

                            let mut local_models = self.local_models.blocking_write();
                            local_models.insert(info.id.clone(), local_model);
                        }
                    }
                }
            }
        }

        Ok(())
    }

    async fn save_local_models_index(&self) -> Result<(), Box<dyn std::error::Error>> {
        let index_path = self.models_dir.join("models.json");
        let models = self.local_models.read().await;
        let json = serde_json::to_string_pretty(&*models)?;
        std::fs::write(index_path, json)?;
        Ok(())
    }

    pub fn get_storage_usage(&self) -> Result<u64, Box<dyn std::error::Error>> {
        let mut total = 0u64;

        if let Ok(entries) = std::fs::read_dir(&self.models_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    if let Ok(metadata) = entry.metadata() {
                        total += metadata.len();
                    }
                }
            }
        }

        Ok(total)
    }
}
