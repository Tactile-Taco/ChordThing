use axum_test::TestServer;
use chordthing_backend::app::create_app_with_state;

async fn setup_server() -> TestServer {
    let app = create_app_with_state();
    TestServer::new(app)
}

#[tokio::test]
async fn index_returns_html() {
    let server = setup_server().await;

    let response = server.get("/").await;

    assert_eq!(response.status_code(), 200);
    let html = response.text();
    assert!(html.contains("ChordMan"));
}

#[tokio::test]
async fn index_dev_mode_true() {
    temp_env::async_with_vars([("DEV", Some("true"))], async {
        let server = setup_server().await;
        let response = server.get("/").await;

        assert_eq!(response.status_code(), 200);
        let html = response.text();

        assert!(
            html.contains("localhost:5173"),
            "Expected dev mode script URL in HTML"
        );
        assert!(
            !html.contains("/assets/index.js"),
            "Should not use production assets in dev mode"
        );
    })
    .await;
}

#[tokio::test]
async fn index_dev_mode_false() {
    temp_env::async_with_vars([("DEV", None::<&str>)], async {
        let server = setup_server().await;
        let response = server.get("/").await;

        assert_eq!(response.status_code(), 200);
        let html = response.text();

        assert!(
            html.contains("/assets/index.js"),
            "Expected production asset URL in HTML"
        );
        assert!(
            !html.contains("localhost:5173"),
            "Should not use dev server in production mode"
        );
    })
    .await;
}

#[tokio::test]
async fn index_dev_mode_with_various_values() {
    temp_env::async_with_vars([("DEV", Some("1"))], async {
        let server = setup_server().await;
        let response = server.get("/").await;

        let html = response.text();
        assert!(
            html.contains("localhost:5173"),
            "DEV=1 should enable dev mode"
        );
    })
    .await;
}

#[tokio::test]
async fn api_set_test_gen_returns_ok() {
    let server = setup_server().await;

    let response = server.post("/api/set-test-gen").await;

    assert_eq!(response.status_code(), 200);
}

#[tokio::test]
async fn api_typer_init_returns_ok() {
    let server = setup_server().await;

    let response = server.post("/api/typer-init").await;

    assert_eq!(response.status_code(), 200);
}

#[tokio::test]
async fn static_files_fallback() {
    let server = setup_server().await;

    let response = server.get("/nonexistent.js").await;

    assert_eq!(response.status_code(), 404);
}

#[tokio::test]
async fn static_files_custom_dist_path() {
    let temp_dir = std::env::temp_dir().join("chordthing-test-dist");
    std::fs::create_dir_all(&temp_dir).unwrap();
    std::fs::write(temp_dir.join("test.txt"), "hello from custom dist").unwrap();

    temp_env::async_with_vars(
        [("FRONTEND_DIST", Some(temp_dir.to_str().unwrap()))],
        async {
            let server = setup_server().await;
            let response = server.get("/test.txt").await;

            assert_eq!(response.status_code(), 200);
            let content = response.text();
            assert_eq!(content, "hello from custom dist");
        },
    )
    .await;

    std::fs::remove_dir_all(&temp_dir).unwrap();
}
