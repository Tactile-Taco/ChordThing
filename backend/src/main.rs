use axum::{
    extract::State,
    response::{IntoResponse, Sse},
    routing::{get, post},
    Router,
};
use datastar::{
    patch_elements::PatchElements,
    patch_signals::PatchSignals,
    axum::ReadSignals,
};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use askama::Template;
use futures::stream::{self, Stream};
use std::convert::Infallible;

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
struct IndexTemplate;

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
        .fallback_service(tower_http::services::ServeDir::new("frontend/dist"))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn index_handler() -> impl IntoResponse {
    let template = IndexTemplate;
    match template.render() {
        Ok(html) => axum::response::Html(html).into_response(),
        Err(err) => {
            tracing::error!("Template render error: {}", err);
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Template error: {}", err),
            )
                .into_response()
        }
    }
}

async fn set_test_gen_handler(
    State(state): State<SharedState>,
    ReadSignals(signals): ReadSignals<TestGenSignals>,
) -> Sse<impl Stream<Item = Result<axum::response::sse::Event, Infallible>>> {
    let mut s = state.lock().await;
    s.test_gen_mode = signals.test_gen_mode.clone();
    tracing::debug!("test_gen_mode set to {}", s.test_gen_mode);
    let signals_json = format!(r#"{{"testGenMode": "{}"}}"#, s.test_gen_mode);
    let patch = PatchSignals::new(signals_json);
    let event = patch.write_as_axum_sse_event();
    Sse::new(stream::iter(vec![Ok(event)]))
}

async fn typer_init_handler() -> Sse<impl Stream<Item = Result<axum::response::sse::Event, Infallible>>> {
    let patch = PatchElements::new(r#"<div id="typer-display"></div>"#);
    let event = patch.write_as_axum_sse_event();
    Sse::new(stream::iter(vec![Ok(event)]))
}
