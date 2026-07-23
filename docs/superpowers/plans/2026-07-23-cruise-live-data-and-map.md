# 크루즈 실데이터 · 세션 영속 · 구글맵 1단계 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/`(언어 즉시 전환·순서), `/cruise`(라이브 API + 시간 규칙 + 다음 기항일 폴백), `/app`(세션 영속·가드·실시각 카운트다운·크루즈 삭제·구글맵)을 스펙대로 구현한다.

**Architecture:** vite dev 프록시 `/api` → Cloud Run 라이브 API(프론트는 상대경로 `/api/v1` 고정, 배포 nginx 구조와 동일). cruise entity를 mock → 실 API 어댑터로 교체하고 시간 규칙은 `entities/cruise/lib/timing.ts` 순수 함수로 모은다. 세션·언어는 localStorage 영속. 지도는 `@vis.gl/react-google-maps`로 항구 중심만(마커 없음).

**Tech Stack:** React 19 · TanStack Start/Router/Query/Store · @wanteddev/wds(Montage) · @vis.gl/react-google-maps · pnpm · Biome

**Spec:** `docs/superpowers/specs/2026-07-23-cruise-live-data-and-map-design.md`

## Global Constraints

- 패키지 매니저 **pnpm**. 새 의존성 추가 없음(전부 설치돼 있음).
- 커밋 메시지 맨 앞 `# ` + 타입 (예: `# feat: …`). **AI 작성 표기(Co-Authored-By 등) 금지.**
- pre-commit 훅이 `pnpm check`(Biome) + `pnpm typecheck`를 자동 실행한다 — 커밋 실패 시 훅 출력을 보고 수정한다. `--no-verify` 금지.
- **이 레포에 테스트 러너가 없다**(vitest 미설치). 태스크별 검증 = `pnpm check` + `pnpm typecheck` + 브라우저 확인(`http://localhost:3002`). 테스트 인프라를 새로 추가하지 않는다.
- dev 서버가 이미 3002에 떠 있다(`pnpm dev`, vite는 3000→3002로 밀림). `vite.config.ts` 수정 시 vite가 자동 재시작한다. 죽으면 frontend에서 `pnpm dev` 재실행.
- 백엔드 레포는 **절대 수정하지 않는다**(라이브 검증 완료: `GET /api/v1/health` → `{"ok":true,...}`).
- 마감 규칙: **탑승 마감 = 출항 60분 전**, 임박 경고 = 출항 150분 전부터. API의 `boardByTime`(-30분)은 사용하지 않는다.
- 기존 스타일 유지(수술적 변경): 파일 내 로컬 `fmt`/locale 삼항 패턴 등 기존 관용구를 존중하고, 요청 범위 밖 리팩터 금지.

---

### Task 1: dev 프록시 + `shared/api` http 헬퍼

**Files:**
- Modify: `vite.config.ts`
- Create: `src/shared/api/http.ts`
- Create: `src/shared/api/index.ts`

**Interfaces:**
- Produces: `api<T>(path: string): Promise<T>` — path는 `/cruises?...`처럼 `/api/v1` 이후 부분. 비 2xx면 `ApiError` throw.
- Produces: `class ApiError extends Error { status: number; code: string }`

- [ ] **Step 1: vite 프록시 추가**

`vite.config.ts`의 `server: { port: 3000 },`를 다음으로 교체:

```ts
  server: {
    port: 3000,
    // dev에서만: /api → Cloud Run 라이브(배포에선 같은 오리진 nginx가 /api/ 프록시)
    proxy: {
      "/api": {
        target: "https://tamrapass-34273089941.asia-northeast3.run.app",
        changeOrigin: true,
      },
    },
  },
```

- [ ] **Step 2: 프록시 동작 확인**

Run: `curl -s http://localhost:3002/api/v1/health`
Expected: `{"ok":true,"spots":1668,"goods":1895}` (vite가 config 변경으로 자동 재시작된 뒤. 안 되면 dev 서버 재실행 후 재시도)

- [ ] **Step 3: `src/shared/api/http.ts` 생성**

```ts
// 얇은 API 클라이언트 — base /api/v1 (dev: vite proxy, 배포: nginx /api/ 프록시)
const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // JSON 아님 — 상태코드만으로 에러 구성
    }
    throw new ApiError(res.status, body.error?.code ?? "UNKNOWN", body.error?.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
```

- [ ] **Step 4: `src/shared/api/index.ts` 생성**

```ts
export { api, ApiError } from "./http";
```

- [ ] **Step 5: 검증 후 커밋**

Run: `pnpm check && pnpm typecheck`
Expected: 둘 다 에러 없음

```bash
git add vite.config.ts src/shared/api
git commit -m "# feat: dev API 프록시(Cloud Run)·shared/api 얇은 http 헬퍼"
```

---

### Task 2: cruise entity 실 API 전환 + 소비처 타입 정합

