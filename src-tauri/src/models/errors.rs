// models/errors.rs
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, Serialize, Deserialize)]
pub enum AppError {
    #[error("파일을 찾을 수 없습니다: {0}")]
    FileNotFound(String),

    #[error("권한이 없습니다: {0}")]
    PermissionDenied(String),

    #[error("네트워크 오류: {0}")]
    NetworkError(String),

    #[error("검증 오류: {0}")]
    ValidationError(String),

    #[error("내부 오류: {0}")]
    InternalError(String),
}

impl AppError {
    pub fn code(&self) -> &str {
        match self {
            Self::FileNotFound(_) => "FILE_NOT_FOUND",
            Self::PermissionDenied(_) => "PERMISSION_DENIED",
            Self::NetworkError(_) => "NETWORK_ERROR",
            Self::ValidationError(_) => "VALIDATION_ERROR",
            Self::InternalError(_) => "INTERNAL_ERROR",
        }
    }
}
