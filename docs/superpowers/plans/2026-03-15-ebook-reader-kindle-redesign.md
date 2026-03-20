# EbookReader Kindle-Style Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EbookReader 플러그인의 디자인을 Kindle 스타일(콘텐츠 퍼스트, 탭 투 쇼 오버레이, 책표지 라이브러리)로 전면 개편. 기능 100% 유지.

**Architecture:** 단일 파일(`EbookReader.js`) 내 CSS 템플릿 리터럴 + HTML 렌더링 함수를 순차적으로 교체. 이벤트 바인딩 로직은 새 DOM 구조에 맞게 재연결. 캐시 저장 시 `characterPortrait` 필드 추가.

**Tech Stack:** Vanilla JS, CSS (CSS Variables, backdrop-filter, CSS Grid), RisuAI Plugin API 3.0

**Spec:** `docs/superpowers/specs/2026-03-15-ebook-reader-kindle-redesign.md`
**Mockup:** `plugins/.mockup-ebook-redesign.html`

---

## Chunk 1: CSS 디자인 토큰 + 리더 본문 스타일

### Task 1: CSS 디자인 토큰 정의

**Files:**
- Modify: `plugins/EbookReader.js` — `ensureReaderStyle()` 함수 내 CSS 템플릿 (line ~240)

- [ ] **Step 1: 기존 `.novel-viewer` 루트에 디자인 토큰 변수 추가**

`.novel-viewer` 블록 내에 아래 변수들을 추가한다. 기존 `--nv-*` 변수 아래에 넣는다:
```css
--nv-overlay-bg: rgba(255, 255, 255, 0.95);
--nv-radius-sm: 4px;
--nv-radius-md: 8px;
--nv-radius-lg: 12px;
--nv-radius-full: 999px;
--nv-transition: 150ms ease;
--nv-ui-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

- [ ] **Step 2: 각 테마 THEME_VARS에 overlay-bg 추가**

`THEME_VARS` 객체의 각 테마에 `--nv-overlay-bg` 값 추가:
```js
light:   "--nv-overlay-bg": "rgba(255, 255, 255, 0.95)"
dark:    "--nv-overlay-bg": "rgba(28, 26, 24, 0.95)"
vintage: "--nv-overlay-bg": "rgba(240, 232, 216, 0.95)"
gray:    "--nv-overlay-bg": "rgba(79, 79, 79, 0.95)"
green:   "--nv-overlay-bg": "rgba(34, 64, 61, 0.95)"
```

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): add design tokens and overlay-bg theme variable"
```

### Task 2: 리더 본문 CSS 교체

**Files:**
- Modify: `plugins/EbookReader.js` — CSS 내 `.novel-header`, `.novel-body`, `.novel-content`, `.novel-page-footer` 스타일

- [ ] **Step 1: `.novel-header` 스타일을 오버레이 형태로 교체**

기존 `.novel-header` CSS를 제거하고 아래로 교체:
```css
.novel-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px 10px;
    background: var(--nv-overlay-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--nv-rule);
    z-index: 30;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
}

.novel-header.overlay-visible {
    opacity: 1;
    pointer-events: auto;
}
```

- [ ] **Step 2: `.novel-page-footer` 스타일을 오버레이 형태로 교체**

기존 `.novel-page-footer` CSS를 제거하고 아래로 교체:
```css
.novel-page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 14px);
    background: var(--nv-overlay-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--nv-rule);
    z-index: 30;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
}

.novel-page-footer.overlay-visible {
    opacity: 1;
    pointer-events: auto;
}
```

- [ ] **Step 3: 상시 진행바 CSS 추가**

새로운 클래스 추가:
```css
.nv-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--nv-rule);
    z-index: 5;
}

.nv-progress-fill {
    height: 100%;
    background: var(--nv-text-muted);
    opacity: 0.4;
    transition: width 0.3s ease;
}
```

- [ ] **Step 4: `.novel-body`를 전체 화면으로 변경**

`.novel-body` CSS 교체:
```css
.novel-body {
    position: absolute;
    inset: 0;
    overflow: hidden;
    padding: 0;
}
```

- [ ] **Step 5: `.novel-content` 패딩 조정**