**Files:**
- Modify: `src/entities/cruise/model/types.ts`
- Create: `src/entities/cruise/lib/timing.ts`
- Create: `src/entities/cruise/api/api.ts`
- Delete: `src/entities/cruise/api/mock.ts`
- Modify: `src/entities/cruise/index.ts`
- Modify: `src/pages/cruise-select/ui/CruiseSelectPage.tsx` (쿼리·라벨 치환)
- Modify: `src/pages/home/ui/HomePage.tsx` (쿼리·portName 치환)
- Modify: `src/pages/my/ui/MyPage.tsx` (쿼리·portName·nextDest 치환)

**Interfaces:**
- Consumes: Task 1의 `api`, `ApiError` (`@/shared/api`)
- Produces (타입): `Cruise = { id; ship; berth; date; portKey: "jeju"|"gangjeong"; portName: string; portLat: number; portLng: number; arr; dep; arrM; depM; nextDest: string }` — **언어 해석 완료형**(LocalizedText 아님)
- Produces (api): `listCruises({ date, lang }): Promise<Cruise[]>` · `getCruise(id, lang): Promise<Cruise>`(404 시 ApiError throw) · `listCruisesForSelect(today, lang): Promise<{ date: string; items: Cruise[]; isFallback: boolean }>`
- Produces (timing): `BOARD_CLOSE_MIN=60` · `IMMINENT_MIN=150` · `localDateStr(d: Date): string` · `fmtHM(min): string` · `cruiseDepartureMs(c): number` · `minutesToDeparture(c, nowMs): number` · `cruiseStatus(c, nowMs): "departed"|"closed"|"imminent"|"ok"`
- **주의:** `LocalizedText` 타입은 transport/product/spot entity가 `@/entities/cruise`에서 import 중 — **export 유지**.

- [ ] **Step 1: `src/entities/cruise/model/types.ts` 전체 교체**

```ts
import type { Locale } from "@/shared/i18n";

/** 다른 entity(transport·product·spot)가 공유하는 4개국어 텍스트 타입 — 유지 */
export type LocalizedText = Record<Locale, string>;

/** 서버 응답을 요청 언어로 해석 완료한 크루즈 (GET /cruises) */
export interface Cruise {
  id: string;
  ship: string;
  berth: string; // 예: "강정1"
  date: string; // "2026-07-23"
  portKey: "jeju" | "gangjeong";
  portName: string; // 요청 lang으로 해석됨
  portLat: number;
  portLng: number;
  arr: string; // "13:00"
  dep: string; // "21:00"
  arrM: number; // 분 단위 도착
  depM: number; // 분 단위 출항
  nextDest: string; // 요청 lang으로 해석됨
}
```

- [ ] **Step 2: `src/entities/cruise/lib/timing.ts` 생성**

```ts
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
```

- [ ] **Step 3: `src/entities/cruise/api/api.ts` 생성**

```ts
import { api } from "@/shared/api";
import type { Locale } from "@/shared/i18n";

import { addDaysStr, minutesToDeparture } from "../lib/timing";
import type { Cruise } from "../model/types";

// GET /cruises 응답 항목 (docs: backend/docs/API-SPEC.md §2)
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
export const listCruisesForSelect = async (today: string, lang: Locale): Promise<CruiseSelectResult> => {
  const todayItems = await listCruises({ date: today, lang });
  const now = Date.now();
  if (todayItems.some((c) => minutesToDeparture(c, now) > 0)) {
    return { date: today, items: todayItems, isFallback: false };
  }
  const dates = await api<ItemsRes<{ date: string }>>(`/cruises/dates?from=${addDaysStr(today, 1)}&limit=1`);
  const next = dates.items[0];
  if (!next) return { date: today, items: [], isFallback: false };
  return { date: next.date, items: await listCruises({ date: next.date, lang }), isFallback: true };
};
```

- [ ] **Step 4: mock 삭제 + 배럴 갱신**

`src/entities/cruise/api/mock.ts` 삭제. `src/entities/cruise/index.ts` 전체 교체:

```ts
export type { Cruise, LocalizedText } from "./model/types";
export { getCruise, listCruises, listCruisesForSelect } from "./api/api";
export {
  BOARD_CLOSE_MIN,
  IMMINENT_MIN,
  cruiseDepartureMs,
  cruiseStatus,
  fmtHM,
  localDateStr,
  minutesToDeparture,
} from "./lib/timing";
export type { CruiseTimeStatus } from "./lib/timing";
```

- [ ] **Step 5: `CruiseSelectPage.tsx` 최소 치환 (동작 유지 — 시간 규칙은 Task 4)**

import를 `import { listCruises, localDateStr } from "@/entities/cruise";`로 바꾸고, 쿼리를:

```ts
  const today = localDateStr(new Date());
  const { data: cruises = [] } = useQuery({
    queryKey: ["cruises", today, locale],
    queryFn: () => listCruises({ date: today, lang: locale }),
  });
```

Option 라벨(기존 `` {`${c.ship} · ${c.line}`} ``)을:

```tsx
            {`${c.ship} · ${c.arr}–${c.dep}`}
```

선택 카드 헤더의 `{selected.line}` → `{selected.berth}`, `{selected.portName[locale]}` → `{selected.portName}`.

- [ ] **Step 6: `HomePage.tsx` 치환**

