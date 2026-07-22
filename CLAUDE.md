# 11.jeju_cruise — 아시아 크루즈 해커톤 프론트엔드

제주 크루즈 관광 웹앱 (repo: `asia-cruise-hack-2026/frontend`). **주 스택은 웹**이지만
**발표 시연에서는 앱처럼** 보여야 한다. 핵심 플로우: 지도에서 마커 확인·수집 →
수집 데이터로 경로 생성 → 택시앱 같은 UX → 네비.

작업 규율(스택 무관 — 신중·단순·수술적 변경·목표기반)은 항상 로드된다: @.claude/rules/core-rules.md

## 이 해커톤이 어떻게 진행되나 (맥락)

- **팀 경계**: 프론트(이 레포) · 서버(별도 레포, **개발 범위 미합의**) · 기획(Notion) · 디자인(Figma/디자이너).
- **진행 방식**: 각 소스를 MCP/참조로 끌어와 프론트에서 조립한다. 클라이언트가 데모의 주인공이다.
- **핵심 제약**: 서버 범위가 안 정해졌으므로 **클라이언트는 모든 기능이 "동작하는 것처럼" 보여야 한다** — 데이터는 mock, 서버 의존 기능은 시뮬레이션.
- **현재 미확정**: 기획(Notion 아직 비어있음)·디자인(Figma 경로 대기)·**디자인 시스템(디자이너 협의 중, 변경 예정)**. 확정 전까지 지도/인터랙션 + mock을 선행한다.

## 소스 오브 트루스 (추측하지 말고 조회)

아래 소스를 해당 도구로 **직접 조회해 근거를 확보한 뒤** 진행한다.

| 종류 | 소스 | 도구 | 상태 |
|---|---|---|---|
| 기획 · 정책 | Notion 지정 페이지 | Notion MCP | ⏳ 미작성 |
| 참조 · 근거 데이터 | Notion 「데이터 소스 카탈로그」 DB | Notion MCP | ✅ data source id `4ceed401-9a4f-41d3-8351-90cde4a1a24a` |
| 디자인(화면) | Figma 지정 파일 | Figma MCP (figma 플러그인, 인증 필요) | ⏳ 경로 대기 |
| 디자인 시스템(컴포넌트·토큰·아이콘) | 원티드 Montage | Montage MCP (`montage-mcp-server`, 호스티드) | ✅ 확정 · `/mcp`로 연결 |
| 서버 API 계약 | `refs/server/` (서버 레포 클론) | Read | ⏳ URL 대기 (읽기 전용) |
| 제주 실데이터 샘플 | `data/`, `docs/recon/` | Read | ✅ 정찰 완료 |

## 절대 원칙

1. **클라이언트는 모든 기능이 "동작하는 것처럼" 보여야 한다.** 모든 데이터 접근은 **mock 어댑터 레이어**를 통과시키고 실제 API로 무중단 스왑 가능하게 짠다. 서버 의존 기능(실시간 택시 위치 등)은 **시뮬레이션 데이터**로 채운다.
2. **서버 코드는 참조만.** `refs/server/`는 계약·DTO·타입 확인용 읽기 전용. 수정·커밋·푸시 금지. 여기서 확인한 계약을 mock 타입 기준으로 삼는다.
3. **웹이지만 앱처럼.** 모든 화면은 모바일 뷰포트 기준(→ `mobile-webview` 스킬).
4. **MVP 우선.** core-rules의 Simplicity First를 지킨다 — 과설계·추측성 유연성 금지, 검증 가능한 최소 코드.

## 기술 스택 (fateflow 계승, MVP로 경량화)

- **런타임/빌드**: React 19 + **TanStack Start** (Vite). SSR 되지만 **지도는 client-only 렌더**. 서버 함수는 "혹시 모를 서버사이드"(CORS 프록시·키 은닉·실서버 BFF) 탈출구로만.
- **언어**: TypeScript strict. **패키지 매니저: pnpm** (npm 금지, `^x.y.z` 고정 — `latest` 금지).
- **상태/데이터**: TanStack Query · Router(파일 라우터). 필요 시 Form/Store.
- **지도**: `@vis.gl/react-google-maps` (Maps JavaScript API) + Directions Service(`optimizeWaypoints`). 네비는 **구글맵 딥링크 핸드오프**(`.../maps/dir/?api=1&destination=...`). 내 위치 `watchPosition`, 택시 위치 시뮬레이션. Google 콘솔: Maps JS + Directions API 활성화, 웹 키는 리퍼러 제한, 키는 `.env`.
- **UI · 디자인 시스템**: **원티드 Montage** (`@wanteddev/wds` — Emotion+Radix 컴포넌트). 아이콘 `wds-icon` · 데모 스캐폴드 `wds-dummy`(NavBar/Footer/BottomTabBar) · 브랜드 `wds-brand`. 상세 → §UI·스타일링
- **모바일/앱화**: `react-simplikit`(+`/mobile`) · `framer-motion`. 오버레이/모달은 Montage(Radix) 우선, 필요 시 `overlay-kit`.
- **검증**: `zod`. **품질**: Biome(린트/포맷) + steiger(FSD, **비차단**).
- **⚠️ fateflow에서 뺀 것**: `astryx`/StyleX(→ Montage/Emotion으로 대체), react-compiler(툴체인 경량화), auth/토큰리프레시 http 클라이언트(MVP는 얇은 mock 우선 버전).

## UI · 스타일링 — 원티드 Montage (WDS) ✅ 확정

