import { toSpanishApiMessage } from "../apiErrors";

describe("mensajes de la API", () => {
  test("traduce errores de correo duplicado", () => {
    expect(
      toSpanishApiMessage("The email has already been taken.", 422),
    ).toBe("Este correo ya está registrado. Inicia sesión para continuar.");
  });

  test("oculta errores técnicos del servidor", () => {
    expect(toSpanishApiMessage("Internal Server Error", 500)).toBe(
      "Ocurrió un problema en el servidor. Intenta nuevamente.",
    );
  });

  test("traduce respuestas de autorización", () => {
    expect(toSpanishApiMessage("", 403)).toBe(
      "No tienes autorización para realizar esta acción.",
    );
    expect(toSpanishApiMessage("This action is unauthorized.", 403)).toBe(
      "No tienes autorización para realizar esta acción.",
    );
  });
});
