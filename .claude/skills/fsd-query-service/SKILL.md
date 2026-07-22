---
name: fsd-query-service
description: FSD 엔티티의 데이터 계층(서버 상태)을 작성·리뷰할 때 사용한다. queryKey/queryOptions 팩토리 + 캐시 서비스 오브젝트(getCache/setCache/queryOptions/prefetch/ensure) 패턴으로 entity의 api 세그먼트를 구성하고, 크로스 엔티티 캐시 시딩(@x), 낙관적 업데이트, 무한 목록을 이 프로젝트 표준대로 배치한다. 트리거 키워드: 엔티티 api, 데이터 계층, queryOptions, queryKey 팩토리, 서비스 오브젝트, articleService식, 캐시 시딩, @x 크로스임포트, entities/*/api, 무한목록, 낙관적 업데이트 배치. 순수 캐시/뮤테이션 프리미티브 규칙은 tanstack-query 스킬, 레이어/배럴 배치 판단은 fsd 스킬.
---

# FSD × TanStack Query — 엔티티 데이터 계층 표준

이 프로젝트에서 서버 상태(외부 NestJS API)를 다루는 **표준 방식**. [FSD 공식 "Usage with React Query" 가이드](https://feature-sliced.design/docs/guides/tech/with-react-query)의 "entity api 세그먼트 + queryOptions 팩토리 + 서비스 오브젝트" 패턴을 우리 스택에 맞춘 것이다.

세 스킬의 역할 분담:
- **fsd-query-service**(이 스킬): 데이터 계층을 *어떻게 구성/배치*하나 (서비스 오브젝트·팩토리·시딩)
- **tanstack-query**: 그 안의 *프리미티브 규칙* (qk-*, cache-*, mut-*, ssr-*)
- **fsd**: 레이어/슬라이스/배럴 등 *일반 배치* 규칙

> 정본 코드는 [`templates/entity-query-service.ts`](templates/entity-query-service.ts). 새 엔티티 데이터 계층은 이걸 복제해 시작한다.

## 배치 (공식 가이드 + 우리 FSD)

| 대상 | 위치 |
|---|---|
| queryKey 팩토리 + queryOptions + 서비스 오브젝트 | `entities/<domain>/api/<domain>.query.ts` |
| 요청 함수(get/create/…) — 얇으면 query.ts 인라인 가능 | `entities/<domain>/api/` |
| **뮤테이션** (쿼리와 분리, 사용처 근처) | `features/<slice>/api/` |
| QueryClient 프로바이더 | `integrations/` (프레임워크 위치) |
| 엔티티 간 캐시 시딩 | 대상 엔티티의 `@x` 공개 API로만 |

## 서비스 오브젝트 패턴 (골격)

entity마다 `<domain>Service` 오브젝트에 **쿼리 + 캐시 접근**을 응집한다:

```
<domain>Service = {
  queryKey, getCache, setCache, removeCache,
  queryOptions, prefetch, ensure
}
```

- `queryOptions`는 `queryKey`+`queryFn`을 한 객체로 (v5 타입 추론 이점). 컴포넌트/로더/prefetch가 **같은 옵션을 재사용**.
- `getCache`/`setCache`는 React 밖에서도 캐시를 조작 → **크로스 엔티티 시딩**(목록 응답의 중첩 객체를 다른 엔티티 단건 캐시에 심기)에 쓴다.

## 우리 스택 각색 (흔한 예제와 다른 점)

인터넷의 FSD+RQ 예제(RealWorld 등)를 그대로 쓰면 안 된다. 아래로 치환:

| 흔한 예제 | 이 프로젝트 |
|---|---|
| `react-router-dom` (`useNavigate`, `pathKeys`) | **`@tanstack/react-router`** — `navigate({ to: "/..." })` 타입 세이프 |
| `zustand` StoreApi (필터/페이지 상태) | **`@tanstack/react-store`** |
| `~` 별칭 | `@/`·`#/` (→ `src/`) |
| `queryFn`이 axios/직접 fetch | **`@/shared/api`의 `http` 래퍼** (`http.get<T>(path,{signal,token})`) |
| 검증 | **Zod 4** |
| SSR dehydrate/hydrate 수동 | `@tanstack/react-router-ssr-query` 연동 사용 |

## QueryClient 접근 — SSR 주의 (중요)

우리는 SSR(Nitro)이라 **QueryClient는 요청마다 새로 만들어 라우터 컨텍스트로 흘려보낸다**(전역 모듈 싱글턴 금지 — 요청 간 캐시 누수). 배선은 [`tanstack-integration`](../tanstack-integration/SKILL.md)의 `setupRouterSsrQueryIntegration`. 따라서 서비스 오브젝트에서 클라이언트를 얻는 방법은:

- **로더**: `context.queryClient`로 접근 → `ensureQueryData(service.queryOptions())`. (여기가 시딩·prefetch의 정석 위치)
- **컴포넌트/뮤테이션**: `useQueryClient()` 훅.
- `service.queryKey`/`service.queryOptions`는 **순수**(클라이언트 불필요)하니 어디서나 재사용.
- `getCache`/`setCache` 같은 명령형 캐시 헬퍼는 클라이언트가 있어야 하므로 **클라이언트를 인자로 받거나**(`setCache(qc, data)`) 훅/로더 컨텍스트 안에서 호출한다. 전역 싱글턴 import는 **클라이언트 전용 편의**로만, SSR 로더/queryFn에선 쓰지 않는다.

## @x 크로스 엔티티 시딩

- 다른 엔티티 캐시를 건드릴 땐 그 엔티티를 직접 깊게 import 하지 말고 **`@/entities/<other>/@x/<this>`** 공개 API로 가져온다(순환·결합 방지). steiger(FSD 플러그인)가 `@x`를 검증.
- 예: 프로필 목록 응답의 `owner`를 `ownerService.setCache(owner)`로 심기.
- 배럴/공개 API 세부 규칙은 **fsd 스킬**.

## Do / Don't

- ✅ `queryFn`은 `http` 래퍼 경유. ❌ 컴포넌트에서 `fetch` 직접.
- ✅ 컴포넌트·로더·prefetch가 `service.queryOptions()` **재사용**. ❌ 곳곳에 queryKey 하드코딩.
- ✅ 뮤테이션은 `features/*/api`. ❌ entity api에 뮤테이션 뭉치기(가이드: 쿼리와 분리).
- ✅ 낙관적 업데이트는 onMutate에서 스냅샷 → onError 롤백 → onSettled invalidate.
- ✅ 크로스 엔티티는 `@x`. ❌ `entities/other/api/...` 깊은 import.

---

> 근거: [FSD 공식 RQ 가이드](https://feature-sliced.design/docs/guides/tech/with-react-query) + [queryOptions 문서](https://tanstack.com/query/latest/docs/framework/react/guides/query-options). 프리미티브는 [`tanstack-query`](../tanstack-query/SKILL.md), 배치는 [`fsd`](../fsd/SKILL.md).
