# NovelPageNav v2.1 -> v3 변경 정리


## 한 줄 요약

기존 v2 방식은 `메인 앱 DOM에 직접 붙어서 화면을 덮어쓰는 플러그인`이었고, v3 방식은 `sandbox iframe 안에서 자기 화면을 직접 렌더링하는 플러그인`이다.

즉, 바뀐 핵심은 단순 문법이 아니라 다음 3가지다.

1. 실행 위치가 바뀌었다.
2. 데이터 접근 방식이 바뀌었다.
3. UI 통합 방식이 바뀌었다.

## 왜 이런 변경이 생겼는가

공식 가이드 기준으로 v3의 목표는 `보안`과 `안정성`이다. 플러그인이 임의 코드 실행이 가능한 이상, 예전처럼 메인 페이지 전역과 DOM에 거의 직접 닿는 구조는 장기적으로 유지하기 어렵다. 그래서 v3는 다음 전제를 깐다.

- 플러그인은 sandbox iframe 안에서 실행된다.
- 메인 앱과의 데이터 교환은 구조화된 API 호출로만 한다.
- 메인 DOM은 꼭 필요할 때만 `getRootDocument()`로 제한적으로 만진다.
- 커스텀 UI는 메인 DOM에 억지 삽입하지 말고 iframe 안에서 그린다.


## 구조적으로 무엇이 달라졌는가

### 1. 실행 컨텍스트

v2:
- 메인 문서 컨텍스트에 붙는다.
- `window`, `document`, `localStorage` 성격의 전역 접근을 많이 전제로 둔다.
- 재실행 시 상태 공유도 `window._nv*` 전역에 매달아 처리한다.

v3:
- 플러그인 전용 iframe 안에서 실행된다.
- 메인 앱 전역을 직접 전제하지 않는다.
- 상태는 플러그인 내부 `readerState`에 둔다.


원리:
- 전역 충돌을 줄인다.
- 다른 플러그인이나 메인 앱 구조 변경의 영향을 덜 받는다.
- 동일 플러그인의 재실행/재등록 시 상태 누수를 줄인다.

### 2. API 접근 방식

v2:
- 사실상 일반 전역 함수/객체처럼 접근하는 감각이 강하다.
- 동기식 스타일이 많고, `document` 조작이 자연스럽다.

v3:
- 모든 핵심 API 진입점이 `risuai` 객체 아래로 모인다.
- 비동기 호출이 기본이다.

가이드 기준은 `migrationGuide.md:137`, `migrationGuide.md:138`, `migrationGuide.md:507`, `migrationGuide.md:622`다.

실제 구현에서도:
- 설정 읽기: `NovelPageNav_Edit.js:323`
- 설정 저장: `NovelPageNav_Edit.js:333`
- 현재 채팅 로드: `NovelPageNav_Edit.js:810`
- 컨테이너 열기: `NovelPageNav_Edit.js:839`

원리:
- 메인 앱과 플러그인 사이 경계를 명확히 만든다.
- 호출 실패를 `await` + `try/catch`로 다룰 수 있다.
- 브리지 계층을 통해 검증 가능한 동작만 허용한다.

### 3. DOM 접근 방식

v2:
- 메인 DOM 안의 요소를 직접 찾아서 컬럼, 스크롤, 버튼, 상태를 붙이는 방식이었다.
- UI가 본질적으로 `메인 앱 위에 덧씌운 커스텀 레이어`에 가까웠다.

v3:
- 커스텀 UI는 iframe 내부 `document`에 직접 렌더링한다.
- 메인 DOM 접근은 권장 경로가 아니다.

가이드 기준:
- `showContainer('fullscreen')`로 iframe UI를 노출: `migrationGuide.md:203`
- UI는 iframe 안에서 짜는 걸 권장: `migrationGuide.md:525`, `migrationGuide.md:602`
- 메인 DOM이 꼭 필요하면 `getRootDocument()`: `migrationGuide.md:223`, `migrationGuide.md:600`

실제 구현:
- 쉘 렌더링: `NovelPageNav_Edit.js:743`
- `document.body.innerHTML`로 iframe UI 구성: `NovelPageNav_Edit.js:745`
- 메인 DOM은 건드리지 않음

원리:
- 메인 앱 레이아웃이나 클래스명 변경에 덜 취약하다.
- 제한된 표면에서만 DOM 조작이 일어난다.
- UI를 플러그인 책임 영역 안으로 완전히 묶을 수 있다.

## NovelPageNav 기준 변경 포인트

### 1. 상태 관리: `window 공유 상태` -> `플러그인 세션 상태`

v2는 다음처럼 `window`에 상태를 매달았다.

- 페이지 정보: `NovelPageNav_Edit_legacy_2_1.js:15`
- 휠 락: `NovelPageNav_Edit_legacy_2_1.js:16`
- 초기화 여부: `NovelPageNav_Edit_legacy_2_1.js:17`
- 진행 중 애니메이션: `NovelPageNav_Edit_legacy_2_1.js:18`

