//@api 2.1
//@name 📖NovelPageNav_Edit_Fix
//@version 6.7.9

// ── 재실행 정리 ──
if (window._nvCleanup) window._nvCleanup();

// ── 모바일 판별 ──
function isMobile() {
    var w = document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth || 9999;
    return w <= 768;
}

// ── 상태 (window에 올려서 재실행 간 공유) ──
if (!window._nvPageState)     window._nvPageState     = new WeakMap();
if (!window._nvWheelLocks)    window._nvWheelLocks    = new WeakMap();
if (!window._nvInitedSet)     window._nvInitedSet     = new WeakSet();
if (!window._nvNavigatingMap) window._nvNavigatingMap = new WeakMap(); // ★ 추가
const pageState     = window._nvPageState;
const wheelLocks    = window._nvWheelLocks;
const initedSet     = window._nvInitedSet;
const navigatingMap = window._nvNavigatingMap;

function getState(el) {
    if (!pageState.has(el)) pageState.set(el, { currentPage: 0, totalPages: 1 });
    return pageState.get(el);
}

// ── 컬럼 설정 수정 ──
function setupColumns(c) {
    if (!c || c.clientWidth === 0 || c.clientWidth < 100) return false;
    
    // 🌟 Math.floor 제거: 소수점 단위의 정확한 실제 렌더링 너비 측정
    const exactWidth = c.getBoundingClientRect().width; 
    
    if (isMobile()) {
        c.style.setProperty('column-count', 'auto', 'important');
        c.style.setProperty('column-width', exactWidth + 'px', 'important');
        c.style.setProperty('column-gap', '30px', 'important');
    } else {
        const colWidth = (exactWidth - 60) / 2;
        if (colWidth <= 0) return false;
        c.style.setProperty('column-count', 'auto', 'important');
        c.style.setProperty('column-width', colWidth + 'px', 'important');
        c.style.setProperty('column-gap', '60px', 'important');
    }
    return true;
}

function getSpreadWidth(c) {
    // 🌟 브라우저가 계산한 정확한 소수점 값을 반환하여 이동 오차 방지
    const gap = parseFloat(getComputedStyle(c).columnGap) || (isMobile() ? 30 : 60);
    return c.getBoundingClientRect().width + gap;
}

function updatePageInfo(c) {
    if (!c) return;
    const sw = getSpreadWidth(c);
    if (sw <= 0) return;
    const st = getState(c);
    st.totalPages = Math.max(1, Math.ceil(c.scrollWidth / sw));
    if (st.currentPage >= st.totalPages) st.currentPage = st.totalPages - 1;
    if (st.currentPage < 0) st.currentPage = 0;
    updateIndicator(c);
}

function goNext(c) {
    if (!c) return;
    updatePageInfo(c);
    const st = getState(c);
    if (st.currentPage < st.totalPages - 1) { st.currentPage++; scrollToPage(c); }
}

function goPrev(c) {
    if (!c) return;
    updatePageInfo(c);
    const st = getState(c);
    if (st.currentPage > 0) { st.currentPage--; scrollToPage(c); }
}

function goFirst(c) {
    if (!c) return;
    updatePageInfo(c);
    const st = getState(c);
    if (st.currentPage !== 0) { st.currentPage = 0; scrollToPage(c); }
}

function goLast(c) {
    if (!c) return;
    updatePageInfo(c);
    const st = getState(c);
    if (st.currentPage !== st.totalPages - 1) { st.currentPage = st.totalPages - 1; scrollToPage(c); }
}

// PC — smooth / 모바일 — rAF easeInOut 150ms
function scrollToPage(c) {
    const sw         = getSpreadWidth(c);
    const st         = getState(c);
    let   targetLeft = Math.min(st.currentPage * sw, c.scrollWidth - c.clientWidth);
    // 🌟 모바일 DPR 반올림 오차 보정 — 페이지 > 0에서 1px 왼쪽으로 당김
    // if (isMobile() && st.currentPage > 0) targetLeft = Math.max(0, targetLeft - 3);

    // 진행 중인 애니메이션 취소
    const prev = navigatingMap.get(c);
    if (prev) { cancelAnimationFrame(prev); clearTimeout(prev); }

    const startLeft = c.scrollLeft;
    const dist      = targetLeft - startLeft;

    if (Math.abs(dist) < 1) {
        navigatingMap.set(c, null);
        updateIndicator(c);
        return;
    }

    // ── PC: 브라우저 기본 smooth ──
    if (!isMobile()) {
        c.scrollTo({ left: targetLeft, behavior: 'smooth' });
        // smooth 완료 시점 추적 불가 → 500ms 후 플래그 해제
        const tid = setTimeout(() => { navigatingMap.set(c, null); updateIndicator(c); }, 500);
        navigatingMap.set(c, tid);
        updateIndicator(c);
        return;
    }

    // ── 모바일: rAF easeInOut 150ms ──
    const duration  = 150;
    const startTime = performance.now();

    function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        c.scrollLeft = startLeft + dist * easeInOut(t);
        if (t < 1) {
            navigatingMap.set(c, requestAnimationFrame(step));
        } else {
            c.scrollLeft = targetLeft;
            navigatingMap.set(c, null);
            updateIndicator(c);
        }
    }

    navigatingMap.set(c, requestAnimationFrame(step));
    updateIndicator(c);
}

function updateIndicator(c) {
    const viewer = c.closest('.novel-viewer');
    if (!viewer) return;
    const el = viewer.querySelector('.novel-page-indicator');
    if (!el) return;
    const st = getState(c);
    el.textContent = st.totalPages > 1 ? `${st.currentPage + 1} / ${st.totalPages}` : '';
}

function handleWheel(c, e) {
    // 🌟 편집 모드에서는 휠을 가로채지 않고 기본 세로 스크롤 허용
    if (c.querySelector('textarea') || c.querySelector('[contenteditable="true"]')) return;
    e.preventDefault();
    if (wheelLocks.get(c)) return;
    wheelLocks.set(c, true);
    if (e.deltaY > 0 || e.deltaX > 0) goNext(c);
    else goPrev(c);
    setTimeout(() => wheelLocks.set(c, false), 400);
}

// ── 테마 ──
const THEMES = [
    { id: 'light',   label: '기본',   dot: '#ffffff', border: '#ccc' },
    { id: 'dark',    label: '다크',   dot: '#1c1a18', border: '#5a5040' },
    { id: 'vintage', label: '빈티지', dot: '#f0e8d8', border: '#c8b898' },
    { id: 'gray',    label: '그레이',   dot: '#4f4f4f', border: '#707070' },
    { id: 'green',   label: '그린',   dot: '#22403d', border: '#4a7a72' },
];