- **`@wanteddev/wds`** = **Emotion 기반 Radix 컴포넌트 라이브러리**(런타임 CSS-in-JS → **Vite 완전 호환**, 번들러 플러그인 불필요). React 18/19 OK.
- **설치**: 루트 `.npmrc`에 `@wanteddev:registry=https://npm.pkg.github.com/` (GitHub Packages — `NODE_AUTH_TOKEN`에 `read:packages` PAT 필요) → `pnpm i @wanteddev/wds @wanteddev/wds-icon`. **모든 `@wanteddev/wds-*`는 동일 버전**(불일치 시 테마 컨텍스트 중복 → 스타일 깨짐).
- **셋업**: 루트를 `<ThemeProvider>`로 감싸고 `import '@wanteddev/wds/global.css'`, **Pretendard** 폰트 로드(CDN link 또는 `pretendard` 패키지). 다른 스타일과 섞이면 `createCache({ key:'wds', prepend:true })` + `CacheProvider`.
- **SSR**: `wds-nextjs`는 **Next 전용** → 우리(TanStack Start)는 **CSR/SPA로 시작**(지도도 client-only). FOUC/critical-CSS가 문제되면 그때 `@emotion/server` 캐시를 배선.
- **작성 규칙 = `montage-react` 스킬 + Montage MCP**: 컴포넌트/토큰/아이콘은 **추측 금지, MCP로 조회**(`get_component`·`list_tokens` 등). 토큰은 `theme.semantic.*` 콜백(생 `var(--...)` 금지), 레이아웃 `FlexBox`/`Grid`/`containerStyle`, 데모 GNB/Footer/바텀탭은 `@wanteddev/wds-dummy`(**BottomTabBar = 앱처럼**), 브랜드는 `LogoWanted`/`IconSymbol`.
- 디자인 SoT는 **Figma** → Montage 컴포넌트로 매핑.

## 아키텍처 — FSD (경량 적용)

레이어 의존 방향(상위 → 하위만 import): `app → pages → widgets → features → entities → shared`

- 상세 배치·배럴·의존성 규칙은 **`fsd` 스킬**. **MVP라 과한 배럴/추상화는 지양**(core-rules Simplicity).
- 프레임워크 위치(`routes/`·`integrations/`·`router.tsx`·`routeTree.gen.ts`)는 FSD 슬라이스 아님 → steiger 검사 제외.
- 별칭: `@/*` · `#/*` → `src/*`.
- 데이터 계층: 서버 상태는 `shared/api`(얇은 http) + `entities/*/api`(queryOptions) 통해. **mock 어댑터로 시작** → 실서버/서버함수로 스왑.

## 스킬 (fateflow 이식 — `.claude/skills/`)

`fsd` · `typescript` · `good-code` · `good-debug` · `tanstack-query`/`router`/`form`/`integration` · `fsd-query-service` · `file-naming` · `mobile-webview` · **`montage-react`**(원티드 WDS)

> `montage-react`는 Montage 공식 플러그인에서 이식 — React UI 작업 시 자동 트리거되며 Montage MCP와 연동된다. 나머지는 fateflow 이식으로 일부 본문에 사주세요·StyleX 언급이 남을 수 있으나 **UI/스타일링은 §UI·스타일링(Montage)이 우선**이고 고유 언급은 jeju 맥락으로 읽는다. (제외: `astryx-stylex`·`tailwind-v4-shadcn`·`new-issue`·`pr`)

## 집행 (`.claude/`)

- `hooks/pre-commit-verify.sh`: 커밋 전 **`pnpm check` + `typecheck`** 강제(MVP — `fsd`·`test`는 비차단, 수동).
- `settings.json`: 권한(allow/ask/deny) + 위 훅. `pnpm dev/build/check/...`·git 읽기·add·commit 허용, push는 ask, 파괴적 명령·`.env` 읽기 deny.

## Git — 해커톤 직접 커밋 워크플로우

- **이슈·PR 없음.** 작업 → **바로 커밋**. GitHub 이슈/PR 흐름을 쓰지 않는다(→ `new-issue`·`pr` 스킬 제외).
- **작업 브랜치(현재 `main`)에 직접 커밋.** feature 분기·병합 흐름 없음. 팀이 별도 공유 브랜치를 쓰면 그걸 따른다.
- 커밋 메시지 맨 앞 `# ` + 타입 (예: `# feat: 지도 마커 수집 구현`).
- **작업 단위(설정·컴포넌트·기능)가 끝나면 즉시 커밋.** 여러 단위를 한 커밋에 몰지 않는다.
- **커밋에 AI 작성 표기 금지** — `Co-Authored-By: Claude …`·`🤖 Generated with …` 트레일러 넣지 않는다(하네스 기본값보다 이 규칙 우선).
- push는 공유 레포 반영이라 확인 후 진행(settings.json `ask`). 로컬 커밋은 직접.

## 디렉토리

- `src/` — 클라이언트 앱 (FSD, 스캐폴딩 예정)
- `refs/server/` — 서버 레포 클론 (gitignore, 읽기 전용)
- `docs/recon/` — 데이터 소스 정찰 · `docs/superpowers/specs/` — 설계 문서
- `data/` — 캡처한 실데이터 샘플

## 현재 페이즈

**디자인 시스템 = Montage 확정.** 기획(Notion)·디자인(Figma 경로)·서버는 미확정 → **지도/인터랙션 + mock 선행**. 정찰·데이터 카탈로그 완료(`README.md`).
