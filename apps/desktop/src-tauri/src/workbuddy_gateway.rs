use std::{
    env,
    io::Read,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};

use serde::Deserialize;
use serde_json::{json, Value};
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};
use url::Url;
use wait_timeout::ChildExt;

const GATEWAY_ADDRESS: &str = "127.0.0.1:8877";
const MAX_REQUEST_BYTES: usize = 1024 * 1024;
const MAX_CLI_OUTPUT_BYTES: u64 = 8 * 1024 * 1024;
const CLI_TIMEOUT: Duration = Duration::from_secs(120);
const DEFAULT_CODEBUDDY_CLI: &str =
    "/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy";
const LEGACY_AGENT_LABEL: &str = "com.tkobserver.workbuddy-gateway";

struct LegacyLaunchAgentPaths {
    active: PathBuf,
    disabled: PathBuf,
}

fn legacy_launch_agent_paths(home: &Path) -> LegacyLaunchAgentPaths {
    let active = home
        .join("Library/LaunchAgents")
        .join(format!("{LEGACY_AGENT_LABEL}.plist"));
    let disabled = active.with_extension("plist.disabled-by-tk-observer");
    LegacyLaunchAgentPaths { active, disabled }
}

#[cfg(target_os = "macos")]
fn disable_legacy_launch_agent() {
    let Ok(home) = env::var("HOME") else {
        return;
    };
    let paths = legacy_launch_agent_paths(Path::new(&home));
    if !paths.active.exists() {
        return;
    }

    if let Ok(output) = Command::new("/usr/bin/id").arg("-u").output() {
        if output.status.success() {
            if let Ok(uid) = String::from_utf8(output.stdout) {
                let target = format!("gui/{}/{LEGACY_AGENT_LABEL}", uid.trim());
                let _ = Command::new("/bin/launchctl")
                    .args(["bootout", &target])
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();
            }
        }
    }

    if std::fs::rename(&paths.active, &paths.disabled).is_err() {
        eprintln!("Could not disable the legacy WorkBuddy launch agent");
    }
}

#[cfg(not(target_os = "macos"))]
fn disable_legacy_launch_agent() {}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum GatewayError {
    ForbiddenOrigin,
    RequestTooLarge,
    InvalidRequest,
    EmptyPrompt,
    Busy,
    CliUnavailable,
    CliFailed,
    CliTimedOut,
    InvalidOutput,
}

impl GatewayError {
    fn code(self) -> &'static str {
        match self {
            Self::ForbiddenOrigin => "FORBIDDEN_ORIGIN",
            Self::RequestTooLarge => "REQUEST_TOO_LARGE",
            Self::InvalidRequest => "INVALID_REQUEST",
            Self::EmptyPrompt => "EMPTY_PROMPT",
            Self::Busy => "GATEWAY_BUSY",
            Self::CliUnavailable => "CLI_UNAVAILABLE",
            Self::CliFailed => "CLI_FAILED",
            Self::CliTimedOut => "CLI_TIMED_OUT",
            Self::InvalidOutput => "INVALID_OUTPUT",
        }
    }

    fn status(self) -> u16 {
        match self {
            Self::ForbiddenOrigin => 403,
            Self::RequestTooLarge => 413,
            Self::InvalidRequest | Self::EmptyPrompt => 400,
            Self::Busy => 429,
            Self::CliUnavailable | Self::CliFailed | Self::CliTimedOut | Self::InvalidOutput => 502,
        }
    }
}

#[derive(Clone, Debug, Default)]
struct ExecutionGate {
    busy: Arc<AtomicBool>,
}

#[derive(Debug)]
struct ExecutionPermit {
    busy: Arc<AtomicBool>,
}

impl ExecutionGate {
    fn try_acquire(&self) -> Result<ExecutionPermit, GatewayError> {
        self.busy
            .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
            .map(|_| ExecutionPermit {
                busy: Arc::clone(&self.busy),
            })
            .map_err(|_| GatewayError::Busy)
    }
}

impl Drop for ExecutionPermit {
    fn drop(&mut self) {
        self.busy.store(false, Ordering::Release);
    }
}

#[derive(Deserialize)]
struct AnalyzeRequest {
    prompt: String,
}

fn is_allowed_origin(origin: &str) -> bool {
    if matches!(
        origin,
        "http://localhost:5173"
            | "http://127.0.0.1:5173"
            | "tauri://localhost"
            | "http://tauri.localhost"
    ) {
        return true;
    }

    let Ok(url) = Url::parse(origin) else {
        return false;
    };
    if url.scheme() != "https" || url.port().is_some() || url.path() != "/" {
        return false;
    }
    let Some(host) = url.host_str() else {
        return false;
    };
    host == "tk-observer.pages.dev" || host.ends_with(".tk-observer.pages.dev")
}

