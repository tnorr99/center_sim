export const toF = (c: number): number => c * 9 / 5 + 32;

export const formatTemp = (c: number, useFahrenheit: boolean, decimals = 1): string =>
  useFahrenheit
    ? `${toF(c).toFixed(decimals)}°F`
    : `${c.toFixed(decimals)}°C`;
