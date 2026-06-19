import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  DISPLAY_TIMEZONE,
  getActiveJumuahIndex,
  type JumuahSlot,
} from "@/lib/prayer-times-pure";

const jumuah: JumuahSlot[] = [
  { index: 1, adhan: "13:15", iqama: "13:30" },
  { index: 2, adhan: "14:15", iqama: "14:30" },
  { index: 3, adhan: "15:15", iqama: "15:30" },
];

function dublinTime(hours: number, minutes: number) {
  return DateTime.fromObject(
    { hour: hours, minute: minutes },
    { zone: DISPLAY_TIMEZONE },
  ).toJSDate();
}

describe("getActiveJumuahIndex", () => {
  const asrAdhan = "17:54";

  it("returns null before the first jumuah adhan", () => {
    expect(getActiveJumuahIndex(jumuah, dublinTime(10, 0), asrAdhan)).toBeNull();
    expect(getActiveJumuahIndex(jumuah, dublinTime(13, 14), asrAdhan)).toBeNull();
  });

  it("returns the active slot during its adhan–iqama window", () => {
    expect(getActiveJumuahIndex(jumuah, dublinTime(13, 15), asrAdhan)).toBe(1);
    expect(getActiveJumuahIndex(jumuah, dublinTime(13, 30), asrAdhan)).toBe(1);
    expect(getActiveJumuahIndex(jumuah, dublinTime(14, 20), asrAdhan)).toBe(2);
  });

  it("returns null between jumuah slots", () => {
    expect(getActiveJumuahIndex(jumuah, dublinTime(13, 31), asrAdhan)).toBeNull();
    expect(getActiveJumuahIndex(jumuah, dublinTime(14, 0), asrAdhan)).toBeNull();
  });

  it("returns null after asr", () => {
    expect(getActiveJumuahIndex(jumuah, dublinTime(18, 0), asrAdhan)).toBeNull();
  });
});
