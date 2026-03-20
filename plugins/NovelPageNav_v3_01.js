//@api 3.0
//@name 📖NovelPageNav_Edit
//@version 7.0.0
//@arg theme string Reader theme
//@arg font string Reader font
//@arg bookmark string Bookmark visibility

const READER_STYLE_ID = 'nv-reader-style'
const CUSTOM_FONT_STYLE_ID = 'nv-reader-custom-font'
const ROOT_POPOVER_STYLE_CLASS = 'nv-root-popover-fallback-style'
const THEMES = [
    { id: 'light', label: '기본', dot: '#ffffff', border: '#cccccc' },
    { id: 'dark', label: '다크', dot: '#1c1a18', border: '#5a5040' },
    { id: 'vintage', label: '빈티지', dot: '#f0e8d8', border: '#c8b898' },
    { id: 'gray', label: '그레이', dot: '#4f4f4f', border: '#707070' },
    { id: 'green', label: '그린', dot: '#22403d', border: '#4a7a72' }
]
const FONTS = [
    { id: 'BookkMyungjo', label: '부크크명조', family: '"BookkMyungjo", serif' },
    { id: 'ChosunIlboMyungjo', label: '조선일보명조', family: '"ChosunIlboMyungjo", serif' },
    { id: 'JoseonGulim', label: '조선굴림', family: '"JoseonGulim", serif' },
    { id: 'Pretendard', label: '프리텐다드', family: '"Pretendard", "Apple SD Gothic Neo", sans-serif' },
    { id: 'Escoredream', label: '에스코어드림', family: '"Escoredream", sans-serif' },
    { id: 'OngleipKonkon', label: '온글잎 콘콘', family: '"OngleipKonkon", sans-serif' },
    { id: 'PeopleFirstTtobaks', label: '피플퍼스트또박', family: '"PeopleFirstTtobaks", sans-serif' }
]
const DEFAULT_SETTINGS = {
    theme: 'light',
    font: 'BookkMyungjo',
    bookmark: 'on'
}
const CUSTOM_THEME_FIELDS = [
    { key: 'bg', label: '배경', cssVar: '--nv-bg', fallback: '#2a2a2a' },
    { key: 'text', label: '본문', cssVar: '--nv-text', fallback: '#d4d4d4' },
    { key: 'muted', label: '강조 글씨', cssVar: '--nv-text-muted', fallback: '#888888' },
    { key: 'header', label: '헤더', cssVar: '--nv-header', fallback: '#aaaaaa' },
    { key: 'rule', label: '구분선', cssVar: '--nv-rule', fallback: '#3a3a3a' },
    { key: 'hlbg', label: '강조 배경', cssVar: '--nv-highlight-bg', fallback: '#383838' }
]
const THEME_VARS = {
    light: {
        '--nv-bg': '#ffffff',
        '--nv-text': '#000000',
        '--nv-text-muted': '#999999',
        '--nv-header': '#333333',
        '--nv-header-name': '#000000',
        '--nv-highlight-bg': '#e8e8e8',
        '--nv-highlight-text': '#000000',
        '--nv-rule': '#f4f4f4',
        '--nv-shadow': 'rgba(0, 0, 0, 0.15)',
        '--nv-controls-bg': '#ffffff',
        '--nv-controls-hover': 'rgba(0, 0, 0, 0.05)'
    },
    dark: {
        '--nv-bg': '#1c1a18',
        '--nv-text': '#bfb49a',
        '--nv-text-muted': '#7a7060',
        '--nv-header': '#968a72',
        '--nv-header-name': '#cfbfa0',
        '--nv-highlight-bg': '#2c2824',
        '--nv-highlight-text': '#ddd0b4',
        '--nv-rule': '#2e2a26',
        '--nv-shadow': 'rgba(0, 0, 0, 0.6)',
        '--nv-controls-bg': '#181614',
        '--nv-controls-hover': 'rgba(190, 180, 150, 0.1)'
    },
    vintage: {
        '--nv-bg': '#f0e8d8',
        '--nv-text': '#5c4430',
        '--nv-text-muted': '#9e8060',
        '--nv-header': '#7a5c40',
        '--nv-header-name': '#5c4430',
        '--nv-highlight-bg': '#e2d6c0',
        '--nv-highlight-text': '#4a3420',
        '--nv-rule': '#d8ccb4',
        '--nv-shadow': 'rgba(58, 48, 40, 0.14)',
        '--nv-controls-bg': '#e8dcc8',
        '--nv-controls-hover': 'rgba(58, 48, 40, 0.08)'
    },
    gray: {
        '--nv-bg': '#4f4f4f',
        '--nv-text': '#d4d4d4',
        '--nv-text-muted': '#909090',
        '--nv-header': '#bbbbbb',
        '--nv-header-name': '#d4d4d4',
        '--nv-highlight-bg': '#5a5a5a',
        '--nv-highlight-text': '#e8e8e8',
        '--nv-rule': '#444444',
        '--nv-shadow': 'rgba(0, 0, 0, 0.5)',
        '--nv-controls-bg': '#444444',
        '--nv-controls-hover': 'rgba(255, 255, 255, 0.07)'
    },
    green: {
        '--nv-bg': '#22403d',
        '--nv-text': '#a8c8c0',
        '--nv-text-muted': '#4e8a82',
        '--nv-header': '#6aaa9e',
        '--nv-header-name': '#bcd4d0',
        '--nv-highlight-bg': '#2a4e4a',
        '--nv-highlight-text': '#c8e0dc',
        '--nv-rule': '#1c3634',
        '--nv-shadow': 'rgba(0, 0, 0, 0.55)',
        '--nv-controls-bg': '#1a3230',
        '--nv-controls-hover': 'rgba(160, 210, 200, 0.08)'
    }
}
const ROOT_POPOVER_FALLBACK_CSS = `
.lb-xnai-menu:popover-open,
.x-risu-lb-xnai-menu:popover-open {
    position: fixed !important;
    position-area: none !important;
    position-try: none !important;
    inset: auto !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    z-index: 2147483647 !important;
}
`.trim()
const readerState = {
    context: null,
    currentPage: 0,
    totalPages: 1,
    theme: 'light',
    font: 'BookkMyungjo',
    showBookmark: true,
    customColors: null,
    customFontCss: '',
    cleanup: null,
    settingsCleanup: null
}

