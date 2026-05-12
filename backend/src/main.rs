use askama::Template;
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Default)]
struct AppState {
    test_gen_mode: String,
}

type SharedState = Arc<Mutex<AppState>>;

#[derive(Debug, Deserialize)]
struct TestGenSignals {
    #[serde(default)]
    test_gen_mode: String,
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    dev_mode: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "chordthing_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state: SharedState = Arc::new(Mutex::new(AppState::default()));

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/api/set-test-gen", post(set_test_gen_handler))
        .route("/api/typer-init", post(typer_init_handler))
        .fallback_service(ServeDir::new("../frontend/dist"))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn index_handler() -> impl IntoResponse {
    let dev_mode = std::env::var("DEV").is_ok();
    let template = IndexTemplate { dev_mode };
    match template.render() {
        Ok(html) => axum::response::Html(html).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn set_test_gen_handler(
    State(state): State<SharedState>,
) -> impl IntoResponse {
    let mut s = state.lock().await;
    s.test_gen_mode = "random".to_string();
    tracing::debug!("test_gen_mode set to {}", s.test_gen_mode);
    StatusCode::OK
}

async fn typer_init_handler() -> impl IntoResponse {
    tracing::debug!("typer init");
    StatusCode::OK
}
