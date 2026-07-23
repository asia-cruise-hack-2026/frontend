# 쇼핑 DB 연동 · 체크아웃 라우팅 · 이동 탭 재구성 · 스플래시 — 설계

날짜: 2026-07-24 · 상태: 사용자 승인됨(대화)
전제: dev = `http://localhost:8787`(vite 고정 포트, `/api` → Cloud Run 프록시). backend 코드 무변경.

## 검증된 백엔드 계약 (라이브 확인)

- `GET /goods?lang&category&q&page&size` → `{items, page, size, totalCount}` (1,895건). item: `id, name, description, category, categoryLabel, price, priceLabel, thumbnail, importStatus(allowed|conditional|restricted|prohibited), importLabel, customsNote, cruiseLineNote, detailUrl` — 전부 요청 언어로 해석됨.
- `GET /goods/categories?lang` → all/food/cosmetics/souvenir + count. (mock의 alcohol 카테고리는 실데이터에 없음 → 탭 제거)
- `GET /goods/:id?lang` → 단건 (404 시 NOT_FOUND).
- `GET /spots?cruiseId&sort=distance&lang&size` (full 응답) → `name, category{key,label}, lat, lng, distanceKm, driveMinutes, thumbnail, fitsWindow …` — 이동 탭 추천명소·지도 마커에 충분. `q=` 이름 검색 지원.

## A. 쇼핑 DB 연동

- `entities/product` 실 API 교체. `Product` 언어 해석형: `{id, category, categoryLabel, name, description, price, thumbnail, importStatus, importLabel, customsNote, cruiseLineNote, detailUrl}`. `IMPORT_STATUS_META`는 키 동일(4종)이라 유지.
- api: `listGoods({category?, q?, lang, page, size=20}) → {items,totalCount,page}` · `listGoodCategories(lang)` · `getGood(id, lang)`(404 → ApiError).
- ShopScreen: 카테고리 탭=API 실데이터, **검색바**(300ms 디바운스), **무한스크롤**(`useInfiniteQuery` + IntersectionObserver 센티널), 카드 썸네일 `<img>`(onError 시 숨김→fill 폴백), 상태배지 기존 스타일 유지. mock 아이콘 매핑(PRODUCT_ICONS)은 그리드에서 제거.
- 상세: hero=썸네일(190px cover), 카테고리 배지=`categoryLabel`, 이름 아래 `description` 문단 추가(보편적 상세), 세관/선사=`customsNote`/`cruiseLineNote`, 탐나오 링크=상품별 `detailUrl`. 배송옵션·픽업안내·장바구니/바로구매 동일.
- 체크아웃 CartItem: `{id, thumbnail, name, meta(categoryLabel), price, qty, importStatus(allowed|restricted — conditional·prohibited는 restricted 취급 유지)}`. CartRow emoji → 썸네일. 카트 조회 `Promise.allSettled`(삭제된 상품 무시). queryKey에 locale.

## B. 체크아웃 라우팅

- 헤더 뒤로가기: `router.history.canGoBack() ? history.back() : navigate("/app/shop")` — `/pay-demo` 하드코딩 제거.
- 결제 완료: 완료 시점 금액을 state로 고정(`paidTotal`) + `sessionActions.clearCart()` 즉시 실행. OrderSuccess 확인 → `/app/shop`. (현재 체크아웃 진입은 쇼핑뿐 — **비쇼핑 결제가 생기면 홈(/app)으로 분기**한다는 규칙을 코드 주석으로 남김.)
- `clearCart` 액션을 세션 스토어에 추가. `/pay-demo` 데모 하네스는 존치.

## C. 이동 탭 재구성

- 데이터: `entities/spot`에 `ReachableSpot {id, name, categoryLabel, km, lat, lng, driveMinutes}` + `listReachableSpots(cruiseId, lang)`(full `/spots?cruiseId&sort=distance&size=10`). 기존 mock `Spot`(x/y%)은 다른 화면용으로 유지 — move만 전환.
- MovePage 필드 스왑: `destSpot.name[locale]`→`name`, `cat[locale]`→`categoryLabel`, `km`→`km`(=distanceKm). 요금/시간은 기존 `taxiFare/taxiMinutes(km)` 그대로.
- **레이아웃(디자인 `Jeju Cruise App(최종)` taxi 섹션 정합)**:
  - `dest`(idle): 현행 유지 — Header + 검색 + 추천 리스트. 지도 없음.
  - `pickup/car/confirm`(idle): 상단 **구글맵**(pickup 300px, car/confirm 180px) + 맵 위 플로팅 뒤로가기(원형, blur) + **바텀시트**(radius 20px 20px 0 0, margin-top -18px 오버랩, 드래그핸들 38×4, shadow `0 -6px 20px rgba(0,0,0,.06)`) 안에 시트 타이틀(stepTitleKey) + 기존 스텝 콘텐츠. 페이지 Header는 미표시.
  - `finding/riding`: 지도 220px + 바텀시트(기존 FindingView/RideView 콘텐츠).