function ensureReaderStyle() {
    if (document.getElementById(READER_STYLE_ID)) {
        return
    }

    const style = document.createElement('style')
    style.id = READER_STYLE_ID
    style.textContent = `
        @font-face {
            font-family: "BookkMyungjo";
            src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/BookkMyungjo-Lt.woff2") format("woff2");
            font-weight: 400;
            font-display: swap;
        }

        @font-face {
            font-family: "BookkMyungjo";
            src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/BookkMyungjo-Bd.woff2") format("woff2");
            font-weight: 700;
            font-display: swap;
        }

        :root {
            color-scheme: light;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
                radial-gradient(circle at top, rgba(255, 255, 255, 0.9), transparent 30%),
                linear-gradient(180deg, #e7dfd0 0%, #d7cfbf 100%);
            padding: 20px;
            font-family: "BookkMyungjo", serif;
        }

        .novel-viewer {
            --nv-bg: #ffffff;
            --nv-text: #000000;
            --nv-text-muted: #999999;
            --nv-header: #333333;
            --nv-header-name: #000000;
            --nv-highlight-bg: #e8e8e8;
            --nv-highlight-text: #000000;
            --nv-rule: #f4f4f4;
            --nv-shadow: rgba(0, 0, 0, 0.15);
            --nv-controls-bg: #ffffff;
            --nv-controls-hover: rgba(0, 0, 0, 0.05);
            --nv-body-font: "BookkMyungjo", serif;
            width: min(1100px, 90vw);
            height: min(750px, 85vh);
            background-color: var(--nv-bg);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 20px 50px var(--nv-shadow);
            overflow: hidden;
        }

        .novel-header {
            padding: 30px 60px 0;
            font-size: 14px;
            color: var(--nv-header);
            flex-shrink: 0;
            margin-bottom: 10px;
            padding-bottom: 10px;
            font-family: var(--nv-body-font);
        }

        .to-label,
        .to-name {
            font-weight: 700;
            color: var(--nv-header-name);
        }

        .bookmark-container {
            width: 340px;
            height: 60px;
            margin-bottom: 10px;
            flex-shrink: 0;
        }

        .bookmark-ribbon {
            width: 100%;
            height: 100%;
            clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%);
            overflow: hidden;
            background: linear-gradient(90deg, #a58b68, #d2bea1);
        }

        .bookmark-images,
        .bookmark-portrait {
            width: 100%;
            height: 100%;
        }

        .bookmark-portrait {
            background: center 40% / cover no-repeat;
        }

        .novel-body {
            flex: 1;
            overflow: hidden;
            position: relative;
            padding: 0 60px;
        }

        .novel-content {
            width: 100%;
            height: 100%;
            column-count: 2;
            column-gap: 60px;
            column-rule: 1px solid var(--nv-rule);
            text-align: justify;
            font-size: 16px;
            line-height: 1.8;
            color: var(--nv-text);
            font-family: var(--nv-body-font);
            overflow-x: scroll;
            overflow-y: hidden;
            padding: 10px 0 80px;
            scrollbar-width: none;
        }

        .novel-content::-webkit-scrollbar {
            display: none;
        }

        .novel-content p {
            text-indent: 1em;
            margin: 0 0 0.5em 0;
            color: var(--nv-text);
        }

        .novel-content p[data-role="user"]::before,
        .novel-content p[data-role="char"]::before {
            display: inline-block;
            margin-right: 0.55em;
            font-size: 0.72em;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--nv-text-muted);
            text-indent: 0;
        }

        .novel-content p[data-role="user"]::before {
            content: "User";
        }

        .novel-content p[data-role="char"]::before {
            content: "Char";
        }

        .novel-content mark[risu-mark="quote1"],
        .novel-content mark[risu-mark="quote2"] {
            background-color: var(--nv-highlight-bg);
            color: var(--nv-highlight-text);
            font-weight: 700;
            border-radius: 4px;
            padding: 2px 4px;
            margin: 0 2px;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
        }

        .novel-page-nav-mobile {
            position: absolute;
            top: 8px;
            right: 12px;
            display: flex;
            align-items: center;
            gap: 2px;
            z-index: 15;
            background: color-mix(in srgb, var(--nv-bg, #fff) 85%, transparent);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border-radius: 20px;
            padding: 4px 8px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .novel-page-indicator {
            min-width: 72px;
            text-align: center;
            color: var(--nv-text-muted);
            font-size: 12px;
        }

        .novel-page-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--nv-text-muted);
            padding: 5px;
            margin: 0 5px;
            display: flex;
            align-items: center;
            transition: color 0.2s, background 0.2s;
            border-radius: 4px;
        }

        .novel-page-btn:hover {
            color: var(--nv-text);
            background: var(--nv-controls-hover);
        }

        .novel-page-btn svg {
            width: 22px;
            height: 22px;
        }

        .nv-button {
            border: none;
            background: var(--nv-controls-bg);
            color: var(--nv-text-muted);
            border-radius: 999px;
            padding: 8px 12px;
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-button:hover {
            background: var(--nv-controls-hover);
            color: var(--nv-text);
        }

        .nv-empty,
        .nv-error {
            display: grid;
            gap: 12px;
            place-items: center;
            height: 100%;
            text-align: center;
            color: var(--nv-text-muted);
        }

        .nv-error strong {
            color: var(--nv-text);
        }

        .nv-theme-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        .nv-theme-btn {
            border: none;
            background: var(--nv-controls-bg);
            color: var(--nv-text-muted);
            border-radius: 999px;
            padding: 8px 12px;
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-theme-btn:hover {
            background: var(--nv-controls-hover);
            color: var(--nv-text);
        }

        .nv-theme-dropdown {
            display: none;
            position: absolute;
            right: 0;
            bottom: calc(100% + 8px);
            min-width: 188px;
            max-height: min(70vh, 560px);
            overflow-y: auto;
            padding: 8px;
            border-radius: 14px;
            background: var(--nv-bg);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
            z-index: 20;
        }

        .nv-theme-dropdown.open {
            display: block;
        }

        .nv-theme-option,
        .nv-font-option,
        .nv-bookmark-row {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            border: none;
            background: none;
            color: var(--nv-text);
            border-radius: 10px;
            padding: 7px 10px;
            cursor: pointer;
            text-align: left;
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-theme-option:hover,
        .nv-font-option:hover,
        .nv-bookmark-row:hover,
        .nv-font-custom-toggle:hover {
            background: var(--nv-controls-hover);
        }

        .nv-theme-option.active,
        .nv-font-option.active {
            font-weight: 700;
        }

        .nv-theme-dot,
        .nv-font-check {
            width: 14px;
            height: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .nv-theme-dot {
            border-radius: 999px;
            border: 1.5px solid;
        }

        .nv-dropdown-divider {
            height: 1px;
            background: var(--nv-rule);
            margin: 6px 8px;
        }

        .nv-section-label {
            padding: 4px 10px 2px;
            color: var(--nv-text-muted);
            font-size: 11px;
        }

        .nv-custom-edit-btn {
            display: none;
            margin-left: auto;
            border: none;
            background: none;
            color: var(--nv-text-muted);
            cursor: pointer;
            border-radius: 999px;
            padding: 2px 6px;
        }

        .nv-custom-edit-btn.visible {
            display: inline-flex;
        }

        .nv-font-custom-row {
            padding: 4px 2px 6px;
        }

        .nv-font-custom-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            border: none;
            background: none;
            color: var(--nv-text-muted);
            border-radius: 8px;
            padding: 6px 8px;
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-font-custom-toggle-label {
            flex: 1;
            text-align: left;
        }

        .nv-font-custom-toggle-arrow {
            transition: transform 0.2s ease;
        }

        .nv-font-custom-toggle-arrow.open {
            transform: rotate(180deg);
        }

        .nv-font-custom-area {
            display: none;
            margin-top: 6px;
        }

        .nv-font-custom-area.open {
            display: block;
        }

        .nv-font-custom-textarea {
            width: 100%;
            min-height: 90px;
            resize: vertical;
            border-radius: 10px;
            border: 1px solid var(--nv-rule);
            background: var(--nv-highlight-bg);
            color: var(--nv-text);
            font: 12px/1.5 monospace;
            padding: 8px;
            box-sizing: border-box;
        }

        .nv-font-custom-btns {
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            margin-top: 6px;
        }

        .nv-font-custom-btn {
            border: none;
            border-radius: 8px;
            padding: 5px 10px;
            cursor: pointer;
            background: var(--nv-highlight-bg);
            color: var(--nv-text);
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-font-custom-btn.primary {
            background: var(--nv-text-muted);
            color: var(--nv-bg);
        }

        .nv-bookmark-label {
            flex: 1;
        }

        .nv-bookmark-switch {
            width: 34px;
            height: 18px;
            border-radius: 999px;
            background: var(--nv-rule);
            position: relative;
            flex-shrink: 0;
        }

        .nv-bookmark-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            border-radius: 999px;
            background: var(--nv-bg);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease;
        }

        .nv-bookmark-switch.on {
            background: var(--nv-text-muted);
        }

        .nv-bookmark-switch.on::after {
            transform: translateX(16px);
        }

        .nv-picker-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 2000;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(3px);
        }

        .nv-picker-overlay.open {
            display: flex;
        }

        .nv-picker-box {
            width: min(320px, calc(100vw - 32px));
            border-radius: 24px;
            background: #1e1e1e;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .nv-picker-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nv-picker-title {
            color: #cccccc;
            flex: 1;
        }

        .nv-picker-close {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.08);
            color: #aaaaaa;
            cursor: pointer;
        }

        .nv-picker-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
        }

        .nv-picker-field {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
        }

        .nv-picker-circle {
            width: 48px;
            height: 48px;
            border-radius: 999px;
            border: 3px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
            transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .nv-picker-circle.editing {
            transform: scale(1.08);
            border-color: #ffffff;
        }

        .nv-picker-field-label {
            color: #888888;
            font-size: 11px;
            text-align: center;
        }

        .nv-sv-box {
            width: 100%;
            height: 140px;
            border-radius: 14px;
            position: relative;
            overflow: hidden;
            cursor: crosshair;
            display: none;
        }

        .nv-sv-box.visible,
        .nv-sliders.visible,
        .nv-hex-row.visible {
            display: flex;
        }

        .nv-sv-box.visible {
            display: block;
        }

        .nv-sv-white,
        .nv-sv-black {
            position: absolute;
            inset: 0;
        }

        .nv-sv-white {
            background: linear-gradient(to right, #ffffff, transparent);
        }

        .nv-sv-black {
            background: linear-gradient(to bottom, transparent, #000000);
        }

        .nv-sv-cursor {
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 999px;
            border: 2px solid #ffffff;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
            transform: translate(-50%, -50%);
            pointer-events: none;
        }

        .nv-sliders {
            display: none;
            align-items: center;
            gap: 10px;
        }

        .nv-preview-circle {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
        }

        .nv-hue-slider {
            width: 100%;
        }

        .nv-hex-row {
            display: none;
            align-items: center;
            gap: 8px;
        }

        .nv-hex-input {
            width: 100%;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.08);
            color: #dddddd;
            padding: 6px 10px;
            text-align: center;
            font: 13px monospace;
        }

        .lb-xnai-menu:popover-open,
        .x-risu-lb-xnai-menu:popover-open {
            position: fixed !important;
            position-area: none !important;
            position-try: none !important;
            inset: auto !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            z-index: 2147483647 !important;
        }

        @media screen and (max-width: 768px) {
            body {
                place-items: end center;
                padding: 12px;
            }

            .novel-viewer {
                width: 92vw;
                height: min(80dvh, 760px);
                border-radius: 20px;
            }

            .novel-header {
                padding: 20px 25px 0;
            }

            .bookmark-container {
                width: 250px;
                height: 55px;
            }

            .novel-body {
                padding: 0 25px;
            }

            .novel-content {
                column-count: 1;
                column-gap: 30px;
                column-rule: none;
                font-size: 15px;
                line-height: 1.9;
                padding-bottom: 20px;
            }

            .novel-page-nav-mobile {
                top: auto;
                right: 50%;
                bottom: 10px;
                transform: translateX(50%);
            }
        }
    `
    document.head.appendChild(style)
}

