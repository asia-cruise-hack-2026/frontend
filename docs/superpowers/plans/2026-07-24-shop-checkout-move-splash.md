# 쇼핑 DB · 체크아웃 라우팅 · 이동 탭 · 스플래시 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙 `2026-07-24-shop-checkout-move-splash-design.md`를 구현한다.

**Architecture:** entities(product/spot) 실 API 어댑터 확장 → 화면 필드 스왑. 이동 탭은 지도+바텀시트 레이아웃으로 재구성. 스플래시는 루트 오버레이 위젯.

**Tech Stack:** 기존과 동일(React 19 · TanStack · WDS · @vis.gl · pnpm · Biome). 새 의존성 없음.

## Global Constraints

- dev `http://localhost:8787`. 커밋 `# type:`, AI 표기 금지, pre-commit 훅(check+typecheck). 테스트 러너 없음 → 태스크별 `pnpm check`+`typecheck`+브라우저.
- backend 무변경. 기존 스타일 관용구(파일 로컬 fmt·인라인 sx) 유지, 수술적 변경.

---

### Task 1: product entity 실 API 교체 + 상세·카트 정합

**Files:** Modify `src/entities/product/model/types.ts`(전체), Create `src/entities/product/api/api.ts`, Delete `src/entities/product/api/mock.ts`, Modify `src/entities/product/index.ts`, `src/entities/product/lib/importStatus.ts`(타입 참조만), `src/pages/product/ui/ProductDetailScreen.tsx`, `src/pages/checkout/model/cart.ts`, `src/pages/checkout/ui/CheckoutPage.tsx`(카트 쿼리), `src/pages/checkout/ui/CartRow 부분`, `src/pages/shop/ui/ShopScreen.tsx`(컴파일 정합 최소 — 본격 개편은 Task 2)

**Interfaces (Produces):**

```ts
export interface Product {
  id: string;
  category: string;
  categoryLabel: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  importStatus: "allowed" | "conditional" | "restricted" | "prohibited";
  importLabel: string;
  customsNote: string;
  cruiseLineNote: string;
  detailUrl: string;
}
export interface GoodsPage { items: Product[]; page: number; totalCount: number }
listGoods(p: { lang: Locale; category?: string; q?: string; page?: number; size?: number }): Promise<GoodsPage>
listGoodCategories(lang: Locale): Promise<{ key: string; label: string; count: number }[]>
getGood(id: string, lang: Locale): Promise<Product>  // 404 → ApiError
```

- IMPORT_STATUS_META 키를 `Product["importStatus"]`로 변경(값 동일). importStatus 매핑은 4종 외 값이면 "allowed" 폴백.
- 상세: hero→썸네일 img(onError 폴백), 배지→categoryLabel, description 문단 추가, customsNote/cruiseLineNote, detailUrl. HeroIcon/PRODUCT_ICONS 제거.
- cart.ts: `CartItem {id, thumbnail, name, meta, price, qty, importStatus: "allowed"|"restricted"}` — meta=categoryLabel. CheckoutPage 쿼리 `Promise.allSettled` + locale 포함 queryKey + `getGood(id, locale)`. CartRow emoji→썸네일 img(44px, radius 11).
- ShopScreen 최소 정합: `listGoods({lang: locale, category: activeCat==="all"?undefined:activeCat}).then(r=>r.items)`, 카드 name/description/importStatus/thumbnail 치환(그리드 아이콘→img), alcohol 탭은 Task 2에서 제거되므로 이번엔 유지돼도 무방(클릭 시 빈 결과).

검증 후 커밋: `# feat: 상품 엔티티 실 API 전환(/goods)·상세/체크아웃 실데이터 정합`

### Task 2: ShopScreen — 카테고리 실데이터 · 검색바 · 무한스크롤

**Files:** Modify `src/pages/shop/ui/ShopScreen.tsx`

