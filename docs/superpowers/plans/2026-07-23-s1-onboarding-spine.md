# S1 온보딩 스파인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cruise-select → home 화면과 앱 셸·하단탭·전역스토어·mock 데이터 토대를 만들어, 언어선택 이후 온보딩 스파인이 mock으로 "동작하는 것처럼" 돌게 한다.

**Architecture:** 기존 FSD(app→pages→widgets→features→entities→shared) 위에 구축. 데이터는 디자인 내장 mock을 `entities/*`에 타입+픽스처로 이식하고 얇은 async 어댑터로 감싼다(나중에 live API 스왑). 크로스스크린 세션 상태는 TanStack Store. 앱 화면은 `/app` 레이아웃(모바일 풀뷰포트 셸 + 하단탭 + Outlet) 안에 둔다.

**Tech Stack:** React 19 · TanStack Router/Query/Start · **@tanstack/react-store** (신규) · Montage `@wanteddev/wds`+`wds-icon` · zod · TypeScript strict · Biome.

## Global Constraints

- 패키지 매니저 **pnpm** 전용, 버전 `^x.y.z` 고정(`latest` 금지). 신규 의존성 추가는 `pnpm add`.
- 별칭 `@/*` · `#/*` → `src/*`.
- **Montage 우선**: 컴포넌트 먼저, 없거나 어려우면 코드 직접. 색·간격·타이포는 `theme.semantic.*` 콜백(생 `var(--...)` 금지). 정확한 컴포넌트/토큰은 `montage-react` 스킬 + Montage MCP로 조회.
- **브랜드 = OMONG**(탐라패스 금지). 탐나오 = 우리가 연결하는 제주 공공 관광상품 플랫폼(파트너)으로 서술 유지.
- **i18n**: 문자열은 반드시 기존 `useI18n().t(key)` 사용(하드코딩 금지). 4개국어. money는 `useI18n().money(n)`.
- **모바일 풀뷰포트, 앱처럼**(`mobile-webview` 스킬). 폰 베젤 프리뷰 크롬은 미채용.
- **커밋**: 메시지 맨 앞 `# ` + 타입(예: `# feat: …`). **AI 작성 표기 금지**(`Co-Authored-By`·`Generated with` 트레일러 넣지 않는다).
- **검증(이 레포엔 단위테스트 러너 없음 — MVP)**: 각 태스크 완료 시 `pnpm typecheck` + `pnpm check` 통과 + 화면 태스크는 **Orca 내장 브라우저**(`orca-cli` 스킬)로 `frontend/design/incoming/Jeju Cruise App.dc.html` 해당 화면과 대조(레이아웃·플로우·콘솔 무에러). 통과 후 커밋.
- 디자인 SoT: `frontend/design/incoming/Jeju Cruise App.dc.html`. 화면 구현은 이 파일의 해당 라인을 근거로 Montage 매핑.

---

## File Structure

**신규 생성**
- `src/entities/cruise/model/types.ts` — `Cruise` 타입
- `src/entities/cruise/api/mock.ts` — 디자인 CRUISES 5건 mock + `listCruises()`, `getCruise(id)`
- `src/entities/cruise/index.ts` — 배럴
- `src/entities/spot/model/types.ts` — `Spot` 타입
- `src/entities/spot/api/mock.ts` — 디자인 SPOTS 12건 mock + `listSpots({portKey})`, `getSpot(id)`
- `src/entities/spot/index.ts` — 배럴
- `src/shared/store/session.ts` — TanStack Store: `{ cruiseId, pkgSpotIds }` + 액션
- `src/shared/store/index.ts` — 배럴
- `src/widgets/bottom-tab-bar/ui/BottomTabBar.tsx` — 하단 탭바(Montage)
- `src/widgets/bottom-tab-bar/index.ts` — 배럴
- `src/pages/cruise-select/ui/CruiseSelectPage.tsx` — 크루즈 선택
- `src/pages/cruise-select/index.ts` — 배럴
- `src/pages/home/ui/HomePage.tsx` — 홈(일정 타임라인)
- `src/pages/home/index.ts` — 배럴
- `src/routes/app.tsx` — `/app` 레이아웃(셸 + 하단탭 + Outlet)
- `src/routes/app/index.tsx` — `/app/` 홈 라우트
- `src/routes/app/explore.tsx` · `shop.tsx` · `move.tsx` · `my.tsx` — 탭 목적지 스텁(하단탭 동작용)