fn extract_assistant_text(value: &Value) -> Result<String, &'static str> {
    let mut last_text = None;
    for message in value.as_array().into_iter().flatten() {
        if message.get("type").and_then(Value::as_str) != Some("message")
            || message.get("role").and_then(Value::as_str) != Some("assistant")
        {
            continue;
        }
        for content in message
            .get("content")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            if content.get("type").and_then(Value::as_str) == Some("output_text") {
                if let Some(text) = content.get("text").and_then(Value::as_str) {
                    if !text.trim().is_empty() {
                        last_text = Some(text.to_owned());
                    }
                }
            }
        }
    }
    last_text.ok_or("INVALID_OUTPUT")
}

fn validate_origin(origin: Option<&str>) -> Result<(), GatewayError> {
    if !origin.is_some_and(is_allowed_origin) {
        return Err(GatewayError::ForbiddenOrigin);
    }
    Ok(())
}

fn validate_analyze_body(body: &[u8]) -> Result<String, GatewayError> {
    if body.len() > MAX_REQUEST_BYTES {
        return Err(GatewayError::RequestTooLarge);
    }
    let payload: AnalyzeRequest =
        serde_json::from_slice(body).map_err(|_| GatewayError::InvalidRequest)?;
    let prompt = payload.prompt.trim();
    if prompt.is_empty() {
        return Err(GatewayError::EmptyPrompt);
    }
    Ok(prompt.to_owned())
}

#[cfg(test)]
fn validate_analyze_request(origin: Option<&str>, body: &[u8]) -> Result<String, GatewayError> {
    validate_origin(origin)?;
    validate_analyze_body(body)
}

fn prepare_analyze_request<F>(
    origin: Option<&str>,
    body_length: Option<usize>,
    read_body: F,
) -> Result<String, GatewayError>
where
    F: FnOnce() -> Result<Vec<u8>, GatewayError>,
{
    validate_origin(origin)?;
    if body_length.is_some_and(|size| size > MAX_REQUEST_BYTES) {
        return Err(GatewayError::RequestTooLarge);
    }
    validate_analyze_body(&read_body()?)
}

fn retry_delay() -> Duration {
    Duration::from_secs(2)
}

fn error_response(error: GatewayError) -> String {
    json!({ "ok": false, "error": error.code() }).to_string()
}

fn run_cli(prompt: String) -> Result<String, GatewayError> {
    let cli_path = env::var("WORKBUDDY_CLI").unwrap_or_else(|_| DEFAULT_CODEBUDDY_CLI.to_owned());
    let mut child = Command::new(cli_path)
        .args(["-p", &prompt, "--output-format", "json"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::NotFound {
                GatewayError::CliUnavailable
            } else {
                GatewayError::CliFailed
            }
        })?;

    let mut stdout = child.stdout.take().ok_or(GatewayError::CliFailed)?;
    let output_reader = thread::spawn(move || {
        let mut bytes = Vec::new();
        stdout
            .by_ref()
            .take(MAX_CLI_OUTPUT_BYTES + 1)
            .read_to_end(&mut bytes)
            .map(|_| bytes)
    });

    let status = match child
        .wait_timeout(CLI_TIMEOUT)
        .map_err(|_| GatewayError::CliFailed)?
    {
        Some(status) => status,
        None => {
            let _ = child.kill();
            let _ = child.wait();
            let _ = output_reader.join();
            return Err(GatewayError::CliTimedOut);
        }
    };
    let bytes = output_reader
        .join()
        .map_err(|_| GatewayError::CliFailed)?
        .map_err(|_| GatewayError::CliFailed)?;
    if !status.success() {
        return Err(GatewayError::CliFailed);
    }
    if bytes.len() as u64 > MAX_CLI_OUTPUT_BYTES {
        return Err(GatewayError::InvalidOutput);
    }
    let output: Value = serde_json::from_slice(&bytes).map_err(|_| GatewayError::InvalidOutput)?;
    extract_assistant_text(&output).map_err(|_| GatewayError::InvalidOutput)
}

fn header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).expect("static HTTP header must be valid")
}

fn request_origin(request: &Request) -> Option<&str> {
    request
        .headers()
        .iter()
        .find(|item| item.field.equiv("Origin"))
        .map(|item| item.value.as_str())
}

fn preflight_headers(origin: &str) -> Vec<Header> {
    vec![
        header("Access-Control-Allow-Origin", origin),
        header("Access-Control-Allow-Headers", "Content-Type"),
        header("Access-Control-Allow-Methods", "POST, GET, OPTIONS"),
        header("Access-Control-Allow-Private-Network", "true"),
        header("Vary", "Origin"),
    ]
}

