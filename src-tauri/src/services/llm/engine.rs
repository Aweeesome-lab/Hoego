use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::path::Path;

#[derive(Debug)]
pub struct LlamaCppEngine {
    binary_path: Option<PathBuf>,
    model_path: Option<PathBuf>,
    process: Option<Child>,
    config: super::LLMConfig,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
struct LlamaRequest {
    method: String,
    params: Value,
    id: u64,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct LlamaResponse {
    result: Option<Value>,
    error: Option<String>,
    id: u64,
}

impl LlamaCppEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mut s = Self {
            binary_path: None,
            model_path: None,
            process: None,
            config: super::LLMConfig::default(),
        };
        // Auto-detect reasonable CPU threads
        let threads = num_cpus::get_physical().max(1);
        s.config.cpu_threads = threads;
        Ok(s)
    }

    pub fn ensure_binary_exists(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let binary_name = Self::get_binary_name();
        let binary_path = Self::get_binary_path()?;

        eprintln!("LLM Binary - Name: {}", binary_name);
        eprintln!("LLM Binary - Path: {:?}", binary_path);

        if !binary_path.exists() {
            eprintln!("LLM Binary - Extracting binary to {:?}", binary_path);
            self.extract_binary(&binary_path)?;
            eprintln!("LLM Binary - Extraction complete");
        } else {
            eprintln!("LLM Binary - Already exists at {:?}", binary_path);
        }

        // Verify the binary is executable
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let metadata = std::fs::metadata(&binary_path)?;
            let perms = metadata.permissions();
            eprintln!("LLM Binary - Permissions: {:o}", perms.mode());
        }