function getDisplayName(context) {
    if (context.messages.length > 0) {
        const firstRole = context.messages[0]?.role
        if (firstRole === 'char') {
            return context.character?.name || 'Character'
        }
    }
    return context.character?.name || 'Reader'
}

function cycleValue(list, current) {
    const index = list.indexOf(current)
    return list[(index + 1 + list.length) % list.length]
}

async function getArgumentOrDefault(api, key) {
    try {
        const value = await api.getArgument(key)
        return typeof value === 'string' && value.length > 0 ? value : DEFAULT_SETTINGS[key]
    } catch (error) {
        await api.log(`Novel reader getArgument failed (${key}): ${error.message}`)
        return DEFAULT_SETTINGS[key]
    }
}

async function setArgumentSafe(api, key, value) {
    try {
        await api.setArgument(key, value)
    } catch (error) {
        await api.log(`Novel reader setArgument failed (${key}): ${error.message}`)
    }
}

async function getPluginStorageItem(api, key, fallback) {
    try {
        const value = await api.pluginStorage.getItem(key)
        return value ?? fallback
    } catch (error) {
        await api.log(`Novel reader pluginStorage read failed (${key}): ${error.message}`)
        return fallback
    }
}

async function setPluginStorageItem(api, key, value) {
    try {
        await api.pluginStorage.setItem(key, value)
    } catch (error) {
        await api.log(`Novel reader pluginStorage write failed (${key}): ${error.message}`)
    }
}

