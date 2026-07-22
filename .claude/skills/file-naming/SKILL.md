---
name: file-naming
description: 타입·상수·유틸 파일의 네이밍/배치 컨벤션. Use when creating type-only files, constant files, or deciding a file name/suffix within a slice. 트리거 키워드 — types.ts, constants.ts, 파일 네이밍, 상수 파일, 타입 파일, 어디에 둬야, 파일명.
---

# file-naming — 파일 네이밍·배치 컨벤션

FSD 슬라이스 안에서 타입·상수·유틸을 **일관된 접미사 + 세그먼트**로 배치한다. 레이어/슬라이스 배치 판단 자체는 [fsd] 스킬, 여기서는 **파일 이름·세그먼트 매핑**만 다룬다.

## 접미사 규칙

| 내용 | 파일명 | FSD 세그먼트 |
|---|---|---|
| 타입/인터페이스/스키마 | `<name>.types.ts` | `model/` |
| 상수/설정값/enum류 | `<name>.constants.ts` | `config/` |
| 전용 유틸/헬퍼 | `<name>.utils.ts` (또는 서술적 이름) | `lib/` |
| 스토어/상태 | `<name>.store.ts` | `model/` |
| StyleX 토큰 | `<name>.stylex.ts` | `shared/theme` (기존 규칙) |

- `<name>` = 슬라이스/도메인/기능 이름(kebab-case). 예: `saju-profile.types.ts`, `fortune.constants.ts`.
- **컴포넌트 파일은 PascalCase**(`Hero.tsx`), 그 외 로직/타입/상수 파일은 **kebab-case**.

## 배치 원칙

1. **세그먼트 우선.** 타입은 `model/`, 상수는 `config/`, 유틸은 `lib/`에 둔다(FSD 세그먼트). 슬라이스에 해당 세그먼트가 없으면 만든다(빈 세그먼트 금지 — 필요할 때만).
   ```
   entities/saju-profile/
   ├── model/saju-profile.types.ts
   ├── config/saju-profile.constants.ts
   └── index.ts
   ```
2. **소규모 co-location 허용.** 한 컴포넌트에만 쓰는 소량의 타입/상수는 세그먼트를 새로 파지 말고 그 파일 안에 두거나 옆에 `<Component>.types.ts`로 co-locate한다. 슬라이스 전반/여러 파일이 공유하면 세그먼트로 승격한다.
3. **Public API.** 외부 노출이 필요한 타입/상수만 슬라이스 `index.ts`(배럴)로 export한다. (StyleX `defineVars`는 배럴 재export 불가 — 예외, [astryx-stylex] 참조.)

## 하지 말 것
- `types.ts`·`constants.ts`를 접미사 없이 슬라이스 루트에 흩뿌리지 않는다(세그먼트로).
- 도메인 무관 공용은 `entities/features`가 아니라 `shared`로 내린다([fsd] 배치 순서).
- 빈 세그먼트 폴더 생성 금지.

관련: 레이어/슬라이스 배치는 [fsd], 엔티티 데이터 계층은 [fsd-query-service].
