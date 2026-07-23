import type { LocalizedText } from "@/entities/cruise";
import type { StringKey } from "@/shared/i18n";

export interface TaxiDriver {
  name: LocalizedText;
  car: LocalizedText;
  plate: string;
  rating: number;
  eta: number; // 도착 예정(분)
}

// 디자인 renderVals(:1450) 이식 — 기본 배정 택시 기사.
export const TAXI_DRIVER: TaxiDriver = {
  name: { ko: "박준영", en: "Junyoung Park", zh: "朴俊英", ja: "パク·ジュンヨン" },
  car: {
    ko: "쏘나타 (개인택시)",
    en: "Sonata (private taxi)",
    zh: "索纳塔（个人出租）",
    ja: "ソナタ(個人タクシー)",
  },
  plate: "제주 80바 3517",
  rating: 4.9,
  eta: 6,
};

export type VehicleType = "normal" | "van";

export interface Vehicle {
  fareMul: number;
  car: LocalizedText;
  plate: string;
}

// 디자인 renderVals(:1451-1454) 이식 — 차종별 요금 배율·차량 정보.
export const VEHICLES: Record<VehicleType, Vehicle> = {
  normal: {
    fareMul: 1,
    car: {
      ko: "쏘나타 (개인택시)",
      en: "Sonata (sedan)",
      zh: "索纳塔（轿车）",
      ja: "ソナタ(セダン)",
    },
    plate: "제주 80바 3517",
  },
  van: {
    fareMul: 1.55,
    car: {
      ko: "카니발 (대형택시)",
      en: "Carnival (van)",
      zh: "嘉华（大型）",
      ja: "カーニバル(大型)",
    },
    plate: "제주 82아 1094",
  },
};

export type GlobalCarKey = "basic" | "jumbo" | "premium" | "van";

export interface GlobalCar {
  key: GlobalCarKey;
  /** i18n 키(gtaxi_basic 등) — 화면에서 t(nameKey)로 해석 */
  nameKey: StringKey;
  cap: string; // 정원 표기 ("4", "5~7" 등)
  day: number; // 1일 대여 요금(원)
  over: number; // 초과 요금(원)
  van: boolean;
  ibg: string; // 아이콘 배경색
  ifg: string; // 아이콘 전경색
}

// 디자인 renderVals(:1597) 이식 — 글로벌택시(전세) 차종 4종.
export const GLOBAL_CARS: GlobalCar[] = [
  {
    key: "basic",
    nameKey: "gtaxi_basic",
    cap: "4",
    day: 220000,
    over: 30000,
    van: false,
    ibg: "#EAF7EE",
    ifg: "var(--status-positive)",
  },
  {
    key: "jumbo",
    nameKey: "gtaxi_jumbo",
    cap: "5~7",
    day: 330000,
    over: 40000,
    van: true,
    ibg: "#E7F1FF",
    ifg: "var(--primary-normal-4)",
  },
  {
    key: "premium",
    nameKey: "gtaxi_premium",
    cap: "5~6",
    day: 400000,
    over: 50000,
    van: true,
    ibg: "#F3ECFF",
    ifg: "#8B3FF0",
  },
  {
    key: "van",
    nameKey: "gtaxi_van",
    cap: "7~12",
    day: 450000,
    over: 60000,
    van: true,
    ibg: "#FFF1E6",
    ifg: "#E8820E",
  },
];
