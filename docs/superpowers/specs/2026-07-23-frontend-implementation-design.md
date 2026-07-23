# 프론트엔드 구현 설계 — OMONG (크루즈 제주 앱)

- 작성일: 2026-07-23
- 상태: 승인됨 (사용자 확인). 이 문서는 프론트 전체 구현의 기준.
- 디자인 SoT: `frontend/design/incoming/Jeju Cruise App.dc.html` (Claude design "share" 산출, WDS/Montage 토큰 기반)
- 백엔드 계약: `backend/docs/API-SPEC.md` (TAMRA PASS API v1, live)

## 1. 배경 · 목표

크루즈로 제주에 기항한 외국인 관광객용 모바일 웹앱. 핵심 여정: 하선 → 체류시간 내 관광 코스 생성 → 택시 이동 → 특산품 쇼핑(선박 배송). **해커톤 MVP이므로 화면 구현이 최우선.**

- **디자인 스펙 = 작업 기준.** 16개 화면을 `.dc.html` 스펙대로 구현한다.
- **mock 선행 → 점진적 서버 연동.** 화면부터 완성하고 데이터는 뒤에 이어붙인다.
- 백엔드(스키마·실데이터·API 20개)는 **이미 live** → 새 스키마/수집 불필요, 필요 시 gap-fill만.

## 2. 확정 결정 (locked)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 브랜드 = **OMONG** (탐라패스→OMONG) | 사용자 확정. 탐나오=우리가 연결하는 제주 공공 관광상품 플랫폼(파트너)으로 서술 유지 |
| D2 | **Montage 컴포넌트에 디자인 값 매핑, 없거나 어려우면 코드 직접** | 사용자 지정. 토큰은 `theme.semantic.*`, `montage-react` 스킬+MCP로 정확 조회 |
| D3 | **디자인 스펙이 구현 기준** | 사용자 지정 |
| D4 | **mock 선행 → 점진 연동**, 화면 최우선 | 사용자 지정 + CLAUDE.md 절대원칙 #1 |
| D5 | 전역 상태 = **TanStack Store** | 스택 정합 |
| D6 | 브라우저 검증 = **Orca 내장 브라우저**(`orca-cli`) | 사용자 지정. chrome-devtools/claude-in-chrome 아님 |
| D7 | 시작 슬라이스 = **S1 온보딩 스파인** | 데모 스파인 |

## 3. 아키텍처 (기존 FSD 위에)

- **앱 셸**: 모바일 **풀뷰포트**(디자인의 390×844 폰 베젤은 프리뷰 크롬이라 미채용). 하단 탭바(홈·탐방·쇼핑·이동·마이)는 디자인이 커스텀으로 그리므로 **Montage 토큰+`wds-icon`으로 직접 구현**(`wds-dummy` 불필요).
- **라우팅** (TanStack file-router):
  - 온보딩(`/` lang-select, `/cruise`) = 셸 밖
  - 탭 화면(home·explore·shop·move·my) = 탭 셸 레이아웃 라우트 안
  - 세부 플로우(spot·theme·add-places·concept·package·transport·final·product·checkout) = 스택형 push
- **크로스스크린 상태** (TanStack Store): 디자인 `DCLogic`의 공유 세션 상태를 이관 — 선택 크루즈, `pkgSpotIds`(코스 담은 스팟), cart, taxi 플로우 단계, 언어(i18n은 기존 `shared/i18n`). 화면 로컬 상태는 컴포넌트 내부.

## 4. 데이터 접근 — "화면별 필요 데이터 정의"의 실체

1. 디자인 내장 mock(CRUISES 5·SPOTS 12·PRODUCTS 8·개념/차량/기사)을 **타입화해 `entities/*`(cruise·spot·product) 픽스처**로 이식. 이게 각 화면의 데이터 계약.
2. **얇은 어댑터 인터페이스**(`shared/api`)로 감싼다 → 지금은 mock 구현, 나중에 live API 구현으로 무중단 스왑. 화면 코드는 어댑터만 안다.
3. 화면을 구현하며 그 화면이 실제로 필요로 하는 필드를 확정 → 어댑터 타입에 반영(= 필요 데이터 정의).

### 나중에 정합할 디자인↔API 드리프트 (연동 시 gap-fill)
- **이동 모델**: 현 디자인=택시 4단계+글로벌택시 일일관광. API §5 파트너 매칭은 stale, `/taxi/*`는 단일 스팟 기준 → 패키지 전체 경로 요금과 불일치.
- **크루즈 선택**: 디자인=배 드롭다운. 실데이터=날짜별 321건(3척은 실제 강정항). `/cruises?date=`로 데모 날짜 고정 검토.
- **카테고리 매핑**: 디자인 테마(관광지·맛집·카페·여행사상품) ↔ 백엔드 7종+`bookable`.

## 5. 빌드 순서 (각 슬라이스 = 하나의 구현 계획)

| 슬라이스 | 화면 | 산출/비고 |
|---|---|---|
| **S1 온보딩 스파인** | cruise-select → home(일정 타임라인, 빈/채워짐) | + 앱셸·하단탭·TanStack Store·mock 토대(entities/adapter) |
| **S2 탐방+지도** | explore(지도)·spot-detail | Google Maps client-only, 실좌표 |
| **S3 AI 코스** | theme-select·add-places·ai-concept·ai-package | 코스 편집·스왑·시간 slack·4단계 로딩 |
| **S4 이동** | transport-select·final-route·move(택시 4단계+글로벌택시) | |
| **S5 쇼핑** | shop·product·checkout | 반입 규정 동의 게이트 |
| **S6 마이+마감** | my·토스트·전체지도 시트 | 공용 위젯 마감 |

## 6. 검증 (슬라이스마다)

1. `pnpm dev` 기동
2. **Orca 내장 브라우저**(`orca-cli`)로 해당 라우트를 열어 디자인 스펙과 1:1 대조 — 레이아웃·플로우·인터랙션·콘솔 에러
3. 어긋남 수정 → 재검토, 통과 후 커밋(`# type: …`, AI 표기 금지)
4. `pnpm check` + `typecheck` (커밋 훅에서도 강제)

## 7. 범위 밖 (defer)

- 라이브 API 실연동(슬라이스마다 점진), 서버 드리프트 gap-fill
- 실 PG 결제, 회원가입/로그인, 관리자 화면
- 다국어 스팟 재수집(비짓제주 jp/en/cn)
- 폰 베젤 프리뷰 크롬

## 8. 참조

- 디자인: `frontend/design/incoming/Jeju Cruise App.dc.html`
- API 계약: `backend/docs/API-SPEC.md` · 데이터: `backend/data/README.md`
- 스킬: `montage-react`(WDS) · `fsd` · `tanstack-router`/`query`/`form` · `mobile-webview` · `orca-cli`(검증)