**수정**
- `src/routes/cruise.tsx` — 스텁을 `CruiseSelectPage`로 교체
- `package.json` — `@tanstack/react-store` 추가

> `routeTree.gen.ts`는 TanStack 플러그인이 `pnpm dev`/`build` 시 자동 재생성(수기 편집 금지).

---

## Task 1: mock 데이터 토대 (cruise · spot entities)

**Files:**
- Create: `src/entities/cruise/model/types.ts`, `src/entities/cruise/api/mock.ts`, `src/entities/cruise/index.ts`
- Create: `src/entities/spot/model/types.ts`, `src/entities/spot/api/mock.ts`, `src/entities/spot/index.ts`
- Reference: `frontend/design/incoming/Jeju Cruise App.dc.html:1405-1429` (CRUISES, PORTS, SPOTS)

**Interfaces (Produces):**
- `Cruise = { id; line; ship; portKey: 'jeju'|'gangjeong'; portName: LocalizedText; arr; dep; arrM; depM; nextDest: LocalizedText }`
- `Spot = { id; portKey; km; min; icon; color; iconColor; themes: string[]; name: LocalizedText; cat: LocalizedText; blurb: LocalizedText }`
- `LocalizedText = Record<Locale, string>` (Locale는 `@/shared/i18n`)
- `listCruises(): Promise<Cruise[]>`, `getCruise(id: string): Promise<Cruise | undefined>`
- `listSpots(opts: { portKey: Cruise['portKey'] }): Promise<Spot[]>`, `getSpot(id: string): Promise<Spot | undefined>`

- [ ] **Step 1: `entities/cruise/model/types.ts` 작성**

```ts
import type { Locale } from "@/shared/i18n";

export type LocalizedText = Record<Locale, string>;

export interface Cruise {
  id: string;
  line: string;
  ship: string;
  portKey: "jeju" | "gangjeong";
  portName: LocalizedText;
  arr: string; // "08:00"
  dep: string; // "18:00"
  arrM: number; // 분 단위 도착
  depM: number; // 분 단위 출항
  nextDest: LocalizedText;
}
```

- [ ] **Step 2: `entities/cruise/api/mock.ts` 작성** — 디자인 `:1405-1412`의 CRUISES 5건 + PORTS를 이식. async 어댑터 형태로 노출(나중에 fetch로 스왑).

