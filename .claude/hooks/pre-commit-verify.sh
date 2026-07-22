#!/usr/bin/env bash
# PreToolUse(Bash) 훅 — git commit 전에 Biome(pnpm check) + tsc(pnpm typecheck)를 강제한다.
#
# MVP 정책(fateflow 대비 경량화): fsd(steiger)·test는 커밋을 "차단하지 않는다"(수동으로 돌린다).
#   해커톤 속도를 위해 빠르고 확실한 두 게이트(린트·타입)만 집행한다.
#
# 동작:
#   - 실행 명령이 `git commit`이 아니면 즉시 통과(exit 0).
#   - 스택 스캐폴딩 전(package.json 없음)에도 통과 — 초기 세팅 커밋을 막지 않는다.
#   - check/typecheck 중 하나라도 실패하면 exit 2 → 커밋 차단 + stderr를 Claude에 되돌린다.
# 테스트: printf '%s' '{"tool_input":{"command":"git commit -m x"}}' | .claude/hooks/pre-commit-verify.sh

input="$(cat)"

# tool_input.command 추출 (jq 없이 node로)
cmd="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(String((j.tool_input&&j.tool_input.command)||""))}catch(e){process.stdout.write("")}})')"

# git commit 명령이 아니면 통과
case "$cmd" in
	*"git commit"*) : ;;
	*) exit 0 ;;
esac

dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$dir" || exit 0

# 스택 스캐폴딩 전에는 검사 스크립트가 없으므로 통과
[ -f package.json ] || exit 0

# pnpm 해석 (PATH에 없으면 corepack 경유)
if command -v pnpm >/dev/null 2>&1; then
	PM="pnpm"
else
	PM="corepack pnpm"
fi

if ! $PM check >/tmp/jeju-precommit-check.log 2>&1; then
	echo "🚫 커밋 차단 — Biome(pnpm check) 실패. 'pnpm check --write'로 고친 뒤 다시 커밋하세요." >&2
	tail -n 25 /tmp/jeju-precommit-check.log >&2 2>/dev/null || true
	exit 2
fi

if ! $PM typecheck >/tmp/jeju-precommit-typecheck.log 2>&1; then
	echo "🚫 커밋 차단 — TypeScript(pnpm typecheck) 타입 오류. 타입을 고친 뒤 다시 커밋하세요." >&2
	tail -n 25 /tmp/jeju-precommit-typecheck.log >&2 2>/dev/null || true
	exit 2
fi

exit 0
