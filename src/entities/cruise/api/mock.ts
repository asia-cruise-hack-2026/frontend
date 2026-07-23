import type { Cruise } from "../model/types";

// 디자인 :1405-1412 이식 (CRUISES 5건 + PORTS). 나중에 실 API로 교체 가능하도록 async 어댑터로 노출.
const PORTS = {
  jeju: { ko: "제주항", en: "Jeju Port", zh: "济州港", ja: "済州港" },
  gangjeong: { ko: "강정항 (서귀포)", en: "Gangjeong Port", zh: "江汀港", ja: "カンジョン港" },
} as const;

const CRUISES: Cruise[] = [
  {
    id: "msc",
    line: "MSC Cruises",
    ship: "MSC Bellissima",
    portKey: "jeju",
    portName: PORTS.jeju,
    arr: "08:00",
    dep: "18:00",
    arrM: 480,
    depM: 1080,
    nextDest: { ko: "후쿠오카, 일본", en: "Fukuoka, Japan", zh: "福冈, 日本", ja: "福岡、日本" },
  },
  {
    id: "adora",
    line: "Adora Cruises",
    ship: "Adora Magic City",
    portKey: "jeju",
    portName: PORTS.jeju,
    arr: "07:00",
    dep: "17:00",
    arrM: 420,
    depM: 1020,
    nextDest: { ko: "상하이, 중국", en: "Shanghai, China", zh: "上海, 中国", ja: "上海、中国" },
  },
  {
    id: "spectrum",
    line: "Royal Caribbean",
    ship: "Spectrum of the Seas",
    portKey: "gangjeong",
    portName: PORTS.gangjeong,
    arr: "09:00",
    dep: "14:00",
    arrM: 540,
    depM: 840,
    nextDest: { ko: "나가사키, 일본", en: "Nagasaki, Japan", zh: "长崎, 日本", ja: "長崎、日本" },
  },
  {
    id: "diamond",
    line: "Princess Cruises",
    ship: "Diamond Princess",
    portKey: "jeju",
    portName: PORTS.jeju,
    arr: "08:00",
    dep: "20:00",
    arrM: 480,
    depM: 1200,
    nextDest: { ko: "부산, 대한민국", en: "Busan, Korea", zh: "釜山, 韩国", ja: "釜山、韓国" },
  },
  {
    id: "costa",
    line: "Costa Cruises",
    ship: "Costa Serena",
    portKey: "gangjeong",
    portName: PORTS.gangjeong,
    arr: "10:00",
    dep: "22:00",
    arrM: 600,
    depM: 1320,
    nextDest: {
      ko: "가고시마, 일본",
      en: "Kagoshima, Japan",
      zh: "鹿儿岛, 日本",
      ja: "鹿児島、日本",
    },
  },
];

export const listCruises = async (): Promise<Cruise[]> => CRUISES;
export const getCruise = async (id: string): Promise<Cruise | undefined> =>
  CRUISES.find((c) => c.id === id);
