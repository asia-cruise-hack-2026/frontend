# refs/ — 외부 읽기 전용 참조 영역

이 폴더는 **이 프론트 레포의 소스가 아니다.** 다른 레포/자료를 클론해 두고
**읽기만** 하는 참조 영역이다. `refs/README.md`를 제외한 내용은 git에 커밋되지 않는다
(`.gitignore`에서 제외).

## server/
백엔드 레포 클론. API 엔드포인트·DTO·타입 계약 확인용.

- 클론: `git clone <server-repo-url> refs/server`
- 최신화: `git -C refs/server pull`
- **규칙: 읽기 전용.** 수정·커밋·푸시 금지.
- 서버 개발 범위가 미합의 상태이므로, 여기서 확인한 계약을
  **클라이언트 mock 어댑터의 타입 기준**으로 삼는다.
