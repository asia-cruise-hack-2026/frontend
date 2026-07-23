import type { Cruise } from "../model/types";

export const BOARD_CLOSE_MIN = 60; // 출항 1시간 전 탑승 마감
export const IMMINENT_MIN = 150; // 출항 2시간 30분 전부터 임박 경고

export const localDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDaysStr = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return localDateStr(new Date(y, m - 1, d + days));
};

export const fmtHM = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** 크루즈 출항 시각(로컬) epoch ms — date + depM 기준 */
export const cruiseDepartureMs = (c: Pick<Cruise, "date" | "depM">): number => {
  const [y, m, d] = c.date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime() + c.depM * 60_000;
};

export const minutesToDeparture = (c: Pick<Cruise, "date" | "depM">, nowMs: number): number =>
  Math.floor((cruiseDepartureMs(c) - nowMs) / 60_000);

export type CruiseTimeStatus = "departed" | "closed" | "imminent" | "ok";

export const cruiseStatus = (c: Pick<Cruise, "date" | "depM">, nowMs: number): CruiseTimeStatus => {
  const t = minutesToDeparture(c, nowMs);
  if (t <= 0) return "departed";
  if (t <= BOARD_CLOSE_MIN) return "closed";
  if (t <= IMMINENT_MIN) return "imminent";
  return "ok";
};
