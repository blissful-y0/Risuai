# EbookReader Kindle-Style Redesign

## Goal
EbookReader 플러그인의 디자인을 Kindle 스타일로 전면 개편. 기능 변경 없이 CSS/HTML만 수정.

## Design Principles
- **콘텐츠 퍼스트**: UI는 숨기고 본문만 보여준다
- **탭 투 쇼**: 중앙 탭으로 오버레이 컨트롤 ON/OFF
- **라이브러리 경험**: 판본 관리는 책표지 그리드로

## Reader View

### 기본 상태 (UI 숨김)
- 본문만 화면 가득 채움
- 하단 2px 진행바만 상시 표시 (muted, 반투명)
- 헤더/푸터 없음

### 탭 존
- 좌측 30%: 이전 페이지
- 중앙 40%: 오버레이 토글
- 우측 30%: 다음 페이지

### 오버레이 (중앙 탭 시)
- **상단**: backdrop-blur 반투명 바. ← 뒤로 | 제목 | 북마크
- **하단**: backdrop-blur 반투명 바. 페이지 슬라이더 + 액션(테마, 판본, 설정)
- 다시 중앙 탭하면 사라짐

### 본문 레이아웃
- 데스크톱: 2단 컬럼, 좌우 64px 패딩
- 모바일(≤768px): 1단, 좌우 32px 패딩
- 폰트: 테마 설정 따라감 (`--nv-body-font`)
- line-height: 1.85, text-align: justify, text-indent: 1em

### 기존 요소 매핑
- `.novel-header` → 상단 오버레이로 이동 (기본 숨김)
- `.novel-page-footer` → 하단 오버레이로 이동 (기본 숨김) + 상시 진행바 분리
- `.novel-page-btn` prev/next → 탭존으로 대체
- 테마 토글, 햄버거 메뉴 → 하단 오버레이 액션 버튼으로 통합

## Library View (판본 관리)

### 헤더
- ← 뒤로 | "판본 관리" | 전체 비우기 (조용한 텍스트 버튼)

### 현재 세션 Hero
- 캐릭터 포트레이트를 책표지로 사용 (`context.characterPortrait`)
- 포트레이트 없으면 플레이스홀더 (그라데이션 배경 + 한자 이니셜)
- 우측: 제목, 캐릭터명, 상태 배지, 메시지/문단 수, 갱신 시각

### 저장된 판본 그리드
- 모바일 3열, ≥480px 4열, ≥768px 5열
- 카드: 5:7 비율 표지 + 제목 + 서브텍스트
- 표지 = 캐릭터 포트레이트 (없으면 플레이스홀더)
- hover 시 우상단 삭제 버튼 (모바일: 길게 누르기 또는 항상 표시)
- 삭제 시 confirm 다이얼로그

### 데이터 소스
- 표지 이미지: `cacheIndex.entries[].characterPortrait` (신규 필드, 저장 시 추가)
- 기존 필드: title, characterName, updatedAt, messageCount, paragraphCount, cacheKey

## Design Tokens (CSS Variables)

기존 `--nv-*` 변수 체계 유지. 추가:
```
--nv-overlay-bg: rgba(var(--nv-bg-rgb), 0.95)
```

## Theme Support
- 5개 테마(light, dark, vintage, gray, green) 모두 대응
- 오버레이는 backdrop-filter: blur(20px) + 반투명 배경
- 라이브러리 뷰도 동일 테마 적용

## Scope
- CSS/HTML 구조 변경만
- JS 이벤트 바인딩은 기존 로직 재연결
- 캐시 저장 시 characterPortrait 필드 추가 (유일한 데이터 변경)
- 기존 기능(페이지 넘김, 테마 변경, 북마크, 캐시 CRUD) 100% 유지

## Mockup
- `/plugins/.mockup-ebook-redesign.html` 참조