function normalizeTheme(theme) {
    return THEMES.some((themeOption) => themeOption.id === theme) || theme === 'custom'
        ? theme
        : DEFAULT_SETTINGS.theme
}

function normalizeFont(font) {
    const mappedFont = font === 'bookk' ? 'BookkMyungjo' : font
    return FONTS.some((fontOption) => fontOption.id === mappedFont) || mappedFont === '_custom'
        ? mappedFont
        : DEFAULT_SETTINGS.font
}

function getCustomThemeColor(key) {
    return readerState.customColors?.[key]
}

function buildCustomThemeVars() {
    const vars = {}
    for (const field of CUSTOM_THEME_FIELDS) {
        vars[field.cssVar] = getCustomThemeColor(field.key) || field.fallback
    }
    vars['--nv-header-name'] = vars['--nv-text']
    vars['--nv-highlight-text'] = vars['--nv-text']
    vars['--nv-shadow'] = 'rgba(0, 0, 0, 0.5)'
    vars['--nv-controls-bg'] = vars['--nv-bg']
    vars['--nv-controls-hover'] = 'rgba(128, 128, 128, 0.12)'
    return vars
}

function updateActiveOptions(selector, dataKey, value) {
    document.querySelectorAll(selector).forEach((element) => {
        element.classList.toggle('active', element.dataset[dataKey] === value)
    })
}

function syncCustomDot() {
    const color = getCustomThemeColor('bg') || '#2a2a2a'
    document.querySelectorAll('.nv-custom-dot').forEach((dot) => {
        dot.style.background = color
        dot.style.borderColor = color
    })
}

function syncCustomEditButtons(themeId = readerState.theme) {
    document.querySelectorAll('.nv-custom-edit-btn').forEach((button) => {
        button.classList.toggle('visible', themeId === 'custom')
    })
}

async function persistCustomColors(api) {
    await setPluginStorageItem(api, 'customColors', readerState.customColors)
}

async function persistCustomFontCss(api) {
    await setPluginStorageItem(api, 'customFontCss', readerState.customFontCss)
}

async function loadReaderSettings(api) {
    const theme = await getArgumentOrDefault(api, 'theme')
    const font = await getArgumentOrDefault(api, 'font')
    const bookmark = await getArgumentOrDefault(api, 'bookmark')
    const customColors = await getPluginStorageItem(api, 'customColors', {})
    const customFontCss = await getPluginStorageItem(api, 'customFontCss', '')

    readerState.theme = normalizeTheme(theme)
    readerState.font = normalizeFont(font)
    readerState.showBookmark = bookmark !== 'off'
    readerState.customColors = customColors && typeof customColors === 'object' ? customColors : {}
    readerState.customFontCss = typeof customFontCss === 'string' ? customFontCss : ''
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function renderMessageContent(context) {
    const messages = context.messages.filter((message) => {
        if (!message || typeof message.data !== 'string') {
            return false
        }

        if (message.disabled === true || message.disabled === 'allBefore' || message.isComment) {
            return false
        }

        return message.data.trim().length > 0
    })

    if (messages.length === 0) {
        return `<div class="nv-empty">No readable messages in this chat.</div>`
    }

    return messages.map((message) => {
        const paragraphs = message.data
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)

        if (paragraphs.length === 0) {
            paragraphs.push(message.data.trim())
        }

        return paragraphs
            .map((paragraph) => `<p data-role="${escapeHtml(message.role)}">${escapeHtml(paragraph)}</p>`)
            .join('')
    }).join('')
}

function getContentElement() {
    return document.querySelector('.novel-content')
}

function getIndicatorElement() {
    return document.querySelector('.novel-page-indicator')
}

function getNavIcon(direction) {
    const icons = {
        first: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
        next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
        last: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>'
    }
    return icons[direction]
}

function getViewerElement() {
    return document.querySelector('.novel-viewer')
}

function isMobile() {
    return window.innerWidth <= 768
}

function setupColumns(contentEl) {
    if (!contentEl) {
        return
    }

    if (isMobile()) {
        contentEl.style.columnCount = '1'
        contentEl.style.columnWidth = `${Math.floor(contentEl.clientWidth)}px`
        contentEl.style.columnGap = '30px'
    } else {
        const colWidth = Math.max(260, Math.floor((contentEl.clientWidth - 60) / 2))
        contentEl.style.columnCount = 'auto'
        contentEl.style.columnWidth = `${colWidth}px`
        contentEl.style.columnGap = '60px'
    }
}

function getPageWidth(contentEl) {
    const gap = Number.parseFloat(window.getComputedStyle(contentEl).columnGap || '60')
    return Math.max(1, Math.floor(contentEl.clientWidth + gap))
}

function updateIndicator() {
    const indicator = getIndicatorElement()
    if (!indicator) {
        return
    }

    indicator.textContent = `${readerState.currentPage + 1} / ${readerState.totalPages}`
}

function updatePageInfo(contentEl) {
    if (!contentEl) {
        return
    }

    const pageWidth = getPageWidth(contentEl)
    readerState.totalPages = Math.max(1, Math.ceil(contentEl.scrollWidth / pageWidth))
    readerState.currentPage = Math.min(readerState.currentPage, readerState.totalPages - 1)
    readerState.currentPage = Math.max(readerState.currentPage, 0)
    updateIndicator()
}