`.novel-content` CSS에서 패딩을 본문 읽기에 적합하게 조정:
```css
.novel-content {
    width: 100%;
    height: 100%;
    column-count: 2;
    column-gap: 64px;
    text-align: justify;
    font-size: 16px;
    line-height: 1.85;
    color: var(--nv-text);
    font-family: var(--nv-body-font);
    overflow-x: scroll;
    overflow-y: hidden;
    padding: 48px 64px 56px;
    scrollbar-width: none;
}
```

- [ ] **Step 6: 모바일 미디어쿼리에서 본문 1단 + 좁은 패딩**

기존 `@media (max-width: 1024px)` 내 `.novel-body`, `.novel-content` 교체:
```css
.novel-content {
    column-count: 1;
    column-gap: 0;
    column-rule: none;
    font-size: 15px;
    line-height: 1.9;
    padding: 40px 28px 52px;
}
```

- [ ] **Step 7: 탭 존 CSS 추가**

새로운 클래스들:
```css
.nv-tap-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 10;
}

.nv-tap-prev {
    left: 0;
    width: 30%;
}

.nv-tap-next {
    right: 0;
    width: 30%;
}

.nv-tap-center {
    left: 30%;
    right: 30%;
    cursor: pointer;
}
```

- [ ] **Step 8: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): replace reader CSS with Kindle-style overlay layout"
```

### Task 3: 하단 오버레이 내부 스타일

**Files:**
- Modify: `plugins/EbookReader.js` — CSS

- [ ] **Step 1: 페이지 슬라이더 행 스타일**

기존 `.novel-page-progress`, `.novel-page-progress-slider`, `.novel-page-indicator` 교체:
```css
.nv-slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.novel-page-progress-slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--nv-rule);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    margin: 0;
}

.novel-page-progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--nv-text);
    border: 3px solid var(--nv-bg);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    cursor: pointer;
}

.novel-page-indicator {
    font-size: 12px;
    color: var(--nv-text-muted);
    min-width: 48px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: var(--nv-ui-font);
}
```

- [ ] **Step 2: 하단 액션 버튼 행 스타일**

```css
.nv-overlay-actions {
    display: flex;
    justify-content: center;
    gap: 4px;
}

.nv-overlay-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    background: none;
    color: var(--nv-text-muted);
    font-family: var(--nv-ui-font);
    font-size: 12px;
    line-height: 1.4;
    cursor: pointer;
    border-radius: var(--nv-radius-md);
    transition: background var(--nv-transition), color var(--nv-transition);
}

.nv-overlay-action:hover {
    background: var(--nv-controls-hover);
    color: var(--nv-text);
}

.nv-overlay-action svg {
    width: 16px;
    height: 16px;
}
```

- [ ] **Step 3: topbar 버튼 스타일 통합**

기존 `.nv-topbar-btn`, `.nv-more-btn` 교체:
```css
.nv-overlay-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: var(--nv-text);
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background var(--nv-transition);
    flex-shrink: 0;
}

.nv-overlay-btn:hover {
    background: var(--nv-controls-hover);
}

.nv-overlay-btn svg {
    width: 20px;
    height: 20px;
}
```

- [ ] **Step 4: 헤더 제목 스타일**

```css
.nv-overlay-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--nv-text);
    text-align: center;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 8px;
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}
```

- [ ] **Step 5: 모바일 대응**

미디어쿼리 내:
```css
.nv-overlay-action {
    padding: 12px 16px;
    font-size: 13px;
}

.nv-overlay-btn {
    width: 44px;
    height: 44px;
}
```

- [ ] **Step 6: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): add overlay controls and action button styles"
```

---

## Chunk 2: 리더 HTML 구조 + 이벤트 재연결

### Task 4: `renderReaderShell()` HTML 교체

**Files:**
- Modify: `plugins/EbookReader.js` — `renderReaderShell()` (line ~3867)

- [ ] **Step 1: 리더 셸 HTML 교체**

`document.body.innerHTML` 템플릿을 아래로 교체. 기존 bookmark-row(리본)는 그대로 유지:

