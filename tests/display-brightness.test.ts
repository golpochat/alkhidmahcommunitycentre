import { describe, expect, it } from "vitest";
import {
  brightnessPeriodsFromStorage,
  brightnessPeriodsToStorage,
  defaultBrightnessPeriods,
} from "@/lib/display-brightness";

describe("display-brightness", () => {
  it("converts visual periods to storage format", () => {
    expect(
      brightnessPeriodsToStorage([
        { from: "06:00", to: "22:00", brightnessPercent: 100 },
        { from: "22:00", to: "06:00", brightnessPercent: 40 },
      ]),
    ).toEqual([
      { from: "06:00", to: "22:00", brightness: 1 },
      { from: "22:00", to: "06:00", brightness: 0.4 },
    ]);
  });

  it("reads array storage back into visual periods", () => {
    expect(
      brightnessPeriodsFromStorage([
        { from: "06:00", to: "22:00", brightness: 1 },
        { from: "22:00", to: "06:00", brightness: 0.4 },
      ]),
    ).toEqual([
      { from: "06:00", to: "22:00", brightnessPercent: 100 },
      { from: "22:00", to: "06:00", brightnessPercent: 40 },
    ]);
  });

  it("migrates legacy object schedule", () => {
    const periods = brightnessPeriodsFromStorage({
      "06:00": 100,
      "22:00": 40,
    });

    expect(periods).toHaveLength(2);
    expect(periods[0].brightnessPercent).toBe(100);
    expect(periods[1].brightnessPercent).toBe(40);
  });

  it("falls back to defaults when empty", () => {
    expect(brightnessPeriodsFromStorage(null)).toEqual(defaultBrightnessPeriods());
  });
});