```ts
import type { Cruise } from "../model/types";

const PORTS = {
  jeju: { ko: "제주항", en: "Jeju Port", zh: "济州港", ja: "済州港" },
  gangjeong: { ko: "강정항 (서귀포)", en: "Gangjeong Port", zh: "江汀港", ja: "カンジョン港" },
} as const;

const CRUISES: Cruise[] = [
  { id: "msc", line: "MSC Cruises", ship: "MSC Bellissima", portKey: "jeju", portName: PORTS.jeju, arr: "08:00", dep: "18:00", arrM: 480, depM: 1080, nextDest: { ko: "후쿠오카, 일본", en: "Fukuoka, Japan", zh: "福冈, 日本", ja: "福岡、日本" } },
  { id: "adora", line: "Adora Cruises", ship: "Adora Magic City", portKey: "jeju", portName: PORTS.jeju, arr: "07:00", dep: "17:00", arrM: 420, depM: 1020, nextDest: { ko: "상하이, 중국", en: "Shanghai, China", zh: "上海, 中国", ja: "上海、中国" } },
  { id: "spectrum", line: "Royal Caribbean", ship: "Spectrum of the Seas", portKey: "gangjeong", portName: PORTS.gangjeong, arr: "09:00", dep: "14:00", arrM: 540, depM: 840, nextDest: { ko: "나가사키, 일본", en: "Nagasaki, Japan", zh: "长崎, 日本", ja: "長崎、日本" } },
  { id: "diamond", line: "Princess Cruises", ship: "Diamond Princess", portKey: "jeju", portName: PORTS.jeju, arr: "08:00", dep: "20:00", arrM: 480, depM: 1200, nextDest: { ko: "부산, 대한민국", en: "Busan, Korea", zh: "釜山, 韩国", ja: "釜山、韓国" } },
  { id: "costa", line: "Costa Cruises", ship: "Costa Serena", portKey: "gangjeong", portName: PORTS.gangjeong, arr: "10:00", dep: "22:00", arrM: 600, depM: 1320, nextDest: { ko: "가고시마, 일본", en: "Kagoshima, Japan", zh: "鹿儿岛, 日本", ja: "鹿児島、日本" } },
];

export const listCruises = async (): Promise<Cruise[]> => CRUISES;
export const getCruise = async (id: string): Promise<Cruise | undefined> =>
  CRUISES.find((c) => c.id === id);
```

- [ ] **Step 3: `entities/spot/model/types.ts` 작성**

```ts
import type { LocalizedText } from "@/entities/cruise";

export interface Spot {
  id: string;
  portKey: "jeju" | "gangjeong";
  km: number;
  min: number;
  icon: string;
  color: string;
  iconColor: string;
  themes: string[];
  name: LocalizedText;
  cat: LocalizedText;
  blurb: LocalizedText;
}
```

- [ ] **Step 4: `entities/spot/api/mock.ts` 작성** — 디자인 `:1416-1429`의 SPOTS 12건 이식(각 항목의 id·portKey·km·min·icon·color·iconColor·themes·name·cat·blurb). `subs`는 S2에서 추가하므로 S1에선 위 필드만. `listSpots({portKey})`는 해당 항구 스팟만 반환.

```ts
import type { Spot } from "../model/types";

// 디자인 :1416-1429 이식. 12건 전부. (subs는 S2에서 확장)
const SPOTS: Spot[] = [
  { id: "dongmun", portKey: "jeju", km: 2.0, min: 60, icon: "coffee", color: "#FFF1E6", iconColor: "#E8820E", themes: ["food", "attraction"], name: { ko: "제주 동문시장", en: "Dongmun Market", zh: "东门市场", ja: "東門市場" }, cat: { ko: "전통시장", en: "Market", zh: "传统市场", ja: "伝統市場" }, blurb: { ko: "항구에서 가장 가까운 제주 대표 재래시장. 흑돼지·회·간식거리가 가득해요.", en: "Jeju's liveliest market, closest to the port — black pork, sashimi and street snacks.", zh: "距港口最近的济州代表市场，黑猪、生鱼片、小吃应有尽有。", ja: "港から最も近い済州の代表市場。黒豚·刺身·屋台グルメが満載。" } },
  // … 나머지 11건(yongduam, sarabong, samyang, pkgjeju, cafejeju, cheonjiyeon, jeongbang, olle, jusangjeolli, pkggj, cafegj)을 :1417-1428에서 동일 필드로 이식
];

export const listSpots = async ({ portKey }: { portKey: Spot["portKey"] }): Promise<Spot[]> =>
  SPOTS.filter((s) => s.portKey === portKey);
export const getSpot = async (id: string): Promise<Spot | undefined> =>
  SPOTS.find((s) => s.id === id);
```

- [ ] **Step 5: 배럴 작성** — `entities/cruise/index.ts`, `entities/spot/index.ts`