        self.binary_path = Some(binary_path);
        Ok(())
    }

    fn get_binary_name() -> &'static str {
        #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
        return "llama-server";

        #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
        return "llama-server-darwin-x64";

        #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
        return "llama-server-windows-x64.exe";

        #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
        return "llama-server-linux-x64";

        #[cfg(not(any(
            all(target_os = "macos", target_arch = "aarch64"),
            all(target_os = "macos", target_arch = "x86_64"),
            all(target_os = "windows", target_arch = "x86_64"),
            all(target_os = "linux", target_arch = "x86_64")
        )))]
        panic!("Unsupported platform");
    }

    fn get_binary_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let data_dir = dirs::data_dir().ok_or("Could not determine data directory")?;

        let hoego_dir = data_dir.join("hoego").join("llm");
        std::fs::create_dir_all(&hoego_dir)?;

        Ok(hoego_dir.join(Self::get_binary_name()))
    }

    fn get_cache_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let data_dir = dirs::data_dir().ok_or("Could not determine data directory")?;
        let cache_dir = data_dir.join("hoego").join("llm");
        std::fs::create_dir_all(&cache_dir)?;
        Ok(cache_dir.join("prompt-cache.bin"))
    }

    fn binary_supports_prompt_cache(binary_path: &Path) -> bool {
        match Command::new(binary_path).arg("-h").output() {
            Ok(out) => {
                let help = String::from_utf8_lossy(&out.stdout);
                help.contains("--prompt-cache") || help.contains("--pcache")
            }
            Err(_) => false,
        }
    }

    fn extract_binary(&self, target_path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        // Extract the embedded binary and dependencies based on platform
        #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
        {
            // Embed all required files
            let embedded_binary = include_bytes!("../../../binaries/build/bin/llama-server");
            let embedded_libggml_base = include_bytes!("../../../binaries/build/bin/libggml-base.dylib");
            let embedded_libggml_blas = include_bytes!("../../../binaries/build/bin/libggml-blas.dylib");
            let embedded_libggml_cpu = include_bytes!("../../../binaries/build/bin/libggml-cpu.dylib");
            let embedded_libggml_metal = include_bytes!("../../../binaries/build/bin/libggml-metal.dylib");
            let embedded_libggml_rpc = include_bytes!("../../../binaries/build/bin/libggml-rpc.dylib");
            let embedded_libggml = include_bytes!("../../../binaries/build/bin/libggml.dylib");
            let embedded_libllama = include_bytes!("../../../binaries/build/bin/libllama.dylib");
            let embedded_libmtmd = include_bytes!("../../../binaries/build/bin/libmtmd.dylib");
            let embedded_metal_shader = include_bytes!("../../../binaries/build/bin/ggml-metal.metal");

            // Write binary
            std::fs::write(target_path, embedded_binary)?;

            // Write dylibs to same directory
            let target_dir = target_path.parent().ok_or("Invalid target path")?;
            std::fs::write(target_dir.join("libggml-base.dylib"), embedded_libggml_base)?;
            std::fs::write(target_dir.join("libggml-blas.dylib"), embedded_libggml_blas)?;
            std::fs::write(target_dir.join("libggml-cpu.dylib"), embedded_libggml_cpu)?;
            std::fs::write(target_dir.join("libggml-metal.dylib"), embedded_libggml_metal)?;
            std::fs::write(target_dir.join("libggml-rpc.dylib"), embedded_libggml_rpc)?;
            std::fs::write(target_dir.join("libggml.dylib"), embedded_libggml)?;
            std::fs::write(target_dir.join("libllama.dylib"), embedded_libllama)?;
            std::fs::write(target_dir.join("libmtmd.dylib"), embedded_libmtmd)?;
            std::fs::write(target_dir.join("ggml-metal.metal"), embedded_metal_shader)?;

            // Make binary executable
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(target_path)?.permissions();
            perms.set_mode(0o755);
            std::fs::set_permissions(target_path, perms)?;
        }

        #[cfg(not(all(target_os = "macos", target_arch = "aarch64")))]
        {
            let embedded_binary = include_bytes!("../../../binaries/placeholder");
            std::fs::write(target_path, embedded_binary)?;

            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(target_path)?.permissions();
                perms.set_mode(0o755);
                std::fs::set_permissions(target_path, perms)?;
            }
        }

        Ok(())
    }

    pub fn load_model(&mut self, model_path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        // Ensure the bundled llama.cpp binary is extracted before trying to spawn it
        self.ensure_binary_exists()?;

        if !model_path.exists() {
            return Err(format!("Model file does not exist: {:?}", model_path).into());
        }

        // Adjust configuration based on model name
        let model_name = model_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        // Update config based on model type
        if model_name.contains("qwen3") || model_name.contains("Qwen3") || model_name.contains("Qwen_Qwen3") {
            // Qwen3 models support longer context and better reasoning
            self.config.max_context = 12288; // 충분한 여유, 과도한 ctx로 인한 속도 저하 방지
            self.config.max_tokens = 4096; // 응답 길이 최대로 허용
            self.config.gpu_layers = 999; // 가능한 전층 GPU 오프로딩
            eprintln!("LLM Config - Using Qwen3 configuration");
        } else if model_name.contains("qwen2.5-7b") {
            self.config.max_context = 12288;
            self.config.max_tokens = 4096;
            self.config.gpu_layers = 999;
            eprintln!("LLM Config - Using Qwen2.5-7B configuration");
        } else if model_name.contains("qwen2.5-3b") {
            self.config.max_context = 8192;
            self.config.max_tokens = 2048;
            self.config.gpu_layers = 999;
            eprintln!("LLM Config - Using Qwen2.5-3B configuration");
        } else if model_name.contains("phi") {
            self.config.max_context = 16384;
            self.config.max_tokens = 2048;
            eprintln!("LLM Config - Using Phi configuration");
        } else {
            // Default for smaller models
            self.config.max_context = 8192;
            self.config.max_tokens = 2048;
            eprintln!("LLM Config - Using default configuration");
        }

        eprintln!("LLM Config - Model: {}, Context: {}, Max Tokens: {}",
                 model_name, self.config.max_context, self.config.max_tokens);

        self.model_path = Some(model_path);

        // Retry mechanism: try up to 3 times with exponential backoff
        let max_retries = 3;
        let mut last_error = None;

        for attempt in 1..=max_retries {
            eprintln!("LLM - Load model attempt {}/{}", attempt, max_retries);

            match self.start_process() {
                Ok(_) => {
                    eprintln!("LLM - Successfully started on attempt {}", attempt);
                    return Ok(());
                }
                Err(e) => {
                    eprintln!("LLM - Attempt {} failed: {}", attempt, e);
                    last_error = Some(e);

                    if attempt < max_retries {
                        // Exponential backoff: 1s, 2s, 4s
                        let wait_ms = 1000 * (1 << (attempt - 1));
                        eprintln!("LLM - Waiting {}ms before retry...", wait_ms);
                        std::thread::sleep(std::time::Duration::from_millis(wait_ms));
                    }
                }
            }
        }

        // All retries failed
        Err(format!(
            "Failed to load model after {} attempts. Last error: {}",
            max_retries,
            last_error.unwrap()
        ).into())
    }

    pub fn is_running(&self) -> bool {
        if let Some(ref process) = self.process {
            // Cast away mutability for try_wait - this is a read-only check
            let process_ptr = process as *const Child as *mut Child;
            unsafe {
                match (*process_ptr).try_wait() {
                    Ok(None) => true, // Process is still running
                    _ => false,       // Process has exited or error occurred
                }
            }
        } else {
            false
        }
    }

    pub async fn wait_for_ready(&self) -> Result<bool, Box<dyn std::error::Error>> {
        eprintln!("LLM - Checking if server is ready...");

        // First check if the process is running
        if !self.is_running() {
            eprintln!("LLM - Server process is not running");
            return Ok(false);
        }

        let client = reqwest::Client::new();
        let response = client
            .get("http://127.0.0.1:8080/health")
            .timeout(std::time::Duration::from_secs(2))
            .send()
            .await;

        match response {
            Ok(resp) if resp.status().is_success() => {
                eprintln!("LLM - Server is ready");
                Ok(true)
            }
            Ok(resp) => {
                eprintln!("LLM - Server returned status: {}", resp.status());
                Ok(false)
            }
            Err(e) => {
                eprintln!("LLM - Server not ready yet: {}", e);
                Ok(false)
            }
        }
    }

    fn start_process(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Stop existing process if running
        self.stop_process()?;

        let binary_path = self.binary_path.as_ref().ok_or("Binary path not set")?;
        let model_path = self.model_path.as_ref().ok_or("Model path not set")?;

        // Verify model file exists and get size
        if !model_path.exists() {
            return Err(format!("Model file does not exist: {:?}", model_path).into());
        }
        let model_size = std::fs::metadata(model_path)?.len();
        eprintln!("LLM Starting - Model file size: {} bytes ({:.2} GB)",
            model_size, model_size as f64 / (1024.0 * 1024.0 * 1024.0));

        // Check if port 8080 is already in use
        if Self::is_port_in_use(8080) {
            eprintln!("LLM Warning - Port 8080 is already in use, attempting to kill existing process");
            // Try to stop any existing llama-server process
            #[cfg(unix)]
            {
                let _ = Command::new("pkill")
                    .arg("-f")
                    .arg("llama-server")
                    .output();
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        }

        eprintln!("LLM Starting - Binary: {:?}", binary_path);
        eprintln!("LLM Starting - Model: {:?}", model_path);

        let mut cmd = Command::new(binary_path);
        cmd.arg("-m")
            .arg(model_path)
            .arg("-c")
            .arg(self.config.max_context.to_string())
            .arg("-n")
            .arg(self.config.max_tokens.to_string())
            .arg("-t")
            .arg(self.config.cpu_threads.to_string())
            .arg("--temp")
            .arg(self.config.temperature.to_string())
            .arg("--port")
            .arg("8080")
            .arg("--host")
            .arg("127.0.0.1");

        // Add special handling for Qwen models
        let model_name = model_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        // For Qwen models, we need to use jinja template
        if model_name.contains("qwen") || model_name.contains("Qwen") {
            // Add jinja flag for Qwen models (required for Qwen3)
            cmd.arg("--jinja");
            eprintln!("LLM Starting - Qwen model detected, enabling jinja template");
        }

        cmd.stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if self.config.gpu_layers > 0 {
            cmd.arg("-ngl").arg(self.config.gpu_layers.to_string());
        }
        // Enable prompt cache only if this llama-server supports the flag
        if Self::binary_supports_prompt_cache(binary_path) {
            if let Ok(cache_path) = Self::get_cache_path() {
                cmd.arg("--prompt-cache").arg(cache_path);
                cmd.arg("--prompt-cache-all");
            }
        } else {
            eprintln!("LLM Info - prompt cache flags not supported by this llama-server; skipping");
        }

        eprintln!("LLM Starting - Spawning process...");
        eprintln!("LLM Starting - Command: {:?}", cmd);

        let mut child = cmd.spawn().map_err(|e| {
            eprintln!("LLM Error - Failed to spawn process: {}", e);
            eprintln!("LLM Error - Command was: {:?}", binary_path);
            eprintln!("LLM Error - Model was: {:?}", model_path);
            e
        })?;

        eprintln!("LLM Starting - Process spawned, waiting for initialization...");

        // Give it more time to initialize (especially for large models)
        std::thread::sleep(std::time::Duration::from_millis(500));

        // Check if process crashed immediately and capture output
        if let Ok(Some(status)) = child.try_wait() {
            eprintln!("LLM Error - Process exited immediately with status: {:?}", status);

            // Try to read stderr/stdout for more details
            use std::io::Read;
            let mut stderr_output = String::new();
            let mut stdout_output = String::new();

            if let Some(mut stderr) = child.stderr.take() {
                let _ = stderr.read_to_string(&mut stderr_output);
            }
            if let Some(mut stdout) = child.stdout.take() {
                let _ = stdout.read_to_string(&mut stdout_output);
            }

            if !stderr_output.is_empty() {
                eprintln!("LLM Error - stderr: {}", stderr_output);
            }
            if !stdout_output.is_empty() {
                eprintln!("LLM Error - stdout: {}", stdout_output);
            }

            return Err(format!(
                "llama.cpp process crashed on startup: {:?}\nstderr: {}\nstdout: {}",
                status, stderr_output, stdout_output
            ).into());
        }

        self.process = Some(child);
        eprintln!("LLM Starting - Process is running, server will initialize in background");

        Ok(())
    }

    fn is_port_in_use(port: u16) -> bool {
        use std::net::TcpListener;
        TcpListener::bind(("127.0.0.1", port)).is_err()
    }

    pub fn stop_process(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(mut process) = self.process.take() {
            process.kill()?;
            process.wait()?;
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn complete(&mut self, prompt: String) -> Result<String, Box<dyn std::error::Error>> {
        if self.process.is_none() {
            return Err("No model loaded".into());
        }

        // Log the request for debugging
        eprintln!("LLM Request - Prompt length: {}", prompt.len());
        eprintln!("LLM Request - Max tokens: {}", self.config.max_tokens);

        // Call the llama.cpp server HTTP API
        let client = reqwest::Client::new();

        let request_body = serde_json::json!({
            "prompt": prompt,
            "n_predict": self.config.max_tokens,
            "temperature": self.config.temperature,
            "stop": ["</s>", "<|im_end|>", "<|endoftext|>"],
            "stream": false
        });

        eprintln!("LLM Request - Sending to http://127.0.0.1:8080/completion");

        let response = client
            .post("http://127.0.0.1:8080/completion")
            .json(&request_body)
            .timeout(std::time::Duration::from_secs(600))  // 10분: 큰 모델과 긴 응답을 위한 충분한 시간
            .send()
            .await
            .map_err(|e| {
                eprintln!("LLM Error - Failed to send request: {}", e);
                format!("Failed to send request: {}", e)
            })?;

        eprintln!("LLM Response - Status: {}", response.status());

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            eprintln!("LLM Error - Server returned error: {}", error_text);
            return Err(format!("Server returned error: {}", error_text).into());
        }

        let result: serde_json::Value = response.json().await.map_err(|e| {
            eprintln!("LLM Error - Failed to parse response: {}", e);
            format!("Failed to parse response: {}", e)
        })?;

        eprintln!("LLM Response - Result: {:?}", result);

        let content = result["content"].as_str().unwrap_or("").trim().to_string();

        if content.is_empty() {
            eprintln!("LLM Error - Empty response from model");
            return Err("Empty response from model".into());
        }

        eprintln!("LLM Success - Response length: {}", content.len());
        Ok(content)
    }

    // OpenAI-compatible chat completions path using llama.cpp server
    pub async fn chat_complete(
        &mut self,
        messages: Vec<super::prompts::ChatMessage>,
        max_tokens: Option<usize>,
        temperature: Option<f32>,
    ) -> Result<String, Box<dyn std::error::Error>> {
        if self.process.is_none() {
            return Err("No model loaded".into());
        }

        let msgs: Vec<serde_json::Value> = messages
            .into_iter()
            .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
            .collect();

        let model_name = self
            .get_model_info()
            .map(|mi| mi.name)
            .unwrap_or_else(|| "unknown".to_string());

        let request_body = serde_json::json!({
            "model": model_name,
            "messages": msgs,
            "max_tokens": max_tokens.unwrap_or(self.config.max_tokens),
            "temperature": temperature.unwrap_or(self.config.temperature),
            "stream": false,
            "stop": ["</s>", "<|im_end|>", "<|endoftext|>"]
        });

        eprintln!("LLM Chat Request - Sending to http://127.0.0.1:8080/v1/chat/completions");

        let client = reqwest::Client::new();
        let response = client
            .post("http://127.0.0.1:8080/v1/chat/completions")
            .json(&request_body)
            .timeout(std::time::Duration::from_secs(600))
            .send()
            .await
            .map_err(|e| {
                eprintln!("LLM Error - Failed to send chat request: {}", e);
                format!("Failed to send chat request: {}", e)
            })?;

        eprintln!("LLM Chat Response - Status: {}", response.status());

        // Fallback to legacy /chat/completions if v1 route is unavailable
        let response = if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            eprintln!("LLM Chat v1 route failed ({}): {}", status, text);

            eprintln!("LLM Chat Request - Falling back to /chat/completions");
            let resp2 = client
                .post("http://127.0.0.1:8080/chat/completions")
                .json(&request_body)
                .timeout(std::time::Duration::from_secs(600))
                .send()
                .await
                .map_err(|e| {
                    eprintln!("LLM Error - Failed to send legacy chat request: {}", e);
                    format!("Failed to send legacy chat request: {}", e)
                })?;
            resp2
        } else {
            response
        };

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            eprintln!("LLM Error - Chat server returned error: {}", error_text);
            return Err(format!("Server returned error: {}", error_text).into());
        }

        let result: serde_json::Value = response.json().await.map_err(|e| {
            eprintln!("LLM Error - Failed to parse chat response: {}", e);
            format!("Failed to parse chat response: {}", e)
        })?;

        let content = result
            .get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("message"))
            .and_then(|m| m.get("content"))
            .and_then(|s| s.as_str())
            .map(|s| s.to_string())
            .or_else(|| result.get("content").and_then(|s| s.as_str()).map(|s| s.to_string()))
            .unwrap_or_default();

        if content.trim().is_empty() {
            eprintln!("LLM Error - Empty chat response from model: {:?}", result);
            return Err("Empty response from model".into());
        }

        eprintln!("LLM Chat Success - Response length: {}", content.len());
        Ok(content)
    }


    // SSE JSON에서 델타 텍스트를 추출 (OpenAI 호환)
    pub(crate) fn extract_sse_delta_text(data: &str) -> Option<String> {
        let v: serde_json::Value = match serde_json::from_str(data) {
            Ok(v) => v,
            Err(_) => return None,
        };
        v.get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("delta"))
            .and_then(|d| d.get("content"))
            .and_then(|s| s.as_str())
            .map(|s| s.to_string())
            .or_else(|| {
                v.get("choices")
                    .and_then(|c| c.get(0))
                    .and_then(|c| c.get("message"))
                    .and_then(|m| m.get("content"))
                    .and_then(|s| s.as_str())
                    .map(|s| s.to_string())
            })
    }

    // OpenAI 호환 Chat Completions SSE 스트리밍
    pub async fn chat_complete_stream(
        &mut self,
        messages: Vec<super::prompts::ChatMessage>,
        max_tokens: Option<usize>,
        temperature: Option<f32>,
        mut on_delta: impl FnMut(&str) + Send,
    ) -> Result<String, Box<dyn std::error::Error>> {
        use futures::StreamExt;

        if self.process.is_none() {
            return Err("No model loaded".into());
        }

        let msgs: Vec<serde_json::Value> = messages
            .into_iter()
            .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
            .collect();

        let model_name = self
            .get_model_info()
            .map(|mi| mi.name)
            .unwrap_or_else(|| "unknown".to_string());

        let request_body = serde_json::json!({
            "model": model_name,
            "messages": msgs,
            "max_tokens": max_tokens.unwrap_or(self.config.max_tokens),
            "temperature": temperature.unwrap_or(self.config.temperature),
            "stream": true,
            "stop": ["</s>", "<|im_end|>", "<|endoftext|>"]
        });

        let client = reqwest::Client::new();
        let mut response = client
            .post("http://127.0.0.1:8080/v1/chat/completions")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Failed to send streaming chat request: {}", e))?;

        if !response.status().is_success() {
            let client = reqwest::Client::new();
            response = client
                .post("http://127.0.0.1:8080/chat/completions")
                .json(&request_body)
                .send()
                .await
                .map_err(|e| format!("Failed to send legacy streaming request: {}", e))?;
        }

        if !response.status().is_success() {
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Server error (stream): {}", text).into());
        }

        let mut stream = response.bytes_stream();
        let mut buf = String::new();
        let mut acc = String::new();

        while let Some(chunk) = stream.next().await {
            let bytes = match chunk {
                Ok(b) => b,
                Err(e) => return Err(format!("Stream error: {}", e).into()),
            };
            let s = String::from_utf8_lossy(&bytes);
            buf.push_str(&s);

            while let Some(pos) = buf.find('\n') {
                let line = buf[..pos].to_string();
                buf.drain(..=pos);

                let trimmed = line.trim();
                if trimmed.is_empty() { continue; }
                if let Some(rest) = trimmed.strip_prefix("data: ") {
                    let data = rest.trim();
                    if data == "[DONE]" {
                        return Ok(acc);
                    }
                    if let Some(delta) = Self::extract_sse_delta_text(data) {
                        if !delta.is_empty() {
                            acc.push_str(&delta);
                            on_delta(&delta);
                        }
                    }
                }
            }
        }

        Ok(acc)
    }

    pub fn get_model_info(&self) -> Option<ModelInfo> {
        self.model_path.as_ref().map(|path| ModelInfo {
            path: path.clone(),
            name: path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            loaded: self.process.is_some(),
        })
    }

    #[allow(dead_code)]
    pub fn get_config(&self) -> super::LLMConfig {
        self.config.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub path: PathBuf,
    pub name: String,
    pub loaded: bool,
}

impl Drop for LlamaCppEngine {
    fn drop(&mut self) {
        let _ = self.stop_process();
    }
}

#[cfg(test)]
mod tests {
    use super::LlamaCppEngine;

    #[test]
    fn extract_sse_delta_text_parses_delta() {
        let json = r#"{"choices":[{"delta":{"content":"안녕"}}]}"#;
        let got = LlamaCppEngine::extract_sse_delta_text(json);
        assert_eq!(got.as_deref(), Some("안녕"));
    }

    #[test]
    fn extract_sse_delta_text_parses_message_content() {
        let json = r#"{"choices":[{"message":{"content":"hello"}}]}"#;
        let got = LlamaCppEngine::extract_sse_delta_text(json);
        assert_eq!(got.as_deref(), Some("hello"));
    }

    #[test]
    fn extract_sse_delta_text_invalid_returns_none() {
        let json = r#"{"foo":"bar"}"#;
        let got = LlamaCppEngine::extract_sse_delta_text(json);
        assert!(got.is_none());
    }
}