const THEME_VARS = {
    light: {
        '--nv-bg': '#ffffff', '--nv-text': '#000000', '--nv-text-muted': '#999999',
        '--nv-header': '#333333', '--nv-header-name': '#000000',
        '--nv-highlight-bg': '#e8e8e8', '--nv-highlight-text': '#000000',
        '--nv-rule': '#f4f4f4', '--nv-shadow': 'rgba(0,0,0,0.15)',
        '--nv-controls-bg': '#ffffff', '--nv-controls-hover': 'rgba(0,0,0,0.05)',
    },
    dark: {
        '--nv-bg': '#1c1a18', '--nv-text': '#bfb49a', '--nv-text-muted': '#7a7060',
        '--nv-header': '#968a72', '--nv-header-name': '#cfbfa0',
        '--nv-highlight-bg': '#2c2824', '--nv-highlight-text': '#ddd0b4',
        '--nv-rule': '#2e2a26', '--nv-shadow': 'rgba(0,0,0,0.6)',
        '--nv-controls-bg': '#181614', '--nv-controls-hover': 'rgba(190,180,150,0.1)',
    },
    vintage: {
        '--nv-bg': '#f0e8d8', '--nv-text': '#5c4430', '--nv-text-muted': '#9e8060',
        '--nv-header': '#7a5c40', '--nv-header-name': '#5c4430',
        '--nv-highlight-bg': '#e2d6c0', '--nv-highlight-text': '#4a3420',
        '--nv-rule': '#d8ccb4', '--nv-shadow': 'rgba(58,48,40,0.14)',
        '--nv-controls-bg': '#e8dcc8', '--nv-controls-hover': 'rgba(58,48,40,0.08)',
    },
    gray: {
        '--nv-bg': '#4f4f4f', '--nv-text': '#d4d4d4', '--nv-text-muted': '#909090',
        '--nv-header': '#bbbbbb', '--nv-header-name': '#d4d4d4',
        '--nv-highlight-bg': '#5a5a5a', '--nv-highlight-text': '#e8e8e8',
        '--nv-rule': '#444444', '--nv-shadow': 'rgba(0,0,0,0.5)',
        '--nv-controls-bg': '#444444', '--nv-controls-hover': 'rgba(255,255,255,0.07)',
    },
    green: {
        '--nv-bg': '#22403d', '--nv-text': '#a8c8c0', '--nv-text-muted': '#4e8a82',
        '--nv-header': '#6aaa9e', '--nv-header-name': '#bcd4d0',
        '--nv-highlight-bg': '#2a4e4a', '--nv-highlight-text': '#c8e0dc',
        '--nv-rule': '#1c3634', '--nv-shadow': 'rgba(0,0,0,0.55)',
        '--nv-controls-bg': '#1a3230', '--nv-controls-hover': 'rgba(160,210,200,0.08)',
    },
};

function getStoredTheme() {
    try { return localStorage.getItem('novel-viewer-theme') || 'light'; } catch { return 'light'; }
}
function setStoredTheme(id) {
    try { localStorage.setItem('novel-viewer-theme', id); } catch { }
}

// 🌟 ── 폰트 ──
const FONTS = [
    // 명조/세리프
    { id: 'BookkMyungjo',       label: '부크크명조',   family: "'BookkMyungjo', serif" },
    { id: 'ChosunIlboMyungjo',  label: '조선일보명조', family: "'ChosunIlboMyungjo', serif" },
    { id: 'JoseonGulim',        label: '조선굴림',     family: "'JoseonGulim', serif" },
    // 고딕/산세리프
    { id: 'Pretendard',         label: '프리텐다드',   family: "'Pretendard', sans-serif" },
    { id: 'Escoredream',        label: '에스코어드림', family: "'Escoredream', sans-serif" },
    // 손글씨/디스플레이
    { id: 'OngleipKonkon',      label: '온글잎 콘콘',     family: "'OngleipKonkon', sans-serif" },
    { id: 'PeopleFirstTtobaks', label: '피플퍼스트또박', family: "'PeopleFirstTtobaks', sans-serif" },
];
function getStoredFont() {
    try { return localStorage.getItem('novel-viewer-font') || 'BookkMyungjo'; } catch { return 'BookkMyungjo'; }
}
function setStoredFont(id) {
    try { localStorage.setItem('novel-viewer-font', id); } catch { }
}
function applyFontAll(fontId) {
    const font = FONTS.find(f => f.id === fontId) || FONTS[0];
    let styleEl = document.getElementById('_nv-font-override');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = '_nv-font-override';
    }
    // 🌟 높은 specificity + head 맨 끝 배치
    styleEl.textContent = `
        html body .risu-chat *,
        html body .risu-chat .novel-viewer *,
        html body .risu-chat .novel-content *,
        html body .novel-page-indicator,
        html body .nv-theme-option,
        html body .nv-font-option { font-family: ${font.family} !important; }`;
    document.head.appendChild(styleEl);
    setStoredFont(fontId);
    // 프리셋 선택 시 커스텀 폰트 CSS 완전 제거
    if (fontId !== '_custom') {
        let customStyleEl = document.getElementById('_nv-font-custom');
        if (customStyleEl) customStyleEl.remove();
    }
    document.querySelectorAll('.nv-font-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.font === fontId);
    });
}

// 🌟 ── 커스텀 폰트 CSS ──
function getStoredFontCSS() {
    try { return localStorage.getItem('novel-viewer-font-css') || ''; } catch { return ''; }
}
function setStoredFontCSS(css) {
    try { localStorage.setItem('novel-viewer-font-css', css); } catch { }
}
function applyCustomFontCSS(css) {
    let styleEl = document.getElementById('_nv-font-custom');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = '_nv-font-custom';
    }

    let finalCSS = css;
    // 🌟 @font-face만 있고 font-family 적용 규칙이 없으면 자동 추가
    if (css.trim() && /@font-face/i.test(css)) {
        const hasApplyRule = /\.risu-chat|\.novel-content|\.novel-viewer/i.test(css);
        if (!hasApplyRule) {
            // @font-face에서 font-family 이름 추출
            const match = css.match(/font-family\s*:\s*['"]([^'"]+)['"]/);
            if (match) {
                const fontName = match[1];
                finalCSS = css + `\nhtml body .risu-chat *,\nhtml body .risu-chat .novel-viewer *,\nhtml body .risu-chat .novel-content * { font-family: '${fontName}', sans-serif !important; }`;
            }
        }
    }

    styleEl.textContent = finalCSS;
    // 항상 head 맨 끝에 배치해서 다른 모든 스타일보다 우선
    document.head.appendChild(styleEl);
    setStoredFontCSS(css);  // 원본 CSS만 저장 (자동 추가분은 저장 안 함)
    if (css.trim()) {
        // 프리셋 오버라이드 스타일을 완전히 제거
        let overrideEl = document.getElementById('_nv-font-override');
        if (overrideEl) overrideEl.remove();
        setStoredFont('_custom');
        document.querySelectorAll('.nv-font-option').forEach(opt => {
            opt.classList.toggle('active', false);
        });
    }
}

// 🌟 ── 북마크 토글 ──
function getStoredBookmark() {
    try { return localStorage.getItem('novel-viewer-bookmark') !== 'off'; } catch { return true; }
}
function setStoredBookmark(show) {
    try { localStorage.setItem('novel-viewer-bookmark', show ? 'on' : 'off'); } catch { }
}
function applyBookmarkAll(show) {
    let styleEl = document.getElementById('_nv-bookmark-toggle');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = '_nv-bookmark-toggle';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = show ? '' : '.bookmark-container { display: none !important; }';
    setStoredBookmark(show);
    document.querySelectorAll('.nv-bookmark-switch').forEach(sw => {
        sw.classList.toggle('on', show);
    });
}
// ── 커스텀 테마 개별 변수 키 목록 ──
const CUSTOM_FIELDS = [
    { key: 'bg',          label: '배경',      var: '--nv-bg',           default: '#2a2a2a' },
    { key: 'text',        label: '본문',      var: '--nv-text',         default: '#d4d4d4' },
    { key: 'muted',       label: '강조 글씨', var: '--nv-text-muted',   default: '#888888' },
    { key: 'header',      label: '헤더',      var: '--nv-header',       default: '#aaaaaa' },
    { key: 'rule',        label: '구분선',    var: '--nv-rule',         default: '#3a3a3a' },
    { key: 'hlbg',        label: '강조 배경', var: '--nv-highlight-bg', default: '#383838' },
];

