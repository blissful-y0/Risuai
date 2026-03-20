# Node Self-Host Service Worker Disable Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Node self-host 환경에서는 서비스워커 초기화를 건너뛰어 `/sw/init` 404와 관련 부수효과를 제거한다.

**Architecture:** 서비스워커 사용 여부를 순수 함수로 분리해 테스트 가능하게 만든 뒤, `bootstrap.ts` 초기화 흐름에서 그 함수를 사용한다. 웹 정적 호스팅과 Tauri 동작은 그대로 두고, Node self-host 분기만 명시적으로 끈다.

**Tech Stack:** TypeScript, Vitest, Svelte bootstrap flow

---

### Task 1: 서비스워커 정책 함수 추가

**Files:**
- Create: `src/ts/serviceWorkerPolicy.ts`
- Test: `src/ts/serviceWorkerPolicy.test.ts`

**Step 1: Write the failing test**

- Node self-host에서는 `false`
- 일반 웹 + serviceWorker 지원 브라우저에서는 `true`
- serviceWorker API가 없으면 `false`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ts/serviceWorkerPolicy.test.ts`

**Step 3: Write minimal implementation**

- `isNodeServer`, `isTauri`, `hasServiceWorker` 입력을 받는 순수 함수 작성

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/ts/serviceWorkerPolicy.test.ts`

### Task 2: bootstrap 초기화에 정책 적용

**Files:**
- Modify: `src/ts/bootstrap.ts`

**Step 1: 서비스워커 초기화 분기를 정책 함수로 교체**

- Node self-host에서는 `setUsingSw(false)` 유지
- 웹 환경에서만 `registerSw()` 실행

**Step 2: 한국어 주석 추가**

- 왜 Node self-host에서 SW를 끄는지 설명

**Step 3: Verify**

Run:
- `pnpm check`
- `pnpm build`

### Task 3: 로컬 self-host 재검증

**Files:**
- None

**Step 1: 서버 재시작**

Run: `RISU_ENABLE_HTTPS=false RISU_GATEWAY_MODE=false pnpm runserver`

**Step 2: 헬스체크**

Run: `node -e "fetch('http://127.0.0.1:6001/api/health').then(async (res)=>{console.log(res.status); console.log(await res.text())})"`

**Step 3: 브라우저 확인**

- 첫 진입에서 `/sw/init` 404가 사라졌는지 확인
