const DEFAULT_BASE =
  process.env.EXPO_PUBLIC_MERCATTO_API_URL ||
  "https://mercatto-back.onrender.com";

async function post(path, body) {
  const url = `${DEFAULT_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }
  return { status: res.status, payload };
}

async function main() {
  console.log("Using API base:", DEFAULT_BASE);
  const timestamp = Date.now();
  const testUser = {
    name: "Test User",
    email: `test+${timestamp}@example.com`,
    password: "Test1234!",
    password_confirmation: "Test1234!",
  };

  console.log("Trying to register:", testUser.email);
  try {
    const reg = await post("/api/register", testUser);
    console.log("Register response:", reg.status, reg.payload);
  } catch (err) {
    console.error("Register error:", err && err.message ? err.message : err);
  }

  console.log("Trying to login:");
  try {
    const login = await post("/api/login", {
      email: testUser.email,
      password: testUser.password,
    });
    console.log("Login response:", login.status, login.payload);
  } catch (err) {
    console.error("Login error:", err && err.message ? err.message : err);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
