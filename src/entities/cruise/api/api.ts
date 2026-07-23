import { api } from "@/shared/api";
import type { Locale } from "@/shared/i18n";

import { addDaysStr, minutesToDeparture } from "../lib/timing";
import type { Cruise } from "../model/types";

// GET /cruises 응답 항목 (backend/docs/API-SPEC.md §2)
interface ApiCruise {
  id: string;
  ship: string;
  berth: string;
  date: string;
  port: { key: string; name: string; lat: number; lng: number };
  arrival: string; // "13:00"
  departure: string; // "21:00"
  nextDestination: string;
}

interface ItemsRes<T> {
  items: T[];
}

const toMin = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

const toCruise = (c: ApiCruise): Cruise => ({
  id: c.id,
  ship: c.ship,
  berth: c.berth,
  date: c.date,
  portKey: c.port.key === "gangjeong" ? "gangjeong" : "jeju",
  portName: c.port.name,
  portLat: c.port.lat,
  portLng: c.port.lng,
  arr: c.arrival,
  dep: c.departure,
  arrM: toMin(c.arrival),
  depM: toMin(c.departure),
  nextDest: c.nextDestination,
});

export const listCruises = async (p: { date: string; lang: Locale }): Promise<Cruise[]> =>
  (await api<ItemsRes<ApiCruise>>(`/cruises?date=${p.date}&lang=${p.lang}`)).items.map(toCruise);

export const getCruise = async (id: string, lang: Locale): Promise<Cruise> =>
  toCruise(await api<ApiCruise>(`/cruises/${encodeURIComponent(id)}?lang=${lang}`));

export interface CruiseSelectResult {
  date: string;
  items: Cruise[];
  isFallback: boolean;
}

/** 크루즈 선택 화면용: 오늘 크루즈(출항 전이 하나라도 있으면) → 없으면 다음 기항일로 폴백 */
export const listCruisesForSelect = async (
  today: string,
  lang: Locale,
): Promise<CruiseSelectResult> => {
  const todayItems = await listCruises({ date: today, lang });
  const now = Date.now();
  if (todayItems.some((c) => minutesToDeparture(c, now) > 0)) {
    return { date: today, items: todayItems, isFallback: false };
  }
  const dates = await api<ItemsRes<{ date: string }>>(
    `/cruises/dates?from=${addDaysStr(today, 1)}&limit=1`,
  );
  const next = dates.items[0];
  if (!next) return { date: today, items: [], isFallback: false };
  return { date: next.date, items: await listCruises({ date: next.date, lang }), isFallback: true };
};