```html
<div class="novel-viewer" data-theme="light">
    <!-- 오버레이 상단 -->
    <div class="novel-header">
        <button class="nv-overlay-btn" type="button" data-action="close-reader-label" aria-label="뒤로">
            ${getNavIcon("prev")}
        </button>
        <div class="nv-overlay-title">${getDisplayName(context)}</div>
        <button class="nv-overlay-btn" type="button" data-action="bookmark-placeholder" aria-label="북마크">
            ${getNavIcon("bookmark")}
        </button>
    </div>

    <!-- 북마크 리본 (기존 유지) -->
    <div class="bookmark-row">
        ${characterRibbon}
        ${personaRibbon}
    </div>

    <!-- 본문 -->
    <div class="novel-body">
        <div class="novel-content"></div>
    </div>

    <!-- 탭 존 -->
    <div class="nv-tap-zone nv-tap-prev" data-action="tap-prev"></div>
    <div class="nv-tap-zone nv-tap-center" data-action="tap-center"></div>
    <div class="nv-tap-zone nv-tap-next" data-action="tap-next"></div>

    <!-- 상시 진행바 -->
    <div class="nv-progress-bar">
        <div class="nv-progress-fill"></div>
    </div>

    <!-- 오버레이 하단 -->
    <div class="novel-page-footer">
        <div class="nv-slider-row">
            <input class="novel-page-progress-slider" type="range"
                   min="1" max="1" value="1" step="1"
                   data-action="page-progress" aria-label="페이지 이동" />
            <span class="novel-page-indicator">1 / 1</span>
        </div>
        <div class="nv-overlay-actions">
            <div data-slot="settings"></div>
            <button class="nv-overlay-action" type="button" data-action="open-cache-manager">
                ${getNavIcon("bookmark")} 판본
            </button>
            <button class="nv-overlay-action" type="button" data-action="open-bookmark-manager">
                책갈피
            </button>
        </div>
    </div>
</div>
```

주의: `data-slot="settings"` 는 기존 테마 토글이 마운트되는 곳이므로 그대로 유지.

- [ ] **Step 2: `.novel-page-progress` 래퍼 제거**

기존에 `<div class="novel-page-progress">` 래퍼가 있었는데, 새 구조에선 `.nv-slider-row`로 대체되므로 관련 CSS 참조를 정리.

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): replace reader shell HTML with Kindle overlay structure"
```

### Task 5: 오버레이 토글 + 이벤트 재연결

**Files:**
- Modify: `plugins/EbookReader.js` — `installReaderEvents()` (line ~3674)

- [ ] **Step 1: 오버레이 토글 함수 추가**

`installReaderEvents()` 위에 헬퍼 추가:
```js
function toggleReaderOverlay() {
  const header = document.querySelector(".novel-header");
  const footer = document.querySelector(".novel-page-footer");
  if (!header || !footer) return;
  const isVisible = header.classList.contains("overlay-visible");
  header.classList.toggle("overlay-visible", !isVisible);
  footer.classList.toggle("overlay-visible", !isVisible);
}

function hideReaderOverlay() {
  document.querySelector(".novel-header")?.classList.remove("overlay-visible");
  document.querySelector(".novel-page-footer")?.classList.remove("overlay-visible");
}
```

- [ ] **Step 2: 탭 존 이벤트 바인딩**

`installReaderEvents()` 내에서 탭존 요소를 쿼리하고 이벤트를 연결:
```js
const tapCenter = document.querySelector('[data-action="tap-center"]');
const tapPrev = document.querySelector('[data-action="tap-prev"]');
const tapNext = document.querySelector('[data-action="tap-next"]');

const onTapCenter = () => { toggleReaderOverlay(); };
const onTapPrev = () => { hideReaderOverlay(); onPrev(); };
const onTapNext = () => { hideReaderOverlay(); onNext(); };

