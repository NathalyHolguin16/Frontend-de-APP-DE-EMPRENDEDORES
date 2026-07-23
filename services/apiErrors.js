export function toSpanishApiMessage(message, status) {
  const normalized = String(message || "").trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("email has already been taken")) {
    return "Este correo ya está registrado. Inicia sesión para continuar.";
  }
  if (lower.includes("has already been taken")) {
    return "Este dato ya está registrado.";
  }
  if (lower.includes("confirmation does not match")) {
    return "La confirmación de la contraseña no coincide.";
  }
  if (lower.includes("must be at least")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (lower.includes("must be a valid email")) {
    return "Ingresa un correo electrónico válido.";
  }
  if (
    lower.includes("credentials") ||
    lower.includes("password is incorrect") ||
    lower.includes("invalid login")
  ) {
    return "El correo o la contraseña son incorrectos.";
  }
  if (lower.includes("unauthenticated") || lower.includes("unauthorized")) {
    return "Tu sesión venció. Inicia sesión nuevamente.";
  }
  if (lower.includes("forbidden")) {
    return "No tienes autorización para realizar esta acción.";
  }
  if (lower.includes("not found")) {
    return "No encontramos la información solicitada.";
  }
  if (
    lower.includes("server error") ||
    lower.includes("internal server error")
  ) {
    return "Ocurrió un problema en el servidor. Intenta nuevamente.";
  }
  if (lower.includes("validation failed") || lower.includes("required")) {
    return "Revisa los campos obligatorios e intenta nuevamente.";
  }

  if (status === 401) return "Tu sesión venció. Inicia sesión nuevamente.";
  if (status === 403) {
    return "No tienes autorización para realizar esta acción.";
  }
  if (status === 404) {
    return "No encontramos la información solicitada.";
  }
  if (status === 409) {
    return "La información cambió mientras realizabas la operación. Actualiza e intenta nuevamente.";
  }
  if (status === 422) {
    return normalized || "Revisa los datos ingresados e intenta nuevamente.";
  }
  if (status === 429) {
    return "Has realizado demasiados intentos. Espera un momento.";
  }
  if (status >= 500) {
    return "Ocurrió un problema en el servidor. Intenta nuevamente.";
  }

  return normalized || "No se pudo completar la solicitud.";
}
