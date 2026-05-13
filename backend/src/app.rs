use axum::{
    Router,
    routing::{get, post},
};
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::services::ServeDir;

use crate::routes::{SharedState, index_handler, set_test_gen_handler, typer_init_handler};
use crate::state::AppState;

pub fn create_app(state: SharedState) -> Router {
    Router::new()
        .route("/", get(index_handler))
        .route("/api/set-test-gen", post(set_test_gen_handler))
        .route("/api/typer-init", post(typer_init_handler))
        .fallback_service(ServeDir::new("../frontend/dist"))
        .with_state(state)
}

pub fn create_app_with_state() -> Router {
    let state: SharedState = Arc::new(Mutex::new(AppState::default()));
    create_app(state)
}