tapCenter?.addEventListener("click", onTapCenter);
tapPrev?.addEventListener("click", onTapPrev);
tapNext?.addEventListener("click", onTapNext);
```

cleanup에도 추가:
```js
tapCenter?.removeEventListener("click", onTapCenter);
tapPrev?.removeEventListener("click", onTapPrev);
tapNext?.removeEventListener("click", onTapNext);
```

- [ ] **Step 3: 기존 prev/next 버튼 바인딩 제거**

기존 `prevButton`, `nextButton` 쿼리 + addEventListener/removeEventListener 라인 제거 (탭존으로 대체됨).

- [ ] **Step 4: 기존 more 메뉴 바인딩 제거**

`moreButton`, `ensureMoreMenu()`, `toggleMoreMenu()` 관련 바인딩 제거. 하단 오버레이에 직접 `data-action="open-cache-manager"`, `data-action="open-bookmark-manager"` 버튼이 있으므로 직접 바인딩:

```js
const openBookmarkBtn = document.querySelector('[data-action="open-bookmark-manager"]');
const openCacheBtn = document.querySelector('[data-action="open-cache-manager"]');

openBookmarkBtn?.addEventListener("click", onOpenBookmarkManager);
openCacheBtn?.addEventListener("click", onOpenCacheManager);
```

- [ ] **Step 5: 상시 진행바 업데이트**

`updateIndicator()` 또는 `updatePageInfo()` 에서 진행바 width 업데이트:
```js
const progressFill = document.querySelector(".nv-progress-fill");
if (progressFill) {
  const pct = readerState.totalPages > 1
    ? ((readerState.currentPage) / (readerState.totalPages - 1)) * 100
    : 0;
  progressFill.style.width = `${pct}%`;
}
```

- [ ] **Step 6: 오버레이 외부 탭 시 닫기**

`onDocumentClick` 수정: 오버레이 바깥(본문 영역) 클릭 시 오버레이 닫기 → 이미 탭존이 처리하므로 별도 처리 불필요. 기존 `closeMoreMenu()` 호출만 제거.

- [ ] **Step 7: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): wire overlay toggle and tap zone events"
```

### Task 6: 기존 푸터 그리드 구조 제거 + 정리

**Files:**
- Modify: `plugins/EbookReader.js` — CSS + HTML

- [ ] **Step 1: 사용하지 않는 CSS 클래스 제거**

아래 CSS 블록들 제거:
- `.novel-page-btn` (탭존으로 대체)
- `.novel-page-progress` (`.nv-slider-row`로 대체)
- `.nv-more-wrap`, `.nv-more-menu`, `.nv-action-btn` (오버레이 액션으로 대체)
- `.nv-cache-header-spacer`
- 이전 grid-template-columns 5칸 레이아웃 관련

- [ ] **Step 2: `ensureMoreMenu()`, `toggleMoreMenu()`, `closeMoreMenu()` 함수는 유지**

판본 관리/북마크 열기 기능은 직접 바인딩으로 이동했지만, 다른 곳에서 `closeMoreMenu()` 호출이 있을 수 있으므로 빈 함수로 남겨둔다:
```js
function closeMoreMenu() {}
function toggleMoreMenu() {}
function ensureMoreMenu() { return null; }
```

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "refactor(ebook): remove legacy footer grid and more-menu CSS"
```

---

## Chunk 3: 라이브러리(판본 관리) 뷰 리디자인

### Task 7: 캐시 저장 시 characterPortrait 필드 추가

**Files:**
- Modify: `plugins/EbookReader.js` — `saveReaderEditionCache()` (line ~2018)

- [ ] **Step 1: cacheEntry에 characterPortrait 저장**

`saveReaderEditionCache()` 내에서 index entry에 portrait 추가:
```js
const nextEntries = index.entries.filter((entry) => entry.cacheKey !== cacheKey);
nextEntries.unshift({
    cacheKey,
    title: getDisplayName(context),
    characterName: context.character?.name || "Character",
    characterPortrait: context.characterPortrait || null,  // 신규
    updatedAt: cacheEntry.updatedAt,
    messageCount: cacheEntry.messageCount,
    paragraphCount: cacheEntry.paragraphCount,
    lastMessageHash: cacheEntry.lastMessageHash,
});
```

- [ ] **Step 2: `buildCurrentSessionCacheSummary()`에도 portrait 추가**

```js
return {
    title: getDisplayName(context),
    characterName: context.character?.name || "Character",
    characterPortrait: context.characterPortrait || null,  // 신규
    // ... 나머지 그대로
};
```

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): save characterPortrait in cache index entries"
```

### Task 8: 라이브러리 뷰 CSS

