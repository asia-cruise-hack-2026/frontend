---
name: tanstack-integration
description: TanStack Query·Router·Start를 함께 연결(SSR 하이드레이션·QueryClient 배선·캐시 조율)할 때 사용한다. router 컨텍스트에 QueryClient 주입, setupRouterSsrQueryIntegration, per-request client, loader↔ensureQueryData↔useSuspenseQuery 흐름, defaultPreloadStaleTime 조율에 트리거. 트리거 키워드: QueryClient 컨텍스트, react-router-ssr-query, setupRouterSsrQueryIntegration, per-request QueryClient, SSR 하이드레이션, dehydrate hydrate, defaultPreloadStaleTime, useSuspenseQuery, 통합 설정, router context queryClient. 개별 규칙은 tanstack-query·tanstack-router, 엔티티 데이터 계층은 fsd-query-service.
---

# TanStack 통합 (Query × Router × Start)

Query·Router·Start를 한 스택으로 엮을 때의 배선·SSR·캐시 조율 규칙. 개별 라이브러리 규칙은 `tanstack-query`·`tanstack-router` 스킬을 함께 본다.

## 이 프로젝트 적용 (fateflow-front)

우리는 **TanStack Start(Vite+Nitro SSR) + Router + Query**를 쓰고, SSR 연동 패키지 **`@tanstack/react-router-ssr-query`가 이미 설치**돼 있다. 이 스킬의 권장 배선이 우리 표준이다:

- **QueryClient는 라우터 컨텍스트로 (전역 싱글턴 금지)**: `getRouter()`에서 **요청마다 새 `QueryClient`를 만들고** `createRootRouteWithContext<{ queryClient }>` 컨텍스트에 넣는다. 로더는 `context.queryClient.ensureQueryData(...)`로 접근. 모듈 전역 싱글턴은 SSR에서 **요청 간 캐시 누수**를 일으키므로 로더/queryFn에서 쓰지 않는다. (`setup-query-client-context`, `ssr-per-request-client`)
- **SSR은 자동 통합 사용**: `setupRouterSsrQueryIntegration({ router, queryClient })`로 dehydrate/hydrate·스트리밍·리다이렉트를 자동 처리. 수동 `dehydrate/hydrate`·별도 엔트리 파일 불필요. (`ssr-dehydrate-hydrate`) → 현재 `src/router.tsx`·`integrations/` 설정을 이 형태로 확인/정렬.
- **캐시는 Query가 단일 진실**: 라우터 `defaultPreloadStaleTime: 0` + `defaultPreload: 'intent'`. (`cache-single-source`)
- **데이터 흐름**: 로더에서 `ensureQueryData(service.queryOptions())` → 컴포넌트에서 `useSuspenseQuery(service.queryOptions())`. 서비스 오브젝트는 [`fsd-query-service`](../fsd-query-service/SKILL.md). (`flow-loader-query-pattern`, `flow-suspense-query-component`)
- **적용 제외**: `flow-server-functions-queries`(queryFn을 서버함수로)는 **우리에 N/A** — 데이터는 외부 NestJS REST를 `shared/api` http 래퍼로 호출한다(서버함수·DB 없음).

## 규칙 카테고리 (우선순위)

| 우선순위 | 카테고리 | 프리픽스 | 요지 |
|---|---|---|---|
| CRITICAL | 셋업 | `setup-` | QueryClient 컨텍스트 주입·프로바이더·staleTime 조율 |
| CRITICAL | SSR 통합 | `ssr-` | `setupRouterSsrQueryIntegration` 자동 SSR |
| HIGH | 데이터 흐름 | `flow-` | loader+ensureQueryData·useSuspenseQuery·뮤테이션 무효화 (서버함수 규칙은 N/A) |
| MEDIUM | 캐싱 | `cache-` | Query 단일 소스·프리로드 조율·무효화 패턴 |
| MEDIUM | SSR | `ssr-` | per-request client·스트리밍 |

## 사용법

각 규칙 파일은 `설명 → Bad → Good → Context` 구성. 새 프로젝트 배선 시 `setup-*` → `ssr-*` → `flow-*` 순으로 적용. 전체는 `rules/` 참조.

---

> 출처: [DeckardGer/tanstack-agent-skills](https://github.com/DeckardGer/tanstack-agent-skills) (MIT). 우리 스택(react-router-ssr-query 설치·외부 REST·서버함수 미사용)에 맞게 위 "적용" 노트로 각색.