```ts
// entities/cruise/index.ts
export type { Cruise, LocalizedText } from "./model/types";
export { listCruises, getCruise } from "./api/mock";
```
```ts
// entities/spot/index.ts
export type { Spot } from "./model/types";
export { listSpots, getSpot } from "./api/mock";
```

- [ ] **Step 6: 검증 + 커밋**

Run: `pnpm typecheck` (Expected: 에러 없음) · `pnpm check` (Expected: 통과)
```bash
git add src/entities/cruise src/entities/spot
git commit -m "# feat: cruise·spot mock entities 이식(디자인 데이터)"
```

---

## Task 2: 세션 스토어 (TanStack Store)

**Files:**
- Modify: `package.json` (`@tanstack/react-store` 추가)
- Create: `src/shared/store/session.ts`, `src/shared/store/index.ts`

**Interfaces (Produces):**
- `useCruiseId(): string | null` · `usePkgSpotIds(): string[]`
- `sessionActions = { setCruiseId(id: string): void; togglePkgSpot(id: string): void; reset(): void }`

- [ ] **Step 1: 의존성 추가**

Run: `pnpm add @tanstack/react-store`
Expected: `package.json` dependencies에 `@tanstack/react-store` `^x.y.z` 추가됨.

- [ ] **Step 2: `shared/store/session.ts` 작성**

```ts
import { Store, useStore } from "@tanstack/react-store";

interface SessionState {
  cruiseId: string | null;
  pkgSpotIds: string[];
}

const store = new Store<SessionState>({ cruiseId: null, pkgSpotIds: [] });

export const useCruiseId = () => useStore(store, (s) => s.cruiseId);
export const usePkgSpotIds = () => useStore(store, (s) => s.pkgSpotIds);

export const sessionActions = {
  setCruiseId: (id: string) => store.setState((s) => ({ ...s, cruiseId: id })),
  togglePkgSpot: (id: string) =>
    store.setState((s) => ({
      ...s,
      pkgSpotIds: s.pkgSpotIds.includes(id)
        ? s.pkgSpotIds.filter((x) => x !== id)
        : [...s.pkgSpotIds, id],
    })),
  reset: () => store.setState(() => ({ cruiseId: null, pkgSpotIds: [] })),
};
```

- [ ] **Step 3: `shared/store/index.ts` 배럴**

```ts
export { useCruiseId, usePkgSpotIds, sessionActions } from "./session";
```

- [ ] **Step 4: 검증 + 커밋**

Run: `pnpm typecheck` · `pnpm check`
```bash
git add package.json pnpm-lock.yaml src/shared/store
git commit -m "# feat: 세션 전역 스토어(TanStack Store) 추가"
```

---

## Task 3: 크루즈 선택 화면 (`/cruise`)

**Files:**
- Create: `src/pages/cruise-select/ui/CruiseSelectPage.tsx`, `src/pages/cruise-select/index.ts`
- Modify: `src/routes/cruise.tsx`
- Reference: 디자인 `:82-122` · 문자열 키: `official_badge, cruise_q, cruise_q_sub, select_cruise, docking_port, time_in_jeju, get_started` · 패턴 참고: `src/pages/lang-select/ui/LangSelectPage.tsx`

**Interfaces (Consumes):** `listCruises`(Task1) · `useI18n`(기존) · `sessionActions.setCruiseId`(Task2)

**동작(디자인 `:82-122` + `:1101/1102` 로직):** 공식배지 → `cruise_q` 제목 → `cruise_q_sub` → Montage `Select`(옵션 label = `ship · line`) → 선택 시 크루즈 정보카드(ship/line 헤더 primary 배경, `docking_port`행·`time_in_jeju`행 = `체류라벨 · arr–dep`) fade-in → 하단 `get_started` 버튼(미선택 시 disabled). 시작 시 `setCruiseId(선택)` 후 `/app`로 이동.