fn respond_json(request: Request, status: u16, body: String, origin: Option<&str>) {
    let mut response = Response::from_string(body)
        .with_status_code(StatusCode(status))
        .with_header(header("Content-Type", "application/json; charset=utf-8"));
    if let Some(origin) = origin.filter(|value| is_allowed_origin(value)) {
        response.add_header(header("Access-Control-Allow-Origin", origin));
        response.add_header(header("Vary", "Origin"));
    }
    let _ = request.respond(response);
}

fn handle_request(mut request: Request, gate: ExecutionGate) {
    let origin = request_origin(&request).map(str::to_owned);
    let path = request.url().split('?').next().unwrap_or(request.url());

    if request.method() == &Method::Get && path == "/health" {
        return respond_json(
            request,
            200,
            json!({ "ok": true, "workbuddy": "ready" }).to_string(),
            origin.as_deref(),
        );
    }

    if request.method() == &Method::Options && path == "/analyze" {
        if !origin.as_deref().is_some_and(is_allowed_origin) {
            return respond_json(
                request,
                GatewayError::ForbiddenOrigin.status(),
                error_response(GatewayError::ForbiddenOrigin),
                None,
            );
        }
        let mut response = Response::empty(StatusCode(204));
        for item in preflight_headers(origin.as_deref().expect("validated origin")) {
            response.add_header(item);
        }
        let _ = request.respond(response);
        return;
    }

    if request.method() != &Method::Post || path != "/analyze" {
        return respond_json(
            request,
            404,
            json!({ "ok": false, "error": "NOT_FOUND" }).to_string(),
            origin.as_deref(),
        );
    }

    let body_length = request.body_length();
    let prompt = prepare_analyze_request(origin.as_deref(), body_length, || {
        let mut body = Vec::new();
        request
            .as_reader()
            .take((MAX_REQUEST_BYTES + 1) as u64)
            .read_to_end(&mut body)
            .map(|_| body)
            .map_err(|_| GatewayError::InvalidRequest)
    });
    let origin_for_response = origin.clone();
    let prompt = match prompt {
        Ok(prompt) => prompt,
        Err(error) => {
            return respond_json(
                request,
                error.status(),
                error_response(error),
                origin_for_response.as_deref(),
            );
        }
    };
    let permit = match gate.try_acquire() {
        Ok(permit) => permit,
        Err(error) => {
            return respond_json(
                request,
                error.status(),
                error_response(error),
                origin_for_response.as_deref(),
            );
        }
    };
    thread::spawn(move || {
        let _permit = permit;
        match run_cli(prompt) {
            Ok(text) => respond_json(
                request,
                200,
                json!({ "ok": true, "text": text }).to_string(),
                origin_for_response.as_deref(),
            ),
            Err(error) => respond_json(
                request,
                error.status(),
                error_response(error),
                origin_for_response.as_deref(),
            ),
        }
    });
}

fn supervise() {
    let gate = ExecutionGate::default();
    loop {
        match Server::http(GATEWAY_ADDRESS) {
            Ok(server) => {
                eprintln!("WorkBuddy gateway listening on {GATEWAY_ADDRESS}");
                for request in server.incoming_requests() {
                    handle_request(request, gate.clone());
                }
            }
            Err(_) => thread::sleep(retry_delay()),
        }
    }
}

