# 크루즈 실데이터 연동 · 세션 영속 · 구글맵 1단계 — 설계

날짜: 2026-07-23 · 상태: 승인 대기
범위: frontend 레포 (backend는 **코드 무변경** — 라이브 API 검증·계약 확인만)

## 배경 / 검증된 사실

- 백엔드 TAMRA PASS API가 Cloud Run에 라이브로 동작 중 (`https://tamrapass-34273089941.asia-northeast3.run.app`). `GET /api/v1/health` OK.
- `GET /api/v1/cruises?date=&lang=` 동작 확인. 2026-07-23엔 1척(Adora Magic City, 강정 13:00→21:00). 응답에 `line`(선사) 필드 **없음** — `ship`·`berth`·`port{key,name,lat,lng}`·`date`·`arrival`·`departure` 등.
- `GET /api/v1/cruises/dates?from=` 로 기항 있는 날짜 목록 조회 가능.
- 지도 마커용 서버 데이터는 **이미 준비 완료**: `GET /api/v1/spots?cruiseId=&compact=1` → `{id,name,lat,lng,category,bookable,km}` + `window{port,availableMinutes}` 라이브 검증됨.
- CORS `*` 허용. 프론트 `.env`에 `VITE_GOOGLE_MAPS_API_KEY` 구성됨. `@vis.gl/react-google-maps` 설치됨(미배선).
- 기존 불일치: 탑승 마감이 홈은 출항-60분, 마이·API `boardByTime`은 -30분 → **-60분으로 통일** 결정(사용자 규칙: 출항 1시간 전 마감).

## 사용자 결정 사항

1. dev API 연결 = **Cloud Run 라이브** (vite 프록시). 프론트 코드는 상대경로 `/api/v1` 고정 — 배포(nginx `/api/`) 구조와 동일.
2. 탑승 마감(출항 ≤60분) 크루즈 = **목록 노출 + 시작 차단**.
3. 마감 시각 = **출항-60분 통일** (마이페이지 -30 표기 수정. API boardByTime은 무시하고 프론트 계산).
4. 영속 범위 = **세션 전체(cruiseId·일정·이동수단·장바구니) + 선택 언어**.
5. 오늘 노출할 크루즈가 없으면(모두 출항/기항 없음) **다음 기항일 크루즈로 폴백** 노출.

## 1. 공통 데이터 계층

- `vite.config.ts`: `server.proxy['/api'] = { target: 'https://tamrapass-34273089941.asia-northeast3.run.app', changeOrigin: true }`.
- `shared/api/http.ts`(신규): 얇은 `fetch` 헬퍼 — base `/api/v1`, JSON 파싱, 비 2xx 시 API 에러(`{error:{code,message}}`) throw. 그 이상 추상화 금지.
- `entities/cruise/api/`: mock 제거 → 실 API 어댑터.
  - `listCruises({ date, lang })` → `GET /cruises?date=&lang=`
  - `listCruiseDates({ from })` → `GET /cruises/dates?from=`
  - `getCruise(id, lang)` → `GET /cruises/:id?lang=`
- `Cruise` 타입 개편(언어 해석 완료형): `{ id, ship, berth, date, portKey, portName: string, portLat, portLng, arr, dep, arrM, depM, nextDest: string }`. `arrM/depM`은 `"HH:MM"` 파싱 파생. `line`·`LocalizedText` 제거.
  - 소비처 수정: CruiseSelectPage(`portName[locale]`→`portName`, 옵션 라벨 `line`→`` `${ship} · ${arr}–${dep}` ``), HomePage, MyPage 동일 치환. queryKey에 `locale` 포함 → 언어 전환 시 재조회.
- spot mock(x/y% 8곳)은 이번 범위에서 유지 — 마커 배선 단계에서 실 `/spots`로 교체 예정.

## 2. `/` 언어 선택

- `LOCALES` 순서 `["en","zh","ja","ko"]`로 변경(언어 카드·마이페이지 언어칩·PayDemoEntry 공통 적용).
- 카드 탭 즉시 `setLocale` → 제목·부제·계속하기가 탭한 언어로 즉시 전환. 로컬 `selected` state 제거(`locale`이 곧 선택값). 계속하기는 `/cruise` 이동만.
- 기본 언어는 `ko` 유지.

## 3. `/cruise` — 오늘 크루즈 + 시간 규칙

- 조회: 오늘 `GET /cruises?date=오늘`. **출항 지난 크루즈 제외 후 목록이 비면** `GET /cruises/dates?from=내일` 첫 날짜로 재조회(폴백). 쿼리 하나가 `{ date, items, isFallback }` 반환.
- 폴백 표시: 목록 위에 안내 문구("오늘 운항 크루즈가 없어 다음 기항일(M/D) 크루즈를 보여드려요" — 4개국어).
- 시간 규칙 (`t` = 출항까지 남은 분, 해당 날짜+시각 기준, 30초 tick 재계산):