- 카테고리: `useQuery(["good-categories", locale], () => listGoodCategories(locale))` → 탭 렌더(key/label). activeCat 기본 "all".
- 검색: `SearchField`(WDS — move의 DestStep과 동일 컴포넌트) + 300ms 디바운스 state(`q` → `debouncedQ` useEffect).
- 목록: `useInfiniteQuery({ queryKey: ["goods", activeCat, debouncedQ, locale], initialPageParam: 1, queryFn: ({pageParam}) => listGoods({lang: locale, category: activeCat==="all"?undefined:activeCat, q: debouncedQ || undefined, page: pageParam, size: 20}), getNextPageParam: (last) => last.page * 20 < last.totalCount ? last.page + 1 : undefined })` → `items = data.pages.flatMap(p=>p.items)`.
- 센티널: 그리드 뒤 `<Box ref>` + IntersectionObserver(useEffect) → `hasNextPage && !isFetchingNextPage && fetchNextPage()`.
- totalCount 표기(선택): 카테고리 탭 카운트는 API count 사용 안 함(라벨만) — 단순화.

검증(브라우저: 검색·스크롤·카테고리) 후 커밋: `# feat: 쇼핑 — 카테고리 실데이터·상품 검색·무한스크롤`

### Task 3: 체크아웃 라우팅 + clearCart

**Files:** Modify `src/shared/store/session.ts`(+clearCart), `src/shared/store/index.ts`(변경 없음 — sessionActions 경유), `src/pages/checkout/ui/CheckoutPage.tsx`

```ts
// session.ts actions에 추가
clearCart: () => store.setState((s) => ({ ...s, cart: [] })),
```

```ts
// CheckoutPage
const router = useRouter();
const goBack = () => {
  if (router.history.canGoBack()) router.history.back();
  else navigate({ to: "/app/shop" });
};
// 헤더 버튼 onClick={goBack}
const [paidTotal, setPaidTotal] = useState(0);
// PaymentSheet onPaid: setPaidTotal(total); setPaid(true); sessionActions.clearCart();
// 쇼핑 결제 완료 → 쇼핑 홈. (비쇼핑 결제 플로우가 생기면 /app 홈으로 분기할 것)
if (paid) return <OrderSuccess total={paidTotal} onDone={() => navigate({ to: "/app/shop" })} />;
```

검증(뒤로가기 히스토리·결제완료→쇼핑홈·카트 비움·새로고침 유지) 후 커밋: `# fix: 체크아웃 뒤로가기 히스토리·결제완료 쇼핑홈 복귀·장바구니 비움`

### Task 4: 스플래시 오버레이

**Files:** Create `src/widgets/splash/ui/Splash.tsx`, Create `src/widgets/splash/index.ts`, Modify `src/routes/__root.tsx`, Modify `src/shared/i18n/strings.ts`(2키)

