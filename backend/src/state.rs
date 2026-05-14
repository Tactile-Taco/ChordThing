use serde::Deserialize;

#[derive(Debug, Default)]
pub struct AppState {
    pub test_gen_mode: String,
}

#[derive(Debug, Deserialize)]
pub struct TestGenSignals {
    pub test_gen_mode: String,
}