**Files:**
- Modify: `plugins/EbookReader.js` — CSS

- [ ] **Step 1: 기존 캐시 관리 CSS 전체 교체**

`/* ── hero card */`부터 `/* ── 빈 상태 */`까지의 캐시 관련 CSS를 모두 제거하고 아래로 교체:

```css
/* ── 라이브러리 헤더 ── */
.nv-library-header {
    display: flex;
    align-items: center;
    padding: 16px 20px 12px;
    gap: 12px;
}

.nv-library-title {
    font-size: 18px;
    font-weight: 700;
    flex: 1;
    color: var(--nv-header-name);
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}

.nv-library-clear {
    border: none;
    background: none;
    color: var(--nv-text-muted);
    font-family: var(--nv-ui-font);
    font-size: 12px;
    line-height: 1.4;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: var(--nv-radius-md);
    transition: all var(--nv-transition);
}
.nv-library-clear:hover {
    background: var(--nv-controls-hover);
    color: var(--nv-text);
}

/* ── 현재 세션 hero ── */
.nv-library-current-label {
    font-size: 11px;
    color: var(--nv-text-muted);
    margin-bottom: 12px;
    font-weight: 500;
    font-family: var(--nv-ui-font);
    line-height: 1.4;
    padding: 0 20px;
}

.nv-library-hero {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    padding: 0 20px 24px;
}

.nv-library-cover {
    width: 100px;
    height: 140px;
    border-radius: var(--nv-radius-sm);
    background: linear-gradient(145deg,
        color-mix(in srgb, var(--nv-highlight-bg) 60%, var(--nv-bg)),
        color-mix(in srgb, var(--nv-highlight-bg) 90%, var(--nv-bg)));
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 2px 4px 12px var(--nv-shadow);
}
.nv-library-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.nv-library-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--nv-text-muted);
    opacity: 0.3;
    font-family: var(--nv-body-font);
}

.nv-library-hero-info {
    flex: 1;
    min-width: 0;
    padding-top: 4px;
    font-family: var(--nv-ui-font);
}
.nv-library-hero-title {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--nv-header-name);
    margin-bottom: 4px;
}
.nv-library-hero-author {
    font-size: 13px;
    color: var(--nv-text-muted);
    margin-bottom: 12px;
    line-height: 1.4;
}
.nv-library-hero-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: var(--nv-text-muted);
    line-height: 1.4;
}
.nv-library-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: var(--nv-radius-sm);
    font-size: 11px;
    font-weight: 600;
    background: color-mix(in srgb, var(--nv-highlight-bg) 50%, var(--nv-bg));
    color: var(--nv-text);
    width: fit-content;
}

/* ── 판본 그리드 ── */
.nv-library-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 12px;
    border-top: 1px solid var(--nv-rule);
}
.nv-library-section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--nv-text);
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}
.nv-library-section-count {
    font-size: 12px;
    color: var(--nv-text-muted);
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}

.nv-library-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 0 20px 32px;
}

@media (min-width: 480px) {
    .nv-library-grid { grid-template-columns: repeat(4, 1fr); }
}

.nv-library-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
}

.nv-library-item-cover {
    aspect-ratio: 5 / 7;
    border-radius: var(--nv-radius-sm);
    overflow: hidden;
    background: linear-gradient(145deg,
        color-mix(in srgb, var(--nv-highlight-bg) 60%, var(--nv-bg)),
        color-mix(in srgb, var(--nv-highlight-bg) 90%, var(--nv-bg)));
    box-shadow: 1px 2px 8px var(--nv-shadow);
    position: relative;
    transition: transform var(--nv-transition), box-shadow var(--nv-transition);
}
.nv-library-item-cover:hover {
    transform: translateY(-2px);
    box-shadow: 2px 4px 16px var(--nv-shadow);
}
.nv-library-item-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.nv-library-item-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.5);
    color: white;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}
.nv-library-item:hover .nv-library-item-delete {
    display: inline-flex;
}

.nv-library-item-title {
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--nv-text);
    font-family: var(--nv-ui-font);
}
.nv-library-item-sub {
    font-size: 10px;
    color: var(--nv-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: -4px;
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}

.nv-library-empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--nv-text-muted);
    font-size: 13px;
    font-family: var(--nv-ui-font);
    line-height: 1.4;
}
```

