import {
  cities,
  cityCoordinates,
  matchMercattoCity,
} from "../mercattoData";

describe("ciudades soportadas", () => {
  test("incluye coordenadas para cada ciudad", () => {
    cities.forEach((city) => {
      expect(cityCoordinates[city]).toEqual({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      });
    });
  });

  test("reconoce la ciudad desde una respuesta de geocodificación", () => {
    expect(
      matchMercattoCity({
        city: "Montecristi",
        region: "Manabí",
      }),
    ).toBe("Montecristi");
  });
});