| 조건 | 처리 |
|---|---|
| `t ≤ 0` 출항 지남 | 목록 제외. stale 대비 **시작하기 클릭 시 재검증** → 진행 불가 피드백 + 목록 갱신 |
| `0 < t ≤ 60` 탑승 마감 | 노출 + "탑승 마감" 표기. 선택 시 안내, 시작하기 비활성 |
| `60 < t ≤ 150` 임박 | 선택 가능. 선택 카드에 경고 배너: 탑승 마감 시각(출항-60분)까지 N분 남음, 서둘러 달라는 톤 |
| `t > 150` 또는 미래 날짜 | 정상 |

- 목록이 tick 중 비게 되면 쿼리 무효화 → 폴백 재조회.
- 빈 상태(폴백까지 없음): "예정된 크루즈가 없습니다" 문구.

## 4. `/app` — 영속 · 가드 · 실시간 카운트다운

- `shared/store/session.ts`: localStorage 영속(키 `omong.session.v1`). lazy init + `typeof window` 가드(SPA prerender 안전). 변경 시 subscribe 저장. locale은 `shared/i18n`에서 별도 키(`omong.locale.v1`)로 영속.
- 가드: `routes/app.tsx` `beforeLoad` — 영속된 `cruiseId` 없으면 `redirect({ to: "/" })` (전체 `/app/*` 커버).
- 만료: HomePage에서 크루즈 로드 후 **출항 일시(date+dep)가 과거**거나 404면 세션 reset + `/` 이동. 미래 날짜(폴백 선택)는 유효.
- 카운트다운: 시뮬레이션(`도착+90분`) 제거 → **실제 현재 시각**, 1분 tick. 마감 = 출항-60분. `remM`·`stayPct`는 0~100 클램프(도착 전 미래 크루즈 대응).
- 마이페이지: "내 크루즈" 카드에 삭제 액션 추가 → `sessionActions.reset()` + `/` 이동. 탑승 마감 표기 -30 → -60.

## 5. `/app` 지도 (1단계: 지도만)

- HomePage placeholder(270px `#CFE4F2`) → `APIProvider` + `Map`(`@vis.gl/react-google-maps`). center = 선택 크루즈 항구 좌표(API `port.lat/lng`), zoom ≈ 11.5, `disableDefaultUI`. 마커 없음.
- 키: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`. 없으면 기존 placeholder 폴백(크래시 금지).
- 서버 준비(마커 데이터)는 **완료 상태로 검증됨** — 다음 단계에서 `/spots?cruiseId=&compact=1`를 그대로 소비. 이번 커밋엔 계약을 본 문서에 고정하는 것으로 갈음, backend 변경 없음.

## i18n 추가 문자열 (4개국어)

`cruise_fallback_notice`(다음 기항일 안내) · `cruise_empty`(예정 없음) · `cruise_departed_toast`(출항해 진행 불가) · `cruise_closed_badge`(탑승 마감) · `cruise_closed_desc`(마감 안내) · `cruise_imminent_warn`(임박 경고, 시각·분 치환) · `my_delete_cruise`(크루즈 삭제) — 문구는 구현 시 기존 STR 톤에 맞춰 작성.

## 검증 계획

- `pnpm check` · `pnpm typecheck` 통과.
- 브라우저(Orca 내장 브라우저, `http://localhost:3002`):
  1. `/` 언어 탭 → 문구 즉시 전환·순서 en/zh/ja/ko 확인.
  2. `/cruise` 현시각(오늘 출항 완료) → 폴백으로 내일 크루즈 노출 + 안내 문구.
  3. 선택→시작→`/app` 카운트다운 표시 → 새로고침 유지 확인.
  4. 마이페이지 삭제 → `/` 리다이렉트, `/app` 직접 진입 차단 확인.
  5. 지도 렌더(구글맵 타일, 강정/제주항 center).
  6. 시간 규칙 분기(마감·임박)는 시스템 시각 변경 또는 로직 단위 검증으로 확인.

## 비범위 / 리스크

- backend 코드·`boardByTime` 무변경. `entities/spot/lib/course.ts`의 -30분 로직도 이번 범위 밖(기존 동작 유지, 추후 정리 후보).
- 마커·스팟 실데이터 배선은 다음 단계(spot id 체계가 mock과 다름 — `vj_*`/`tn_*`).
- dev 중 조회가 라이브 DB를 읽음(GET만).
- 클라이언트 시계 기준 시간 판정(해커톤 허용 범위).