pub fn spawn() {
    disable_legacy_launch_agent();
    let _ = thread::Builder::new()
        .name("workbuddy-gateway".to_owned())
        .spawn(supervise);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{cell::Cell, io::Write, net::TcpStream};

    #[test]
    fn allows_only_tk_observer_browser_origins() {
        for origin in [
            "https://tk-observer.pages.dev",
            "https://preview.tk-observer.pages.dev",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "tauri://localhost",
            "http://tauri.localhost",
        ] {
            assert!(is_allowed_origin(origin), "expected allowed: {origin}");
        }

        for origin in [
            "https://example.com",
            "https://tk-observer.pages.dev.example.com",
            "http://localhost:3000",
        ] {
            assert!(!is_allowed_origin(origin), "expected denied: {origin}");
        }
    }

    #[test]
    fn extracts_last_assistant_output_text() {
        let value = serde_json::json!([
            {
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": "first"}]
            },
            {
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": "final"}]
            }
        ]);

        assert_eq!(extract_assistant_text(&value).unwrap(), "final");
    }

    #[test]
    fn rejects_cli_output_without_assistant_text() {
        let value = serde_json::json!([
            {"type": "message", "role": "user", "content": []}
        ]);

        assert_eq!(
            extract_assistant_text(&value).unwrap_err(),
            "INVALID_OUTPUT"
        );
    }

    #[test]
    fn validates_analyze_request_before_cli_execution() {
        assert_eq!(
            validate_analyze_request(
                Some("https://tk-observer.pages.dev"),
                br#"{"prompt":"analyze"}"#
            )
            .unwrap(),
            "analyze"
        );
        assert_eq!(
            validate_analyze_request(Some("https://example.com"), br#"{"prompt":"analyze"}"#)
                .unwrap_err(),
            GatewayError::ForbiddenOrigin
        );
        assert_eq!(
            validate_analyze_request(Some("https://tk-observer.pages.dev"), br#"{"prompt":"  "}"#)
                .unwrap_err(),
            GatewayError::EmptyPrompt
        );
        assert_eq!(
            validate_analyze_request(
                Some("https://tk-observer.pages.dev"),
                &vec![b'a'; MAX_REQUEST_BYTES + 1]
            )
            .unwrap_err(),
            GatewayError::RequestTooLarge
        );
    }

    #[test]
    fn retry_delay_avoids_a_busy_restart_loop() {
        assert_eq!(retry_delay(), std::time::Duration::from_secs(2));
    }

    #[test]
    fn public_errors_never_include_cli_details() {
        for error in [
            GatewayError::CliUnavailable,
            GatewayError::CliFailed,
            GatewayError::CliTimedOut,
            GatewayError::InvalidOutput,
        ] {
            let response = error_response(error);
            assert!(!response.contains("/Applications/"));
            assert!(!response.contains("stderr"));
            assert!(response.contains(error.code()));
        }
    }

    #[test]
    fn private_network_preflight_is_allowed_only_after_origin_validation() {
        let headers = preflight_headers("https://tk-observer.pages.dev");
        let rendered = headers
            .iter()
            .map(|item| format!("{}: {}", item.field, item.value))
            .collect::<Vec<_>>()
            .join("\n");

        assert!(rendered.contains("Access-Control-Allow-Private-Network: true"));
        assert!(rendered.contains("Access-Control-Allow-Origin: https://tk-observer.pages.dev"));
    }

    #[test]
    fn legacy_migration_targets_only_the_old_gateway_agent() {
        let paths = legacy_launch_agent_paths(std::path::Path::new("/Users/tester"));

        assert_eq!(
            paths.active,
            std::path::PathBuf::from(
                "/Users/tester/Library/LaunchAgents/com.tkobserver.workbuddy-gateway.plist"
            )
        );
        assert_eq!(
            paths.disabled,
            std::path::PathBuf::from(
                "/Users/tester/Library/LaunchAgents/com.tkobserver.workbuddy-gateway.plist.disabled-by-tk-observer"
            )
        );
    }

    #[test]
    fn execution_gate_allows_only_one_active_cli() {
        let gate = ExecutionGate::default();
        let first = gate.try_acquire().expect("first task should start");

        let busy = gate.try_acquire().unwrap_err();
        assert_eq!(busy, GatewayError::Busy);
        assert_eq!(busy.code(), "GATEWAY_BUSY");
        assert_eq!(busy.status(), 429);

        drop(first);
        assert!(gate.try_acquire().is_ok());
    }

    #[test]
    fn rejects_unauthorized_post_before_calling_body_reader() {
        let body_read = Cell::new(false);

        let result = prepare_analyze_request(Some("https://example.com"), Some(100), || {
            body_read.set(true);
            Ok(br#"{"prompt":"analyze"}"#.to_vec())
        });

        assert_eq!(result.unwrap_err(), GatewayError::ForbiddenOrigin);
        assert!(!body_read.get());
    }

    #[test]
    fn unauthorized_http_post_responds_without_waiting_for_body() {
        let server = Server::http("127.0.0.1:0").expect("test server");
        let address = server.server_addr().to_ip().expect("TCP address");
        thread::spawn(move || {
            handle_request(server.recv().expect("request"), ExecutionGate::default());
        });
        let mut stream = TcpStream::connect(address).expect("connect test server");
        stream
            .set_read_timeout(Some(Duration::from_millis(500)))
            .expect("read timeout");
        write!(
            stream,
            "POST /analyze HTTP/1.1\r\nHost: {address}\r\nOrigin: https://example.com\r\nContent-Type: application/json\r\nContent-Length: 2048\r\nConnection: close\r\n\r\n"
        )
        .expect("request headers");

        let mut response = [0_u8; 512];
        let result = stream.read(&mut response);
        let bytes = result.expect("403 response must not wait for request body");
        let rendered = String::from_utf8_lossy(&response[..bytes]);
        assert!(rendered.starts_with("HTTP/1.1 403"), "{rendered}");
    }
}
