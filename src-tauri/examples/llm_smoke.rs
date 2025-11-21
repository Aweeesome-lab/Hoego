use hoego::services::llm::{self};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    eprintln!("[smoke] starting LLM smoke test");

    // Construct manager OUTSIDE of a Tokio runtime to avoid blocking_* panic
    let manager = llm::LLMManager::new()?;
    let model_manager = manager.model_manager.clone();

    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async move {
        let mut engine = manager.engine.lock().await;
        engine.ensure_binary_exists()?;

        let default_model = model_manager
            .get_default_model()
            .await
            .ok()
            .flatten()
            .ok_or("no default model found; place a .gguf under ~/Library/Application Support/hoego/models and set default_model.txt")?;

        eprintln!("[smoke] loading model: {:?}", default_model.path);
        engine.load_model(default_model.path.clone())?;

        drop(engine);
        // wait for server to be ready
        for _ in 0..15 {
            let eng = manager.engine.lock().await;
            if eng.wait_for_ready().await.unwrap_or(false) {
                break;
            }
            drop(eng);
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }

        let mut engine = manager.engine.lock().await;
        if !engine.wait_for_ready().await.unwrap_or(false) {
            return Err("server not ready".into());
        }

        let input = "오늘은 카페에서 코드를 정리했다. 모델 요약이 이상하게 나오던 문제를 점검했다.";
        let prompt = llm::prompts::PromptTemplate::for_business_journal_coach(input);
        let messages = prompt.to_chat_format();

        eprintln!("[smoke] sending chat request");
        let out = engine.chat_complete(messages, Some(400), Some(0.3)).await?;
        println!("===== SMOKE OUTPUT =====\n{}\n========================", out);
        Ok(()) as Result<(), Box<dyn std::error::Error>>
    })
}
