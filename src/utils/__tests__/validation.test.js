import { isEmail, isEmailOrPhone, validatePassword } from "../validation";

describe("validaciones del registro", () => {
  test("acepta una contraseña de ocho caracteres sin exigir complejidad", () => {
    const result = validatePassword("mercatto");

    expect(result.valid).toBe(true);
    expect(result.checks.length).toBe(true);
  });

  test("rechaza una contraseña demasiado corta", () => {
    expect(validatePassword("1234567").valid).toBe(false);
  });

  test("valida correos y celulares ecuatorianos", () => {
    expect(isEmail("luis@example.com")).toBe(true);
    expect(isEmail("correo-invalido")).toBe(false);
    expect(isEmailOrPhone("0991234567")).toBe(true);
  });
});
