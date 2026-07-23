import { fireEvent, render } from "@testing-library/react-native";

import { PrimaryButton } from "../MercattoUI";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("PrimaryButton", () => {
  test("ejecuta la acción al presionarlo", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <PrimaryButton title="Guardar cambios" onPress={onPress} />,
    );

    fireEvent.press(screen.getByText("Guardar cambios"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("bloquea la acción durante una solicitud", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <PrimaryButton title="Guardando..." onPress={onPress} disabled />,
    );

    fireEvent.press(screen.getByText("Guardando..."));

    expect(onPress).not.toHaveBeenCalled();
  });
});
