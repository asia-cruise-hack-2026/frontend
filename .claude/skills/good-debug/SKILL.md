---
name: good-debug
description: 프론트에서 버그·예상 밖 동작·에러를 만났을 때, 고치기 전에 먼저 쓴다. 증상이 아니라 근본 원인을 진단·재현·수정·재발방지하는 4단계 + 우리 스택 디버깅 도구. 트리거 키워드 — 버그, 에러, TypeError, undefined, 재현, 근본 원인, 왜 안 돼, 디버깅, 콘솔 에러, 네트워크 실패, 하이드레이션, StyleX 안 나옴. 일반 디버깅 규율은 superpowers systematic-debugging, 타입 회피(any/as/!)는 typescript 스킬.
---

# Good Debug (fateflow-front)

**증상이 아닌 원인을 수정한다. 에러를 숨기거나 우회하지 않는다.**
원리 출처: Toss Frontend Fundamentals. 도구는 우리 스택(TanStack Start/Vite·StyleX·Vitest·Biome)에 맞춰 각색.

---

## 디버깅 4단계

### 1. 진단 — 무엇이 문제인지 정확히
에러 메시지를 첫 줄만 보지 말고 전체를 읽는다. **무슨 의미 → 어떤 상황 → 가능한 원인** 순으로 생각한 뒤 검색.

| 에러 종류 | 확인 포인트 |
|---|---|
| `TypeError` | 객체가 undefined인데 접근, `await` 누락 |
| `ReferenceError` | 선언 위치·스코프. SSR에서 `window`/`localStorage` 접근(클라 전용 가드 `typeof window`) |
| 네트워크 | CORS vs 프록시, 인증(401), 4xx vs 5xx. 우리는 `/v1` Vite 프록시 경유(직접호출이면 CORS) |
| 모듈 해석 | `Could not resolve` — StyleX 크로스파일 토큰(`unstable_moduleResolution`), ESM/경로/별칭 |
| 하이드레이션 불일치 | SSR≠클라 첫 렌더. 클라 전용 값(테마·토큰)을 초기 렌더에 넣지 않았나 |

### 2. 재현 — 재현 안 되면 못 고친다
재현 조건을 최소화한다. 무관한 비동기·상태·UI를 걷어내고 핵심 로직만. **비즈니스 로직을 순수 함수로 분리**하면 Vitest로 바로 재현·고정할 수 있다.

### 3. 수정 — 근본 원인을 고친다
```ts
// ❌ 증상만 숨김
const user = selectedUser as User;   // as 회피
const name = selectedUser!.name;     // non-null 남용
setTimeout(() => refetch(), 300);    // 레이스 땜빵

// ✅ 근본 처리
if (!selectedUser) throw new Error("selectedUser is required");
const controller = new AbortController();      // 이전 요청 취소
fetch(url, { signal: controller.signal });     // (TanStack Query는 signal 자동 주입)
```
같은 버그 재발을 막으려면 재현 테스트(Vitest)를 남긴다.

### 4. 재발 방지
- 고친 조건에서 다시 재현해 검증. 엣지 케이스(빈 배열·null·최대값)도.
- 같은 패턴의 버그가 다른 곳에 있는지 ripgrep으로 탐색.

---

## 우리 스택 디버깅 도구

| 상황 | 도구 |
|---|---|
| 컴포넌트 상태 | React DevTools (브라우저 확장) |
| 서버 상태·캐시 | **TanStack Query Devtools** (이미 `__root`에 배선) |
| 라우팅·로더 | **TanStack Router Devtools** (이미 `__root`에 배선) |
| 네트워크 요청 | 브라우저 Network 탭. `/v1` 프록시 응답 확인 |
| 타입 에러 | `pnpm typecheck` (tsc --noEmit) |
| 린트·포맷 | `pnpm check` (Biome) |
| FSD 위반 | `pnpm fsd` (steiger) |
| **StyleX 방출·색/폰트** | ⚠️ **dev ≠ build**. `vite dev`가 StyleX 규칙을 드롭할 수 있다. 최종 진실은 `pnpm build && pnpm preview`(:4173) + DevTools 계산값 — grep 아님. 상세 [astryx-stylex] §5 |
| 번들·SSR 에러 | `pnpm dev`(Vite/Nitro 로그), `pnpm build`(SSR 빌드) |

---

## 하지 말 것
- `// @ts-ignore`로 타입 에러 무시, `as`/`!`(non-null) 남용 → [typescript]
- `try {} catch(e) {}` 빈 catch
- 원인 모르고 `key` 바꿔 리렌더 강제
- `setTimeout`으로 타이밍 문제 임시 해결
- 프리뷰 포트 혼선: 낡은 `vite preview`가 남으면 새 프로세스가 다른 포트로 뜬다 → 옛 빌드 에셋 404. `pkill -f "vite preview"` 후 재시작.