- [ ] **Step 2: 모바일 미디어쿼리에 라이브러리 대응 추가**

```css
@media (max-width: 1024px) {
    .nv-library-item-delete {
        display: inline-flex;
    }
    .nv-library-hero {
        gap: 16px;
    }
    .nv-library-cover {
        width: 80px;
        height: 112px;
    }
}
```

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): add library view CSS with cover grid layout"
```

### Task 9: 라이브러리 HTML 렌더링 함수 교체

**Files:**
- Modify: `plugins/EbookReader.js` — `renderCurrentCacheCard()`, `renderCacheRow()`, `ensureCacheManagerModal()`, `openCacheManagerModal()`

- [ ] **Step 1: 커버 렌더 헬퍼 추가**

```js
function renderCoverImage(portrait, fallbackChar) {
  if (portrait) {
    return `<img src="${escapeHtml(portrait)}" alt="" loading="lazy">`;
  }
  const initial = fallbackChar || "本";
  return `<div class="nv-library-cover-placeholder">${escapeHtml(initial)}</div>`;
}
```

- [ ] **Step 2: `renderCurrentCacheCard()` 교체**

```js
function renderCurrentCacheCard(entry) {
  const stateText = entry.hasCache ? "판본 준비됨" : "저장된 판본 없음";
  const updatedText = entry.updatedAt ? formatCacheTimestamp(entry.updatedAt) : "아직 생성되지 않음";
  const coverChar = (entry.characterName || "本").charAt(0);
  return `
    <div class="nv-library-hero" data-cache-key="${escapeHtml(entry.cacheKey)}">
        <div class="nv-library-cover">
            ${renderCoverImage(entry.characterPortrait, coverChar)}
        </div>
        <div class="nv-library-hero-info">
            <div class="nv-library-hero-title">${escapeHtml(entry.title || "제목 없는 세션")}</div>
            <div class="nv-library-hero-author">${escapeHtml(entry.characterName || "캐릭터")}</div>
            <div class="nv-library-hero-meta">
                <span class="nv-library-badge">${stateText}</span>
                <span>메시지 ${entry.messageCount || 0} · 문단 ${entry.paragraphCount || 0}</span>
                <span>${updatedText}</span>
            </div>
        </div>
    </div>`;
}
```

- [ ] **Step 3: `renderCacheRow()` → 그리드 아이템으로 교체**

```js
function renderCacheRow(entry, isCurrent = false) {
  const coverChar = (entry.characterName || "本").charAt(0);
  const subText = `${escapeHtml(entry.characterName || "캐릭터")} · 메시지 ${entry.messageCount || 0}`;
  return `
    <div class="nv-library-item" data-cache-key="${escapeHtml(entry.cacheKey)}">
        <div class="nv-library-item-cover">
            ${renderCoverImage(entry.characterPortrait, coverChar)}
            <button class="nv-library-item-delete" type="button"
                    data-action="delete-cache" data-cache-key="${escapeHtml(entry.cacheKey)}"
                    aria-label="삭제">×</button>
        </div>
        <div class="nv-library-item-title">${escapeHtml(entry.title || "제목 없는 세션")}</div>
        <div class="nv-library-item-sub">${subText}</div>
    </div>`;
}
```

- [ ] **Step 4: `ensureCacheManagerModal()` HTML 교체**

모달 innerHTML을 라이브러리 레이아웃으로 교체:
```html
<div class="nv-cache-manager-shell">
    <div class="nv-library-header">
        <button class="nv-overlay-btn" type="button" data-action="close-cache-manager" aria-label="뒤로">
            ${getNavIcon("prev")}
        </button>
        <div class="nv-library-title">판본 관리</div>
        <button class="nv-library-clear" type="button" data-action="clear-all-caches">전체 비우기</button>
    </div>
    <div class="nv-library-current-label">읽고 있는 세션</div>
    <div class="nv-cache-current"></div>
    <div class="nv-library-section-header">
        <div class="nv-library-section-title">저장된 판본</div>
        <div class="nv-library-section-count"></div>
    </div>
    <div class="nv-cache-list nv-library-grid"></div>
