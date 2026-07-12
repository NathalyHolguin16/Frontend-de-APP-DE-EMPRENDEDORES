const DEFAULT_BASE =
  process.env.EXPO_PUBLIC_MERCATTO_API_URL ||
  "https://mercatto-back.onrender.com";

const BASE_URL = DEFAULT_BASE.replace(/\/$/, "");
const TIMEOUT_MS = 10000;

function buildUrl(path) {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(buildUrl(path), {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }

    return { status: res.status, ok: res.ok, payload };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDocumentation() {
  const result = await fetchJson("/api/documentation", { method: "HEAD" });
  return {
    name: "Documentación Swagger",
    status: result.status,
    ok: result.ok,
  };
}

async function post(path, body) {
  return fetchJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function printResult(label, result) {
  const badge = result.ok ? "OK" : "FAIL";
  console.log(`${badge} - ${label} (${result.status})`);
  if (result.payload !== undefined && result.payload !== "") {
    console.log(JSON.stringify(result.payload, null, 2));
  }
}

async function main() {
  console.log("API base:", BASE_URL);

  const doc = await checkDocumentation();
  printResult(doc.name, doc);

  const timestamp = Date.now();
  const testUser = {
    name: "Test User",
    email: `test+${timestamp}@example.com`,
    password: "Test1234!",
    password_confirmation: "Test1234!",
  };

  console.log("\nProbando registro con:", testUser.email);
  try {
    const reg = await post("/api/register", testUser);
    printResult("Registro", reg);
  } catch (err) {
    console.error("Register error:", err && err.message ? err.message : err);
  }

  console.log("\nProbando login:");
  try {
    const login = await post("/api/login", {
      email: testUser.email,
      password: testUser.password,
    });
    printResult("Login", login);
  } catch (err) {
    console.error("Login error:", err && err.message ? err.message : err);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
