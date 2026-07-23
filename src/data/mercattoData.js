export const cities = [
  "Manta",
  "Portoviejo",
  "Guayaquil",
  "Quito",
  "Cuenca",
  "Loja",
  "Ambato",
  "Santo Domingo",
  "Machala",
  "Riobamba",
  "Esmeraldas",
  "Montecristi",
];

export const cityCoordinates = {
  Manta: { latitude: -0.9677, longitude: -80.7089 },
  Portoviejo: { latitude: -1.0546, longitude: -80.4545 },
  Guayaquil: { latitude: -2.171, longitude: -79.9224 },
  Quito: { latitude: -0.1807, longitude: -78.4678 },
  Cuenca: { latitude: -2.9001, longitude: -79.0059 },
  Loja: { latitude: -3.9931, longitude: -79.2042 },
  Ambato: { latitude: -1.2491, longitude: -78.6168 },
  "Santo Domingo": { latitude: -0.253, longitude: -79.1754 },
  Machala: { latitude: -3.2581, longitude: -79.9554 },
  Riobamba: { latitude: -1.6636, longitude: -78.6546 },
  Esmeraldas: { latitude: 0.9682, longitude: -79.6517 },
  Montecristi: { latitude: -1.0455, longitude: -80.6592 },
};

export const cityProvinces = {
  Manta: "Manabí",
  Portoviejo: "Manabí",
  Guayaquil: "Guayas",
  Quito: "Pichincha",
  Cuenca: "Azuay",
  Loja: "Loja",
  Ambato: "Tungurahua",
  "Santo Domingo": "Santo Domingo de los Tsáchilas",
  Machala: "El Oro",
  Riobamba: "Chimborazo",
  Esmeraldas: "Esmeraldas",
  Montecristi: "Manabí",
};

export function matchMercattoCity(place) {
  const placeNames = [place.city, place.district, place.subregion, place.region]
    .filter(Boolean)
    .map((value) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    );

  return cities.find((city) => {
    const normalizedCity = city
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return placeNames.some(
      (placeName) =>
        placeName.includes(normalizedCity) ||
        normalizedCity.includes(placeName),
    );
  });
}