function scrollToPage(contentEl, behavior = 'smooth') {
    if (!contentEl) {
        return
    }

    const pageWidth = getPageWidth(contentEl)
    const left = Math.max(0, Math.min(readerState.currentPage * pageWidth, contentEl.scrollWidth - contentEl.clientWidth))
    contentEl.scrollTo({ left, behavior })
    updateIndicator()
}

function setPage(contentEl, nextPage) {
    readerState.currentPage = Math.max(0, Math.min(nextPage, readerState.totalPages - 1))
    scrollToPage(contentEl)
}

function applyTheme(themeId) {
    const viewer = getViewerElement()
    if (!viewer) {
        return
    }

    viewer.dataset.theme = themeId
    const vars = themeId === 'custom'
        ? buildCustomThemeVars()
        : (THEME_VARS[themeId] || THEME_VARS.light)
    for (const [key, value] of Object.entries(vars)) {
        viewer.style.setProperty(key, value)
    }
    updateActiveOptions('.nv-theme-option', 'theme', themeId)
    syncCustomEditButtons(themeId)
    if (themeId === 'custom') {
        syncCustomDot()
    }
}

function applyFont(fontId) {
    const viewer = getViewerElement()
    if (!viewer) {
        return
    }

    const font = FONTS.find((fontOption) => fontOption.id === normalizeFont(fontId)) || FONTS[0]
    viewer.style.setProperty('--nv-body-font', font.family)

    let customStyle = document.getElementById(CUSTOM_FONT_STYLE_ID)
    if (!customStyle && readerState.customFontCss.trim()) {
        customStyle = document.createElement('style')
        customStyle.id = CUSTOM_FONT_STYLE_ID
        document.head.appendChild(customStyle)
    }
    if (readerState.font === '_custom' && readerState.customFontCss.trim()) {
        if (!customStyle) {
            customStyle = document.createElement('style')
            customStyle.id = CUSTOM_FONT_STYLE_ID
            document.head.appendChild(customStyle)
        }
        customStyle.textContent = readerState.customFontCss
    } else if (customStyle) {
        customStyle.remove()
    }
    updateActiveOptions('.nv-font-option', 'font', readerState.font)
    document.querySelectorAll('.nv-font-option .nv-font-check').forEach((element) => {
        const option = element.closest('.nv-font-option')
        element.textContent = option?.classList.contains('active') ? '✓' : ''
    })
}

function applyBookmarkVisibility() {
    const bookmark = document.querySelector('.bookmark-container')
    if (!bookmark) {
        return
    }

    bookmark.style.display = readerState.showBookmark ? '' : 'none'
    document.querySelectorAll('.nv-bookmark-switch').forEach((element) => {
        element.classList.toggle('on', readerState.showBookmark)
    })
}