쿼리를:

```ts
  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
    retry: false,
  });
```

`{cruise.portName[locale]}` → `{cruise.portName}` (포트 배지 1곳).

- [ ] **Step 7: `MyPage.tsx` 치환**

쿼리를 HomePage와 동일 형태(`queryKey: ["cruise", cruiseId, locale]`, `getCruise(cruiseId ?? "", locale)`, `retry: false`)로. `{cruise.portName[locale]}` → `{cruise.portName}`, `{cruise.nextDest[locale]}` → `{cruise.nextDest}`.

- [ ] **Step 8: 검증**

Run: `pnpm check && pnpm typecheck`
Expected: 에러 없음
브라우저: `/cruise`에서 현시각 기준 오늘 크루즈(출항 전이면 노출, 밤이면 빈 셀렉트)가 실데이터로 뜸. 선택 시 카드에 실제 항구·시간 표시.

- [ ] **Step 9: 커밋**

```bash
git add -A src/entities/cruise src/pages/cruise-select src/pages/home src/pages/my
git commit -m "# feat: 크루즈 엔티티 실 API 전환(Cloud Run /cruises)·언어 해석 완료형 타입"
```

---

### Task 3: `/` 언어 선택 — 순서·탭 즉시 전환·언어 영속

**Files:**
- Modify: `src/shared/i18n/locale.tsx`
- Modify: `src/pages/lang-select/ui/LangSelectPage.tsx`

**Interfaces:**
- Produces: `LOCALES` 순서 `["en", "zh", "ja", "ko"]` (LangSelect·MyPage 언어칩·PayDemoEntry 공통 반영 — 소비처 코드 수정 불필요)
- Produces: locale이 localStorage `omong.locale.v1`에 영속, 재방문 시 복원

- [ ] **Step 1: `locale.tsx` 수정**

`LOCALES` 를:

```ts
export const LOCALES: readonly Locale[] = ["en", "zh", "ja", "ko"];
```

파일 상단(DEFAULT_LOCALE 아래)에 추가:

```ts
const LOCALE_KEY = "omong.locale.v1";

const isLocale = (v: string | null): v is Locale => v === "ko" || v === "en" || v === "zh" || v === "ja";
```

`I18nProvider` 본문의 `useState` 부분을 다음으로 교체(마운트 후 복원 — prerender된 HTML과의 하이드레이션 불일치 회피):

```ts
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // 저장된 언어 복원 (SPA prerender/hydration 안전하게 마운트 후 1회)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      // 접근 불가(프라이버시 모드 등)면 기본 언어 유지
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // 저장 실패는 무시
    }
  }, []);
```

react import에 `useCallback`, `useEffect` 추가. `useMemo`의 `setLocale`은 이제 위의 `setLocale`을 그대로 value에 넣고 deps를 `[locale, setLocale]`로.

- [ ] **Step 2: `LangSelectPage.tsx` — 탭 즉시 반영**

`useState` 제거하고:

```ts
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();

  const confirm = () => {
    navigate({ to: "/cruise" });
  };
```

카드 렌더에서 `const active = l === selected;` → `const active = l === locale;`, `onClick={() => setSelected(l)}` → `onClick={() => setLocale(l)}`. react의 `useState` import 제거.

- [ ] **Step 3: 검증**

Run: `pnpm check && pnpm typecheck`
브라우저 `/`: 카드 순서 English→中文→日本語→한국어. English 탭 → 제목이 "Choose your language", 부제·Continue 버튼도 즉시 영어로. 中文 탭 → 즉시 중국어. 새로고침 → 마지막 선택 언어 유지.

- [ ] **Step 4: 커밋**

```bash
git add src/shared/i18n/locale.tsx src/pages/lang-select
git commit -m "# feat: 언어 선택 — en/zh/ja/ko 순서·탭 즉시 전환·언어 localStorage 영속"
```

---

### Task 4: `/cruise` 시간 규칙 · 다음 기항일 폴백 · 시작 방어 + 문자열

**Files:**
- Modify: `src/shared/i18n/strings.ts` (키 7개 추가)
- Modify: `src/pages/cruise-select/ui/CruiseSelectPage.tsx` (전체 교체)

**Interfaces:**
- Consumes: `listCruisesForSelect`, `cruiseStatus`, `minutesToDeparture`, `fmtHM`, `BOARD_CLOSE_MIN`, `localDateStr` (`@/entities/cruise`) · `sessionActions` (`@/shared/store`)
- Produces: StringKey 추가 — `cruise_fallback_notice` `cruise_empty` `cruise_departed_feedback` `cruise_closed_badge` `cruise_closed_desc` `cruise_imminent_warn` `my_delete_cruise`

- [ ] **Step 1: `strings.ts`의 `} as const;` 직전(마지막 엔트리 뒤)에 추가**