- strings: `splash_tap_hint` {ko "화면을 탭해 수면을 출렁여 보세요" / en "Tap the screen to ripple the water" / zh "点击屏幕，让水面荡漾" / ja "画面をタップして水面を揺らしてみて"}, `splash_credit` {ko "제주 공식 · 탐나오 제휴" / en "Official Jeju · with Tamnao" / zh "济州官方 · 携手Tamnao" / ja "済州公式 · Tamnao提携"}.
- Splash.tsx: 디자인 이식 — fixed inset 0 z 9999, 그라데이션 `linear-gradient(168deg,#1D4ED8 0%,#2563EB 52%,#60A5FA 100%)`, 로고 팝인+글로우+반사, 물(waterH = min(42, pct*0.42)+surge, transition .55s), 파도 SVG 3겹(sp-wave), 기포 6개(sp-bubrise), 탭 리플+기포(sp-fillr/sp-ring/sp-bubble, 상태 배열+1s 정리), ambient 점광(sp-amb 자체 정의: 은은한 opacity 펄스), 하단 힌트(sp-hint)+크레딧(IconVerifiedCheckFill #7FFFB0). pct: 50ms 간격 +3.2(<70)/+1.8 → 100 도달 시 350ms 후 fade(opacity 0, .35s) → 350ms 후 onDone. keyframes는 컴포넌트 `<style>`로, `@media (prefers-reduced-motion: reduce)`에서 animation none.
- __root: 모듈 플래그 `let splashDone = false;` + `const [showSplash, setShowSplash] = useState(() => !splashDone);` → `{showSplash && <Splash onDone={() => { splashDone = true; setShowSplash(false); }} />}` (센터 컬럼 div 바깥, AppProviders 안 — i18n 사용).

검증(콜드 로드 1회·전환·내비게이션 재노출 없음·build prerender 통과) 후 커밋: `# feat: 스플래시 — 차오르는 바다 인터랙티브(디자인 Splash Interactive 최종 이식)`

### Task 5: 이동 탭 — 실 스팟 + 지도/바텀시트 레이아웃

**Files:** Modify `src/entities/spot/model/types.ts`(+ReachableSpot), Create `src/entities/spot/api/api.ts`, Modify `src/entities/spot/index.ts`, Create `src/pages/move/ui/MoveMap.tsx`, Modify `src/pages/move/ui/MovePage.tsx`

```ts
// types.ts 추가
export interface ReachableSpot {
  id: string;
  name: string;
  categoryLabel: string;
  km: number;
  lat: number;
  lng: number;
  driveMinutes: number;
}
// api.ts
listReachableSpots(cruiseId: string, lang: Locale): Promise<ReachableSpot[]>
// GET /spots?cruiseId&sort=distance&size=10&lang → items.map(r => ({id, name, categoryLabel: r.category.label, km: r.distanceKm, lat, lng, driveMinutes}))
```

- MoveMap.tsx: HomeMap 패턴 + `Marker` 2개(내위치 myPos?, 목적지 dest) — props `{ dest: {lat,lng} | null; myPos: {lat,lng} | null; height: number }`. center=dest ?? myPos ?? 제주항, zoom 12. 키 부재 폴백.
- MovePage 재구성:
  - spots 쿼리 → `listReachableSpots(cruiseId, locale)` (enabled !!cruiseId). destSpot 타입 ReachableSpot.
  - geolocation: useEffect `watchPosition`(성공 setMyPos, 실패 무시, cleanup clearWatch).
  - 레이아웃: `callStatus==="idle" && step==="dest"` → 기존 Header+DestStep. 그 외 → `<MoveMap height={...} />`(pickup 300, car/confirm 180, finding/riding 220) + 플로팅 백버튼(idle 시, 맵 좌상단 — ProductDetail의 원형 blur 버튼 스타일) + 시트 Box(`marginTop:-18px, borderRadius:"20px 20px 0 0", boxShadow:"0 -6px 20px rgba(0,0,0,.06)", background normal, position relative, zIndex 2` + 핸들바 38×4 + idle 스텝이면 시트 타이틀(stepTitleKey)) 안에 기존 콘텐츠(PickupStep/CarStep/ConfirmStep/FindingView/RideView).
  - Header는 dest에서만 렌더(기존 showBack 로직 단순화).
  - DestStep/PlaceRow: `s.name`, `${s.categoryLabel} · ${s.km}km` 치환.

검증(추천 실데이터·선택→지도+시트·현위치 마커·요금 계산·라이드 시뮬 정상) 후 커밋: `# feat: 이동 탭 — 추천명소 실데이터(/spots)·구글맵+바텀시트 레이아웃·현위치 마커`

### Task 6: 전체 검증

`pnpm check && pnpm typecheck && pnpm build` + Orca 브라우저(8787) 시나리오: 스플래시→언어→크루즈→홈(지도 타일 실렌더 확인 — 리퍼러 해결됨)→쇼핑(검색·무한스크롤·상세·카트·결제·완료·쇼핑홈)→이동(추천→지도+시트→호출 시뮬)→콘솔 에러 0. 최종 보고(변경·검증·미검증 명시).