- [ ] **Step 1: `CruiseSelectPage.tsx` 작성** — 데이터/네비 배선은 아래 코드대로. 시각 구조는 디자인 `:82-122`를 Montage(`Box`/`FlexBox`/`Select`/`Button` + `theme.semantic.*` + `wds-icon`)로 매핑. 정확한 컴포넌트 props/토큰은 Montage MCP로 확인.

```tsx
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { listCruises } from "@/entities/cruise";
import { useI18n } from "@/shared/i18n";
import { sessionActions } from "@/shared/store";

export function CruiseSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { data: cruises = [] } = useQuery({ queryKey: ["cruises"], queryFn: listCruises });
  const [cruiseId, setCruiseId] = useState("");
  const selected = cruises.find((c) => c.id === cruiseId);

  const start = () => {
    if (!cruiseId) return;
    sessionActions.setCruiseId(cruiseId);
    navigate({ to: "/app" });
  };

  // 렌더: 디자인 :82-122 를 Montage로 매핑.
  // - Select options: cruises.map(c => ({ value: c.id, label: `${c.ship} · ${c.line}` })), onChange → setCruiseId
  // - 정보카드(selected일 때): portName=selected.portName[locale], 체류=stayLabel(아래), arr–dep
  // - Button disabled={!cruiseId} onClick={start}
  // stayLabel 예: `${Math.floor((selected.depM-selected.arrM)/60)}시간`(locale별 단위는 lang-select와 동일 패턴)
  return null; // ← 위 구조로 실제 JSX 채우기(placeholder 금지)
}
```

- [ ] **Step 2: 배럴** — `src/pages/cruise-select/index.ts`

```ts
export { CruiseSelectPage } from "./ui/CruiseSelectPage";
```

- [ ] **Step 3: 라우트 교체** — `src/routes/cruise.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { CruiseSelectPage } from "@/pages/cruise-select";

export const Route = createFileRoute("/cruise")({
  component: CruiseSelectPage,
});
```

- [ ] **Step 4: 검증(typecheck·check·Orca) + 커밋**

Run: `pnpm typecheck` · `pnpm check` · `pnpm dev` 후 Orca 브라우저로 `/cruise` 열어 디자인 `:82-122`와 대조(Select·정보카드 fade·버튼 disabled·이동).
```bash
git add src/pages/cruise-select src/routes/cruise.tsx
git commit -m "# feat: 크루즈 선택 화면 구현"
```

---

## Task 4: 앱 셸 + 하단 탭바 + `/app` 레이아웃

**Files:**
- Create: `src/widgets/bottom-tab-bar/ui/BottomTabBar.tsx`, `src/widgets/bottom-tab-bar/index.ts`
- Create: `src/routes/app.tsx` (레이아웃), `src/routes/app/index.tsx`(홈 자리), `src/routes/app/explore.tsx`·`shop.tsx`·`move.tsx`·`my.tsx`(스텁)
- Reference: 디자인 `:988-1005`(BOTTOM NAV) · 문자열 키: `nav_home, nav_explore, nav_shop, nav_move, nav_my`

**Interfaces (Produces):** `<BottomTabBar />` — 5탭(home/explore/shop/move/my), 활성 탭은 현재 경로로 판정, 클릭 시 해당 `/app/*`로 이동. `/app` 레이아웃은 모바일 풀뷰포트 셸 + `<Outlet/>` + 하단 `<BottomTabBar/>`.

- [ ] **Step 1: `BottomTabBar.tsx` 작성** — 디자인 `:988-1005`를 Montage 토큰+`wds-icon`으로 직접 구현. 탭 정의: `[{key:'home',to:'/app',icon,label:t('nav_home')}, {explore:'/app/explore'}, {shop:'/app/shop'}, {move:'/app/move'}, {my:'/app/my'}]`. 활성 판정은 `useRouterState`의 `location.pathname`. safe-area 하단 인셋 고려(`mobile-webview`).

