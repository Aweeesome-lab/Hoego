// models/weekly.rs
// Weekly data and statistics models

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Week data with daily entries and aggregated statistics
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WeekData {
    pub start_date: String,
    pub end_date: String,
    pub daily_entries: Vec<DailyEntry>,
    pub aggregated_stats: AggregatedStats,
}

/// Daily entry with dump, feedback, retrospect, and categorized time
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailyEntry {
    pub date: String,
    pub dump_content: String,
    pub ai_feedback: Option<String>,
    pub retrospect_content: Option<String>,
    pub categorized_time: HashMap<String, i64>, // category -> seconds
}

/// Aggregated statistics for the week
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedStats {
    pub total_categories: HashMap<String, i64>, // category -> total seconds
    pub productivity_vs_waste: ProductivityStats,
    pub daily_trend: Vec<DailyTrend>,
}

/// Productivity vs waste time statistics
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProductivityStats {
    pub productive_seconds: i64,
    pub waste_seconds: i64,
    pub productive_percentage: f64,
    pub waste_percentage: f64,
}

/// Daily trend with categorized time
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailyTrend {
    pub date: String,
    pub categories: HashMap<String, i64>, // category -> seconds for this day
}

/// Payload for getting week data
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWeekDataPayload {
    pub start_date: String,      // ISO 8601 format: YYYY-MM-DD
    pub week_start_day: String,  // "sunday" or "monday"
}