</div>
```

- [ ] **Step 5: `openCacheManagerModal()` 업데이트**

카운트 표시 추가:
```js
const countEl = overlay.querySelector(".nv-library-section-count");
if (countEl) {
  countEl.textContent = index.entries.length > 0 ? `${index.entries.length}권` : "";
}
```

- [ ] **Step 6: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): replace cache manager with library cover grid view"
```

---

## Chunk 4: 정리 + Focus 상태 + 테스트

### Task 10: Focus 상태 + 접근성 개선

**Files:**
- Modify: `plugins/EbookReader.js` — CSS

- [ ] **Step 1: 전역 focus-visible 스타일 추가**

```css
.novel-viewer button:focus-visible,
.novel-viewer input:focus-visible {
    outline: 2px solid var(--nv-text);
    outline-offset: 2px;
}
```

- [ ] **Step 2: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "feat(ebook): add focus-visible accessibility styles"
```

### Task 11: 레거시 CSS/HTML 정리

**Files:**
- Modify: `plugins/EbookReader.js`

- [ ] **Step 1: 사용하지 않는 CSS 블록 최종 정리**

아래 클래스들이 더 이상 참조되지 않으면 제거:
- `.nv-cache-manager-screen` → `.nv-cache-manager-screen` 유지 (모달 래퍼)
- `.nv-cache-manager-shell` → 유지 (스크롤 컨테이너)
- `.nv-modal-header`, `.nv-modal-title`, `.nv-modal-body` → 제거 (라이브러리 헤더로 대체)
- `.nv-cache-current-card`, `.nv-cache-card-*`, `.nv-cache-chip`, `.nv-cache-stats`, `.nv-cache-stat*` → 제거
- `.nv-cache-row`, `.nv-cache-row-*` → 제거
- `.nv-cache-section-title`, `.nv-cache-list-header` → 제거
- `.nv-cache-delete`, `.nv-cache-clear-all`, `.nv-cache-back` → 제거
- `.nv-cache-empty` → `.nv-library-empty`로 대체

- [ ] **Step 2: `.to-name`, `.to-label` CSS 제거**

헤더가 오버레이로 바뀌면서 `.nv-overlay-title`로 대체됨.

- [ ] **Step 3: Commit**
```bash
git add plugins/EbookReader.js
git commit -m "refactor(ebook): remove legacy CSS classes replaced by Kindle design"
```

### Task 12: 수동 기능 테스트

- [ ] **Step 1: 리더 열기 테스트**
  - 플러그인 로드 → 본문만 보이는지 확인
  - 하단 2px 진행바 보이는지 확인
  - 헤더/푸터 숨겨져 있는지 확인

- [ ] **Step 2: 오버레이 토글 테스트**
  - 화면 중앙 탭 → 상하 오버레이 나타나는지
  - 다시 탭 → 사라지는지
  - 오버레이 내 슬라이더 조작 → 페이지 이동
  - 테마/판본/책갈피 버튼 동작

- [ ] **Step 3: 페이지 넘김 테스트**
  - 좌측 30% 탭 → 이전 페이지
  - 우측 30% 탭 → 다음 페이지
  - 키보드 좌우 화살표
  - 스와이프 (모바일)
  - 마우스 휠

- [ ] **Step 4: 판본 관리 테스트**
  - 라이브러리 열기 → 현재 세션 hero 표시
  - 저장된 판본 그리드 표시
  - 캐릭터 포트레이트 있으면 표지에 이미지
  - 없으면 이니셜 플레이스홀더
  - 삭제 버튼 → confirm → 삭제
  - 전체 비우기 → confirm → 전부 삭제

- [ ] **Step 5: 5개 테마 전환 테스트**
  - light/dark/vintage/gray/green 각각에서 오버레이 색상 확인
  - backdrop-filter blur 동작 확인

- [ ] **Step 6: 모바일(≤1024px) 테스트**
  - 1단 레이아웃
  - 터치 타겟 크기
  - safe-area 패딩
  - 라이브러리 3열 그리드

- [ ] **Step 7: 최종 Commit**
```bash
git add plugins/EbookReader.js
git commit -m "chore(ebook): complete Kindle-style redesign"
```
