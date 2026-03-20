# Custom Fork Bootstrap: Step 0

> 작성일: 2026-03-20  
> 브랜치: `feat/cloudflare-step0-bootstrap`  
> 대상 포크: `git@github.com:blissful-y0/Risuai.git`

## 목적

이 문서는 `blissful-y0/Risuai` 포크를 실제 개조 작업에 착수하기 전에,

- 현재 배포 인프라를 어떻게 볼지
- Cloudflare Tunnel 환경에서 무엇을 캐시하고 무엇을 우회할지
- Step 0에서 무엇을 끝내야 하는지
- Phase 0에서 바로 어디부터 손댈지

를 한 번에 정리한 시작 문서다.

이 문서의 목표는 “설계 멋있게 쓰기”가 아니라, 바로 구현 들어갈 수 있게 기준을 고정하는 것이다.

## 현재 전제

현재 환경 전제는 다음과 같다.

- RisuAI는 Docker 기반으로 운영 중
- 외부 노출은 Cloudflare Tunnel 위에서 이뤄짐
- 단순 정적 사이트가 아니라 다음 성격을 동시에 가짐
  - 대형 정적 프론트 번들
  - 바이너리 저장/읽기 API
  - LLM 프록시
  - 장시간 응답
  - SSE/스트리밍

즉, Cloudflare 정책을 전체 경로에 하나로 걸면 깨질 가능성이 높다.

## Cloudflare Tunnel 기준 분리 원칙

RisuAI는 경로별로 성격이 다르므로 다음처럼 나눈다.

### 1. 정적 자산

대상 예시:

- `/assets/*`
- 해시된 JS/CSS
- 이미지, 폰트, 기타 정적 리소스

정책:

- 장기 캐시 가능
- 압축 적극 사용
- Cloudflare 캐시 사용 가능

### 2. HTML

대상 예시:

- `/`
- `index.html`

정책:

- 장기 캐시 금지
- no-cache 또는 매우 짧은 캐시
- 새 배포가 즉시 반영되어야 함

### 3. 저장 API

대상 예시:

- `/api/read`
- `/api/write`
- `/api/list`
- `/api/remove`

정책:

- 캐시 금지
- 응답 변형 금지
- body/headers 그대로 유지

### 4. 프록시 API

대상 예시:

- `/proxy`
- `/proxy2`
- `/hub-proxy/*`

정책:

- 캐시 금지
- HTML/JS 최적화 계층 영향 금지
- 스트리밍/SSE 변형 금지
- 가능하면 “거의 패스스루”처럼 취급

### 5. 장시간 스트리밍 응답

대상 예시:

- LLM stream
- SSE 기반 응답

정책:

- 버퍼링/변형 최소화
- Cloudflare 경유 시 truncation/abort 영향을 우선 점검
- 필요하면 후속 단계에서 Worker 또는 별도 서브도메인 검토

## 권장 공개 구조

가장 안전한 운영 모델은 다음 두 가지 중 하나다.

### 옵션 A: 단일 도메인 + 경로별 정책 분리

- `app.example.com`
  - `/` + `/assets/*` + `/api/*` + `/proxy*`

장점:

- 단순함

단점:

- Cloudflare 정책을 경로별로 더 세밀하게 관리해야 함

### 옵션 B: 앱/프록시 분리

- `app.example.com`
  - UI + 정적 자산
- `api.example.com`
  - `/api/*`, `/proxy*`, `/hub-proxy/*`

장점:

- 캐시와 프록시 정책을 명확히 분리 가능
- 나중에 Worker/Rules 붙이기 쉬움

단점:

- 배포/환경변수/오리진 관리가 조금 늘어남

현재 단계 추천:

- 처음엔 옵션 A로 시작
- 프록시 쪽 문제가 남으면 옵션 B로 분리

## Step 0

Step 0은 “실제 기능 개발 전 준비 작업”이다.

여기서 끝내야 하는 것은 다음 네 가지다.

1. Git/브랜치 작업기반 정리
2. Cloudflare 경로 정책 정리
3. 로컬 baseline 확인
4. 첫 구현 범위 고정

### Step 0-1. Git 기준 정리

- `origin = blissful-y0/Risuai`
- `upstream = kwaroran/Risuai`
- 기능 작업은 `main`에서 새 브랜치로만 진행
- 잡다한 로컬 변경은 본 작업 브랜치에 섞지 않음

