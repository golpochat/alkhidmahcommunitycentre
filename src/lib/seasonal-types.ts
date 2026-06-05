export interface SeasonalCountdown {
  label: string;
  seconds: number;
}

export interface SeasonalFlags {
  isRamadan: boolean;
  isEid: boolean;
  isJumuah: boolean;
  ramadanDay?: number;
  ramadanDaysRemaining?: number;
}