- 지도(MoveMap): `@vis.gl` GoogleMap + `Marker` 2개 — **내 위치**(`navigator.geolocation.watchPosition`, 거부/실패 시 마커 생략) + **목적지**(ReachableSpot lat/lng). center=목적지, zoom 12. 키 부재 시 하늘색 폴백. 택시 이동 애니메이션 마커는 후속.
- 현위치 픽업: PickupStep "현위치 자동"은 기존 라벨 유지(실좌표는 지도 마커에 사용).

## D. "어디로 갈까요?" 검색 — 검토 결론 (이번 미구현)

가능. UI(SearchField)와 로드분 필터는 이미 있고, C 이후 서버 검색(`/spots?q=` 이름 LIKE·언어별)으로 전체 1,600+곳 확장은 쇼핑 검색과 동일 패턴(디바운스·최소 2자·거리순). 사용자 결정 대기.

## E. 스플래시 — 디자인 소스 `design/incoming/Splash Interactive(최종).dc.html`

- 콜드 로드당 1회, `__root`에 풀스크린 오버레이(fixed inset 0, z 9999). SPA prerender 셸에 포함되어 JS 로드 전 첫 페인트부터 보임. 클라 내비게이션엔 재노출 없음(모듈 플래그).
- 비주얼(디자인 이식): 그라데이션 배경 — 원본 `#0A4FE0→#0066FF→#2E7BFF`를 **리브랜드 팔레트 `#1D4ED8→#2563EB→#60A5FA`로 매핑**(기존 리브랜드 규칙 — 원 hex 유지 원하면 되돌림 용이). 상단 radial 광원 + ambient 점광(원본의 `sp-amb` 키프레임이 파일에 누락 — 은은한 펄스로 보완), 중앙 흰 로고(`/brand/logo-omong-white.svg`) 팝인+글로우+수면 반사, 하단에서 **차오르는 물**(로딩 pct 0→100 ≈2초, 높이 pct×0.42 최대 42%, 파도 SVG 3겹 루프, 물속 기포 상승), 하단 힌트 + "제주 공식 · 탐나오 제휴" 크레딧.
- 인터랙션(디자인 이식): 탭 → 리플(라디얼 필+링 2겹) + 기포 5~7개 비산 + 수면 +6% 서지(360ms). 탭=스킵 아님(디자인 의도).
- 종료: pct 100 도달 → 350ms 후 350ms 페이드아웃 → 언마운트. 총 ≈2.7초. `prefers-reduced-motion`: 무한 애니메이션 제거.
- 디자인 캔버스 크롬(390×844 프레임·상태바 9:41)은 앱에 미이식. 문구 2종 4개국어 키 추가(`splash_tap_hint`, `splash_credit`).

## 검증

`pnpm check`·`typecheck`·`build` + Orca 브라우저(8787): 스플래시 1회 노출·전환, 쇼핑 목록/검색/무한스크롤/상세/장바구니→결제→완료→쇼핑홈·카트 비움, 뒤로가기 히스토리, 이동 탭 지도+바텀시트 레이아웃·추천 실데이터. 지도 마커는 리퍼러 등록 완료 상태에서 실렌더 확인.

## F. 후속 승인분 (2026-07-24 추가)

- **move 서버 검색(D) 구현 확정**: 2자 이상 + 300ms 디바운스 → `GET /spots?cruiseId&q&sort=distance&size=20`. 2자 미만은 추천 10곳 로컬 필터. 선택 스팟은 id가 아닌 **객체로 보관**(검색 결과가 추천 목록에 없어도 안전).
- **공용 바텀시트**: 디자인 감사 결과 모달형(SWAP SPOT SHEET :1029 — 딤 .32·라운드 24·핸들 38×4·닫기 34px·슬라이드업)과 인라인형(taxi) 2종. `shared/ui/bottom-sheet/BottomSheet.tsx` 신설(+`SheetHandle`) 후 소비처 통일: PaymentSheet(기존 라운드 22·핸들 없음·딤 .46 → 공용 스펙으로 통일, `dimClosable`로 결제 진행 중 잠금 유지), AiPackage 스왑 시트(공용 대체), Move 인라인 시트(SheetHandle 공유). 디자인 최종본 `Jeju Cruise App(최종).dc.html`을 design/incoming에 추가(기존 파일은 코드 주석의 라인 참조 보존을 위해 유지).
- **바텀시트 표준 동작(재검토 반영)**: 중복 핸들 제거(MethodSelect 자체 핸들·PayWindow 자체 라운드 삭제). BottomSheet에 딤 페이드 인/아웃·슬라이드다운 닫힘(280ms, 함수형 children으로 내부 닫기 버튼도 애니메이션 경유)·핸들 드래그 디스미스(80px 임계)·배경 스크롤 락·ESC 닫기. **`InlineSheet` 변형 추가**(비모달·지도 오버랩 레이아웃용): 동일한 슬라이드업 진입·핸들 드래그를 공유하고, 드래그로 내리면 이전 단계 복귀(`onDismiss=goBack`, 호출 진행 중 잠금) — Move 시트가 이걸 사용. 두 시트 라운드 24로 통일.

## 비범위

택시 위치 시뮬 마커 · explore/final 실지도 · 주문 내역(백엔드 orders API 미사용 — 결제는 기존 PaymentSheet mock 유지).