```ts
  cruise_fallback_notice: {
    ko: "오늘 운항 크루즈가 없어 다음 기항일({date}) 크루즈를 보여드려요.",
    en: "No cruises remaining today — showing the next call date ({date}).",
    zh: "今日已无邮轮，为您显示下一个停靠日（{date}）的邮轮。",
    ja: "本日の運航はないため、次の寄港日（{date}）のクルーズを表示します。",
  },
  cruise_empty: {
    ko: "예정된 크루즈가 없습니다.",
    en: "No upcoming cruises.",
    zh: "暂无预定邮轮。",
    ja: "予定されているクルーズはありません。",
  },
  cruise_departed_feedback: {
    ko: "이미 출항한 크루즈예요. 다른 크루즈를 선택해 주세요.",
    en: "This cruise has already departed. Please choose another.",
    zh: "该邮轮已出航，请选择其他邮轮。",
    ja: "このクルーズはすでに出航しました。他のクルーズをお選びください。",
  },
  cruise_closed_badge: {
    ko: "탑승 마감",
    en: "Boarding closed",
    zh: "登船已截止",
    ja: "乗船締切",
  },
  cruise_closed_desc: {
    ko: "출항 1시간 전에 탑승이 마감돼 지금은 시작할 수 없어요.",
    en: "Boarding closes 1 hour before departure, so this cruise can't be started now.",
    zh: "登船于出航前1小时截止，现在无法开始。",
    ja: "乗船は出航1時間前に締め切られるため、現在は開始できません。",
  },
  cruise_imminent_warn: {
    ko: "탑승 마감({time})까지 {min}분 남았어요. 일정을 짧게 잡고 서둘러 주세요!",
    en: "Only {min} min until boarding closes ({time}). Keep plans short and hurry!",
    zh: "距登船截止（{time}）仅剩{min}分钟，请安排短行程并抓紧时间！",
    ja: "乗船締切（{time}）まで残り{min}分。短めの予定でお急ぎください！",
  },
  my_delete_cruise: {
    ko: "크루즈 선택 삭제",
    en: "Remove cruise",
    zh: "删除邮轮选择",
    ja: "クルーズ選択を削除",
  },
```

- [ ] **Step 2: `CruiseSelectPage.tsx` 전체 교체**

```tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox, Option, Select } from "@wanteddev/wds";
import { IconClockFill, IconLocationFill } from "@wanteddev/wds-icon";
import { useEffect, useState } from "react";

import {
  BOARD_CLOSE_MIN,
  cruiseStatus,
  fmtHM,
  listCruisesForSelect,
  localDateStr,
  minutesToDeparture,
} from "@/entities/cruise";
import { useI18n } from "@/shared/i18n";
import { sessionActions } from "@/shared/store";

// 디자인 :95 원본 선박 SVG — WDS 대응 아이콘 없어 코드로 직접(D2).
function ShipGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1" />
      <path d="M4 18l-1 -5h18l-2 4" />
      <path d="M5 13v-6h8l4 6" />
      <path d="M7 7v-4h-1" />
    </svg>
  );
}

/** 크루즈 선택 — 오늘 크루즈(없으면 다음 기항일 폴백) + 출항/마감/임박 시간 규칙 */
export function CruiseSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const today = localDateStr(new Date());
  const { data, refetch } = useQuery({
    queryKey: ["cruises", "select", today, locale],
    queryFn: () => listCruisesForSelect(today, locale),
  });
  const [cruiseId, setCruiseId] = useState("");
  const [startError, setStartError] = useState(false);

  // 시간 규칙 실시간 재평가(30초) — 목록 필터·배너·버튼 상태가 시각에 따라 변함
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nowMs = now.getTime();
  // 출항 지난 크루즈는 노출 제외 (마감된 크루즈는 노출하되 시작 차단)
  const visible = (data?.items ?? []).filter((c) => minutesToDeparture(c, nowMs) > 0);
  const selected = visible.find((c) => c.id === cruiseId);
  const status = selected ? cruiseStatus(selected, nowMs) : null;
  const isEmpty = !!data && visible.length === 0;

  // 오늘 목록이 화면에 떠 있는 동안 모두 출항해 버리면 폴백 재조회
  useEffect(() => {
    if (data && !data.isFallback && data.items.length > 0 && visible.length === 0) void refetch();
  }, [data, visible.length, refetch]);

  const stayLabel = (arrM: number, depM: number) => {
    const h = Math.floor((depM - arrM) / 60);
    if (locale === "ko") return `${h}시간`;
    if (locale === "zh") return `${h}小时`;
    if (locale === "ja") return `${h}時間`;
    return `${h} hours`;
  };

  const dateLabel = (iso: string) => {
    const [, m, d] = iso.split("-").map(Number);
    if (locale === "en") {
      const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
      return `${mon} ${d}`;
    }
    if (locale === "ko") return `${m}월 ${d}일`;
    return `${m}月${d}日`;
  };

  const start = () => {
    if (!selected) return;
    // 클릭 시점 재검증 — 화면이 오래 떠 있던(stale) 경우 방어
    const s = cruiseStatus(selected, Date.now());
    if (s === "departed") {
      setStartError(true);
      setCruiseId("");
      void refetch();
      return;
    }
    if (s === "closed") return;
    sessionActions.setCruiseId(selected.id);
    navigate({ to: "/app" });
  };

  return (
    <FlexBox
      flexDirection="column"
      sx={{ minHeight: "100dvh", padding: "20px 24px 24px", overflowY: "auto" }}
    >
      <Box
        as="h1"
        sx={(theme) => ({
          margin: "0 0 8px",
          fontWeight: 700,
          fontSize: "24px",
          lineHeight: 1.36,
          letterSpacing: "-0.02em",
          color: theme.semantic.label.normal,
        })}
      >
        {t("cruise_q")}
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "0 0 22px",
          fontSize: "15px",
          lineHeight: 1.55,
          color: theme.semantic.label.alternative,
        })}
      >
        {t("cruise_q_sub")}
      </Box>

      {/* 다음 기항일 폴백 안내 */}
      {data?.isFallback && visible.length > 0 && (
        <Box
          sx={(theme) => ({
            marginBottom: "14px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: theme.semantic.fill.normal,
            fontSize: "13px",
            lineHeight: 1.5,
            color: theme.semantic.label.neutral,
          })}
        >
          {t("cruise_fallback_notice").replace("{date}", dateLabel(data.date))}
        </Box>
      )}

      {isEmpty ? (
        <Box
          sx={(theme) => ({
            padding: "48px 0",
            textAlign: "center",
            fontSize: "15px",
            color: theme.semantic.label.alternative,
          })}
        >
          {t("cruise_empty")}
        </Box>
      ) : (
        <Select
          value={cruiseId}
          onChange={(v) => {
            setCruiseId(v);
            setStartError(false);
          }}
          placeholder={t("select_cruise")}
          width="100%"
        >
          {visible.map((c) => {
            const closed = cruiseStatus(c, nowMs) === "closed";
            return (
              <Option key={c.id} value={c.id}>
                {`${c.ship} · ${c.arr}–${c.dep}${closed ? ` · ${t("cruise_closed_badge")}` : ""}`}
              </Option>
            );
          })}
        </Select>
      )}

      {/* 디자인 :93 카드 등장 페이드 */}
      <style>
        {
          "@keyframes cs-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}"
        }
      </style>
      {selected && (
        <Box
          sx={(theme) => ({
            marginTop: "20px",
            borderRadius: "18px",
            background: theme.semantic.background.normal.normal,
            boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
            overflow: "hidden",
            animation: "cs-fade 0.3s ease both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          })}
        >
          <FlexBox
            alignItems="center"
            gap="12px"
            sx={(theme) => ({
              padding: "16px 18px",
              background: theme.semantic.primary.normal,
              color: theme.semantic.static.white,
            })}
          >
            <Box as="span" sx={{ display: "inline-flex" }}>
              <ShipGlyph />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontWeight: 700, fontSize: "17px" }}>{selected.ship}</Box>
              <Box sx={{ fontSize: "13px", opacity: 0.85 }}>
                {`${dateLabel(selected.date)} · ${selected.berth}`}
              </Box>
            </Box>
          </FlexBox>
          <Box sx={{ padding: "6px 18px" }}>
            <FlexBox
              alignItems="center"
              gap="12px"
              sx={(theme) => ({
                padding: "13px 0",
                borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <Box
                as="span"
                sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
              >
                <IconLocationFill sx={{ fontSize: "20px" }} />
              </Box>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  fontSize: "13px",
                  color: theme.semantic.label.alternative,
                })}
              >
                {t("docking_port")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 600,
                  fontSize: "15px",
                  color: theme.semantic.label.normal,
                })}
              >
                {selected.portName}
              </Box>
            </FlexBox>
            <FlexBox alignItems="center" gap="12px" sx={{ padding: "13px 0" }}>
              <Box
                as="span"
                sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
              >
                <IconClockFill sx={{ fontSize: "20px" }} />
              </Box>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  fontSize: "13px",
                  color: theme.semantic.label.alternative,
                })}
              >
                {t("time_in_jeju")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: "15px",
                  color: theme.semantic.primary.normal,
                })}
              >
                {`${stayLabel(selected.arrM, selected.depM)} · ${selected.arr}–${selected.dep}`}
              </Box>
            </FlexBox>

            {/* 임박 경고 — 탑승 마감(출항 1시간 전)까지 여유가 90분 미만 */}
            {status === "imminent" && (
              <Box
                sx={{
                  margin: "2px 0 14px",
                  padding: "11px 13px",
                  borderRadius: "11px",
                  background: "rgba(181,98,10,.08)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: "#B5620A",
                }}
              >
                {t("cruise_imminent_warn")
                  .replace("{time}", fmtHM(selected.depM - BOARD_CLOSE_MIN))
                  .replace("{min}", String(minutesToDeparture(selected, nowMs) - BOARD_CLOSE_MIN))}
              </Box>
            )}

            {/* 탑승 마감 — 시작 불가 안내 */}
            {status === "closed" && (
              <Box
                sx={(theme) => ({
                  margin: "2px 0 14px",
                  padding: "11px 13px",
                  borderRadius: "11px",
                  background: addOpacity(theme.semantic.status.negative, theme.opacity[8]),
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: theme.semantic.status.negative,
                })}
              >
                {t("cruise_closed_desc")}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      {/* 출항 지난 크루즈를 시작하려던 경우 피드백 */}
      {startError && (
        <Box
          sx={(theme) => ({
            marginTop: "14px",
            padding: "11px 13px",
            borderRadius: "11px",
            background: addOpacity(theme.semantic.status.negative, theme.opacity[8]),
            fontSize: "13px",
            lineHeight: 1.5,
            fontWeight: 600,
            color: theme.semantic.status.negative,
          })}
        >
          {t("cruise_departed_feedback")}
        </Box>
      )}

      <Box sx={{ marginTop: "22px" }}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          disabled={!selected || status === "closed"}
          onClick={start}
        >
          {t("get_started")}
        </Button>
      </Box>
    </FlexBox>
  );
}
```

