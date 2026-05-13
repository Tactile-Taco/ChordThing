use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt;

use chordthing_backend::app::create_app_with_state;

#[tokio::test]
async fn index_returns_html() {
    let app = create_app_with_state();

    let response = app
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();
    assert!(html.contains("ChordMan") || html.contains("ChordThing"));
}

#[tokio::test]
async fn api_set_test_gen_returns_ok() {
    let app = create_app_with_state();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/set-test-gen")
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn api_typer_init_returns_ok() {
    let app = create_app_with_state();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/typer-init")
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn static_files_fallback() {
    let app = create_app_with_state();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/nonexistent.js")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // Should return 404 since frontend/dist may not have the file in test
    // But the route exists and handles it
    assert!(response.status() == StatusCode::OK || response.status() == StatusCode::NOT_FOUND);
}
