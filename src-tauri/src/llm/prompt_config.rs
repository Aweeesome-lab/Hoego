use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptConfig {
    pub id: String,
    pub name: String,
    pub user_prompt: String,
    pub created_at: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptConfigStore {
    pub configs: Vec<PromptConfig>,
}

impl PromptConfigStore {
    pub fn new() -> Self {
        Self {
            configs: Vec::new(),
        }
    }

    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = Self::config_path()?;

        if !config_path.exists() {
            // Return empty store if file doesn't exist
            return Ok(Self::new());
        }

        let content = fs::read_to_string(&config_path)?;
        let store: Self = serde_json::from_str(&content)?;
        Ok(store)
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_path()?;

        // Ensure directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        fs::write(&config_path, content)?;
        Ok(())
    }

    fn config_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let data_dir = dirs::data_dir()
            .ok_or("Could not determine data directory")?;

        Ok(data_dir.join("hoego").join("prompt_configs.json"))
    }

    pub fn add_config(&mut self, name: String, user_prompt: String) -> Result<PromptConfig, Box<dyn std::error::Error>> {
        // Deactivate all existing configs
        for config in &mut self.configs {
            config.is_active = false;
        }

        // Create new config as active
        let new_config = PromptConfig {
            id: Uuid::new_v4().to_string(),
            name,
            user_prompt,
            created_at: Utc::now(),
            is_active: true,
        };

        self.configs.push(new_config.clone());
        self.save()?;

        Ok(new_config)
    }

    pub fn activate_config(&mut self, config_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Deactivate all configs
        for config in &mut self.configs {
            config.is_active = false;
        }

        // Activate the specified config
        if let Some(config) = self.configs.iter_mut().find(|c| c.id == config_id) {
            config.is_active = true;
            self.save()?;
            Ok(())
        } else {
            Err("Config not found".into())
        }
    }

    pub fn get_active_config(&self) -> Option<&PromptConfig> {
        self.configs.iter().find(|c| c.is_active)
    }

    pub fn get_all_configs(&self) -> Vec<PromptConfig> {
        self.configs.clone()
    }

    pub fn delete_config(&mut self, config_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Don't delete if it's the only config or if it's active
        if self.configs.len() == 1 {
            return Err("Cannot delete the only prompt configuration".into());
        }

        if let Some(config) = self.configs.iter().find(|c| c.id == config_id) {
            if config.is_active {
                return Err("Cannot delete the active prompt. Please activate another prompt first.".into());
            }
        }

        self.configs.retain(|c| c.id != config_id);
        self.save()?;
        Ok(())
    }
}

pub struct PromptManager;

impl PromptManager {
    pub fn get_active_user_prompt() -> Result<String, Box<dyn std::error::Error>> {
        let store = PromptConfigStore::load()?;

        if let Some(active_config) = store.get_active_config() {
            Ok(active_config.user_prompt.clone())
        } else {
            // Return default prompt if no active config
            Ok(Self::default_user_prompt())
        }
    }

    pub fn default_user_prompt() -> String {
        r#"오늘 사용자가 작성한 일지입니다. 일지를 분석하고 사고 패턴에 대한 피드백을 제공하세요.

{content}

위 일지를 분석하여 다음 관점에서 피드백을 제공하세요:

1. **사고 패턴 분석**: 일지에서 발견되는 사고의 패턴, 논리 구조, 반복되는 주제
2. **논리적 평가**: 감정적 판단과 객관적 판단의 구분, 근거의 충실도
3. **모순과 왜곡**: 일관성 없는 부분이나 인지적 왜곡이 있다면 지적
4. **성장 포인트**: 구체적인 사고 개선 방법 2-3가지 제시
5. **핵심 질문**: 스스로 사고를 발전시킬 수 있는 질문 1-2개

간결하고 실용적인 피드백을 제공하되, 비판보다는 성장 중심으로 작성하세요."#.to_string()
    }
}