- [ ] **Step 3: 검증**

Run: `pnpm check && pnpm typecheck`
브라우저 `/cruise` (현시각 밤이면): 폴백 안내("다음 기항일(7월 24일)…") + 내일 크루즈 노출, 선택 → 카드에 날짜·선석 표시, 시작하기 → `/app` 이동. 시간 분기(마감·임박·출항 직후 방어)는 코드 리뷰 + `cruiseStatus` 경계값(60/150분) 육안 확인으로 갈음(시스템 시각 변경 없이는 재현 불가).

- [ ] **Step 4: 커밋**

```bash
git add src/shared/i18n/strings.ts src/pages/cruise-select
git commit -m "# feat: 크루즈 선택 — 오늘/다음 기항일 폴백·출항 제외·마감 차단·임박 경고"
```

---

### Task 5: 세션 localStorage 영속 + `/app` 진입 가드·만료 처리

**Files:**
- Modify: `src/shared/store/session.ts`
- Modify: `src/shared/store/index.ts`
- Modify: `src/routes/app.tsx`
- Modify: `src/pages/home/ui/HomePage.tsx` (만료 리다이렉트)

**Interfaces:**
- Produces: 세션 전체(`cruiseId`·`pkgSpotIds`·`transportMode`·`cart`)가 `omong.session.v1` 키로 영속
- Produces: `getSessionCruiseId(): string | null` — 라우터 `beforeLoad`용 스냅샷
- Consumes: `minutesToDeparture` (`@/entities/cruise`) · `ApiError` (`@/shared/api`)

- [ ] **Step 1: `session.ts` — 영속 배선**

파일 상단 `const store = new Store<SessionState>({...})` 를 다음으로 교체:

```ts
const EMPTY: SessionState = { cruiseId: null, pkgSpotIds: [], transportMode: null, cart: [] };

const STORAGE_KEY = "omong.session.v1";

// SPA prerender(node)에서도 모듈이 평가되므로 window 가드 필수
const load = (): SessionState => {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p: unknown = JSON.parse(raw);
    if (typeof p !== "object" || p === null) return EMPTY;
    const s = p as Partial<SessionState>;
    return {
      cruiseId: typeof s.cruiseId === "string" ? s.cruiseId : null,
      pkgSpotIds: Array.isArray(s.pkgSpotIds)
        ? s.pkgSpotIds.filter((x): x is string => typeof x === "string")
        : [],
      transportMode:
        s.transportMode === "taxi" || s.transportMode === "van" || s.transportMode === "gtaxi"
          ? s.transportMode
          : null,
      cart: Array.isArray(s.cart) ? s.cart.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return EMPTY;
  }
};

const store = new Store<SessionState>(load());

store.subscribe(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
  } catch {
    // 저장 실패(용량·프라이버시 모드)는 무시 — 세션은 메모리로 계속 동작
  }
});

/** 라우터 beforeLoad 등 훅 밖에서 읽는 스냅샷 */
export const getSessionCruiseId = (): string | null => store.state.cruiseId;
```

`sessionActions.reset`은 기존 그대로(EMPTY와 동일 형태라 subscribe가 빈 상태를 저장 → 삭제 효과).

- [ ] **Step 2: `src/shared/store/index.ts` 에 export 추가**

```ts
export {
  getSessionCruiseId,
  sessionActions,
  useCart,
  useCruiseId,
  usePkgSpotIds,
  useTransportMode,
} from "./session";
export type { TransportMode } from "./session";
```

- [ ] **Step 3: `routes/app.tsx` 가드**

import에 `redirect` 추가, store import 추가:

```ts
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
```

```ts
import { getSessionCruiseId } from "@/shared/store";
```

Route 정의를:

```ts
export const Route = createFileRoute("/app")({
  // 탑승(크루즈 선택) 정보 없으면 첫 화면으로 — /app/* 전체 커버
  beforeLoad: () => {
    if (!getSessionCruiseId()) throw redirect({ to: "/" });
  },
  component: AppLayout,
});
```

- [ ] **Step 4: `HomePage.tsx` 만료 처리**

react import 추가(`useEffect`), entity·api import 추가:

```ts
import { useEffect } from "react";
```