```tsx
import { Link, useRouterState } from "@tanstack/react-router";

import { useI18n } from "@/shared/i18n";
// wds-icon에서 탭 아이콘 import (Montage MCP로 정확 아이콘명 확인)

export function BottomTabBar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { key: "home", to: "/app", label: t("nav_home") },
    { key: "explore", to: "/app/explore", label: t("nav_explore") },
    { key: "shop", to: "/app/shop", label: t("nav_shop") },
    { key: "move", to: "/app/move", label: t("nav_move") },
    { key: "my", to: "/app/my", label: t("nav_my") },
  ] as const;
  const isActive = (to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));
  // 렌더: 디자인 :988-1005 를 Montage로. 각 탭 아이콘+라벨, 활성 색 theme.semantic.primary.normal.
  return null; // ← 실제 JSX 채우기
}
```

- [ ] **Step 2: 배럴** — `src/widgets/bottom-tab-bar/index.ts`

```ts
export { BottomTabBar } from "./ui/BottomTabBar";
```

- [ ] **Step 3: `/app` 레이아웃 라우트** — `src/routes/app.tsx`

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";

import { BottomTabBar } from "@/widgets/bottom-tab-bar";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </Box>
      <BottomTabBar />
    </FlexBox>
  );
}
```

- [ ] **Step 4: 탭 목적지 스텁 4종** — `explore.tsx`·`shop.tsx`·`move.tsx`·`my.tsx` (동일 패턴, 경로만 다름). 예:

```tsx
// src/routes/app/explore.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/explore")({
  component: () => <div style={{ padding: 24 }}>탐방 (S2 예정)</div>,
});
```
(shop→`/app/shop` "쇼핑 (S5 예정)", move→`/app/move` "이동 (S4 예정)", my→`/app/my` "마이 (S6 예정)")

- [ ] **Step 5: 검증(typecheck·check·Orca) + 커밋** — Orca로 `/app` 및 각 탭 이동/활성표시 확인(하단탭이 디자인 `:988-1005`와 유사, 탭 전환 동작).
```bash
git add src/widgets/bottom-tab-bar src/routes/app.tsx src/routes/app
git commit -m "# feat: 앱 셸 + 하단 탭바 + /app 레이아웃"
```

---

## Task 5: 홈 화면 (`/app/`)

**Files:**
- Create: `src/pages/home/ui/HomePage.tsx`, `src/pages/home/index.ts`
- Modify: `src/routes/app/index.tsx` (홈 연결)
- Reference: 디자인 `:124-228`(HOME) · 홈 일정 로직 `:1537-1572`(planItems/slack) · 문자열 키: `until_departure, home_disembark, home_immigration, home_deadline, home_empty_t, home_empty_s, home_add, home_ai_fill, home_route_none_t, home_route_none_s`

**Interfaces (Consumes):** `useCruiseId`·`usePkgSpotIds`(Task2) · `getCruise`·`listSpots`(Task1) · `useI18n`.

**동작:** `cruiseId`로 크루즈 로드 → 헤더(선택 크루즈 ship/line, 출항까지 카운트다운/체류바 = 디자인 `:124-228` 상단). 본문: `pkgSpotIds`가 **비었으면** 빈 상태(`home_empty_t`/`home_empty_s` + `home_ai_fill`(→ S3 concept, 지금은 `/app` 유지 또는 비활성)·`home_add`(→ S2 explore) 버튼). **차 있으면** 일정 타임라인(디자인 `:1537-1572`의 planItems: 하선노드→택시leg→스팟노드들→탑승마감노드 + slack 여유/초과). S1 진입 직후는 빈 상태가 기본이며, 타임라인 상세 스타일은 S3에서 정교화(S1은 노드/leg 기본 렌더까지).

- [ ] **Step 1: `HomePage.tsx` 작성** — 데이터 배선은 아래대로. 시각/타임라인은 디자인 `:124-228`(+`:1537-1572`)을 Montage로 매핑.

```tsx
import { useQuery } from "@tanstack/react-query";