function ensureColorPickerOverlay(api) {
    if (window._nvPickerOverlay) {
        return window._nvPickerOverlay
    }

    const hsvToHex = (h, s, v) => {
        const sUnit = s / 100
        const vUnit = v / 100
        const f = (n) => {
            const k = (n + h / 60) % 6
            return vUnit - vUnit * sUnit * Math.max(0, Math.min(k, 4 - k, 1))
        }
        const toHex = (value) => Math.round(value * 255).toString(16).padStart(2, '0')
        return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
    }

    const hexToHsv = (hex) => {
        const r = Number.parseInt(hex.slice(1, 3), 16) / 255
        const g = Number.parseInt(hex.slice(3, 5), 16) / 255
        const b = Number.parseInt(hex.slice(5, 7), 16) / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const delta = max - min
        let h = 0
        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta) % 6
            } else if (max === g) {
                h = (b - r) / delta + 2
            } else {
                h = (r - g) / delta + 4
            }
            h = Math.round(h * 60)
            if (h < 0) {
                h += 360
            }
        }
        return {
            h,
            s: max === 0 ? 0 : Math.round(delta / max * 100),
            v: Math.round(max * 100)
        }
    }

    const overlay = document.createElement('div')
    overlay.className = 'nv-picker-overlay'
    overlay.id = '_nv-picker-overlay'

    const box = document.createElement('div')
    box.className = 'nv-picker-box'

    const header = document.createElement('div')
    header.className = 'nv-picker-header'

    const title = document.createElement('div')
    title.className = 'nv-picker-title'
    title.textContent = '색상 선택'

    const closeButton = document.createElement('button')
    closeButton.className = 'nv-picker-close'
    closeButton.textContent = '✕'
    closeButton.addEventListener('click', () => overlay.classList.remove('open'))

    header.append(title, closeButton)

    const grid = document.createElement('div')
    grid.className = 'nv-picker-grid'
    grid.id = '_nv-picker-grid'

    const svBox = document.createElement('div')
    svBox.className = 'nv-sv-box'
    svBox.id = '_nv-sv-box'
    const svWhite = document.createElement('div')
    svWhite.className = 'nv-sv-white'
    const svBlack = document.createElement('div')
    svBlack.className = 'nv-sv-black'
    const svCursor = document.createElement('div')
    svCursor.className = 'nv-sv-cursor'
    svBox.append(svWhite, svBlack, svCursor)

    const sliders = document.createElement('div')
    sliders.className = 'nv-sliders'
    sliders.id = '_nv-sliders'
    const previewCircle = document.createElement('div')
    previewCircle.className = 'nv-preview-circle'
    const hueSlider = document.createElement('input')
    hueSlider.type = 'range'
    hueSlider.className = 'nv-hue-slider'
    hueSlider.min = '0'
    hueSlider.max = '360'
    hueSlider.value = '0'
    sliders.append(previewCircle, hueSlider)

    const hexRow = document.createElement('div')
    hexRow.className = 'nv-hex-row'
    hexRow.id = '_nv-hex-row'
    const hexInput = document.createElement('input')
    hexInput.className = 'nv-hex-input'
    hexInput.maxLength = 7
    hexInput.placeholder = '#000000'
    hexRow.appendChild(hexInput)

    box.append(header, grid, svBox, sliders, hexRow)
    overlay.appendChild(box)
    document.body.appendChild(overlay)

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.classList.remove('open')
        }
    })

    const pickerState = {
        h: 0,
        s: 0,
        v: 0,
        activeField: null,
        activeCircle: null
    }
    window._nvPickerOverlay = overlay
    window._nvPickerState = pickerState

    const updateFromHsv = async (h, s, v, skipHex = false) => {
        pickerState.h = h
        pickerState.s = s
        pickerState.v = v
        const hex = hsvToHex(h, s, v)
        const hueHex = hsvToHex(h, 100, 100)
        svBox.style.background = hueHex
        svCursor.style.left = `${s}%`
        svCursor.style.top = `${100 - v}%`
        svCursor.style.background = hex
        hueSlider.value = String(h)
        previewCircle.style.background = hex
        if (!skipHex) {
            hexInput.value = hex
        }
        if (pickerState.activeCircle) {
            pickerState.activeCircle.style.background = hex
        }
        if (pickerState.activeField) {
            readerState.customColors = {
                ...(readerState.customColors || {}),
                [pickerState.activeField.key]: hex
            }
            applyTheme('custom')
            syncCustomDot()
            await persistCustomColors(api)
        }
    }

    let dragging = false
    const updateFromPointer = (event) => {
        const point = event.touches?.[0] ?? event
        const rect = svBox.getBoundingClientRect()
        const s = Math.max(0, Math.min(100, (point.clientX - rect.left) / rect.width * 100))
        const v = Math.max(0, Math.min(100, 100 - (point.clientY - rect.top) / rect.height * 100))
        updateFromHsv(pickerState.h, s, v)
    }

    svBox.addEventListener('mousedown', (event) => {
        dragging = true
        updateFromPointer(event)
    })
    document.addEventListener('mousemove', (event) => {
        if (dragging) {
            updateFromPointer(event)
        }
    })
    document.addEventListener('mouseup', () => {
        dragging = false
    })
    svBox.addEventListener('touchstart', (event) => {
        event.preventDefault()
        updateFromPointer(event)
    }, { passive: false })
    svBox.addEventListener('touchmove', (event) => {
        event.preventDefault()
        updateFromPointer(event)
    }, { passive: false })

    hueSlider.addEventListener('input', () => {
        updateFromHsv(Number.parseInt(hueSlider.value, 10), pickerState.s, pickerState.v)
    })

    hexInput.addEventListener('input', () => {
        const value = hexInput.value.trim()
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            const hsv = hexToHsv(value)
            updateFromHsv(hsv.h, hsv.s, hsv.v, true)
        }
    })

    CUSTOM_THEME_FIELDS.forEach((field) => {
        const pickerField = document.createElement('div')
        pickerField.className = 'nv-picker-field'

        const circle = document.createElement('div')
        circle.className = 'nv-picker-circle'
        circle.style.background = getCustomThemeColor(field.key) || field.fallback

        const label = document.createElement('div')
        label.className = 'nv-picker-field-label'
        label.textContent = field.label

        const openField = (event) => {
            event.preventDefault()
            event.stopPropagation()
            document.querySelectorAll('.nv-picker-circle.editing').forEach((element) => {
                element.classList.remove('editing')
            })
            circle.classList.add('editing')
            pickerState.activeField = field
            pickerState.activeCircle = circle
            svBox.classList.add('visible')
            sliders.classList.add('visible')
            hexRow.classList.add('visible')
            const color = getCustomThemeColor(field.key) || field.fallback
            const hsv = hexToHsv(color)
            updateFromHsv(hsv.h, hsv.s, hsv.v)
        }

        pickerField.addEventListener('mousedown', openField)
        pickerField.addEventListener('touchstart', openField, { passive: false })
        pickerField.append(circle, label)
        grid.appendChild(pickerField)
    })

    return overlay
}