function getCustomColors() {
    try {
        const s = localStorage.getItem('novel-viewer-custom-colors');
        return s ? JSON.parse(s) : {};
    } catch { return {}; }
}
function setCustomColors(obj) {
    try { localStorage.setItem('novel-viewer-custom-colors', JSON.stringify(obj)); } catch { }
}
function getPresets() {
    try {
        const s = localStorage.getItem('novel-viewer-presets');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}
function savePreset(name, colors) {
    const list = getPresets();
    const existing = list.findIndex(p => p.name === name);
    if (existing >= 0) list[existing] = { name, colors };
    else list.push({ name, colors });
    try { localStorage.setItem('novel-viewer-presets', JSON.stringify(list)); } catch { }
}
function deletePreset(name) {
    const list = getPresets().filter(p => p.name !== name);
    try { localStorage.setItem('novel-viewer-presets', JSON.stringify(list)); } catch { }
}
function buildCustomVars() {
    const saved = getCustomColors();
    const vars = {};
    CUSTOM_FIELDS.forEach(f => {
        vars[f.var] = saved[f.key] || f.default;
    });
    // 파생 변수 (본문색과 동일하게)
    vars['--nv-header-name']    = vars['--nv-text'];
    vars['--nv-highlight-text'] = vars['--nv-text'];
    vars['--nv-shadow']         = 'rgba(0,0,0,0.5)';
    vars['--nv-controls-bg']    = vars['--nv-bg'];
    vars['--nv-controls-hover'] = 'rgba(128,128,128,0.12)';
    return vars;
}

function applyThemeAll(themeId) {
    const vars = themeId === 'custom'
        ? buildCustomVars()
        : (THEME_VARS[themeId] || THEME_VARS['light']);

    const css = `.novel-viewer { ${Object.entries(vars).map(([k, v]) => `${k}: ${v} !important;`).join(' ')} }`;
    let styleEl = document.getElementById('_nv-theme-vars');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = '_nv-theme-vars';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    setStoredTheme(themeId);
    document.querySelectorAll('.nv-theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === themeId);
    });
    // 커스텀 편집 버튼 표시 동기화
    syncEditBtn(themeId);
    // 커스텀 dot 배경색 동기화
    if (themeId === 'custom') syncCustomDot();
}

function syncCustomDot() {
    const saved = getCustomColors();
    const bgColor = saved['bg'] || '#2a2a2a';
    document.querySelectorAll('.nv-custom-dot').forEach(d => {
        d.style.background = bgColor;
        d.style.borderColor = bgColor;
    });
}
function syncEditBtn(themeId) {
    document.querySelectorAll('.nv-custom-edit-btn').forEach(b => {
        b.classList.toggle('visible', themeId === 'custom');
    });
}

