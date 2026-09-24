import { describe, expect, it } from "vitest";
import { parseCoordinates } from "./coordinates";

describe("parseCoordinates", () => {
  it("returns a point when both latitude and longitude are valid numbers within range", () => {
    expect(parseCoordinates(59.773315, 29.973801)).toEqual({ lat: 59.773315, lng: 29.973801 });
    expect(parseCoordinates(0, 0)).toEqual({ lat: 0, lng: 0 });
    expect(parseCoordinates(-90, -180)).toEqual({ lat: -90, lng: -180 });
    expect(parseCoordinates(90, 180)).toEqual({ lat: 90, lng: 180 });
  });

  it("rejects out-of-range or non-finite values", () => {
    expect(parseCoordinates(91, 1)).toBeUndefined();
    expect(parseCoordinates(1, 181)).toBeUndefined();
    expect(parseCoordinates(0, Infinity)).toBeUndefined();
    expect(parseCoordinates(NaN, 1)).toBeUndefined();
    expect(parseCoordinates(1, NaN)).toBeUndefined();
  });

  it("rejects non-numeric or missing values for either coordinate", () => {
    expect(parseCoordinates("59.77", 29.97)).toBeUndefined();
    expect(parseCoordinates(59.77, "29.97")).toBeUndefined();
    expect(parseCoordinates(undefined, undefined)).toBeUndefined();
    expect(parseCoordinates(59.77, undefined)).toBeUndefined();
    expect(parseCoordinates(undefined, 29.97)).toBeUndefined();
    expect(parseCoordinates(null, null)).toBeUndefined();
  });
});