function createThemeToggle(api) {
    const wrap = document.createElement('div')
    wrap.className = 'nv-theme-wrap'

    const button = document.createElement('button')
    button.className = 'nv-theme-btn'
    button.type = 'button'
    button.textContent = '설정'

    const dropdown = document.createElement('div')
    dropdown.className = 'nv-theme-dropdown'

    const closeDropdown = () => dropdown.classList.remove('open')
    const onDocClick = (event) => {
        if (!wrap.contains(event.target)) {
            closeDropdown()
        }
    }
    document.addEventListener('click', onDocClick)

    THEMES.forEach((theme) => {
        const option = document.createElement('button')
        option.type = 'button'
        option.className = `nv-theme-option${readerState.theme === theme.id ? ' active' : ''}`
        option.dataset.theme = theme.id
        option.innerHTML = `<span class="nv-theme-dot" style="background:${theme.dot};border-color:${theme.border}"></span><span>${theme.label}</span>`
        option.addEventListener('click', async (event) => {
            event.stopPropagation()
            readerState.theme = theme.id
            applyTheme(theme.id)
            await setArgumentSafe(api, 'theme', theme.id)
            closeDropdown()
        })
        dropdown.appendChild(option)
    })

    const customOption = document.createElement('button')
    customOption.type = 'button'
    customOption.className = `nv-theme-option${readerState.theme === 'custom' ? ' active' : ''}`
    customOption.dataset.theme = 'custom'
    customOption.innerHTML = '<span class="nv-theme-dot nv-custom-dot"></span><span style="flex:1">커스텀</span>'

    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.className = `nv-custom-edit-btn${readerState.theme === 'custom' ? ' visible' : ''}`
    editButton.textContent = '편집'
    editButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        closeDropdown()
        const overlay = ensureColorPickerOverlay(api)
        overlay.classList.add('open')
        const firstCircle = overlay.querySelector('.nv-picker-field')
        firstCircle?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    customOption.appendChild(editButton)
    customOption.addEventListener('click', async (event) => {
        event.stopPropagation()
        readerState.theme = 'custom'
        applyTheme('custom')
        await setArgumentSafe(api, 'theme', 'custom')
        closeDropdown()
    })
    dropdown.appendChild(customOption)

    dropdown.appendChild(Object.assign(document.createElement('div'), { className: 'nv-dropdown-divider' }))
    dropdown.appendChild(Object.assign(document.createElement('div'), { className: 'nv-section-label', textContent: '폰트' }))

    FONTS.forEach((font) => {
        const option = document.createElement('button')
        option.type = 'button'
        option.className = `nv-font-option${readerState.font === font.id ? ' active' : ''}`
        option.dataset.font = font.id
        option.style.fontFamily = font.family
        option.innerHTML = `<span class="nv-font-check">${readerState.font === font.id ? '✓' : ''}</span><span>${font.label}</span>`
        option.addEventListener('click', async (event) => {
            event.stopPropagation()
            readerState.font = font.id
            applyFont(font.id)
            await setArgumentSafe(api, 'font', font.id)
        })
        dropdown.appendChild(option)
    })

    const fontCustomRow = document.createElement('div')
    fontCustomRow.className = 'nv-font-custom-row'
    const fontCustomToggle = document.createElement('button')
    fontCustomToggle.type = 'button'
    fontCustomToggle.className = 'nv-font-custom-toggle'
    const fontCustomToggleLabel = document.createElement('span')
    fontCustomToggleLabel.className = 'nv-font-custom-toggle-label'
    fontCustomToggleLabel.textContent = '직접 입력 (CSS)'
    const fontCustomToggleArrow = document.createElement('span')
    fontCustomToggleArrow.className = 'nv-font-custom-toggle-arrow'
    fontCustomToggleArrow.textContent = '▼'
    fontCustomToggle.append(fontCustomToggleLabel, fontCustomToggleArrow)

    const fontCustomArea = document.createElement('div')
    fontCustomArea.className = 'nv-font-custom-area'
    const fontCustomTextarea = document.createElement('textarea')
    fontCustomTextarea.className = 'nv-font-custom-textarea'
    fontCustomTextarea.value = readerState.customFontCss
    fontCustomTextarea.placeholder = '@font-face {\n  font-family: "MyFont";\n  src: url("...") format("woff2");\n}\n.novel-viewer * {\n  font-family: "MyFont" !important;\n}'

    const fontCustomButtons = document.createElement('div')
    fontCustomButtons.className = 'nv-font-custom-btns'
    const clearButton = document.createElement('button')
    clearButton.type = 'button'
    clearButton.className = 'nv-font-custom-btn'
    clearButton.textContent = '초기화'
    clearButton.addEventListener('click', async (event) => {
        event.stopPropagation()
        readerState.customFontCss = ''
        fontCustomTextarea.value = ''
        readerState.font = DEFAULT_SETTINGS.font
        await persistCustomFontCss(api)
        await setArgumentSafe(api, 'font', DEFAULT_SETTINGS.font)
        applyFont(DEFAULT_SETTINGS.font)
    })

    const applyButton = document.createElement('button')
    applyButton.type = 'button'
    applyButton.className = 'nv-font-custom-btn primary'
    applyButton.textContent = '적용'
    applyButton.addEventListener('click', async (event) => {
        event.stopPropagation()
        readerState.customFontCss = fontCustomTextarea.value
        readerState.font = '_custom'
        await persistCustomFontCss(api)
        await setArgumentSafe(api, 'font', '_custom')
        applyFont(DEFAULT_SETTINGS.font)
    })

    fontCustomButtons.append(clearButton, applyButton)
    fontCustomArea.append(fontCustomTextarea, fontCustomButtons)
    fontCustomToggle.addEventListener('click', (event) => {
        event.stopPropagation()
        const isOpen = fontCustomArea.classList.toggle('open')
        fontCustomToggleArrow.classList.toggle('open', isOpen)
    })
    fontCustomRow.append(fontCustomToggle, fontCustomArea)
    dropdown.appendChild(fontCustomRow)

    dropdown.appendChild(Object.assign(document.createElement('div'), { className: 'nv-dropdown-divider' }))
    const bookmarkRow = document.createElement('button')
    bookmarkRow.type = 'button'
    bookmarkRow.className = 'nv-bookmark-row'
    bookmarkRow.innerHTML = '<span class="nv-bookmark-label">북마크 이미지</span><span class="nv-bookmark-switch"></span>'
    bookmarkRow.addEventListener('click', async (event) => {
        event.stopPropagation()
        readerState.showBookmark = !readerState.showBookmark
        applyBookmarkVisibility()
        await setArgumentSafe(api, 'bookmark', readerState.showBookmark ? 'on' : 'off')
    })
    dropdown.appendChild(bookmarkRow)

    button.addEventListener('click', (event) => {
        event.stopPropagation()
        dropdown.classList.toggle('open')
    })

    wrap.append(button, dropdown)
    syncCustomDot()
    syncCustomEditButtons()
    applyBookmarkVisibility()
    return {
        element: wrap,
        cleanup: () => document.removeEventListener('click', onDocClick)
    }
}

async function ensureRootPopoverFallback(api) {
    const granted = await api.requestPluginPermission('mainDom')
    if (!granted) {
        return
    }
    const rootDoc = await api.getRootDocument()
    if (!rootDoc) {
        return
    }
    const existing = await rootDoc.querySelector(`.${ROOT_POPOVER_STYLE_CLASS}`)
    if (existing) {
        return
    }
    const head = await rootDoc.querySelector('head')
    if (!head) {
        return
    }
    const style = await rootDoc.createElement('style')
    await style.setClassName(ROOT_POPOVER_STYLE_CLASS)
    await style.setTextContent(ROOT_POPOVER_FALLBACK_CSS)
    await head.appendChild(style)
}

function renderReaderBody(context) {
    const contentEl = getContentElement()
    if (!contentEl) {
        return
    }

    contentEl.innerHTML = renderMessageContent(context)
    setupColumns(contentEl)
    readerState.currentPage = 0
    updatePageInfo(contentEl)
    scrollToPage(contentEl, 'auto')
}