// ── 스타일 주입 ──
function ensureStyles() {
    if (document.getElementById('_nv-btn-style')) return;
    const s = document.createElement('style');
    s.id = '_nv-btn-style';
    s.textContent = `
        .novel-page-btn {
            background: none !important; border: none !important; cursor: pointer !important;
            color: var(--nv-text-muted, #999) !important; padding: 5px !important; margin: 0 5px !important;
            display: flex !important; align-items: center !important;
            transition: color 0.2s, background 0.2s !important; border-radius: 4px !important;
        }
        .novel-page-btn:hover { color: var(--nv-text, #333) !important; background: var(--nv-controls-hover, rgba(0,0,0,0.05)) !important; }
        .novel-page-btn svg { width: 22px !important; height: 22px !important; }
        .novel-page-indicator {
            font-family: 'BookkMyungjo', serif !important; font-size: 12px !important;
            color: var(--nv-text-muted, #999) !important; display: flex !important;
            align-items: center !important; user-select: none !important; margin: 0 8px !important;
        }
        .novel-page-nav-mobile {
            position: absolute !important; top: 8px !important; right: 12px !important;
            display: flex !important; align-items: center !important; gap: 2px !important; z-index: 15 !important;
            background: color-mix(in srgb, var(--nv-bg, #fff) 85%, transparent) !important;
            backdrop-filter: blur(6px) !important; -webkit-backdrop-filter: blur(6px) !important;
            border-radius: 20px !important; padding: 4px 8px !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
        }
        .novel-page-nav-mobile .novel-page-btn svg { width: 18px !important; height: 18px !important; }
        .novel-page-nav-mobile .novel-page-indicator { font-size: 11px !important; margin: 0 4px !important; }
        .nv-theme-wrap { position: relative !important; display: flex !important; align-items: center !important; }
        .nv-theme-btn {
            background: none !important; border: none !important; cursor: pointer !important;
            color: var(--nv-text-muted, #999) !important; padding: 4px !important; margin: 0 2px !important;
            display: flex !important; align-items: center !important; border-radius: 4px !important; transition: color 0.2s !important;
        }
        .nv-theme-btn:hover { color: var(--nv-text, #333) !important; }
        .nv-theme-btn svg { width: 16px !important; height: 16px !important; }
        .nv-theme-dropdown {
            display: none; position: absolute !important; top: calc(100% + 6px) !important; right: 0 !important;
            background: var(--nv-bg, #fff) !important; border-radius: 12px !important; padding: 6px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; z-index: 100 !important; min-width: 160px !important;
            max-height: 60vh !important; overflow-y: auto !important; scrollbar-width: thin !important;
        }
        .nv-theme-dropdown.open { display: block !important; }
        .nv-theme-option {
            display: flex !important; align-items: center !important; gap: 8px !important;
            padding: 7px 12px !important; border: none !important; background: none !important;
            cursor: pointer !important; border-radius: 8px !important; width: 100% !important;
            font-family: 'BookkMyungjo', serif !important; font-size: 12px !important;
            color: var(--nv-text, #333) !important; transition: background 0.15s !important; white-space: nowrap !important;
        }
        .nv-theme-option:hover { background: var(--nv-controls-hover, rgba(0,0,0,0.05)) !important; }
        .nv-theme-option.active { font-weight: 700 !important; }
        .nv-theme-dot { width: 14px !important; height: 14px !important; border-radius: 50% !important; flex-shrink: 0 !important; border: 1.5px solid !important; }
        /* 작은따옴표 안 텍스트 — 색+볼드만, 배경/여백 없음 */
        .novel-viewer .novel-content .nv-sq {
            color: var(--nv-highlight-text, var(--nv-text, inherit)) !important;
            background: var(--nv-highlight-bg, transparent) !important;
            font-weight: bold !important;
            font-style: normal !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
        }
        .nv-custom-edit-btn {
            display: none; background: none !important; border: none !important;
            cursor: pointer !important; padding: 2px 4px !important; margin-left: auto !important;
            border-radius: 50% !important; color: var(--nv-text-muted,#999) !important;
            transition: background 0.15s, color 0.15s !important; align-items: center !important;
        }
        .nv-custom-edit-btn.visible { display: flex !important; }
        .nv-custom-edit-btn:hover { background: var(--nv-controls-hover,rgba(0,0,0,0.08)) !important; color: var(--nv-text,#333) !important; }
        .nv-custom-edit-btn svg { width: 13px !important; height: 13px !important; }
        /* ── 색상 선택 오버레이 패널 ── */
        .nv-picker-overlay {
            display: none; position: fixed !important; inset: 0 !important;
            z-index: 9999 !important; align-items: center !important; justify-content: center !important;
            background: rgba(0,0,0,0.35) !important; backdrop-filter: blur(3px) !important;
        }
        .nv-picker-overlay.open { display: flex !important; }
        .nv-picker-box {
            background: #1e1e1e !important; border-radius: 24px !important;
            padding: 20px !important; width: 280px !important;
            box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;
            display: flex !important; flex-direction: column !important; gap: 14px !important;
        }
        .nv-picker-header {
            display: flex !important; align-items: center !important; gap: 8px !important;
        }
        .nv-picker-title {
            font-family: 'BookkMyungjo', serif !important; font-size: 13px !important;
            color: #ccc !important; flex: 1 !important;
        }
        .nv-picker-close {
            background: rgba(255,255,255,0.08) !important; border: none !important;
            border-radius: 50% !important; width: 26px !important; height: 26px !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            cursor: pointer !important; color: #aaa !important; font-size: 14px !important;
            transition: background 0.15s !important;
        }
        .nv-picker-close:hover { background: rgba(255,255,255,0.15) !important; }
        /* 색상 그리드 */
        .nv-picker-grid {
            display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important;
        }
        .nv-picker-field {
            display: flex !important; flex-direction: column !important;
            align-items: center !important; gap: 6px !important; cursor: pointer !important;
        }
        .nv-picker-circle {
            width: 48px !important; height: 48px !important; border-radius: 50% !important;
            border: 3px solid rgba(255,255,255,0.15) !important;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4) !important;
            transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s !important;
            cursor: pointer !important; position: relative !important;
        }
        .nv-picker-circle:hover { transform: scale(1.1) !important; border-color: rgba(255,255,255,0.4) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.5) !important; }
        .nv-picker-circle.editing { border-color: #fff !important; transform: scale(1.08) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.25), 0 6px 16px rgba(0,0,0,0.5) !important; }
        .nv-picker-field-label {
            font-family: 'BookkMyungjo', serif !important; font-size: 10px !important;
            color: #888 !important; text-align: center !important; white-space: nowrap !important;
        }
        /* SV 그라디언트 박스 */
        .nv-sv-box {
            width: 100% !important; height: 140px !important; border-radius: 14px !important;
            position: relative !important; overflow: hidden !important; cursor: crosshair !important;
            display: none; flex-shrink: 0 !important;
        }
        .nv-sv-box.visible { display: block !important; }
        .nv-sv-white { position: absolute !important; inset: 0 !important; background: linear-gradient(to right, #fff, transparent) !important; }
        .nv-sv-black { position: absolute !important; inset: 0 !important; background: linear-gradient(to bottom, transparent, #000) !important; }
        .nv-sv-cursor {
            position: absolute !important; width: 16px !important; height: 16px !important;
            border-radius: 50% !important; border: 2.5px solid #fff !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.6) !important;
            transform: translate(-50%, -50%) !important; pointer-events: none !important;
        }
        /* 슬라이더 행 */
        .nv-sliders { display: none; gap: 10px !important; align-items: center !important; }
        .nv-sliders.visible { display: flex !important; }
        .nv-preview-circle {
            width: 32px !important; height: 32px !important; border-radius: 50% !important;
            flex-shrink: 0 !important; border: 2px solid rgba(255,255,255,0.2) !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
        }
        .nv-sliders-col { display: flex !important; flex-direction: column !important; gap: 8px !important; flex: 1 !important; }
        .nv-hue-slider, .nv-alpha-slider {
            -webkit-appearance: none !important; appearance: none !important;
            width: 100% !important; height: 12px !important; border-radius: 99px !important;
            outline: none !important; border: none !important; cursor: pointer !important;
        }
        .nv-hue-slider {
            background: linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00) !important;
        }
        .nv-hue-slider::-webkit-slider-thumb {
            -webkit-appearance: none !important; width: 18px !important; height: 18px !important;
            border-radius: 50% !important; background: #fff !important;
            border: 2px solid rgba(0,0,0,0.3) !important; box-shadow: 0 1px 4px rgba(0,0,0,0.4) !important;
            cursor: pointer !important;
        }
        /* hex 입력 */
        .nv-hex-row { display: none; align-items: center !important; gap: 8px !important; }
        .nv-hex-row.visible { display: flex !important; }
        .nv-hex-input {
            flex: 1 !important; background: rgba(255,255,255,0.08) !important;
            border: 1.5px solid rgba(255,255,255,0.12) !important; border-radius: 10px !important;
            color: #ddd !important; font-family: monospace !important; font-size: 13px !important;
            padding: 6px 10px !important; outline: none !important; text-align: center !important;
            transition: border-color 0.15s !important;
        }
        .nv-hex-input:focus { border-color: rgba(255,255,255,0.35) !important; }
        /* 🌟 ── 드롭다운 구분선 ── */
        .nv-dropdown-divider {
            height: 1px !important; background: var(--nv-rule, #eee) !important;
            margin: 6px 8px !important; border: none !important;
        }
        /* 🌟 ── 섹션 라벨 ── */
        .nv-section-label {
            font-family: 'BookkMyungjo', serif !important; font-size: 10px !important;
            color: var(--nv-text-muted, #999) !important; padding: 4px 12px 2px !important;
            user-select: none !important;
        }
        /* 🌟 ── 폰트 옵션 ── */
        .nv-font-option {
            display: flex !important; align-items: center !important; gap: 8px !important;
            padding: 6px 12px !important; border: none !important; background: none !important;
            cursor: pointer !important; border-radius: 8px !important; width: 100% !important;
            font-size: 12px !important; color: var(--nv-text, #333) !important;
            transition: background 0.15s !important; white-space: nowrap !important;
        }
        .nv-font-option:hover { background: var(--nv-controls-hover, rgba(0,0,0,0.05)) !important; }
        .nv-font-option.active { font-weight: 700 !important; }
        .nv-font-check {
            width: 14px !important; height: 14px !important; flex-shrink: 0 !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            color: var(--nv-text-muted, #999) !important; font-size: 11px !important;
        }
        .nv-font-option.active .nv-font-check { color: var(--nv-text, #333) !important; }
        /* 🌟 ── 북마크 토글 행 ── */
        .nv-bookmark-row {
            display: flex !important; align-items: center !important; gap: 8px !important;
            padding: 6px 12px !important; cursor: pointer !important; border-radius: 8px !important;
            border: none !important; background: none !important; width: 100% !important;
            transition: background 0.15s !important;
        }
        .nv-bookmark-row:hover { background: var(--nv-controls-hover, rgba(0,0,0,0.05)) !important; }
        .nv-bookmark-label {
            font-family: 'BookkMyungjo', serif !important; font-size: 12px !important;
            color: var(--nv-text, #333) !important; flex: 1 !important; text-align: left !important;
        }
        .nv-bookmark-switch {
            width: 34px !important; height: 18px !important; border-radius: 99px !important;
            background: var(--nv-rule, #ddd) !important; position: relative !important;
            transition: background 0.2s !important; flex-shrink: 0 !important;
        }
        .nv-bookmark-switch::after {
            content: '' !important; position: absolute !important; top: 2px !important; left: 2px !important;
            width: 14px !important; height: 14px !important; border-radius: 50% !important;
            background: var(--nv-bg, #fff) !important; transition: transform 0.2s !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
        }
        .nv-bookmark-switch.on { background: var(--nv-text-muted, #999) !important; }
        .nv-bookmark-switch.on::after { transform: translateX(16px) !important; }
        /* 🌟 ── 커스텀 폰트 CSS 입력 ── */
        .nv-font-custom-row {
            padding: 4px 8px 6px !important;
        }
        .nv-font-custom-toggle {
            display: flex !important; align-items: center !important; gap: 6px !important;
            background: none !important; border: none !important; cursor: pointer !important;
            padding: 4px 4px !important; width: 100% !important; border-radius: 6px !important;
            transition: background 0.15s !important;
        }
        .nv-font-custom-toggle:hover { background: var(--nv-controls-hover, rgba(0,0,0,0.05)) !important; }
        .nv-font-custom-toggle-label {
            font-size: 11px !important; color: var(--nv-text-muted, #999) !important;
            flex: 1 !important; text-align: left !important;
        }
        .nv-font-custom-toggle-arrow {
            font-size: 10px !important; color: var(--nv-text-muted, #999) !important;
            transition: transform 0.2s !important;
        }
        .nv-font-custom-toggle-arrow.open { transform: rotate(180deg) !important; }
        .nv-font-custom-area {
            display: none; margin-top: 6px !important;
        }
        .nv-font-custom-area.open { display: block !important; }
        .nv-font-custom-textarea {
            width: 100% !important; min-height: 80px !important; max-height: 160px !important;
            resize: vertical !important; background: var(--nv-highlight-bg, #f0f0f0) !important;
            color: var(--nv-text, #333) !important; border: 1.5px solid var(--nv-rule, #ddd) !important;
            border-radius: 8px !important; padding: 8px !important; font-family: monospace !important;
            font-size: 11px !important; line-height: 1.5 !important; box-sizing: border-box !important;
            outline: none !important; transition: border-color 0.15s !important;
        }
        .nv-font-custom-textarea:focus { border-color: var(--nv-text-muted, #999) !important; }
        .nv-font-custom-textarea::placeholder { color: var(--nv-text-muted, #999) !important; opacity: 0.6 !important; }
        .nv-font-custom-btns {
            display: flex !important; gap: 6px !important; margin-top: 6px !important; justify-content: flex-end !important;
        }
        .nv-font-custom-btn {
            background: var(--nv-highlight-bg, #eee) !important; border: none !important;
            border-radius: 6px !important; padding: 4px 12px !important; cursor: pointer !important;
            font-size: 11px !important; color: var(--nv-text, #333) !important;
            transition: background 0.15s !important;
        }
        .nv-font-custom-btn:hover { background: var(--nv-controls-hover, rgba(0,0,0,0.1)) !important; }
        .nv-font-custom-btn.primary {
            background: var(--nv-text-muted, #999) !important; color: var(--nv-bg, #fff) !important;
        }
        .nv-font-custom-btn.primary:hover { opacity: 0.85 !important; }

/* 삽화 모듈 팝오버 메뉴 호환성 패치 */
.lb-xnai-menu:popover-open,
.x-risu-lb-xnai-menu:popover-open {
    position: fixed !important;
    position-area: none !important; /* 🌟 엉뚱한 곳으로 날아가는 앵커 추적 기능 해제 */
    position-try: none !important;
    inset: auto !important;
    top: 50% !important;          /* 🌟 화면 세로 정중앙 */
    left: 50% !important;         /* 🌟 화면 가로 정중앙 */
    transform: translate(-50%, -50%) !important; /* 🌟 완벽한 중앙 정렬을 위한 보정 */
    margin: 0 !important;
    z-index: 2147483647 !important; /* 🌟 무조건 최상단 노출 */
}

    `;
    document.head.appendChild(s);
}

