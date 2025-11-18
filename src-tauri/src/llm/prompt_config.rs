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

impl Default for PromptConfigStore {
    fn default() -> Self {
        Self::new()
    }
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