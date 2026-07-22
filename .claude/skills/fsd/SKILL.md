---
name: fsd
description: FSD로 코드를 배치/생성/리뷰할 때 사용한다. 이 프로젝트(fateflow-front)는 Feature-Sliced Design v2 아키텍처를 따른다. 새 컴포넌트·훅·API·페이지·위젯·기능을 어느 레이어/슬라이스/세그먼트에 둘지, import 의존성 방향이 맞는지, Public API(배럴) 규칙을 지키는지 판단할 때 호출한다. 트리거 키워드: FSD, 레이어, 슬라이스, 세그먼트, 어디에 둬야, 폴더 구조, 아키텍처 위반, 의존성 방향, public api, 배럴, steiger, pnpm fsd, pages/widgets/features/entities/shared.
---

# Feature-Sliced Design v2 (fateflow-front)

## 레이어 6종 (위 → 아래)

상위 레이어일수록 추상도가 낮고(구체적), 하위일수록 재사용성이 높다.

1. **app** — 진입점, 라우팅 연결, 전역 provider, 전역 스타일, 앱 초기화. 슬라이스 없음(세그먼트 직접 보유).
2. **pages** — 라우트 1개에 대응하는 화면 전체 또는 큰 화면 조각. 위젯/기능/엔티티를 조립한다.
3. **widgets** — 독립적으로 완결된 큰 UI 블록(헤더, 사이드바, 프로필 매니저 등). 여러 기능/엔티티를 묶어 하나의 use case를 제공.
4. **features** — 사용자가 수행하는 비즈니스 행동(로그인, 프로필 생성, 알고리즘 선택 등). 재사용 가능한 product feature.
5. **entities** — 비즈니스 도메인 객체(user, manse-profile, algorithm 등). 데이터 모델 + 그 객체의 표현/조회.
6. **shared** — 프로젝트 도메인과 무관한 재사용 코드(UI 키트, 유틸, API 클라이언트, 설정). 슬라이스 없음(세그먼트 직접 보유).

> v2에서 **process 레이어는 deprecated**. 사용하지 않는다.

## 의존성 규칙 (가장 중요)

```
app → pages → widgets → features → entities → shared
```

- 모듈은 **자기보다 strictly 아래 레이어만** import할 수 있다. (위/같은 레이어 import 금지)
- **같은 레이어의 다른 슬라이스를 직접 참조 금지.** 예) `features/auth`가 `features/algorithm`을 import하면 위반. 공유가 필요하면 더 아래 레이어(entities/shared)로 내리거나, 상위 레이어(widget/page)에서 조립한다.
- shared와 app은 슬라이스가 없으므로 이 "슬라이스 간 참조 금지" 규칙의 대상이 아니다.

## 슬라이스 & 세그먼트

- **슬라이스** = 비즈니스 도메인 단위 폴더. pages/widgets/features/entities에만 존재. (예: `entities/manse-profile`, `features/auth`)
- **세그먼트** = 슬라이스 내부를 기술적 목적별로 분할:
  - `ui/` — 컴포넌트, 스타일
  - `model/` — 상태, 스토어, 비즈니스 로직, 타입/스키마
  - `api/` — 백엔드 호출, 요청/응답 매핑
  - `lib/` — 해당 슬라이스 전용 유틸/헬퍼
  - `config/` — 상수, 피처 플래그
- 슬라이스에 없는 세그먼트는 만들지 않는다(빈 폴더 금지). 필요한 것만 둔다.

```
src/features/auth/
├── ui/LoginModal.tsx
├── model/use-require-auth.ts
├── api/exchange.ts
└── index.ts   ← Public API
```

## Public API (배럴) 규칙

- 각 슬라이스는 **루트 `index.ts`로만 외부에 노출**한다. 외부 코드는 슬라이스 내부 파일을 깊은 경로로 import하지 않는다.
  - 좋음: `import { LoginModal } from "@/features/auth"`
  - 나쁨: `import { LoginModal } from "@/features/auth/ui/LoginModal"`
- index에서 명시적으로 export한 것만 공개 API. 내부 구현은 숨긴다.

## 이 프로젝트 특수사항

- **경로 별칭**: `@/*` = `src/*` (`#/*`도 동일). import는 별칭 사용.
- **TanStack Start 프레임워크 위치는 FSD 슬라이스가 아니다.** 다음은 프레임워크 산출물/관례이며 `steiger.config.ts`에서 검사 제외됨:
  - `src/routes/**` — 라우트 정의 파일
  - `src/router.tsx` — 라우터 설정
  - `src/integrations/**` — 프레임워크 통합(tanstack-query provider 등)
  - `src/routeTree.gen.ts` — 자동 생성
- **화면 구현은 `src/pages/*` 슬라이스에서** 한다. `src/routes/*` 파일은 얇은 진입점으로, `pages`에서 export한 컴포넌트를 연결만 한다(비즈니스 로직/UI를 route 파일에 직접 쓰지 않는다).
- **shadcn 컴포넌트는 `@/shared/ui`(= `src/shared/ui`)에 위치.** `components.json`의 `components`/`ui` 별칭이 `@/shared/ui`. shadcn UI 프리미티브는 파일 직접 import(`@/shared/ui/button`) 관례를 허용한다(배럴 강제 예외).
- **검증**: `pnpm fsd` (steiger, `@feature-sliced/steiger-plugin` recommended 룰셋). 코드 배치 후 이걸로 위반을 확인한다.

## 새 코드 배치 의사결정 순서

1. **이건 어느 레이어인가?**
   - 도메인 무관 재사용(버튼, fetch 래퍼, 날짜 유틸) → `shared`
   - 도메인 객체의 데이터/표현(프로필, 알고리즘) → `entities`
   - 사용자의 행동/상호작용(생성, 로그인, 선택) → `features`
   - 여러 기능을 묶은 완결된 UI 블록 → `widgets`
   - 라우트 화면 전체 → `pages`
   - 전역 provider/초기화/라우팅 연결 → `app`
2. **새 슬라이스가 필요한가?** 새 도메인이면 새 슬라이스. 기존 도메인 확장이면 기존 슬라이스에 세그먼트 추가.
3. **어느 세그먼트인가?** UI면 `ui`, 상태/로직/타입이면 `model`, 서버 호출이면 `api`, 전용 유틸이면 `lib`, 상수면 `config`.
4. 외부 노출이 필요하면 슬라이스 `index.ts`에 export 추가.

## 흔한 실수 체크리스트

- [ ] 같은 레이어 슬라이스를 직접 import하지 않았는가? (feature → 다른 feature 금지)
- [ ] 하위 레이어만 import하는가? (entity가 feature를 import하면 위반)
- [ ] 슬라이스 내부 깊은 경로로 import하지 않고 `index.ts` 배럴을 거쳤는가? (shadcn `@/shared/ui/*` 제외)
- [ ] 비즈니스 로직/UI를 `src/routes/*` route 파일에 직접 넣지 않고 `pages` 슬라이스로 뺐는가?
- [ ] 빈 세그먼트 폴더를 만들지 않았는가? 필요한 세그먼트만 생성.
- [ ] 도메인 무관 코드를 entities/features에 두지 않고 shared로 내렸는가?
- [ ] 배치 후 `pnpm fsd`로 검증했는가?