// ── UI 생성 ──
function createBtn(direction, contentEl) {
    const btn = document.createElement('button');
    btn.className = 'novel-page-btn';
    const actions = { prev: goPrev, next: goNext, first: goFirst, last: goLast };
    btn.addEventListener('click', () => actions[direction](contentEl));
    const icons = {
        first: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`,
        prev:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
        next:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
        last:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>`,
    };
    btn.innerHTML = icons[direction];
    return btn;
}

function createIndicator() {
    const span = document.createElement('span');
    span.className = 'novel-page-indicator';
    return span;
}

function createThemeToggle() {
    const wrap = document.createElement('div');
    wrap.className = 'nv-theme-wrap';

    const btn = document.createElement('button');
    btn.className = 'nv-theme-btn';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'nv-theme-dropdown';

    THEMES.forEach(t => {
        const opt = document.createElement('button');
        opt.className = 'nv-theme-option' + (t.id === getStoredTheme() ? ' active' : '');
        opt.dataset.theme = t.id;
        opt.innerHTML = `<span class="nv-theme-dot" style="background:${t.dot};border-color:${t.border}"></span>${t.label}`;
        const selectTheme = (e) => {
            e.preventDefault();
            e.stopPropagation();
            applyThemeAll(t.id);
            dropdown.classList.remove('open');
        };
        opt.addEventListener('mousedown', selectTheme);
        opt.addEventListener('touchstart', selectTheme, { passive: false });
        dropdown.appendChild(opt);
    });

    // ── 커스텀 테마 행 ──
    const _initSaved = getCustomColors();
    const _initBg = _initSaved['bg'] || '#2a2a2a';
    const isCustomActive = getStoredTheme() === 'custom';

    const customOpt = document.createElement('button');
    customOpt.className = 'nv-theme-option' + (isCustomActive ? ' active' : '');
    customOpt.dataset.theme = 'custom';
    customOpt.style.cssText = 'display:flex !important; align-items:center !important; gap:8px !important; width:100% !important;';

    const customDot = document.createElement('span');
    customDot.className = 'nv-theme-dot nv-custom-dot';
    customDot.style.background = _initBg;
    customDot.style.borderColor = _initBg;

    const customLbl = document.createElement('span');
    customLbl.style.cssText = 'flex:1 !important; text-align:left !important;';
    customLbl.textContent = '커스텀';

    // 편집 버튼 (연필 아이콘) — 커스텀 선택 시에만 표시
    const editBtn = document.createElement('button');
    editBtn.className = 'nv-custom-edit-btn' + (isCustomActive ? ' visible' : '');
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    customOpt.appendChild(customDot);
    customOpt.appendChild(customLbl);
    customOpt.appendChild(editBtn);

    // 커스텀 행 클릭 → 테마 적용 + 드롭다운 닫기
    const selectCustom = (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyThemeAll('custom');
        dropdown.classList.remove('open');
    };
    customOpt.addEventListener('mousedown', selectCustom);
    customOpt.addEventListener('touchstart', selectCustom, { passive: false });

    // ── 커스텀 컬러 오버레이 피커 ──
    // 한 번만 생성 (전역)
    if (!window._nvPickerOverlay) {
        // HSV ↔ HEX 변환
        window._nvHsvToHex = function(h, s, v) {
            s /= 100; v /= 100;
            const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
            const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
            return '#' + toHex(f(5)) + toHex(f(3)) + toHex(f(1));
        };
        window._nvHexToHsv = function(hex) {
            let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
            const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
            let h = 0;
            if (d) { h = max===r ? ((g-b)/d)%6 : max===g ? (b-r)/d+2 : (r-g)/d+4; h = Math.round(h*60); if(h<0)h+=360; }
            return { h, s: max ? Math.round(d/max*100) : 0, v: Math.round(max*100) };
        };

        const ov = document.createElement('div');
        ov.className = 'nv-picker-overlay';
        ov.id = '_nv-picker-overlay';

        const box = document.createElement('div');
        box.className = 'nv-picker-box';

        // 헤더
        const hdr = document.createElement('div');
        hdr.className = 'nv-picker-header';
        const titleEl = document.createElement('div');
        titleEl.className = 'nv-picker-title';
        titleEl.textContent = '색상 선택';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'nv-picker-close';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => ov.classList.remove('open'));
        hdr.appendChild(titleEl);
        hdr.appendChild(closeBtn);

        // 색상 그리드
        const grid = document.createElement('div');
        grid.className = 'nv-picker-grid';
        grid.id = '_nv-picker-grid';

        // SV 박스
        const svBox = document.createElement('div');
        svBox.className = 'nv-sv-box';
        svBox.id = '_nv-sv-box';
        const svWhite = document.createElement('div'); svWhite.className = 'nv-sv-white';
        const svBlack = document.createElement('div'); svBlack.className = 'nv-sv-black';
        const svCursor = document.createElement('div'); svCursor.className = 'nv-sv-cursor';
        svBox.appendChild(svWhite); svBox.appendChild(svBlack); svBox.appendChild(svCursor);

        // 슬라이더 행
        const slidersRow = document.createElement('div');
        slidersRow.className = 'nv-sliders';
        slidersRow.id = '_nv-sliders';
        const previewCircle = document.createElement('div');
        previewCircle.className = 'nv-preview-circle';
        const slidersCol = document.createElement('div');
        slidersCol.className = 'nv-sliders-col';
        const hueSlider = document.createElement('input');
        hueSlider.type = 'range'; hueSlider.className = 'nv-hue-slider'; hueSlider.min = 0; hueSlider.max = 360; hueSlider.value = 0;
        slidersCol.appendChild(hueSlider);
        slidersRow.appendChild(previewCircle);
        slidersRow.appendChild(slidersCol);

        // hex 입력
        const hexRow = document.createElement('div');
        hexRow.className = 'nv-hex-row';
        hexRow.id = '_nv-hex-row';
        const hexInput = document.createElement('input');
        hexInput.className = 'nv-hex-input'; hexInput.maxLength = 7; hexInput.placeholder = '#000000';
        hexRow.appendChild(hexInput);

        // ── 프리셋 영역 ──
        const presetSection = document.createElement('div');
        presetSection.id = '_nv-preset-section';
        presetSection.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;display:flex;flex-direction:column;gap:8px;';

        const presetTopRow = document.createElement('div');
        presetTopRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const presetLabel = document.createElement('span');
        presetLabel.style.cssText = 'font-family:BookkMyungjo,serif;font-size:11px;color:#888;flex:1;';
        presetLabel.textContent = '프리셋';
        const presetSaveBtn = document.createElement('button');
        presetSaveBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:4px 10px;color:#ccc;font-size:11px;font-family:BookkMyungjo,serif;cursor:pointer;transition:background 0.15s;';
        presetSaveBtn.textContent = '+ 저장';
        presetSaveBtn.addEventListener('mouseenter', () => presetSaveBtn.style.background = 'rgba(255,255,255,0.2)');
        presetSaveBtn.addEventListener('mouseleave', () => presetSaveBtn.style.background = 'rgba(255,255,255,0.1)');
        presetSaveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = prompt('프리셋 이름을 입력하세요:');
            if (!name) return;
            savePreset(name.trim(), getCustomColors());
            renderPresets();
        });
        presetTopRow.appendChild(presetLabel);
        presetTopRow.appendChild(presetSaveBtn);

        const presetList = document.createElement('div');
        presetList.id = '_nv-preset-list';
        presetList.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';

        function renderPresets() {
            presetList.innerHTML = '';
            getPresets().forEach(p => {
                const chip = document.createElement('div');
                chip.style.cssText = 'display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.07);border-radius:20px;padding:3px 10px 3px 6px;cursor:pointer;transition:background 0.15s;';

                // 배경색 미니 dot
                const dot = document.createElement('span');
                dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${p.colors.bg||'#2a2a2a'};flex-shrink:0;border:1px solid rgba(255,255,255,0.15);`;

                const chipLabel = document.createElement('span');
                chipLabel.style.cssText = 'font-family:BookkMyungjo,serif;font-size:11px;color:#ccc;';
                chipLabel.textContent = p.name;

                const delBtn = document.createElement('span');
                delBtn.style.cssText = 'color:#666;font-size:10px;margin-left:2px;cursor:pointer;line-height:1;';
                delBtn.textContent = '✕';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePreset(p.name);
                    renderPresets();
                });

                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setCustomColors(p.colors);
                    applyThemeAll('custom');
                    // 그리드 원형 색 갱신
                    const saved = getCustomColors();
                    document.querySelectorAll('#_nv-picker-grid .nv-picker-circle').forEach((el, i) => {
                        el.style.background = saved[CUSTOM_FIELDS[i].key] || CUSTOM_FIELDS[i].default;
                    });
                    syncCustomDot();
                });
                chip.addEventListener('mouseenter', () => chip.style.background = 'rgba(255,255,255,0.14)');
                chip.addEventListener('mouseleave', () => chip.style.background = 'rgba(255,255,255,0.07)');

                chip.appendChild(dot);
                chip.appendChild(chipLabel);
                chip.appendChild(delBtn);
                presetList.appendChild(chip);
            });
        }
        window._nvRenderPresets = renderPresets;

        presetSection.appendChild(presetTopRow);
        presetSection.appendChild(presetList);

        box.appendChild(hdr);
        box.appendChild(grid);
        box.appendChild(svBox);
        box.appendChild(slidersRow);
        box.appendChild(hexRow);
        box.appendChild(presetSection);
        ov.appendChild(box);
        document.body.appendChild(ov);

        // 오버레이 배경 클릭 시 닫기
        ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });

        window._nvPickerOverlay = ov;
        window._nvPickerState = { h: 0, s: 0, v: 0, onUpdate: null, activeCircle: null };

        function updateFromHsv(h, s, v, skipHex) {
            const state = window._nvPickerState;
            state.h = h; state.s = s; state.v = v;
            const hex = window._nvHsvToHex(h, s, v);
            const hueHex = window._nvHsvToHex(h, 100, 100);
            svBox.style.background = hueHex;
            svCursor.style.left = s + '%';
            svCursor.style.top = (100 - v) + '%';
            svCursor.style.background = hex;
            hueSlider.value = h;
            previewCircle.style.background = hex;
            if (!skipHex) hexInput.value = hex;
            if (state.activeCircle) state.activeCircle.style.background = hex;
            if (state.onUpdate) state.onUpdate(hex);
        }
        window._nvUpdateFromHsv = updateFromHsv;

        // SV 드래그
        function svPointer(e) {
            const rect = svBox.getBoundingClientRect();
            const cx = (e.touches ? e.touches[0].clientX : e.clientX);
            const cy = (e.touches ? e.touches[0].clientY : e.clientY);
            const s = Math.max(0, Math.min(100, (cx - rect.left) / rect.width * 100));
            const v = Math.max(0, Math.min(100, 100 - (cy - rect.top) / rect.height * 100));
            updateFromHsv(window._nvPickerState.h, s, v, false);
        }
        let svDragging = false;
        svBox.addEventListener('mousedown', e => { svDragging = true; svPointer(e); });
        document.addEventListener('mousemove', e => { if (svDragging) svPointer(e); });
        document.addEventListener('mouseup', () => svDragging = false);
        svBox.addEventListener('touchstart', e => { e.preventDefault(); svPointer(e); }, { passive: false });
        svBox.addEventListener('touchmove', e => { e.preventDefault(); svPointer(e); }, { passive: false });

        // 색조 슬라이더
        hueSlider.addEventListener('input', () => {
            const st = window._nvPickerState;
            updateFromHsv(parseInt(hueSlider.value), st.s, st.v, false);
        });

        // hex 입력
        hexInput.addEventListener('input', () => {
            const val = hexInput.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                const hsv = window._nvHexToHsv(val);
                updateFromHsv(hsv.h, hsv.s, hsv.v, true);
            }
        });
        hexInput.addEventListener('keydown', e => e.stopPropagation());
        hexInput.addEventListener('mousedown', e => e.stopPropagation());
        hexInput.addEventListener('click', e => e.stopPropagation());
    }

    // 그리드에 필드 원형 채우기
    const pickerGrid = document.getElementById('_nv-picker-grid');
    const svBoxEl = document.getElementById('_nv-sv-box');
    const slidersEl = document.getElementById('_nv-sliders');
    const hexRowEl = document.getElementById('_nv-hex-row');
    const circleEls = {}; // key → circle DOM

    pickerGrid.innerHTML = '';
    CUSTOM_FIELDS.forEach(field => {
        const pField = document.createElement('div');
        pField.className = 'nv-picker-field';

        const pCircle = document.createElement('div');
        pCircle.className = 'nv-picker-circle';
        const cColor = (_initSaved[field.key] || field.default);
        pCircle.style.background = cColor;
        circleEls[field.key] = pCircle;

        const pLabel = document.createElement('div');
        pLabel.className = 'nv-picker-field-label';
        pLabel.textContent = field.label;

        const openPicker = (e) => {
            e.stopPropagation();
            // 이전 active 해제
            document.querySelectorAll('.nv-picker-circle.editing').forEach(c => c.classList.remove('editing'));
            pCircle.classList.add('editing');

            const st = window._nvPickerState;
            st.activeCircle = pCircle;
            st.onUpdate = (hex) => {
                const colors = getCustomColors();
                colors[field.key] = hex;
                setCustomColors(colors);
                applyThemeAll('custom');
                if (field.key === 'bg') syncCustomDot();
            };
            const initHex = getCustomColors()[field.key] || field.default;
            const hsv = window._nvHexToHsv(initHex);
            svBoxEl.classList.add('visible');
            slidersEl.classList.add('visible');
            hexRowEl.classList.add('visible');
            window._nvUpdateFromHsv(hsv.h, hsv.s, hsv.v, false);
        };
        pField.addEventListener('mousedown', openPicker);
        pField.addEventListener('touchstart', openPicker, { passive: false });

        pField.appendChild(pCircle);
        pField.appendChild(pLabel);
        pickerGrid.appendChild(pField);
    });

    // 편집 버튼 → 오버레이 열기
    const openColorPanel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.remove('open');
        const ov = window._nvPickerOverlay;
        // circleEls 최신 색으로 동기화
        const saved = getCustomColors();
        CUSTOM_FIELDS.forEach(f => {
            if (circleEls[f.key]) circleEls[f.key].style.background = saved[f.key] || f.default;
        });
        // SV/슬라이더 처음엔 숨김
        svBoxEl.classList.remove('visible');
        slidersEl.classList.remove('visible');
        hexRowEl.classList.remove('visible');
        document.querySelectorAll('.nv-picker-circle.editing').forEach(c => c.classList.remove('editing'));
        ov.classList.add('open');
        if (window._nvRenderPresets) window._nvRenderPresets();
    };
    editBtn.addEventListener('mousedown', openColorPanel);
    editBtn.addEventListener('click', (e) => e.stopPropagation());
    editBtn.addEventListener('touchstart', openColorPanel, { passive: false });

    dropdown.appendChild(customOpt);

    // 🌟 ── 폰트 선택 섹션 ──
    const fontDivider = document.createElement('div');
    fontDivider.className = 'nv-dropdown-divider';
    dropdown.appendChild(fontDivider);

    const fontLabel = document.createElement('div');
    fontLabel.className = 'nv-section-label';
    fontLabel.textContent = '폰트';
    dropdown.appendChild(fontLabel);

    const currentFont = getStoredFont();
    FONTS.forEach(f => {
        const opt = document.createElement('button');
        opt.className = 'nv-font-option' + (f.id === currentFont ? ' active' : '');
        opt.dataset.font = f.id;
        opt.style.fontFamily = f.family + ' !important';
        opt.innerHTML = `<span class="nv-font-check">${f.id === currentFont ? '✓' : ''}</span>${f.label}`;
        const selectFont = (e) => {
            e.preventDefault();
            e.stopPropagation();
            applyFontAll(f.id);
            // 체크마크 업데이트
            dropdown.querySelectorAll('.nv-font-option').forEach(o => {
                const isActive = o.dataset.font === f.id;
                o.classList.toggle('active', isActive);
                o.querySelector('.nv-font-check').textContent = isActive ? '✓' : '';
            });
        };
        opt.addEventListener('mousedown', selectFont);
        opt.addEventListener('touchstart', selectFont, { passive: false });
        dropdown.appendChild(opt);
    });

    // 🌟 ── 커스텀 폰트 CSS 입력 영역 ──
    const fontCustomRow = document.createElement('div');
    fontCustomRow.className = 'nv-font-custom-row';

    const fontCustomToggle = document.createElement('button');
    fontCustomToggle.className = 'nv-font-custom-toggle';
    const fontCustomToggleLabel = document.createElement('span');
    fontCustomToggleLabel.className = 'nv-font-custom-toggle-label';
    fontCustomToggleLabel.textContent = '직접 입력 (CSS)';
    const fontCustomToggleArrow = document.createElement('span');
    fontCustomToggleArrow.className = 'nv-font-custom-toggle-arrow';
    fontCustomToggleArrow.textContent = '▼';
    fontCustomToggle.appendChild(fontCustomToggleLabel);
    fontCustomToggle.appendChild(fontCustomToggleArrow);

    const fontCustomArea = document.createElement('div');
    fontCustomArea.className = 'nv-font-custom-area';

    const fontCustomTextarea = document.createElement('textarea');
    fontCustomTextarea.className = 'nv-font-custom-textarea';
    fontCustomTextarea.placeholder = '@font-face {\n  font-family: \'MyFont\';\n  src: url(\'...\') format(\'woff2\');\n}\n.risu-chat * {\n  font-family: \'MyFont\' !important;\n}';
    fontCustomTextarea.value = getStoredFontCSS();
    // textarea 이벤트 전파 차단 (드롭다운 닫힘 방지)
    fontCustomTextarea.addEventListener('click', e => e.stopPropagation());
    fontCustomTextarea.addEventListener('mousedown', e => e.stopPropagation());
    fontCustomTextarea.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
    fontCustomTextarea.addEventListener('keydown', e => e.stopPropagation());

    const fontCustomBtns = document.createElement('div');
    fontCustomBtns.className = 'nv-font-custom-btns';

    const fontCustomClearBtn = document.createElement('button');
    fontCustomClearBtn.className = 'nv-font-custom-btn';
    fontCustomClearBtn.textContent = '초기화';
    fontCustomClearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fontCustomTextarea.value = '';
        applyCustomFontCSS('');
        // 기본 폰트로 복원
        applyFontAll('BookkMyungjo');
        dropdown.querySelectorAll('.nv-font-option').forEach(o => {
            const isActive = o.dataset.font === 'BookkMyungjo';
            o.classList.toggle('active', isActive);
            o.querySelector('.nv-font-check').textContent = isActive ? '✓' : '';
        });
    });

    const fontCustomApplyBtn = document.createElement('button');
    fontCustomApplyBtn.className = 'nv-font-custom-btn primary';
    fontCustomApplyBtn.textContent = '적용';
    fontCustomApplyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyCustomFontCSS(fontCustomTextarea.value);
    });

    fontCustomBtns.appendChild(fontCustomClearBtn);
    fontCustomBtns.appendChild(fontCustomApplyBtn);
    fontCustomArea.appendChild(fontCustomTextarea);
    fontCustomArea.appendChild(fontCustomBtns);

    fontCustomToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = fontCustomArea.classList.toggle('open');
        fontCustomToggleArrow.classList.toggle('open', isOpen);
    });

    fontCustomRow.appendChild(fontCustomToggle);
    fontCustomRow.appendChild(fontCustomArea);
    dropdown.appendChild(fontCustomRow);

    // 🌟 ── 북마크 토글 섹션 ──
    const bmDivider = document.createElement('div');
    bmDivider.className = 'nv-dropdown-divider';
    dropdown.appendChild(bmDivider);

    const bmRow = document.createElement('button');
    bmRow.className = 'nv-bookmark-row';
    const bmLabel = document.createElement('span');
    bmLabel.className = 'nv-bookmark-label';
    bmLabel.textContent = '북마크 이미지';
    const bmSwitch = document.createElement('span');
    bmSwitch.className = 'nv-bookmark-switch' + (getStoredBookmark() ? ' on' : '');
    bmRow.appendChild(bmLabel);
    bmRow.appendChild(bmSwitch);
    const toggleBm = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !bmSwitch.classList.contains('on');
        bmSwitch.classList.toggle('on', next);
        applyBookmarkAll(next);
    };
    bmRow.addEventListener('mousedown', toggleBm);
    bmRow.addEventListener('touchstart', toggleBm, { passive: false });
    dropdown.appendChild(bmRow);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.nv-theme-dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
        dropdown.classList.toggle('open');
    });

    wrap.appendChild(btn);
    wrap.appendChild(dropdown);
    return wrap;
}

// ── 드롭다운 외부 클릭 닫기 ──
if (!window._nvDocClickAdded) {
    document.addEventListener('click', () => {
        document.querySelectorAll('.nv-theme-dropdown.open').forEach(d => d.classList.remove('open'));
    });
    window._nvDocClickAdded = true;
}

// ── 뷰어 초기화 ──
// ── 작은따옴표 안 텍스트에 테마 색 강제 적용 ──
function wrapSingleQuotes(root) {
    const PAIR = new RegExp(
        '([\u2018\u0027])([^\u2018\u2019\u0027\n]{1,200}?)([\u2019\u0027])',
        'g'
    );

    // ★ getComputedStyle Illegal invocation 방어
    function safeGetBg(el) {
        try { return window.getComputedStyle(el).backgroundColor; } catch (e) { return ''; }
    }

    function hasHighlightedAncestor(node) {
        let el = node.nodeType === 3 ? node.parentElement : node;
        while (el && el !== root) {
            const bg = safeGetBg(el);
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true;
            el = el.parentElement;
        }
        return false;
    }

    function processNode(node) {
        // ★ 이미 처리된 span.nv-sq 재진입 차단
        if (node._nvSqDone) return;

        if (node.nodeType === 3) {
            const text = node.textContent;
            PAIR.lastIndex = 0;
            if (!PAIR.test(text)) return;
            if (hasHighlightedAncestor(node)) return;
            PAIR.lastIndex = 0;
            const frag = document.createDocumentFragment();
            let last = 0, m;
            while ((m = PAIR.exec(text)) !== null) {
                if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                const span = document.createElement('span');
                span.className = 'nv-sq';
                span._nvSqDone = true; // ★ 플래그
                span.textContent = m[0];
                frag.appendChild(span);
                last = m.index + m[0].length;
            }
            if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && !['SCRIPT','STYLE'].includes(node.tagName) && !node.classList.contains('nv-sq')) {
            Array.from(node.childNodes).forEach(processNode);
        }
    }
    processNode(root);
}

function initViewer(viewer) {
    const c = viewer.querySelector('.novel-content');
    if (!c) return;

    if (initedSet.has(c)) return;

    if (c.clientWidth === 0) { setTimeout(() => initViewer(viewer), 100); return; }
    if (!setupColumns(c))    { setTimeout(() => initViewer(viewer), 100); return; }

    const st = getState(c);
    st.currentPage = 0;
    c.scrollLeft   = 0;

    // 작은따옴표 래핑 (한 번만)
    wrapSingleQuotes(c);

    c.addEventListener('wheel', (e) => handleWheel(c, e), { passive: false });

    // ── 터치 스와이프 ──
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    // ── 모바일: overflow hidden으로 네이티브 스크롤 완전 차단, 터치만으로 제어 ──
    // 🌟 모바일: overflow-x/y를 각각 설정 — CSS의 overflow-x: scroll !important를 확실히 덮어씀
    if (isMobile()) {
        c.style.setProperty('overflow-x', 'hidden', 'important');
        c.style.setProperty('overflow-y', 'hidden', 'important');
    }

    let isHorizontalSwipe = false;
    let touchCurrentX = 0;

    c.addEventListener('touchstart', (e) => {
        touchStartX       = e.touches[0].clientX;
        touchStartY       = e.touches[0].clientY;
        touchCurrentX     = touchStartX;
        touchStartTime    = Date.now();
        isHorizontalSwipe = false;
        // 진행 중인 애니메이션 중단 (손가락 올리면 즉시 멈춤)
        const prev = navigatingMap.get(c);
        if (prev) { cancelAnimationFrame(prev); clearTimeout(prev); navigatingMap.set(c, null); }
    }, { passive: true });

    c.addEventListener('touchmove', (e) => {
        const dx = touchStartX - e.touches[0].clientX;
        const dy = touchStartY - e.touches[0].clientY;
        if (!isHorizontalSwipe && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            isHorizontalSwipe = true;
        }
        // 가로 스와이프면 전파 막기 (상위 스크롤 방지)
        if (isHorizontalSwipe) e.preventDefault();
        touchCurrentX = e.touches[0].clientX;
    }, { passive: false });

    c.addEventListener('touchend', (e) => {
        const dx      = touchStartX - e.changedTouches[0].clientX;
        const dy      = touchStartY - e.changedTouches[0].clientY;
        const elapsed = Date.now() - touchStartTime;
        if (Math.abs(dy) > Math.abs(dx)) return;       // 세로 스크롤 무시
        const speed = Math.abs(dx) / elapsed;
        if (Math.abs(dx) > 50  && elapsed < 500 && speed > 0.25) {
            // 스와이프 성공 → 정확히 1페이지만 이동
            dx > 0 ? goNext(c) : goPrev(c);
        } else {
            // 스와이프 실패 → 현재 페이지로 복귀
            scrollToPage(c);
        }
    }, { passive: true });

    // PC용 snap (모바일은 overflow:hidden이라 scroll 이벤트 안 뜸)
    let snapTimer;
    c.addEventListener('scroll', () => {
        if (isMobile()) return;                         // 모바일은 무시
        if (navigatingMap.get(c)) return;
        clearTimeout(snapTimer);
        snapTimer = setTimeout(() => {
            if (navigatingMap.get(c)) return;
            const sw = getSpreadWidth(c);
            if (sw <= 0) return;
            const st = getState(c);
            const snapped = Math.max(0, Math.min(Math.round(c.scrollLeft / sw), st.totalPages - 1));
            st.currentPage = snapped;
            scrollToPage(c);
        }, 80);
    }, { passive: true });

    // 기존 nav 제거 후 새로 삽입
    viewer.querySelectorAll('.novel-page-nav-mobile').forEach(el => el.remove());
    const nav = document.createElement('div');
    nav.className = 'novel-page-nav-mobile';
    nav.appendChild(createThemeToggle());
    nav.appendChild(createBtn('first', c));
    nav.appendChild(createBtn('prev', c));
    nav.appendChild(createIndicator());
    nav.appendChild(createBtn('next', c));
    nav.appendChild(createBtn('last', c));
    viewer.appendChild(nav);

    applyThemeAll(getStoredTheme());
    // 🌟 폰트 적용: 커스텀 CSS가 있으면 그걸 사용, 없으면 프리셋
    const _savedFontCSS = getStoredFontCSS();
    if (_savedFontCSS.trim()) {
        applyCustomFontCSS(_savedFontCSS);
    } else {
        applyFontAll(getStoredFont());
    }
    applyBookmarkAll(getStoredBookmark()); // 🌟 북마크 적용

    initedSet.add(c);
    setTimeout(() => updatePageInfo(c), 200);
}

function initAll() {
    ensureStyles();
    document.querySelectorAll('.novel-viewer').forEach(initViewer);
}

// ── 키보드 ──
if (!window._nvKeydownAdded) {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const all = document.querySelectorAll('.novel-content');
        if (!all.length) return;
        let c = all[0];
        if (all.length > 1) {
            const mid = window.innerHeight / 2;
            let best  = Infinity;
            all.forEach(el => {
                const r = el.getBoundingClientRect();
                const d = Math.abs((r.top + r.bottom) / 2 - mid);
                if (d < best) { best = d; c = el; }
            });
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(c); }
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev(c); }
    });
    window._nvKeydownAdded = true;
}

// ── 리사이즈 ──
if (!window._nvResizeAdded) {
    let resizeTimer;
    let wasMobile = isMobile();
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const nowMobile = isMobile();
            if (nowMobile !== wasMobile) {
                wasMobile = nowMobile;
                document.querySelectorAll('.novel-content').forEach(c => initedSet.delete(c));
                document.querySelectorAll('.novel-viewer').forEach(initViewer);
            } else {
                document.querySelectorAll('.novel-content').forEach(c => {
                    setupColumns(c); updatePageInfo(c); scrollToPage(c);
                });
            }
        }, 250);
    });
    window._nvResizeAdded = true;
}

// ── 초기화 ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

let mutationTimer;
const mutationObs = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
        initAll();
        document.querySelectorAll('.novel-content').forEach(c => { setupColumns(c); updatePageInfo(c); });
    }, 300);
});
mutationObs.observe(document.body, { childList: true, subtree: true });

// ── 정리 함수 ──
window._nvCleanup = () => {
    mutationObs.disconnect();
};