import { getCruise, listSpots } from "@/entities/cruise"; // getCruise
import { listSpots as listSpotsFn } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { useCruiseId, usePkgSpotIds } from "@/shared/store";

export function HomePage() {
  const { t, locale } = useI18n();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId],
    queryFn: () => getCruise(cruiseId as string),
    enabled: !!cruiseId,
  });
  const { data: spots = [] } = useQuery({
    queryKey: ["spots", cruise?.portKey],
    queryFn: () => listSpotsFn({ portKey: cruise!.portKey }),
    enabled: !!cruise,
  });
  const pkgSpots = pkgSpotIds.map((id) => spots.find((s) => s.id === id)).filter(Boolean);
  const isEmpty = pkgSpots.length === 0;
  // 렌더: 헤더(cruise) + (isEmpty ? 빈상태 : 타임라인). 디자인 :124-228 / :1537-1572.
  return null; // ← 실제 JSX
}
```
> Note: `getCruise`는 `@/entities/cruise`, `listSpots`는 `@/entities/spot`에서 가져온다(위 import 정리). 이름 충돌 피하려 spot 쪽을 `listSpotsFn` 별칭.

- [ ] **Step 2: 배럴** — `src/pages/home/index.ts`

```ts
export { HomePage } from "./ui/HomePage";
```

- [ ] **Step 3: 홈 라우트 연결** — `src/routes/app/index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/pages/home";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});
```

- [ ] **Step 4: 검증(typecheck·check·Orca) + 커밋** — Orca로 lang→cruise→시작→`/app` 홈까지 스파인 전체 흐름 확인. 빈 상태가 디자인 `:124-228` 빈 상태와 일치, 헤더 카운트다운 표시.
```bash
git add src/pages/home src/routes/app/index.tsx
git commit -m "# feat: 홈 화면(일정 스파인) 구현"
```

---

## Self-Review (against spec)

- **Spec §5 S1 커버**: cruise-select(T3)·home(T5)·앱셸/하단탭(T4)·전역스토어(T2)·mock 토대(T1) — 전부 태스크 존재 ✅
- **D1 브랜드**: 이 슬라이스엔 탐라패스/탐나오 문자열 미노출(그 문자열은 shop/trust 화면 — S5/S6). lang-select의 "Omong"은 기구현. 문자열 정리는 S5/S6에서 처리(별도 메모).
- **D2 Montage**: 모든 화면 태스크가 "Montage 매핑 + MCP 확인" 명시 ✅
- **D4 mock 어댑터**: entities가 async 함수로 노출, 페이지는 useQuery 경유 → live 스왑 용이 ✅
- **D5 TanStack Store**: T2 ✅ / **D6 Orca 검증**: 화면 태스크 검증 단계에 명시 ✅
- **타입 일관성**: `Cruise`/`Spot`/`LocalizedText` 이름·필드가 T1 정의와 T3/T5 소비에서 일치. `sessionActions.setCruiseId`/`togglePkgSpot`가 T2 정의와 소비 일치 ✅
- **주의(placeholder)**: T3/T4/T5의 `return null`은 "구조를 Montage로 채우라"는 지시가 붙은 **의도적 골격**이다. 실행자는 디자인 라인+MCP로 실제 JSX를 채운다(빈 채로 커밋 금지). UI JSX를 계획서에 미리 다 적지 않는 이유: 정확한 Montage 토큰/컴포넌트명은 실행 시 MCP로 확정해야 하며(디자인 SoT=`.dc.html`), 추측 JSX는 D2 위반이 되기 때문.

## 남은 슬라이스 (참고)
S2 탐방+지도 · S3 AI코스 · S4 이동 · S5 쇼핑 · S6 마이+마감. 각각 별도 plan.
