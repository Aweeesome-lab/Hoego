use std::{env, fs, path::PathBuf};

fn ensure_dist_dir() {
    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR env var is always set");
    let dist_path = PathBuf::from(manifest_dir).join("../dist");

    if !dist_path.exists() {
        // Some workflows (clippy, cargo check) run without building the frontend first.
        // Ensure the dist directory exists so tauri-build does not fail early.
        fs::create_dir_all(dist_path).expect("failed to create ../dist directory");
    }
}

fn main() {
    ensure_dist_dir();
    tauri_build::build()
}