function installReaderEvents(api) {
    readerState.cleanup?.()

    const contentEl = getContentElement()
    const closeButton = document.querySelector('[data-action="close"]')
    const prevButton = document.querySelector('[data-action="prev"]')
    const nextButton = document.querySelector('[data-action="next"]')
    const firstButton = document.querySelector('[data-action="first"]')
    const lastButton = document.querySelector('[data-action="last"]')

    if (!contentEl) {
        return
    }

    let touchStartX = 0
    const onResize = () => {
        setupColumns(contentEl)
        updatePageInfo(contentEl)
        scrollToPage(contentEl, 'auto')
    }

    const onKeydown = (event) => {
        if (event.key === 'Escape') {
            closeReader(api).catch(() => {})
        } else if (event.key === 'ArrowRight') {
            setPage(contentEl, readerState.currentPage + 1)
        } else if (event.key === 'ArrowLeft') {
            setPage(contentEl, readerState.currentPage - 1)
        }
    }

    const onWheel = (event) => {
        event.preventDefault()
        if (event.deltaY > 0 || event.deltaX > 0) {
            setPage(contentEl, readerState.currentPage + 1)
        } else if (event.deltaY < 0 || event.deltaX < 0) {
            setPage(contentEl, readerState.currentPage - 1)
        }
    }

    const onScroll = () => {
        const pageWidth = getPageWidth(contentEl)
        readerState.currentPage = Math.max(0, Math.min(readerState.totalPages - 1, Math.round(contentEl.scrollLeft / pageWidth)))
        updateIndicator()
    }

    const onTouchStart = (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0
    }

    const onTouchEnd = (event) => {
        const diff = touchStartX - (event.changedTouches[0]?.clientX || 0)
        if (Math.abs(diff) < 48) {
            return
        }
        setPage(contentEl, readerState.currentPage + (diff > 0 ? 1 : -1))
    }

    const onClose = () => {
        closeReader(api).catch(() => {})
    }
    const onPrev = () => {
        setPage(contentEl, readerState.currentPage - 1)
    }
    const onNext = () => {
        setPage(contentEl, readerState.currentPage + 1)
    }
    const onFirst = () => {
        setPage(contentEl, 0)
    }
    const onLast = () => {
        setPage(contentEl, readerState.totalPages - 1)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKeydown)
    contentEl.addEventListener('wheel', onWheel, { passive: false })
    contentEl.addEventListener('scroll', onScroll)
    contentEl.addEventListener('touchstart', onTouchStart, { passive: true })
    contentEl.addEventListener('touchend', onTouchEnd, { passive: true })
    closeButton?.addEventListener('click', onClose)
    prevButton?.addEventListener('click', onPrev)
    nextButton?.addEventListener('click', onNext)
    firstButton?.addEventListener('click', onFirst)
    lastButton?.addEventListener('click', onLast)

    readerState.cleanup = () => {
        readerState.settingsCleanup?.()
        readerState.settingsCleanup = null
        window.removeEventListener('resize', onResize)
        document.removeEventListener('keydown', onKeydown)
        contentEl.removeEventListener('wheel', onWheel)
        contentEl.removeEventListener('scroll', onScroll)
        contentEl.removeEventListener('touchstart', onTouchStart)
        contentEl.removeEventListener('touchend', onTouchEnd)
        closeButton?.removeEventListener('click', onClose)
        prevButton?.removeEventListener('click', onPrev)
        nextButton?.removeEventListener('click', onNext)
        firstButton?.removeEventListener('click', onFirst)
        lastButton?.removeEventListener('click', onLast)
    }
}

function renderReaderShell(context, api) {
    ensureReaderStyle()
    document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
            <div class="novel-header">
                <span class="to-label">From.</span>
                <span class="to-name">${getDisplayName(context)}</span>
            </div>
            <div class="bookmark-container">
                <div class="bookmark-ribbon">
                    <div class="bookmark-images">
                        <div class="bookmark-portrait"></div>
                    </div>
                </div>
            </div>
            <div class="novel-body">
                <div class="novel-content"></div>
            </div>
            <div class="novel-page-nav-mobile">
                <div data-slot="settings"></div>
                <button class="novel-page-btn" type="button" data-action="first">${getNavIcon('first')}</button>
                <button class="novel-page-btn" type="button" data-action="prev">${getNavIcon('prev')}</button>
                <span class="novel-page-indicator">1 / 1</span>
                <button class="novel-page-btn" type="button" data-action="next">${getNavIcon('next')}</button>
                <button class="novel-page-btn" type="button" data-action="last">${getNavIcon('last')}</button>
            </div>
        </div>
    `

    readerState.settingsCleanup?.()
    const settingsSlot = document.querySelector('[data-slot="settings"]')
    const settingsUi = createThemeToggle(api)
    settingsSlot?.appendChild(settingsUi.element)
    readerState.settingsCleanup = settingsUi.cleanup
    applyTheme(readerState.theme)
    applyFont(readerState.font)
    applyBookmarkVisibility()
}

async function closeReader(api) {
    readerState.cleanup?.()
    readerState.cleanup = null
    await api.hideContainer()
}

function renderErrorState(api, message) {
    ensureReaderStyle()
    document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
            <div class="novel-body">
                <div class="nv-error">
                    <strong>Novel reader failed to load</strong>
                    <div>${message}</div>
                    <button class="nv-button" type="button" data-action="close">Close</button>
                </div>
            </div>
        </div>
    `

    document.querySelector('[data-action="close"]')?.addEventListener('click', () => {
        closeReader(api).catch(() => {})
    })
}

async function loadCurrentReaderContext(api) {
    try {
        const characterIndex = await api.getCurrentCharacterIndex()
        const chatIndex = await api.getCurrentChatIndex()
        const character = await api.getCharacterFromIndex(characterIndex)
        const chat = await api.getChatFromIndex(characterIndex, chatIndex)

        return {
            ok: true,
            characterIndex,
            chatIndex,
            character,
            chat,
            messages: Array.isArray(chat?.message) ? chat.message : []
        }
    } catch (error) {
        await api.log(`Novel reader context load failed: ${error.message}`)
        return {
            ok: false,
            error,
            characterIndex: -1,
            chatIndex: -1,
            character: null,
            chat: null,
            messages: []
        }
    }
}

async function openReader(api) {
    try {
        await loadReaderSettings(api)
        await ensureRootPopoverFallback(api)
        await api.showContainer('fullscreen')
        const context = await loadCurrentReaderContext(api)
        readerState.context = context
        await setPluginStorageItem(api, 'readerLastOpenAt', Date.now())
        renderReaderShell(context, api)
        renderReaderBody(context)
        installReaderEvents(api)
    } catch (error) {
        renderErrorState(api, error.message)
        await api.log(`Novel reader open failed: ${error.message}`)
    }
}

(async () => {
    try {
        await risuai.registerSetting(
            'Novel Reader',
            async () => {
                await openReader(risuai)
            },
            '📖',
            'html'
        )

        await risuai.registerButton(
            {
                name: 'Novel Reader',
                icon: '📖',
                iconType: 'html',
                location: 'chat'
            },
            () => {
                openReader(risuai).catch(() => {})
            }
        )
    } catch (error) {
        await risuai.log(`Novel reader bootstrap failed: ${error.message}`)
    }
})()
