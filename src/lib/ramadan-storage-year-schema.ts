import { z } from "zod";
import { isValidRamadanStorageYear } from "@/lib/ramadan-season-types";

export const ramadanStorageYearSchema = z
  .number()
  .int()
  .refine(isValidRamadanStorageYear, {
    message: "Invalid Ramadan season year",
  });

export function parseRamadanStorageYearParam(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const year = Number(value);
  return isValidRamadanStorageYear(year) ? year : null;
}