v3는 `NovelPageNav_Edit.js:12`~`NovelPageNav_Edit.js:25`의 `readerState` 하나로 관리한다.

왜 바뀌었나:
- iframe 격리 구조에서는 메인 `window`에 기대는 설계 자체가 자연스럽지 않다.
- 상태 범위를 "리더 한 세션"으로 줄이는 편이 정리된다.

### 2. 데이터 소스: `DOM 스캔` -> `채팅 API 로드`

v2는 메인 화면에 이미 렌더된 결과를 기준으로 읽고 건드리는 성격이 강했다. 그래서 실제 소스와 화면 구조가 많이 묶여 있었다.

v3는 현재 컨텍스트를 API로 직접 읽는다.

- 캐릭터 인덱스: `NovelPageNav_Edit.js:812`
- 채팅 인덱스: `NovelPageNav_Edit.js:813`
- 캐릭터 데이터: `NovelPageNav_Edit.js:814`
- 채팅 데이터: `NovelPageNav_Edit.js:815`

왜 바뀌었나:
- 화면에 보이는 DOM은 결과물일 뿐 원본 데이터 계약이 아니다.
- 메인 테마/레이아웃이 바뀌어도 채팅 API만 유지되면 리더를 다시 그릴 수 있다.

### 3. UI 진입점: `비공식 삽입` -> `공식 등록`

가이드가 강조하는 변경 중 하나가 이 부분이다.

v2 계열에서는 설정 버튼이나 액션 버튼을 MutationObserver, `setInterval`, 직접 DOM 삽입으로 처리하는 패턴이 흔했다. 가이드 예시는 `migrationGuide.md:536`, `migrationGuide.md:568`에서 이걸 "old/hacky way"로 설명한다.

v3의 NovelPageNav는:
- 설정 메뉴 등록: `NovelPageNav_Edit.js:857`
- 채팅 액션 버튼 등록: `NovelPageNav_Edit.js:866`

왜 바뀌었나:
- 메인 UI 구조를 추측해서 붙이는 방식은 깨지기 쉽다.
- 공식 등록 API를 쓰면 앱 구조 변경에 덜 흔들린다.

### 4. 저장 방식: `localStorage 중심` -> `argument + pluginStorage 분리`

v2:
- 테마 저장: `NovelPageNav_Edit_legacy_2_1.js:211`
- 폰트 저장: `NovelPageNav_Edit_legacy_2_1.js:235`

이 방식은 디바이스 로컬 기준 저장 감각이 강하다.

v3:
- 기본 설정값 로드: `NovelPageNav_Edit.js:359`
- `getArgument`/`setArgument`: `NovelPageNav_Edit.js:323`, `NovelPageNav_Edit.js:333`
- `pluginStorage`: `NovelPageNav_Edit.js:341`, `NovelPageNav_Edit.js:351`

역할 분리는 이렇게 잡았다.

- `argument`
  - 사용자가 직접 바꾸는 대표 설정
  - 예: `theme`, `font`, `bookmark`
- `pluginStorage`
  - 세이브와 함께 가져가야 하는 부가 상태
  - 예: `customColors`, `customFontCss`, `readerLastOpenAt`

왜 바뀌었나:
- v3는 저장 의도를 구분해서 쓰는 편이 맞다.
- 가이드도 `pluginStorage`를 세이브 파일 단위 syncable storage로 설명한다: `migrationGuide.md:88`, `migrationGuide.md:646`

### 5. 렌더링 원리: `앱이 만든 결과를 재가공` -> `플러그인이 직접 렌더링`

v2는 메인 화면의 채팅 UI와 강하게 결합된 쪽이었다. 그래서 `.risu-chat`, 기존 마크업 구조, 메인 테마 레이어를 많이 전제했다.

v3는 읽은 채팅 데이터를 바탕으로 리더용 HTML을 새로 그린다.

- 메시지 필터링/문단화: `NovelPageNav_Edit.js:382`
- 본문 렌더링: `NovelPageNav_Edit.js:599`
- 리더 쉘 렌더링: `NovelPageNav_Edit.js:743`

왜 바뀌었나:
- 플러그인의 책임 범위를 분명히 한다.
- "보이는 결과를 훔쳐와 수정"하는 방식보다 "원본 데이터를 받아 전용 UI로 출력"하는 방식이 유지보수성이 높다.

### 6. 페이지네이션: 알고리즘은 유지, 의존 대상만 교체

페이지 계산과 이동 자체는 완전히 다른 개념이 된 건 아니다. 실제로 핵심 함수 구조는 비슷하다.

v2:
- 페이지 계산: `NovelPageNav_Edit_legacy_2_1.js:51`
- 스크롤 이동: `NovelPageNav_Edit_legacy_2_1.js:91`

