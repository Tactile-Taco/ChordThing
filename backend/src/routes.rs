use askama::Template;
use axum::{extract::State, http::StatusCode, response::IntoResponse};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::state::AppState;

pub type SharedState = Arc<Mutex<AppState>>;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    pub dev_mode: bool,
}

pub async fn index_handler() -> impl IntoResponse {
    let dev_mode = std::env::var("DEV").is_ok();
    let template = IndexTemplate { dev_mode };
    match template.render() {
        Ok(html) => axum::response::Html(html).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn set_test_gen_handler(State(state): State<SharedState>) -> impl IntoResponse {
    let mut s = state.lock().await;
    s.test_gen_mode = "random".to_string();
    tracing::debug!("test_gen_mode set to {}", s.test_gen_mode);
    StatusCode::OK
}

pub async fn typer_init_handler() -> impl IntoResponse {
    tracing::debug!("typer init");
    StatusCode::OK
}
