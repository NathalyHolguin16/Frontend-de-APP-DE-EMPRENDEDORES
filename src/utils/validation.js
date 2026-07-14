export function validatePassword(password) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score,
    label: score <= 2 ? "Débil" : score <= 4 ? "Media" : "Fuerte",
    valid: score === 5,
  };
}

export function isEmailOrPhone(value) {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || /^09\d{8}$/.test(trimmed);
}