v3:
- 페이지 계산: `NovelPageNav_Edit.js:462`
- 스크롤 이동: `NovelPageNav_Edit.js:474`

무엇이 유지됐나:
- 컬럼 기반 페이지 계산
- 좌우 이동 중심 내비게이션
- 모바일/데스크탑 분기

무엇이 달라졌나:
- 대상 요소가 메인 DOM이 아니라 iframe 내부 `.novel-content`
- 상태 출처가 `window WeakMap`이 아니라 `readerState`

즉, "기능"은 이어졌지만 "의존 계층"은 완전히 교체됐다.

### 7. 이벤트와 정리: `흩어진 정리` -> `명시적 cleanup`

v2는 재실행 정리를 위해 `NovelPageNav_Edit_legacy_2_1.js:6`의 `window._nvCleanup`에 기대는 구조였다.

v3는 이벤트 설치와 정리를 한 덩어리로 묶는다.

- 이벤트 설치: `NovelPageNav_Edit.js:612`
- cleanup 저장: `NovelPageNav_Edit.js:725`
- 닫기 처리: `NovelPageNav_Edit.js:785`

왜 바뀌었나:
- v3는 iframe lifecycle 안에서 리소스를 닫는 편이 자연스럽다.
- 가이드도 cleanup을 best practice로 요구한다: `migrationGuide.md:649`

### 8. 오류 처리: `조용한 실패`보다 `try/catch + fallback`

v3 가이드는 async 오류 처리를 명시적으로 권장한다: `migrationGuide.md:648`

그래서 현재 구현은 다음 경로를 전부 감싼다.

- argument 읽기 실패: `NovelPageNav_Edit.js:323`
- argument 저장 실패: `NovelPageNav_Edit.js:333`
- pluginStorage 읽기 실패: `NovelPageNav_Edit.js:341`
- pluginStorage 저장 실패: `NovelPageNav_Edit.js:351`
- 컨텍스트 로드 실패: `NovelPageNav_Edit.js:810`
- 전체 오픈 실패: `NovelPageNav_Edit.js:839`
- 부트스트랩 실패: `NovelPageNav_Edit.js:855`

원리:
- v3는 브리지 호출이므로 실패 지점이 더 명확하다.
- 실패를 숨기기보다, 화면 fallback과 로그를 남기는 편이 맞다.

## 바뀌지 않은 것

구현 원리가 달라졌어도, 사용자 경험 차원에서 유지하려고 한 부분도 있다.

- 소설형 2단 리더라는 기본 UX
- 모바일에서 1단 페이지 이동 감각
- 테마/폰트/북마크 토글
- 좌우 페이지 이동 버튼과 휠/터치 내비게이션

즉, `겉기능은 유지하고 구조를 교체`한 마이그레이션이라고 보는 편이 맞다.

## 왜 `getRootDocument()` 중심 이식으로 가지 않았는가

가이드상 메인 DOM 접근은 가능하다. 하지만 권장 경로는 아니다: `migrationGuide.md:600`

`NovelPageNav`는 원래 DOM 의존도가 매우 높았다. 이런 플러그인을 SafeDocument 기반으로만 옮기면 다음 문제가 생긴다.

- 메인 앱 클래스명/구조 변경에 계속 취약하다.
- SafeElement 제약 때문에 코드가 더 복잡해진다.
- UI와 데이터 경계가 여전히 흐리다.

그래서 이번 마이그레이션은 `메인 DOM 패치 이식`이 아니라 `iframe 리더 재구성`으로 감

## 실무적으로 기억할 기준

앞으로 비슷한 플러그인을 v3로 옮길 때는 아래 기준으로 보면 된다.

1. 메인 화면에 보이는 DOM을 읽지 말고, 가능한 한 원본 데이터를 API로 읽는다.
2. 커스텀 화면은 메인 DOM에 꽂지 말고 iframe 안에서 렌더링한다.
3. 사용자 설정은 `getArgument/setArgument`, 세이브 연동 상태는 `pluginStorage`로 분리한다.
4. 메인 DOM 접근은 정말 필요한 경우에만 `getRootDocument()`를 쓴다.
5. 모든 비동기 브리지 호출은 `try/catch`로 감싼다.
6. 이벤트 리스너와 타이머는 열기/닫기 lifecycle에 맞춰 정리한다.

## 결론

v2 -> v3 변경은 `문법 변경`보다 `책임 분리`에 가깝다.

- 메인 앱이 담당하던 화면 위에 플러그인이 덧칠하던 구조에서
- 플러그인이 자기 데이터 로드, 자기 렌더링, 자기 상태 관리, 자기 종료를 책임지는 구조로 바뀌었다.

이게 v3의 원리다. `더 불편하게 만든 API`가 아니라, `플러그인이 앱 내부 구현에 기생하지 않도록 경계를 다시 세운 API`라고 이해하면 된다.