`getCruise` import 줄을 `import { getCruise, minutesToDeparture } from "@/entities/cruise";`로, `ApiError`를 `import { ApiError } from "@/shared/api";`로. store import에 `sessionActions` 추가:

```ts
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";
```

cruise 쿼리를 `error` 포함으로:

```ts
  const { data: cruise, error: cruiseError } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
    retry: false,
  });
```

쿼리 아래에 만료/소실 처리 추가:

```ts
  // 출항이 지났거나(만료) 크루즈가 사라졌으면(404) 세션 비우고 첫 화면으로
  useEffect(() => {
    const gone = cruiseError instanceof ApiError && cruiseError.status === 404;
    const departed = cruise ? minutesToDeparture(cruise, Date.now()) <= 0 : false;
    if (gone || departed) {
      sessionActions.reset();
      void navigate({ to: "/" });
    }
  }, [cruise, cruiseError, navigate]);
```

- [ ] **Step 5: 검증**

Run: `pnpm check && pnpm typecheck`
브라우저: `/cruise`에서 선택→시작→`/app` 진입 후 **새로고침 → 그대로 유지**(카운트다운 섹션 표시). localStorage 삭제(개발자도구) 후 `/app` 새로고침 → `/`로 리다이렉트. `/app/my` 직접 진입도 동일 가드.

- [ ] **Step 6: 커밋**

```bash
git add src/shared/store src/routes/app.tsx src/pages/home
git commit -m "# feat: 세션 localStorage 영속·/app 진입 가드·만료(출항 경과/404) 시 초기 화면 복귀"
```

---

### Task 6: 카운트다운 실시각 전환 + 마이페이지 마감 -60분·크루즈 삭제

**Files:**
- Modify: `src/pages/home/ui/HomePage.tsx`
- Modify: `src/pages/my/ui/MyPage.tsx`

**Interfaces:**
- Consumes: `cruiseDepartureMs` (`@/entities/cruise`) · Task 4의 `my_delete_cruise` 문자열 · `sessionActions.reset`

- [ ] **Step 1: `HomePage.tsx` — 실시각 tick**

react import를 `import { useEffect, useState } from "react";`로. entity import에 `cruiseDepartureMs` 추가(`getCruise, minutesToDeparture`와 함께). 컴포넌트 상단(쿼리 위쪽)에 추가:

```ts
  // 실시각 카운트다운 (1분 tick)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
```

- [ ] **Step 2: `derived` 블록 교체**

기존:

```ts
  // 디자인 최종 renderVals (now = 도착 90분 후, 마감 = 출항 60분 전)
  const derived = cruise
    ? (() => {
        const nowM = cruise.arrM + 90;
        const deadM = cruise.depM - 60;
        const remM = Math.max(0, deadM - nowM);
        return {
          remH: Math.floor(remM / 60),
          remMin: remM % 60,
          boardBy: fmt(deadM),
          stayPct: Math.round(((nowM - cruise.arrM) / (deadM - cruise.arrM)) * 100),
        };
      })()
    : null;
```

교체:

```ts
  // 실제 현재 시각 기준 (마감 = 출항 60분 전). 미래 기항일 선택(폴백) 시 pct는 0으로 클램프
  const derived = cruise
    ? (() => {
        const depMs = cruiseDepartureMs(cruise);
        const deadMs = depMs - 60 * 60_000;
        const arrMs = depMs - (cruise.depM - cruise.arrM) * 60_000;
        const remM = Math.max(0, Math.floor((deadMs - now.getTime()) / 60_000));
        return {
          remH: Math.floor(remM / 60),
          remMin: remM % 60,
          boardBy: fmt(cruise.depM - 60),
          stayPct: Math.round(
            Math.min(100, Math.max(0, ((now.getTime() - arrMs) / (deadMs - arrMs)) * 100)),
          ),
        };
      })()
    : null;
```

만료 useEffect(Task 5)의 deps에 `now` 추가 — tick마다 만료 재평가:

```ts
  }, [cruise, cruiseError, navigate, now]);
```

(`departed` 계산도 `minutesToDeparture(cruise, now.getTime()) <= 0`으로 바꿔 tick과 일관되게.)

- [ ] **Step 3: `MyPage.tsx` — 마감 -60 + 삭제 버튼**

`{fmt(cruise.depM - 30)}` → `{fmt(cruise.depM - 60)}`.

import 수정: wds에 `Button` 추가, `useNavigate` 추가, store에 `sessionActions` 추가:

```ts
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import { useNavigate } from "@tanstack/react-router";
import { sessionActions, useCruiseId } from "@/shared/store";
```

컴포넌트 상단에:

```ts
  const navigate = useNavigate();

  const removeCruise = () => {
    sessionActions.reset();
    void navigate({ to: "/" });
  };
```

내 크루즈 카드의 마지막 row(`next_dest` FlexBox) 닫힌 뒤, 카드 안쪽 `</Box>`(padding "4px 16px" Box 닫는 태그) **앞**에 추가:

```tsx
            <Box sx={{ padding: "2px 0 14px" }}>
              <Button variant="outlined" color="primary" size="medium" fullWidth onClick={removeCruise}>
                {t("my_delete_cruise")}
              </Button>
            </Box>
```

