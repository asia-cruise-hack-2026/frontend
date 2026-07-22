---
name: tanstack-router
description: TanStack Router로 라우팅·데이터 로더·search params·네비게이션을 작성·리뷰할 때 사용한다. createFileRoute, loader, ensureQueryData, search 검증, Link/useNavigate, 코드 스플리팅(.lazy), 프리로드, 루트 컨텍스트 관련 작업에 트리거. 트리거 키워드: TanStack Router, createFileRoute, 라우트, 로더, loader, ensureQueryData, search params, useNavigate, Link, beforeLoad, routeTree, lazy 라우트, 프리로드, 파일 라우팅. 순수 데이터 캐시 규칙은 tanstack-query, 엔티티 데이터 계층은 fsd-query-service, 레이어/배럴 배치는 fsd 스킬.
---

# TanStack Router 베스트 프랙티스

타입 세이프 라우팅·데이터 로더·search params·네비게이션 규칙. 상세는 `rules/`의 개별 파일에 있고 필요한 것만 골라 읽는다.

## 이 프로젝트 적용 (fateflow-front)

우리는 **TanStack Start(Vite+Nitro SSR) 위에서 TanStack Router 파일 라우터**를 쓴다. 아래 프로젝트 규약을 규칙보다 우선한다:

- **thin route → page** (가장 중요): `src/routes/*`는 프레임워크가 강제하는 **얇은 진입점**이다. 화면 구현은 `src/pages/*` 슬라이스에 두고 route의 `component`가 그 page를 import 한다. 규칙 예제처럼 route 파일에 화면 로직을 몰아넣지 않는다. (fsd 스킬)
- **로더 = 엔티티 서비스**: `loader`에서는 `context.queryClient.ensureQueryData(<domain>Service.queryOptions(...))` 형태로, [`fsd-query-service`](../fsd-query-service/SKILL.md)의 서비스 오브젝트를 재사용한다. 로더에서 직접 fetch/쿼리키 하드코딩 금지. (`load-ensure-query-data`)
- **search 검증은 Zod 4**: `validateSearch`에 Zod 스키마 사용. (`search-validation`)
- **QueryClient 연동**: 루트 컨텍스트에 queryClient 주입 + SSR dehydrate/hydrate. 이 프로젝트는 `@tanstack/react-router-ssr-query` 통합을 쓰므로 `router.tsx`의 수동 dehydrate/hydrate/Wrap 예제는 그 통합 방식으로 대체될 수 있다 — 현재 `src/router.tsx`·`integrations/` 설정을 먼저 확인.
- **코드 스플리팅**: `@tanstack/router-plugin` 설치됨 → `autoCodeSplitting` 활용(`split-auto-splitting`). 수동 `.lazy.tsx`는 필요 시.
- **별칭/제외**: `@/`·`#/` → `src/`. `routes/`·`router.tsx`·`integrations/`·`routeTree.gen.ts`는 steiger FSD 검사 제외(프레임워크 위치). `routeTree.gen.ts`는 자동 생성이라 **수정 금지**.

## 규칙 카테고리 (우선순위)

| 우선순위 | 카테고리 | 프리픽스 | 요지 |
|---|---|---|---|
| CRITICAL | 타입 세이프 | `ts-` | router 타입 등록·`from` 내로잉·컨텍스트 타이핑·loader queryOptions |
| CRITICAL | 라우트 구성 | `org-` | 파일 라우팅·트리 구조·pathless 레이아웃·index 라우트 |
| HIGH | 라우터 설정 | `router-` | 전역 기본값(scrollRestoration 등) |
| HIGH | 데이터 로딩 | `load-` | **ensureQueryData**·loaderDeps·deferred·에러·병렬 |
| HIGH | search params | `search-` | Zod 검증·타입 상속·미들웨어·기본값·시리얼라이저 |
| HIGH | 에러 | `err-` | not-found 처리 |
| MEDIUM | 네비게이션 | `nav-` | Link·active 상태·useNavigate·상대경로·라우트 마스크 |
| MEDIUM | 코드 스플리팅 | `split-` | `.lazy.tsx`·critical path·autoCodeSplitting |
| MEDIUM | 프리로드 | `preload-` | intent 프리로드·staleTime·수동 |
| LOW | 루트 컨텍스트 | `ctx-` | 루트 컨텍스트·beforeLoad·의존성 주입 |

## 사용법

1. **CRITICAL(타입 세이프·라우트 구성) 먼저** — 런타임 에러·리팩터 안전성
2. **HIGH(로더·search)** — 데이터·URL 상태. 로더는 fsd-query-service와 함께.
3. MEDIUM/LOW는 필요 시. 각 규칙: `설명 → Bad → Good → Context`.

전체 목록·코드 예제는 `rules/` 참조.

---

> 출처: [DeckardGer/tanstack-agent-skills](https://github.com/DeckardGer/tanstack-agent-skills) (MIT). 규칙 본문은 원본을 따르되 프론트(fateflow-front)의 thin route→page·FSD·SSR-query 통합에 맞게 위 "적용" 노트로 각색.