현재 작업 브랜치:

- `feat/cloudflare-step0-bootstrap`

### Step 0-2. 격리 작업공간

작업은 별도 worktree에서 진행한다.

현재 경로:

- `/Users/bliss/Documents/Risuai/.worktrees/feat-custom-fork-bootstrap`

이유:

- 현재 메인 작업트리를 더럽히지 않음
- 장기 개조 작업을 독립적으로 진행 가능

### Step 0-3. baseline 확인

이 브랜치에서 baseline 확인은 이미 완료했다.

- `pnpm install` 완료
- `pnpm check` 통과
- 결과: `0 errors`, `0 warnings`

즉 시작점 자체는 깨끗하다.

### Step 0-4. Cloudflare 정책 결정

Step 0에서 최소한 다음 결론은 고정한다.

- 정적 asset만 장기 캐시
- HTML은 장기 캐시 금지
- `/api/*` 캐시 금지
- `/proxy*`, `/hub-proxy/*` 캐시 금지
- 프록시 계층은 Cloudflare 최적화 대상이 아니라 “보존 대상”으로 봄

### Step 0-5. Worker 사용 원칙

Worker는 지금 바로 필수는 아니다.

원칙:

- 먼저 origin 서버와 Tunnel만으로 해결 가능한지 본다
- 부족하면 Worker/Cache Rules/서브도메인 분리를 붙인다

즉:

- Step 0에서는 Worker 설계까지는 안 감
- 단, “필요 시 나중에 붙인다”는 전제는 유지

## Step 0 완료 기준

다음이 만족되면 Step 0 완료다.

- [x] 포크 기준 remote 정리
- [x] `main` 기반 기능 브랜치 생성
- [x] 별도 worktree 생성
- [x] `pnpm check` baseline 통과
- [x] Cloudflare Tunnel 전제 경로 분리 원칙 확정
- [x] Worker는 후순위라는 운영 방침 확정

## Phase 0

Step 0이 끝났으므로 이제 실제 구현은 Phase 0부터 시작한다.

Phase 0 목표:

- 정적 리소스 전송량과 캐시 정책 정리
- Tunnel 위에서도 안전한 응답 헤더 설계
- Docker/Node 배포 구조를 장기 개조 가능한 형태로 정리

### Phase 0-1. `server/node/server.cjs`

우선 변경 대상:

- `compression` 미들웨어 추가
- 정적 파일 캐시 정책 분리
- HTML 응답 캐시 정책 분리
- `trust proxy` 활성화
- Tunnel 뒤 HTTP origin 운영을 위한 `RISU_ENABLE_HTTPS=false` 경로 마련
- 간단한 `/api/health` 헬스체크 추가

원칙:

- `/`에서 주입되는 HTML은 장기 캐시 금지
- `express.static`로 나가는 asset은 장기 캐시 가능
- API/프록시는 캐시 금지

### Phase 0-2. Docker

변경 대상:

- `Dockerfile`
- 필요 시 `docker-compose.yml`

목표:

- multi-stage build 정리
- runtime 이미지 최소화
- 향후 server patch와 static build를 반복 배포하기 쉬운 구조 확보
- pnpm 버전 고정으로 빌드 재현성 확보
- Tunnel 환경에 맞는 런타임 기본값 정리

### Phase 0-3. Cloudflare 검증

코드 수정 후 확인할 것:

- 정적 JS/CSS에 기대한 cache header가 붙는지
- HTML이 과캐시되지 않는지
- Tunnel 경유 응답에 compression이 살아있는지

## 후속 메모

Phase 0이 끝나면 다음 우선순위는 `Gateway/Proxy 안정화`다.

이유:

- RisuAI에서 제일 깨지기 쉬운 부분은 결국 프록시/SSE다
- Cloudflare Tunnel 위에서는 이 가치가 더 커진다

그래서 Bootstrap 단계의 다음 구현 축은 다음이다.

1. 정적 asset/cache 정리
2. 프록시 안정성 점검
3. 필요 시 Gateway 모드 설계

## 한 줄 결론

Step 0은 이미 끝났고, 지금부터의 실제 시작점은 이거다:

`Cloudflare Tunnel을 의식한 캐시/프록시 분리 정책을 기준으로 Phase 0을 구현한다.`