- [ ] **Step 4: 검증**

Run: `pnpm check && pnpm typecheck`
브라우저: `/app` 카운트다운이 실제 남은 시간(내일 크루즈 선택 시 큰 값, 예: 15h+)으로 표시, board_by 칩 = 출항-60분. `/app/my` 탑승 마감도 동일 시각. **삭제 버튼 → `/` 이동 → `/app` 재진입 시도 → `/`로 가드**. 새로고침해도 삭제 상태 유지.

- [ ] **Step 5: 커밋**

```bash
git add src/pages/home src/pages/my
git commit -m "# feat: 탑승 마감 카운트다운 실시각 전환(마감 -60분 통일)·마이 크루즈 삭제"
```

---

### Task 7: 홈 지도 — 구글맵 1단계 (항구 중심, 마커 없음)

**Files:**
- Create: `src/pages/home/ui/HomeMap.tsx`
- Modify: `src/pages/home/ui/HomePage.tsx` (placeholder 교체)

**Interfaces:**
- Consumes: `cruise.portLat` / `cruise.portLng` (Task 2 타입) · `frontend/.env`의 `VITE_GOOGLE_MAPS_API_KEY`(구성됨 — **읽지 말 것**, 값 확인 불필요)
- Produces: `HomeMap({ lat, lng })` — 키 없으면 기존 placeholder 폴백. 마커는 다음 단계(`GET /spots?cruiseId=&compact=1` 계약 확정됨 — 스펙 §5)

- [ ] **Step 1: `src/pages/home/ui/HomeMap.tsx` 생성**

```tsx
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** 홈 지도 1단계 — 구글맵만 띄운다(항구 중심). 마커·스팟 연동은 /spots?compact=1로 다음 단계 */
export function HomeMap({ lat, lng }: { lat: number; lng: number }) {
  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 기존 placeholder 유지
    return <Box sx={{ position: "relative", height: "270px", background: "#CFE4F2" }} />;
  }
  return (
    <Box sx={{ position: "relative", height: "270px" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={11.5}
          disableDefaultUI
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        />
      </APIProvider>
    </Box>
  );
}
```

- [ ] **Step 2: `HomePage.tsx` placeholder 교체**

import 추가:

```ts
import { HomeMap } from "./HomeMap";
```

기존:

```tsx
          {/* 지도 placeholder — S2에서 Google Maps(client-only)로 교체 */}
          <Box sx={{ position: "relative", height: "270px", background: "#CFE4F2" }} />
```

교체(크루즈 미로드 순간엔 제주항 좌표 기본값):

```tsx
          {/* 구글맵 1단계 — 항구 중심, 마커는 다음 단계(/spots?compact=1) */}
          <HomeMap lat={cruise?.portLat ?? 33.523} lng={cruise?.portLng ?? 126.537} />
```

- [ ] **Step 3: 검증**

Run: `pnpm check && pnpm typecheck`
브라우저 `/app`: 지도 카드에 실제 구글맵 타일 렌더(강정항 선택 시 서귀포 일대 중심). 콘솔에 Maps 키 에러 없어야 함. 키 문제로 회색 지도가 뜨면 그대로 보고(키는 사용자 소관 — .env 열람 금지).

- [ ] **Step 4: 커밋**

```bash
git add src/pages/home
git commit -m "# feat: 홈 지도 구글맵 1단계(항구 중심·마커 없음, 키 부재 시 placeholder 폴백)"
```

---

### Task 8: 전체 검증 (빌드 + 브라우저 시나리오)

**Files:** 없음 (수정 발생 시 해당 파일 fixup)

- [ ] **Step 1: 정적 검증 + 빌드**

Run: `pnpm check && pnpm typecheck && pnpm build`
Expected: 모두 성공. build는 SPA prerender 포함 — `typeof window` 가드 덕에 node에서 크래시 없어야 함. 실패 시 출력 그대로 보고.

- [ ] **Step 2: 브라우저 E2E 시나리오 (Orca 내장 브라우저, `http://localhost:3002`)**

1. `/`: 순서 en→zh→ja→ko, 탭 즉시 문구 전환, 새로고침 후 언어 유지.
2. `/cruise`: (밤 시간대) 폴백 안내 + 다음 기항일 크루즈. 선택 → 카드(날짜·선석·항구·체류시간). 시작하기 → `/app`.
3. `/app`: 카운트다운 실시각 값, board_by = 출항-60분, 구글맵 렌더. **새로고침 → 전부 유지**.
4. `/app/my`: 내 크루즈 정보 일치, 마감 -60분, 삭제 → `/` 복귀 → `/app` 직접 진입 차단.
5. 콘솔 에러 0 확인(맵 키 경고 제외 — 발생 시 보고).

- [ ] **Step 3: 최종 보고**

무엇을 바꿨고(커밋 목록), 무엇을 검증했고, **검증 못 한 것**(시간 분기 경계값 — 시스템 시각 의존, 낮 시간대 오늘-크루즈 노출 경로)을 명시해 보고.
