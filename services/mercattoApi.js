const fallbackBaseUrl = "https://mercatto-back.onrender.com";
const authTokenKey = "mercatto_auth_token";
let webSessionToken = null;

export const mercattoApiUrl = (
  process.env.EXPO_PUBLIC_MERCATTO_API_URL || fallbackBaseUrl
).replace(/\/$/, "");

function buildUrl(path) {
  return `${mercattoApiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, ...opts });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function request(path, { method = "GET", body, token, timeoutMs } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    // If no token provided, try to load stored token automatically
    try {
      const stored = await getStoredToken();
      if (stored) {
        token = stored;
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
  }

  const maxRetries = method === "GET" ? 2 : 0;
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      const response = await fetchWithTimeout(
        buildUrl(path),
        {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        timeoutMs || 8000,
      );

      const contentType =
        (response.headers && response.headers.get
          ? response.headers.get("content-type")
          : "") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const status = response.status || 0;
        // Retry on server errors
        if (status >= 500 && attempt < maxRetries) {
          attempt += 1;
          await sleep(500 * attempt);
          continue;
        }

        const validationMessage =
          typeof payload === "object" && payload?.errors
            ? Object.values(payload.errors).flat().find(Boolean)
            : null;
        const error = new Error(
          typeof payload === "string"
            ? payload
            : validationMessage || payload?.message || payload?.error || "No se pudo completar la solicitud.",
        );
        error.status = status;
        error.payload = payload;
        throw error;
      }

      return payload;
    } catch (err) {
      lastError = err;
      // If aborted or network error, retry a couple times
      const isAbort = err && err.name === "AbortError";
      const isNetwork =
        err &&
        (err.code === "ECONNRESET" ||
          err.code === "ENOTFOUND" ||
          err.code === "ECONNREFUSED");
      if ((isAbort || isNetwork) && attempt < maxRetries) {
        attempt += 1;
        await sleep(500 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function saveToken(token) {
  if (process.env.EXPO_OS === "web") {
    webSessionToken = token;
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(authTokenKey, token);
}

export async function getStoredToken() {
  if (process.env.EXPO_OS === "web") {
    return webSessionToken;
  }

  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(authTokenKey);
}

export async function clearStoredToken() {
  if (process.env.EXPO_OS === "web") {
    webSessionToken = null;
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(authTokenKey);
}

export async function registerUser(payload) {
  return request("/api/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload) {
  return request("/api/login", {
    method: "POST",
    body: payload,
  });
}

export async function getMe(token) {
  return request("/api/me", {
    token,
  });
}

export async function logoutUser(token) {
  return request("/api/logout", {
    method: "POST",
    token,
  });
}

export async function getAddresses(token) {
  return request("/api/v1/client/addresses", { token });
}

export async function createAddress(payload, token) {
  return request("/api/v1/client/addresses", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function deleteAddress(addressId, token) {
  return request(`/api/v1/client/addresses/${addressId}`, {
    method: "DELETE",
    token,
  });
}
