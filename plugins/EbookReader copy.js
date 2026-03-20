//@api 3.0
//@name 📖EbookReader
//@version 7.0.0
//@arg theme string Reader theme
//@arg font string Reader font
//@arg bookmark string Bookmark visibility

const READER_STYLE_ID = "nv-reader-style";
const CUSTOM_FONT_STYLE_ID = "nv-reader-custom-font";
const ROOT_POPOVER_STYLE_CLASS = "nv-root-popover-fallback-style";
const CACHE_INDEX_KEY = "readerCacheIndex";
const CACHE_ENTRY_PREFIX = "readerCache:";
const THEMES = [
  { id: "light", label: "기본", dot: "#ffffff", border: "#cccccc" },
  { id: "dark", label: "다크", dot: "#1c1a18", border: "#5a5040" },
  { id: "vintage", label: "빈티지", dot: "#f0e8d8", border: "#c8b898" },
  { id: "gray", label: "그레이", dot: "#4f4f4f", border: "#707070" },
  { id: "green", label: "그린", dot: "#22403d", border: "#4a7a72" },
];
const FONTS = [
  { id: "BookkMyungjo", label: "부크크명조", family: '"BookkMyungjo", serif' },
  {
    id: "ChosunIlboMyungjo",
    label: "조선일보명조",
    family: '"ChosunIlboMyungjo", serif',
  },
  { id: "JoseonGulim", label: "조선굴림", family: '"JoseonGulim", serif' },
  {
    id: "Pretendard",
    label: "프리텐다드",
    family: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
  },
  {
    id: "Escoredream",
    label: "에스코어드림",
    family: '"Escoredream", sans-serif',
  },
  {
    id: "OngleipKonkon",
    label: "온글잎 콘콘",
    family: '"OngleipKonkon", sans-serif',
  },
  {
    id: "PeopleFirstTtobaks",
    label: "피플퍼스트또박",
    family: '"PeopleFirstTtobaks", sans-serif',
  },
];
const DEFAULT_SETTINGS = {
  theme: "light",
  font: "BookkMyungjo",
  bookmark: "on",
};
const CUSTOM_THEME_FIELDS = [
  { key: "bg", label: "배경", cssVar: "--nv-bg", fallback: "#2a2a2a" },
  { key: "text", label: "본문", cssVar: "--nv-text", fallback: "#d4d4d4" },
  {
    key: "muted",
    label: "강조 글씨",
    cssVar: "--nv-text-muted",
    fallback: "#888888",
  },
  { key: "header", label: "헤더", cssVar: "--nv-header", fallback: "#aaaaaa" },
  { key: "rule", label: "구분선", cssVar: "--nv-rule", fallback: "#3a3a3a" },
  {
    key: "hlbg",
    label: "강조 배경",
    cssVar: "--nv-highlight-bg",
    fallback: "#383838",
  },
];
const THEME_VARS = {
  light: {
    "--nv-bg": "#ffffff",
    "--nv-text": "#000000",
    "--nv-text-muted": "#999999",
    "--nv-header": "#333333",
    "--nv-header-name": "#000000",
    "--nv-highlight-bg": "#e8e8e8",
    "--nv-highlight-text": "#000000",
    "--nv-rule": "#f4f4f4",
    "--nv-shadow": "rgba(0, 0, 0, 0.15)",
    "--nv-controls-bg": "#ffffff",
    "--nv-controls-hover": "rgba(0, 0, 0, 0.05)",
  },
  dark: {
    "--nv-bg": "#1c1a18",
    "--nv-text": "#bfb49a",
    "--nv-text-muted": "#7a7060",
    "--nv-header": "#968a72",
    "--nv-header-name": "#cfbfa0",
    "--nv-highlight-bg": "#2c2824",
    "--nv-highlight-text": "#ddd0b4",
    "--nv-rule": "#2e2a26",
    "--nv-shadow": "rgba(0, 0, 0, 0.6)",
    "--nv-controls-bg": "#181614",
    "--nv-controls-hover": "rgba(190, 180, 150, 0.1)",
  },
  vintage: {
    "--nv-bg": "#f0e8d8",
    "--nv-text": "#5c4430",
    "--nv-text-muted": "#9e8060",
    "--nv-header": "#7a5c40",
    "--nv-header-name": "#5c4430",
    "--nv-highlight-bg": "#e2d6c0",
    "--nv-highlight-text": "#4a3420",
    "--nv-rule": "#d8ccb4",
    "--nv-shadow": "rgba(58, 48, 40, 0.14)",
    "--nv-controls-bg": "#e8dcc8",
    "--nv-controls-hover": "rgba(58, 48, 40, 0.08)",
  },
  gray: {
    "--nv-bg": "#4f4f4f",
    "--nv-text": "#d4d4d4",
    "--nv-text-muted": "#909090",
    "--nv-header": "#bbbbbb",
    "--nv-header-name": "#d4d4d4",
    "--nv-highlight-bg": "#5a5a5a",
    "--nv-highlight-text": "#e8e8e8",
    "--nv-rule": "#444444",
    "--nv-shadow": "rgba(0, 0, 0, 0.5)",
    "--nv-controls-bg": "#444444",
    "--nv-controls-hover": "rgba(255, 255, 255, 0.07)",
  },
  green: {
    "--nv-bg": "#22403d",
    "--nv-text": "#a8c8c0",
    "--nv-text-muted": "#4e8a82",
    "--nv-header": "#6aaa9e",
    "--nv-header-name": "#bcd4d0",
    "--nv-highlight-bg": "#2a4e4a",
    "--nv-highlight-text": "#c8e0dc",
    "--nv-rule": "#1c3634",
    "--nv-shadow": "rgba(0, 0, 0, 0.55)",
    "--nv-controls-bg": "#1a3230",
    "--nv-controls-hover": "rgba(160, 210, 200, 0.08)",
  },
};
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
`.trim();
const readerState = {
  context: null,
  currentPage: 0,
  totalPages: 1,
  pendingPage: null,
  navigationLockPage: null,
  navigationLockTimer: null,
  theme: "light",
  font: "BookkMyungjo",
  showBookmark: true,
  customColors: null,
  customFontCss: "",
  cleanup: null,
  settingsCleanup: null,
  currentCacheKey: "",
  currentCacheEntry: null,
  currentCacheSignature: null,
  currentLocation: null,
  locationPersistTimer: null,
};

function getAssetExtension(path) {
  const cleanPath = String(path || "").split("?")[0];
  const ext = cleanPath.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") {
    return "jpeg";
  }
  if (ext === "webp" || ext === "gif") {
    return ext;
  }
  return "png";
}

function normalizeAssetKey(path) {
  if (typeof path !== "string" || path.length === 0) {
    return "";
  }
  return path.startsWith("assets/") ? path.slice(7) : path;
}

function bytesToDataUrl(bytes, mimeType = "image/png") {
  if (!bytes || typeof bytes.length !== "number") {
    return "";
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function loadAssetDataUrl(api, path) {
  const assetKey = normalizeAssetKey(path);
  if (!assetKey) {
    return "";
  }

  try {
    const imageData = await api.readImage(assetKey);
    if (typeof imageData === "string") {
      return imageData;
    }
    if (imageData instanceof Uint8Array) {
      return bytesToDataUrl(imageData, `image/${getAssetExtension(assetKey)}`);
    }
    if (ArrayBuffer.isView(imageData)) {
      return bytesToDataUrl(
        new Uint8Array(
          imageData.buffer,
          imageData.byteOffset,
          imageData.byteLength,
        ),
        `image/${getAssetExtension(assetKey)}`,
      );
    }
  } catch (error) {
    await api.log(`Ebook Reader image load failed (${assetKey}): ${error.message}`);
  }

  return "";
}

function ensureReaderStyle() {
  if (document.getElementById(READER_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = READER_STYLE_ID;
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

        html,
        body {
            width: 100%;
            height: 100%;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100dvh;
            display: grid;
            place-items: center;
            background:
                radial-gradient(circle at top, rgba(255, 255, 255, 0.9), transparent 30%),
                linear-gradient(180deg, #e7dfd0 0%, #d7cfbf 100%);
            padding: 0;
            overflow: hidden;
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
            width: 100vw;
            height: 100vh;
            background-color: var(--nv-bg);
            border-radius: 0;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: none;
            overflow: hidden;
        }

        .novel-header {
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 6px;
            font-size: 12px;
            color: var(--nv-header);
            flex-shrink: 0;
            font-family: var(--nv-body-font);
            display: grid;
            grid-template-columns: 44px minmax(0, 1fr) 44px;
            align-items: center;
            justify-items: center;
            column-gap: 8px;
            border-bottom: 1px solid var(--nv-rule);
            margin-bottom: 8px;
        }

        .nv-topbar-btn,
        .nv-more-btn {
            border: none;
            background: none;
            color: var(--nv-text-muted);
            border-radius: 999px;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .nv-topbar-btn:hover,
        .nv-more-btn:hover {
            color: var(--nv-text);
            background: var(--nv-controls-hover);
        }

        .nv-topbar-btn svg,
        .nv-more-btn svg {
            width: 16px;
            height: 16px;
        }

        .nv-more-wrap {
            position: relative;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .to-label,
        .to-name {
            font-weight: 700;
            color: var(--nv-header-name);
        }

        .to-name {
            display: block;
            min-width: 0;
            width: 100%;
            font-size: 15px;
            line-height: 1.4;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .bookmark-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 10px;
            flex-shrink: 0;
        }

        .bookmark-container {
            width: 340px;
            height: 60px;
            flex-shrink: 0;
        }

        .bookmark-container-right {
            margin-left: auto;
        }

        .bookmark-ribbon {
            width: 100%;
            height: 100%;
            clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%);
            overflow: hidden;
            background: linear-gradient(90deg, #a58b68, #d2bea1);
        }

        .bookmark-ribbon-right {
            clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%, 8% 50%, 0 0);
            background: linear-gradient(270deg, #a58b68, #d2bea1);
        }

        .bookmark-images,
        .bookmark-portrait {
            width: 100%;
            height: 100%;
        }

        .bookmark-portrait {
            background: center 40% / cover no-repeat;
        }

        .bookmark-portrait-right {
            transform: scaleX(-1);
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
            padding: 10px 0 24px;
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

        .novel-content p strong,
        .novel-content li strong,
        .novel-content blockquote strong {
            font-weight: 700;
            color: var(--nv-highlight-text);
        }

        .novel-content p em,
        .novel-content li em,
        .novel-content blockquote em {
            font-style: italic;
        }

        .nv-md-rule {
            border: 0;
            border-top: 1px solid var(--nv-rule);
            margin: 1.2em 0 1.4em;
            break-inside: avoid-column;
        }

        .nv-md-quote {
            margin: 0 0 1em 0;
            padding: 0.2em 0 0.2em 1em;
            border-left: 3px solid var(--nv-text-muted);
            color: var(--nv-text-muted);
            font-style: italic;
            break-inside: avoid-column;
        }

        .nv-md-quote p {
            text-indent: 0;
            margin: 0;
        }

        .nv-md-list {
            margin: 0 0 1em 1.2em;
            padding: 0;
            break-inside: avoid-column;
        }

        .nv-md-list li {
            margin: 0 0 0.45em 0;
        }

        .nv-processed-message {
            margin: 0 0 1.1em 0;
            break-inside: avoid-column;
            color: var(--nv-text);
        }

        .nv-processed-message > *:first-child {
            margin-top: 0;
        }

        .nv-processed-message > *:last-child {
            margin-bottom: 0;
        }

        .nv-processed-message img,
        .nv-processed-message video,
        .nv-processed-message audio {
            max-width: 100%;
            height: auto;
        }

        .nv-processed-message .risu-inlay-image,
        .nv-processed-message .lb-xnai-inlay-wrapper,
        .nv-processed-message .lb-xnai-kv-wrapper {
            margin: 1rem auto;
            break-inside: avoid-column;
        }

        .nv-processed-message .lb-xnai-inlay,
        .nv-processed-message .lb-xnai-kv {
            display: block;
        }

        .nv-processed-message .lb-xnai-inlay img,
        .nv-processed-message .lb-xnai-kv img,
        .nv-processed-message .risu-inlay-image img {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
        }

        .nv-media-placeholder {
            min-height: 160px;
            margin: 1rem auto;
            border: 1px solid var(--nv-rule);
            border-radius: 14px;
            background:
                linear-gradient(135deg, color-mix(in srgb, var(--nv-bg) 88%, white 12%), color-mix(in srgb, var(--nv-highlight-bg) 92%, transparent)),
                radial-gradient(circle at top right, color-mix(in srgb, var(--nv-text-muted) 16%, transparent), transparent 32%),
                repeating-linear-gradient(-45deg, transparent, transparent 8px, color-mix(in srgb, var(--nv-rule) 45%, transparent) 8px, color-mix(in srgb, var(--nv-rule) 45%, transparent) 16px);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--nv-bg) 70%, var(--nv-rule) 30%);
            break-inside: avoid-column;
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

        .novel-page-footer {
            position: relative;
            width: 100%;
            display: grid;
            grid-template-columns: 44px 44px minmax(0, 1fr) 44px 44px;
            align-items: center;
            justify-items: center;
            gap: 8px;
            padding: 10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px);
            border-top: 1px solid var(--nv-rule);
            background: var(--nv-bg);
            box-shadow: none;
            flex-shrink: 0;
        }

        .novel-page-indicator {
            min-width: 0;
            width: 100%;
            text-align: center;
            color: var(--nv-text-muted);
            font-size: 12px;
        }

        .novel-page-progress {
            min-width: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
        }

        .novel-page-progress-slider {
            width: 100%;
            margin: 0;
            accent-color: var(--nv-text-muted);
            cursor: pointer;
        }

        .novel-page-progress-slider:disabled {
            cursor: default;
            opacity: 0.45;
        }

        .novel-page-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--nv-text-muted);
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s, background 0.2s;
            border-radius: 4px;
            width: 44px;
            height: 44px;
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

        .nv-loading {
            display: grid;
            place-items: center;
            height: 100%;
            padding: 24px;
            text-align: center;
        }

        .nv-loading-stack {
            width: min(320px, 100%);
            display: grid;
            gap: 14px;
        }

        .nv-loading-label {
            color: var(--nv-text);
            font-size: 15px;
            font-weight: 700;
        }

        .nv-loading-bar {
            height: 4px;
            border-radius: 999px;
            background: var(--nv-rule);
            overflow: hidden;
        }

        .nv-loading-bar::after {
            content: "";
            display: block;
            width: 40%;
            height: 100%;
            border-radius: inherit;
            background: var(--nv-header-name);
            animation: nv-loading-slide 1.1s ease-in-out infinite;
        }

        @keyframes nv-loading-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
        }

        .nv-cache-manager-screen {
            position: fixed;
            inset: 0;
            display: none;
            width: 100%;
            height: 100%;
            background: var(--nv-bg, #ffffff);
            z-index: 200;
        }

        .nv-cache-manager-screen.open {
            display: block;
        }

        .nv-cache-manager-shell {
            width: 100%;
            height: 100%;
            overflow: auto;
            overflow-x: hidden;
            background: var(--nv-bg, #ffffff);
            -webkit-overflow-scrolling: touch;
            font-family: var(--nv-body-font);
        }

        .nv-more-menu {
            display: none;
            position: absolute;
            right: -4px;
            bottom: calc(100% + 10px);
            min-width: 180px;
            padding: 4px;
            border: 1px solid var(--nv-rule);
            border-radius: 14px;
            background: var(--nv-bg);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            z-index: 160;
            font-family: var(--nv-body-font);
        }

        .nv-more-menu.open {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .nv-modal-header {
            display: grid;
            grid-template-columns: 44px minmax(0, 1fr) 44px;
            align-items: center;
            justify-items: center;
            gap: 4px;
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px;
            border-bottom: 1px solid var(--nv-rule);
            background: var(--nv-bg, #ffffff);
            position: sticky;
            top: 0;
            z-index: 1;
        }

        .nv-modal-title {
            min-width: 0;
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
            color: var(--nv-header-name);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .nv-modal-body {
            padding: 24px 20px calc(env(safe-area-inset-bottom, 0px) + 28px);
        }

        .nv-cache-layout {
            width: 100%;
            max-width: min(560px, 100%);
            margin: 0 auto;
            display: grid;
            gap: 32px;
        }

        .nv-cache-section {
            display: grid;
            gap: 12px;
        }

        .nv-action-btn {
            width: 100%;
            border: none;
            border-radius: 10px;
            background: transparent;
            color: var(--nv-text);
            padding: 10px 14px;
            text-align: left;
            cursor: pointer;
            font: inherit;
            font-size: 13px;
            line-height: 1.4;
            transition: background 0.12s;
        }

        .nv-action-btn:hover {
            background: var(--nv-controls-hover);
        }

        .nv-action-btn:active {
            background: var(--nv-controls-hover);
            opacity: 0.8;
        }

        .nv-action-btn[disabled] {
            opacity: 0.3;
            cursor: not-allowed;
            pointer-events: none;
        }

        .nv-cache-section-title {
            font-size: 12px;
            font-weight: 500;
            line-height: 1.4;
            color: var(--nv-text-muted);
            letter-spacing: 0.01em;
        }

        .nv-cache-list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        /* ── hero card: 현재 세션 ── */

        .nv-cache-current-card {
            display: grid;
            gap: 16px;
            padding: 20px 0;
            border: none;
            border-radius: 0;
            border-bottom: 1px solid var(--nv-rule);
            background: transparent;
        }

        .nv-cache-card-head {
            display: grid;
            gap: 4px;
        }

        .nv-cache-card-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--nv-header-name);
            line-height: 1.4;
        }

        .nv-cache-card-subtitle {
            font-size: 13px;
            color: var(--nv-text-muted);
            line-height: 1.4;
        }

        .nv-cache-card-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0;
        }

        .nv-cache-chip {
            display: inline-flex;
            align-items: center;
            color: var(--nv-text-muted);
            font-size: 12px;
            line-height: 1.4;
        }

        .nv-cache-chip + .nv-cache-chip::before {
            content: "·";
            margin: 0 6px;
            color: var(--nv-text-muted);
            opacity: 0.4;
        }

        .nv-cache-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid var(--nv-rule);
            padding-top: 16px;
        }

        .nv-cache-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 0;
            background: transparent;
            border: none;
            border-radius: 0;
        }

        .nv-cache-stat + .nv-cache-stat {
            border-left: 1px solid var(--nv-rule);
        }

        .nv-cache-stat-value {
            font-size: 18px;
            font-weight: 700;
            color: var(--nv-header-name);
            line-height: 1.3;
        }

        .nv-cache-stat-label {
            font-size: 11px;
            color: var(--nv-text-muted);
            line-height: 1.4;
            letter-spacing: 0.01em;
        }

        /* ── 판본 목록 ── */

        .nv-cache-current,
        .nv-cache-list {
            display: grid;
            gap: 0;
        }

        .nv-cache-row {
            display: grid;
            gap: 4px;
            padding: 14px 0;
            background: transparent;
            border: none;
            border-radius: 0;
            border-bottom: 1px solid var(--nv-rule);
            color: var(--nv-text);
        }

        .nv-cache-row:last-child {
            border-bottom: none;
        }

        .nv-cache-row-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-width: 0;
        }

        .nv-cache-row-head > div {
            min-width: 0;
        }

        .nv-cache-row-title {
            min-width: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--nv-header-name);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
        }

        .nv-cache-row-subtitle {
            font-size: 12px;
            color: var(--nv-text-muted);
            line-height: 1.4;
        }

        .nv-cache-row-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0;
        }

        .nv-cache-row-meta span {
            display: inline-flex;
            align-items: center;
            padding: 0;
            border: none;
            border-radius: 0;
            background: transparent;
            font-size: 11px;
            color: var(--nv-text-muted);
            line-height: 1.4;
        }

        .nv-cache-row-meta span + span::before {
            content: "·";
            margin: 0 5px;
            opacity: 0.4;
        }

        /* ── 버튼들 ── */

        .nv-cache-delete,
        .nv-cache-clear-all,
        .nv-cache-back {
            border: none;
            background: transparent;
            cursor: pointer;
            font: inherit;
            color: var(--nv-text-muted);
            border-radius: 999px;
            transition: color 0.15s, background 0.15s, opacity 0.15s;
        }

        .nv-cache-delete:hover,
        .nv-cache-clear-all:hover,
        .nv-cache-back:hover {
            color: var(--nv-text);
            background: var(--nv-controls-hover);
        }

        .nv-cache-back {
            width: 36px;
            height: 36px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .nv-cache-back svg {
            width: 18px;
            height: 18px;
        }

        .nv-cache-clear-all {
            min-height: 26px;
            padding: 0 10px;
            font-size: 11px;
            line-height: 1.4;
            opacity: 0.55;
        }

        .nv-cache-clear-all:hover {
            opacity: 1;
        }

        .nv-cache-delete {
            min-height: 28px;
            padding: 0 10px;
            font-size: 11px;
            line-height: 1.4;
            opacity: 0.45;
            flex-shrink: 0;
        }

        .nv-cache-delete:hover {
            opacity: 1;
        }

        /* ── 빈 상태 ── */

        .nv-cache-empty {
            padding: 36px 12px;
            text-align: center;
            color: var(--nv-text-muted);
            font-size: 13px;
            line-height: 1.4;
            border: none;
            border-radius: 0;
            opacity: 0.5;
        }

        .nv-cache-header-spacer {
            width: 44px;
            height: 36px;
        }

        .nv-bookmark-screen {
            position: fixed;
            inset: 0;
            display: none;
            width: 100%;
            height: 100%;
            background: var(--nv-bg, #ffffff);
            z-index: 210;
        }

        .nv-bookmark-screen.open {
            display: block;
        }

        .nv-bookmark-shell {
            width: 100%;
            height: 100%;
            overflow: auto;
            background: var(--nv-bg, #ffffff);
        }

        .nv-bookmark-layout {
            width: 100%;
            max-width: min(820px, 100%);
            margin: 0 auto;
            display: grid;
            gap: 18px;
            padding: 18px 16px calc(env(safe-area-inset-bottom, 0px) + 20px);
        }

        .nv-bookmark-section {
            display: grid;
            gap: 10px;
        }

        .nv-bookmark-current-card,
        .nv-bookmark-last-card,
        .nv-bookmark-item {
            display: grid;
            gap: 12px;
            padding: 16px;
            border: 1px solid var(--nv-rule);
            border-radius: 18px;
            background: color-mix(in srgb, var(--nv-highlight-bg) 26%, var(--nv-bg, #ffffff));
        }

        .nv-bookmark-current-card {
            gap: 14px;
        }

        .nv-bookmark-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--nv-header-name);
        }

        .nv-bookmark-preview {
            font-size: 13px;
            line-height: 1.7;
            color: var(--nv-text);
        }

        .nv-bookmark-meta,
        .nv-bookmark-item-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .nv-bookmark-chip {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid var(--nv-rule);
            background: var(--nv-bg, #ffffff);
            color: var(--nv-text-muted);
            font-size: 11px;
        }

        .nv-bookmark-primary {
            min-height: 40px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid var(--nv-rule);
            background: var(--nv-bg, #ffffff);
            color: var(--nv-header-name);
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-body-font);
            justify-self: start;
        }

        .nv-bookmark-primary:hover {
            background: var(--nv-controls-hover);
        }

        .nv-bookmark-list {
            display: grid;
            gap: 10px;
        }

        .nv-bookmark-item-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }

        .nv-bookmark-item-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--nv-header-name);
        }

        .nv-bookmark-item-actions {
            display: inline-flex;
            gap: 8px;
            flex-shrink: 0;
        }

        .nv-bookmark-action {
            min-height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid var(--nv-rule);
            background: transparent;
            color: var(--nv-text-muted);
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-body-font);
        }

        .nv-bookmark-action:hover {
            color: var(--nv-text);
            background: var(--nv-controls-hover);
        }

        .nv-theme-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
        }

        .nv-theme-btn {
            background: none;
            border: none;
            color: var(--nv-text-muted);
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            transition: color 0.2s ease;
            width: 44px;
            height: 44px;
        }

        .nv-theme-btn:hover {
            color: var(--nv-text);
        }

        .nv-theme-btn svg {
            width: 16px;
            height: 16px;
        }

        .nv-theme-dropdown {
            display: none;
            position: absolute;
            left: 0;
            right: auto;
            top: auto;
            bottom: calc(100% + 8px);
            min-width: 160px;
            max-width: min(320px, calc(100vw - 24px));
            max-height: 60vh;
            overflow-y: auto;
            padding: 6px;
            border-radius: 12px;
            background: var(--nv-bg);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            z-index: 100;
            scrollbar-width: thin;
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
            border-radius: 8px;
            padding: 7px 12px;
            cursor: pointer;
            text-align: left;
            font-family: var(--nv-body-font);
            font-size: 12px;
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
            border-radius: 50%;
            padding: 2px 4px;
            transition: background 0.15s ease, color 0.15s ease;
        }

        .nv-custom-edit-btn.visible {
            display: inline-flex;
        }

        .nv-custom-edit-btn:hover {
            background: var(--nv-controls-hover);
            color: var(--nv-text);
        }

        .nv-custom-edit-btn svg {
            width: 13px;
            height: 13px;
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

        @media screen and (max-width: 1024px) {
            body {
                place-items: stretch;
                padding: 0;
            }

            .novel-viewer {
                width: 100vw;
                height: 100dvh;
                border-radius: 0;
            }

            .novel-header {
                padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 4px;
                margin-bottom: 8px;
            }

            .bookmark-container {
                width: 250px;
                height: 55px;
            }

            .bookmark-row {
                gap: 12px;
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
                padding-bottom: 16px;
            }

            .novel-page-footer {
                padding: 10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px);
            }

            .novel-page-progress {
                gap: 8px;
            }

            .novel-page-progress-slider {
                min-height: 24px;
            }

            .nv-theme-dropdown {
                position: fixed;
                top: auto;
                left: 12px;
                right: 12px;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 72px);
                min-width: 0;
                max-height: min(50dvh, 420px);
                border: 1px solid var(--nv-rule);
                box-shadow: none;
            }

            /* ── 캐시 관리 모바일 ── */

            .nv-modal-header {
                padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px;
            }

            .nv-modal-body {
                padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 20px);
            }

            .nv-cache-layout {
                gap: 24px;
            }

            .nv-cache-current-card {
                gap: 14px;
                padding: 16px 0;
            }

            .nv-cache-card-title {
                font-size: 17px;
            }

            .nv-cache-stat-value {
                font-size: 16px;
            }

            .nv-cache-stats {
                padding-top: 12px;
            }

            .nv-cache-row {
                padding: 14px 0;
            }

            .nv-cache-row-title {
                font-size: 13px;
            }

            .nv-cache-delete {
                min-height: 44px;
                padding: 0 14px;
                font-size: 12px;
            }

            .nv-cache-clear-all {
                min-height: 44px;
                padding: 0 14px;
                font-size: 12px;
            }

            .nv-cache-empty {
                padding: 28px 8px;
            }

            .nv-more-menu {
                right: -8px;
                min-width: 172px;
            }

            .nv-action-btn {
                padding: 12px 14px;
                font-size: 14px;
            }
        }
    `;
  document.head.appendChild(style);
}

function getDisplayName(context) {
  if (typeof context.chat?.name === "string" && context.chat.name.trim()) {
    return context.chat.name.trim();
  }
  if (context.messages.length > 0) {
    const firstRole = context.messages[0]?.role;
    if (firstRole === "char") {
      return context.character?.name || "Character";
    }
  }
  return context.character?.name || "Reader";
}

function cycleValue(list, current) {
  const index = list.indexOf(current);
  return list[(index + 1 + list.length) % list.length];
}

async function getArgumentOrDefault(api, key) {
  try {
    const value = await api.getArgument(key);
    return typeof value === "string" && value.length > 0
      ? value
      : DEFAULT_SETTINGS[key];
  } catch (error) {
    await api.log(`Ebook Reader getArgument failed (${key}): ${error.message}`);
    return DEFAULT_SETTINGS[key];
  }
}

async function setArgumentSafe(api, key, value) {
  try {
    await api.setArgument(key, value);
  } catch (error) {
    await api.log(`Ebook Reader setArgument failed (${key}): ${error.message}`);
  }
}

async function getPluginStorageItem(api, key, fallback) {
  try {
    const value = await api.pluginStorage.getItem(key);
    return value ?? fallback;
  } catch (error) {
    await api.log(
      `Ebook Reader pluginStorage read failed (${key}): ${error.message}`,
    );
    return fallback;
  }
}

async function setPluginStorageItem(api, key, value) {
  try {
    await api.pluginStorage.setItem(key, value);
  } catch (error) {
    await api.log(
      `Ebook Reader pluginStorage write failed (${key}): ${error.message}`,
    );
  }
}

async function removePluginStorageItem(api, key) {
  try {
    await api.pluginStorage.removeItem(key);
  } catch (error) {
    await api.log(
      `Ebook Reader pluginStorage remove failed (${key}): ${error.message}`,
    );
  }
}

async function getPluginStorageKeys(api) {
  try {
    const keys = await api.pluginStorage.keys();
    return Array.isArray(keys) ? keys : [];
  } catch (error) {
    await api.log(
      `Ebook Reader pluginStorage keys failed: ${error.message}`,
    );
    return [];
  }
}

function getReaderCacheKey(characterIndex, chatIndex) {
  return `${CACHE_ENTRY_PREFIX}${characterIndex}:${chatIndex}`;
}

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return String(hash >>> 0);
}

function buildReaderCacheSignature(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastMessage = safeMessages[safeMessages.length - 1] || {};
  const lastPayload = JSON.stringify({
    role: lastMessage.role || "",
    data: lastMessage.data || "",
  });
  return {
    messageCount: safeMessages.length,
    lastMessageHash: hashString(lastPayload),
  };
}

function isReaderEditionCacheValid(cacheEntry, signature) {
  if (!cacheEntry || !signature) {
    return false;
  }
  return (
    cacheEntry.messageCount === signature.messageCount &&
    cacheEntry.lastMessageHash === signature.lastMessageHash &&
    typeof cacheEntry.renderedHtml === "string" &&
    cacheEntry.renderedHtml.length > 0
  );
}

function countRenderedParagraphs(renderedHtml) {
  if (typeof renderedHtml !== "string" || renderedHtml.length === 0) {
    return 0;
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderedHtml;
  return wrapper.querySelectorAll("p, li").length;
}

function clampParagraphIndex(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function normalizeReaderBookmarks(bookmarks) {
  if (!Array.isArray(bookmarks)) {
    return [];
  }
  return bookmarks
    .map((bookmark) => {
      if (!bookmark || typeof bookmark !== "object") {
        return null;
      }
      return {
        id:
          typeof bookmark.id === "string" && bookmark.id.length > 0
            ? bookmark.id
            : `bookmark-${Date.now()}`,
        messageIndex: clampParagraphIndex(bookmark.messageIndex),
        paragraphIndex: clampParagraphIndex(bookmark.paragraphIndex),
        preview:
          typeof bookmark.preview === "string" ? bookmark.preview : "",
        createdAt:
          typeof bookmark.createdAt === "number" ? bookmark.createdAt : Date.now(),
      };
    })
    .filter(Boolean);
}

function normalizeReaderLocation(location) {
  if (!location || typeof location !== "object") {
    return {
      messageIndex: 0,
      paragraphIndex: 0,
      preview: "",
      updatedAt: null,
    };
  }
  return {
    messageIndex: clampParagraphIndex(location.messageIndex),
    paragraphIndex: clampParagraphIndex(location.paragraphIndex),
    preview: typeof location.preview === "string" ? location.preview : "",
    updatedAt: typeof location.updatedAt === "number" ? location.updatedAt : null,
  };
}

function normalizeReaderEditionCache(cacheEntry) {
  if (!cacheEntry || typeof cacheEntry !== "object") {
    return null;
  }
  return {
    ...cacheEntry,
    bookmarks: normalizeReaderBookmarks(cacheEntry.bookmarks),
    lastLocation: normalizeReaderLocation(cacheEntry.lastLocation),
  };
}

function makeBookmarkId() {
  return `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatLocationLabel(location) {
  if (!location) {
    return "메시지 1 · 문단 1";
  }
  return `메시지 ${location.messageIndex + 1} · 문단 ${location.paragraphIndex + 1}`;
}

function truncateBookmarkPreview(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "미리보기를 불러올 수 없습니다.";
  }
  return normalized.length > 90 ? `${normalized.slice(0, 90)}…` : normalized;
}

function formatCacheTimestamp(value) {
  if (!value) {
    return "없음";
  }
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return "없음";
  }
}

async function getReaderCacheIndex(api) {
  const stored = await getPluginStorageItem(api, CACHE_INDEX_KEY, { entries: [] });
  const entries = Array.isArray(stored?.entries) ? stored.entries : [];
  return { entries };
}

async function setReaderCacheIndex(api, index) {
  const entries = Array.isArray(index?.entries) ? index.entries : [];
  await setPluginStorageItem(api, CACHE_INDEX_KEY, { entries });
}

async function loadReaderEditionCache(api, cacheKey) {
  const cacheEntry = await getPluginStorageItem(api, cacheKey, null);
  return normalizeReaderEditionCache(cacheEntry);
}

async function saveReaderEditionCache(api, context, cacheEntry) {
  const cacheKey = getReaderCacheKey(context.characterIndex, context.chatIndex);
  await setPluginStorageItem(api, cacheKey, cacheEntry);
  const index = await getReaderCacheIndex(api);
  const nextEntries = index.entries.filter((entry) => entry.cacheKey !== cacheKey);
  nextEntries.unshift({
    cacheKey,
    characterIndex: context.characterIndex,
    chatIndex: context.chatIndex,
    title: getDisplayName(context),
    characterName: context.character?.name || "Character",
    updatedAt: cacheEntry.updatedAt,
    messageCount: cacheEntry.messageCount,
    paragraphCount: cacheEntry.paragraphCount,
    lastMessageHash: cacheEntry.lastMessageHash,
  });
  await setReaderCacheIndex(api, { entries: nextEntries });
}

async function deleteReaderEditionCache(api, cacheKey) {
  await removePluginStorageItem(api, cacheKey);
  const index = await getReaderCacheIndex(api);
  await setReaderCacheIndex(api, {
    entries: index.entries.filter((entry) => entry.cacheKey !== cacheKey),
  });
}

async function clearReaderEditionCaches(api) {
  const keys = await getPluginStorageKeys(api);
  const cacheKeys = keys.filter((key) => key === CACHE_INDEX_KEY || key.startsWith(CACHE_ENTRY_PREFIX));
  for (const key of cacheKeys) {
    await removePluginStorageItem(api, key);
  }
}

async function persistCurrentCacheState(api) {
  if (!readerState.context || !readerState.currentCacheEntry) {
    return;
  }
  await saveReaderEditionCache(api, readerState.context, readerState.currentCacheEntry);
}

function normalizeTheme(theme) {
  return THEMES.some((themeOption) => themeOption.id === theme) ||
    theme === "custom"
    ? theme
    : DEFAULT_SETTINGS.theme;
}

function normalizeFont(font) {
  const mappedFont = font === "bookk" ? "BookkMyungjo" : font;
  return FONTS.some((fontOption) => fontOption.id === mappedFont) ||
    mappedFont === "_custom"
    ? mappedFont
    : DEFAULT_SETTINGS.font;
}

function getCustomThemeColor(key) {
  return readerState.customColors?.[key];
}

function buildCustomThemeVars() {
  const vars = {};
  for (const field of CUSTOM_THEME_FIELDS) {
    vars[field.cssVar] = getCustomThemeColor(field.key) || field.fallback;
  }
  vars["--nv-header-name"] = vars["--nv-text"];
  vars["--nv-highlight-text"] = vars["--nv-text"];
  vars["--nv-shadow"] = "rgba(0, 0, 0, 0.5)";
  vars["--nv-controls-bg"] = vars["--nv-bg"];
  vars["--nv-controls-hover"] = "rgba(128, 128, 128, 0.12)";
  return vars;
}

function updateActiveOptions(selector, dataKey, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.classList.toggle("active", element.dataset[dataKey] === value);
  });
}

function syncCustomDot() {
  const color = getCustomThemeColor("bg") || "#2a2a2a";
  document.querySelectorAll(".nv-custom-dot").forEach((dot) => {
    dot.style.background = color;
    dot.style.borderColor = color;
  });
}

function syncCustomEditButtons(themeId = readerState.theme) {
  document.querySelectorAll(".nv-custom-edit-btn").forEach((button) => {
    button.classList.toggle("visible", themeId === "custom");
  });
}

async function persistCustomColors(api) {
  await setPluginStorageItem(api, "customColors", readerState.customColors);
}

async function persistCustomFontCss(api) {
  await setPluginStorageItem(api, "customFontCss", readerState.customFontCss);
}

async function loadReaderSettings(api) {
  const theme = await getArgumentOrDefault(api, "theme");
  const font = await getArgumentOrDefault(api, "font");
  const bookmark = await getArgumentOrDefault(api, "bookmark");
  const customColors = await getPluginStorageItem(api, "customColors", {});
  const customFontCss = await getPluginStorageItem(api, "customFontCss", "");

  readerState.theme = normalizeTheme(theme);
  readerState.font = normalizeFont(font);
  readerState.showBookmark = bookmark !== "off";
  readerState.customColors =
    customColors && typeof customColors === "object" ? customColors : {};
  readerState.customFontCss =
    typeof customFontCss === "string" ? customFontCss : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function stripReaderMetaBlocks(value, isHtml = false) {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const strippedText = value
    .replace(/\[LBDATA START][\s\S]*?\[LBDATA END]\n*/gi, "")
    .replace(/<Thoughts>[\s\S]*?<\/Thoughts>\s*/gi, "")
    .replace(/<details[\s\S]*?<\/details>\s*/gi, "")
    .trim();

  if (!isHtml) {
    return strippedText;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = strippedText;
  wrapper
    .querySelectorAll(
      "details, .lb-rerolling, .lb-pending, lb-rerolling, lb-interacting",
    )
    .forEach((element) => element.remove());
  return wrapper.innerHTML.trim();
}

// TODO: restore direct illustration rendering when v3 plugins can safely access
// processed inlay assets without depending on main DOM blob URLs.
function stripIllustrationBlocks(value, isHtml = false) {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const strippedText = value
    .replace(/<lb-xnai[\s\S]*?<\/lb-xnai>\s*/gi, "")
    .replace(/{{(inlay|inlayed|inlayeddata)::.+?}}\s*/gi, "")
    .trim();

  if (!isHtml) {
    return strippedText;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = strippedText;
  wrapper
    .querySelectorAll(
      '.lb-xnai-inlay-wrapper, .lb-xnai-kv-wrapper, .risu-inlay-image, img[src^="blob:"], video[src], audio[src], lb-xnai',
    )
    .forEach((element) => element.remove());
  wrapper
    .querySelectorAll('source[src^="blob:"]')
    .forEach((source) => source.parentElement?.remove());
  return wrapper.innerHTML.trim();
}

function shouldUseProcessedHtml(html) {
  if (typeof html !== "string" || html.trim().length === 0) {
    return false;
  }

  return /<(img|video|audio)\b|lb-xnai-|risu-inlay-image/i.test(html);
}

function renderMarkdownBlock(block, role, messageIndex, paragraphIndex) {
  const trimmed = block.trim();
  if (!trimmed) {
    return "";
  }

  const locationAttrs = ` data-reader-anchor="true" data-message-index="${messageIndex}" data-paragraph-index="${paragraphIndex}"`;

  if (/^-{3,}$/.test(trimmed)) {
    return `<hr class="nv-md-rule"${locationAttrs}>`;
  }

  if (
    trimmed
      .split("\n")
      .every((line) => line.trim().startsWith(">"))
  ) {
    const quoteContent = trimmed
      .split("\n")
      .map((line) => line.trim().replace(/^>\s?/, ""))
      .filter(Boolean)
      .map((line) => `<p>${formatInlineMarkdown(line)}</p>`)
      .join("");
    return `<blockquote class="nv-md-quote"${locationAttrs}>${quoteContent}</blockquote>`;
  }

  if (
    trimmed
      .split("\n")
      .every((line) => line.trim().startsWith("- "))
  ) {
    const items = trimmed
      .split("\n")
      .map((line) => line.trim().replace(/^- /, ""))
      .filter(Boolean)
      .map((line) => `<li>${formatInlineMarkdown(line)}</li>`)
      .join("");
    return `<ul class="nv-md-list"${locationAttrs}>${items}</ul>`;
  }

  const paragraph = trimmed.replace(/\n+/g, " ");
  return `<p data-role="${escapeHtml(role)}"${locationAttrs}>${formatInlineMarkdown(paragraph)}</p>`;
}

function renderMessageContent(context) {
  const messages = context.messages
    .map((message, messageIndex) => ({ message, messageIndex }))
    .filter(({ message }) => {
      if (!message || typeof message.data !== "string") {
        return false;
      }

      if (
        message.disabled === true ||
        message.disabled === "allBefore" ||
        message.isComment
      ) {
        return false;
      }

      return message.data.trim().length > 0;
    });

  if (messages.length === 0) {
    return `<div class="nv-empty">No readable messages in this chat.</div>`;
  }

  return messages
    .map(({ message, messageIndex }) => {
      const processedHtml = stripReaderMetaBlocks(message.processedHtml, true);
      const readableHtml = stripIllustrationBlocks(processedHtml, true);
      if (shouldUseProcessedHtml(readableHtml)) {
        return `<div class="nv-processed-message" data-role="${escapeHtml(message.role || "")}" data-reader-anchor="true" data-message-index="${messageIndex}" data-paragraph-index="0">${readableHtml}</div>`;
      }

      const plainText = stripReaderMetaBlocks(message.data);
      const readableText = stripIllustrationBlocks(plainText);
      if (!readableText) {
        return "";
      }
      const blocks = readableText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      if (blocks.length === 0) {
        blocks.push(readableText.trim());
      }

      return blocks
        .map((block, paragraphIndex) =>
          renderMarkdownBlock(block, message.role, messageIndex, paragraphIndex),
        )
        .join("");
    })
    .join("");
}

function getContentElement() {
  return document.querySelector(".novel-content");
}

function getIndicatorElement() {
  return document.querySelector(".novel-page-indicator");
}

function getProgressInputElement() {
  return document.querySelector('[data-action="page-progress"]');
}

function getReaderAnchors(contentEl = getContentElement()) {
  if (!contentEl) {
    return [];
  }
  return Array.from(contentEl.querySelectorAll('[data-reader-anchor="true"]'));
}

function getAnchorLocation(anchor) {
  if (!(anchor instanceof HTMLElement)) {
    return null;
  }
  return {
    messageIndex: clampParagraphIndex(anchor.dataset.messageIndex),
    paragraphIndex: clampParagraphIndex(anchor.dataset.paragraphIndex),
    preview: truncateBookmarkPreview(anchor.textContent || ""),
    updatedAt: Date.now(),
  };
}

function getNavIcon(direction) {
  const icons = {
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    bookmark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path></svg>',
    hamburger:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>',
    more:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></svg>',
    first:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    last: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>',
  };
  return icons[direction];
}

function getViewerElement() {
  return document.querySelector(".novel-viewer");
}

function isMobile() {
  return window.innerWidth <= 1024;
}

function setupColumns(contentEl) {
  if (!contentEl) {
    return;
  }

  if (isMobile()) {
    contentEl.style.columnCount = "1";
    contentEl.style.columnWidth = `${Math.floor(contentEl.clientWidth)}px`;
    contentEl.style.columnGap = "30px";
  } else {
    const colWidth = Math.max(
      260,
      Math.floor((contentEl.clientWidth - 60) / 2),
    );
    contentEl.style.columnCount = "auto";
    contentEl.style.columnWidth = `${colWidth}px`;
    contentEl.style.columnGap = "60px";
  }
}

function getPageWidth(contentEl) {
  const gap = Number.parseFloat(
    window.getComputedStyle(contentEl).columnGap || "60",
  );
  return Math.max(1, Math.floor(contentEl.clientWidth + gap));
}

function getPendingPage() {
  if (
    Number.isInteger(readerState.pendingPage) &&
    readerState.pendingPage !== null
  ) {
    return Math.max(
      0,
      Math.min(readerState.pendingPage, readerState.totalPages - 1),
    );
  }
  return readerState.currentPage;
}

function updateProgressControl() {
  const progressInput = getProgressInputElement();
  if (!(progressInput instanceof HTMLInputElement)) {
    return;
  }

  progressInput.min = "1";
  progressInput.max = String(Math.max(1, readerState.totalPages));
  progressInput.value = String(getPendingPage() + 1);
  progressInput.disabled = readerState.totalPages <= 1;
}

function updateIndicator() {
  const indicator = getIndicatorElement();
  if (!indicator) {
    return;
  }

  indicator.textContent = `${getPendingPage() + 1} / ${readerState.totalPages}`;
  updateProgressControl();
}

function updatePageInfo(contentEl) {
  if (!contentEl) {
    return;
  }

  const pageWidth = getPageWidth(contentEl);
  readerState.totalPages = Math.max(
    1,
    Math.ceil(contentEl.scrollWidth / pageWidth),
  );
  readerState.currentPage = Math.min(
    readerState.currentPage,
    readerState.totalPages - 1,
  );
  readerState.currentPage = Math.max(readerState.currentPage, 0);
  updateIndicator();
}

function clearNavigationPageLock() {
  if (readerState.navigationLockTimer) {
    clearTimeout(readerState.navigationLockTimer);
    readerState.navigationLockTimer = null;
  }
  readerState.navigationLockPage = null;
}

function resolveCurrentPageFromScroll(
  contentEl,
  navigationLockPage = null,
  totalPages = readerState.totalPages,
) {
  const pageWidth = getPageWidth(contentEl);
  const page = Math.max(
    0,
    Math.min(
      totalPages - 1,
      Math.round(contentEl.scrollLeft / pageWidth),
    ),
  );

  if (navigationLockPage === null || navigationLockPage === undefined) {
    return {
      page,
      keepNavigationLock: false,
    };
  }

  const maxLeft = Math.max(0, contentEl.scrollWidth - contentEl.clientWidth);
  const targetLeft = Math.max(
    0,
    Math.min(navigationLockPage * pageWidth, maxLeft),
  );
  const lockThreshold = Math.max(12, Math.floor(pageWidth * 0.1));

  if (Math.abs(contentEl.scrollLeft - targetLeft) > lockThreshold) {
    return {
      page: navigationLockPage,
      keepNavigationLock: true,
    };
  }

  return {
    page: navigationLockPage,
    keepNavigationLock: false,
  };
}

function scrollToPage(contentEl, behavior = "smooth") {
  if (!contentEl) {
    return;
  }

  const pageWidth = getPageWidth(contentEl);
  const left = Math.max(
    0,
    Math.min(
      readerState.currentPage * pageWidth,
      contentEl.scrollWidth - contentEl.clientWidth,
    ),
  );
  if (behavior === "smooth") {
    readerState.navigationLockPage = readerState.currentPage;
    if (readerState.navigationLockTimer) {
      clearTimeout(readerState.navigationLockTimer);
    }
    readerState.navigationLockTimer = setTimeout(() => {
      clearNavigationPageLock();
    }, 700);
  } else {
    clearNavigationPageLock();
  }
  contentEl.scrollTo({ left, behavior });
  updateIndicator();
}

function setPage(contentEl, nextPage) {
  readerState.pendingPage = null;
  readerState.currentPage = Math.max(
    0,
    Math.min(nextPage, readerState.totalPages - 1),
  );
  scrollToPage(contentEl);
}

function getCurrentReaderLocation(contentEl = getContentElement()) {
  const anchors = getReaderAnchors(contentEl);
  if (anchors.length === 0 || !contentEl) {
    return normalizeReaderLocation(null);
  }

  const contentRect = contentEl.getBoundingClientRect();
  let bestAnchor = anchors[0];
  let bestScore = Number.POSITIVE_INFINITY;

  anchors.forEach((anchor) => {
    if (!(anchor instanceof HTMLElement)) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const isVisible =
      rect.bottom > contentRect.top + 8 &&
      rect.top < contentRect.bottom - 8 &&
      rect.right > contentRect.left + 8 &&
      rect.left < contentRect.right - 8;
    const horizontalOffset = isVisible
      ? Math.max(0, rect.left - contentRect.left)
      : Math.abs(rect.left - contentRect.left) + 100000;
    const verticalOffset = Math.abs(rect.top - contentRect.top);
    const score = horizontalOffset * 10000 + verticalOffset;
    if (score < bestScore) {
      bestScore = score;
      bestAnchor = anchor;
    }
  });

  return getAnchorLocation(bestAnchor);
}

function getAnchorForLocation(contentEl, location) {
  if (!contentEl || !location) {
    return null;
  }
  return contentEl.querySelector(
    `[data-reader-anchor="true"][data-message-index="${location.messageIndex}"][data-paragraph-index="${location.paragraphIndex}"]`,
  );
}

function jumpToBookmark(contentEl, location) {
  const anchor = getAnchorForLocation(contentEl, location);
  if (!(anchor instanceof HTMLElement) || !contentEl) {
    return false;
  }
  const pageWidth = getPageWidth(contentEl);
  const targetPage = Math.max(
    0,
    Math.min(
      readerState.totalPages - 1,
      Math.floor(anchor.offsetLeft / Math.max(pageWidth, 1)),
    ),
  );
  readerState.currentPage = targetPage;
  scrollToPage(contentEl);
  readerState.currentLocation = normalizeReaderLocation(location);
  updateIndicator();
  return true;
}

function applyTheme(themeId) {
  const viewer = getViewerElement();
  if (!viewer) {
    return;
  }

  viewer.dataset.theme = themeId;
  const vars =
    themeId === "custom"
      ? buildCustomThemeVars()
      : THEME_VARS[themeId] || THEME_VARS.light;
  for (const [key, value] of Object.entries(vars)) {
    viewer.style.setProperty(key, value);
  }
  updateActiveOptions(".nv-theme-option", "theme", themeId);
  syncCustomEditButtons(themeId);
  if (themeId === "custom") {
    syncCustomDot();
  }
}

function applyFont(fontId) {
  const viewer = getViewerElement();
  if (!viewer) {
    return;
  }

  const font =
    FONTS.find((fontOption) => fontOption.id === normalizeFont(fontId)) ||
    FONTS[0];
  viewer.style.setProperty("--nv-body-font", font.family);

  let customStyle = document.getElementById(CUSTOM_FONT_STYLE_ID);
  if (!customStyle && readerState.customFontCss.trim()) {
    customStyle = document.createElement("style");
    customStyle.id = CUSTOM_FONT_STYLE_ID;
    document.head.appendChild(customStyle);
  }
  if (readerState.font === "_custom" && readerState.customFontCss.trim()) {
    if (!customStyle) {
      customStyle = document.createElement("style");
      customStyle.id = CUSTOM_FONT_STYLE_ID;
      document.head.appendChild(customStyle);
    }
    customStyle.textContent = readerState.customFontCss;
  } else if (customStyle) {
    customStyle.remove();
  }
  updateActiveOptions(".nv-font-option", "font", readerState.font);
  document
    .querySelectorAll(".nv-font-option .nv-font-check")
    .forEach((element) => {
      const option = element.closest(".nv-font-option");
      element.textContent = option?.classList.contains("active") ? "✓" : "";
    });
}

function applyBookmarkVisibility() {
  const bookmarks = document.querySelectorAll(".bookmark-container");
  if (bookmarks.length === 0) {
    return;
  }

  bookmarks.forEach((bookmark) => {
    if (bookmark instanceof HTMLElement) {
      if (readerState.showBookmark && bookmark.dataset.hasImage !== "false") {
        bookmark.style.display = "";
      } else {
        bookmark.style.display = "none";
      }
    }
  });
  document.querySelectorAll(".nv-bookmark-switch").forEach((element) => {
    element.classList.toggle("on", readerState.showBookmark);
  });
}

function ensureColorPickerOverlay(api) {
  if (window._nvPickerOverlay) {
    return window._nvPickerOverlay;
  }

  const hsvToHex = (h, s, v) => {
    const sUnit = s / 100;
    const vUnit = v / 100;
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return vUnit - vUnit * sUnit * Math.max(0, Math.min(k, 4 - k, 1));
    };
    const toHex = (value) =>
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
  };

  const hexToHsv = (hex) => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6;
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) {
        h += 360;
      }
    }
    return {
      h,
      s: max === 0 ? 0 : Math.round((delta / max) * 100),
      v: Math.round(max * 100),
    };
  };

  const overlay = document.createElement("div");
  overlay.className = "nv-picker-overlay";
  overlay.id = "_nv-picker-overlay";

  const box = document.createElement("div");
  box.className = "nv-picker-box";

  const header = document.createElement("div");
  header.className = "nv-picker-header";

  const title = document.createElement("div");
  title.className = "nv-picker-title";
  title.textContent = "색상 선택";

  const closeButton = document.createElement("button");
  closeButton.className = "nv-picker-close";
  closeButton.textContent = "✕";
  closeButton.addEventListener("click", () => overlay.classList.remove("open"));

  header.append(title, closeButton);

  const grid = document.createElement("div");
  grid.className = "nv-picker-grid";
  grid.id = "_nv-picker-grid";

  const svBox = document.createElement("div");
  svBox.className = "nv-sv-box";
  svBox.id = "_nv-sv-box";
  const svWhite = document.createElement("div");
  svWhite.className = "nv-sv-white";
  const svBlack = document.createElement("div");
  svBlack.className = "nv-sv-black";
  const svCursor = document.createElement("div");
  svCursor.className = "nv-sv-cursor";
  svBox.append(svWhite, svBlack, svCursor);

  const sliders = document.createElement("div");
  sliders.className = "nv-sliders";
  sliders.id = "_nv-sliders";
  const previewCircle = document.createElement("div");
  previewCircle.className = "nv-preview-circle";
  const hueSlider = document.createElement("input");
  hueSlider.type = "range";
  hueSlider.className = "nv-hue-slider";
  hueSlider.min = "0";
  hueSlider.max = "360";
  hueSlider.value = "0";
  sliders.append(previewCircle, hueSlider);

  const hexRow = document.createElement("div");
  hexRow.className = "nv-hex-row";
  hexRow.id = "_nv-hex-row";
  const hexInput = document.createElement("input");
  hexInput.className = "nv-hex-input";
  hexInput.maxLength = 7;
  hexInput.placeholder = "#000000";
  hexRow.appendChild(hexInput);

  box.append(header, grid, svBox, sliders, hexRow);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.classList.remove("open");
    }
  });

  const pickerState = {
    h: 0,
    s: 0,
    v: 0,
    activeField: null,
    activeCircle: null,
  };
  window._nvPickerOverlay = overlay;
  window._nvPickerState = pickerState;

  const updateFromHsv = async (h, s, v, skipHex = false) => {
    pickerState.h = h;
    pickerState.s = s;
    pickerState.v = v;
    const hex = hsvToHex(h, s, v);
    const hueHex = hsvToHex(h, 100, 100);
    svBox.style.background = hueHex;
    svCursor.style.left = `${s}%`;
    svCursor.style.top = `${100 - v}%`;
    svCursor.style.background = hex;
    hueSlider.value = String(h);
    previewCircle.style.background = hex;
    if (!skipHex) {
      hexInput.value = hex;
    }
    if (pickerState.activeCircle) {
      pickerState.activeCircle.style.background = hex;
    }
    if (pickerState.activeField) {
      readerState.customColors = {
        ...(readerState.customColors || {}),
        [pickerState.activeField.key]: hex,
      };
      applyTheme("custom");
      syncCustomDot();
      await persistCustomColors(api);
    }
  };

  let dragging = false;
  const updateFromPointer = (event) => {
    const point = event.touches?.[0] ?? event;
    const rect = svBox.getBoundingClientRect();
    const s = Math.max(
      0,
      Math.min(100, ((point.clientX - rect.left) / rect.width) * 100),
    );
    const v = Math.max(
      0,
      Math.min(100, 100 - ((point.clientY - rect.top) / rect.height) * 100),
    );
    updateFromHsv(pickerState.h, s, v);
  };

  svBox.addEventListener("mousedown", (event) => {
    dragging = true;
    updateFromPointer(event);
  });
  document.addEventListener("mousemove", (event) => {
    if (dragging) {
      updateFromPointer(event);
    }
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  svBox.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      updateFromPointer(event);
    },
    { passive: false },
  );
  svBox.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      updateFromPointer(event);
    },
    { passive: false },
  );

  hueSlider.addEventListener("input", () => {
    updateFromHsv(
      Number.parseInt(hueSlider.value, 10),
      pickerState.s,
      pickerState.v,
    );
  });

  hexInput.addEventListener("input", () => {
    const value = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      const hsv = hexToHsv(value);
      updateFromHsv(hsv.h, hsv.s, hsv.v, true);
    }
  });

  CUSTOM_THEME_FIELDS.forEach((field) => {
    const pickerField = document.createElement("div");
    pickerField.className = "nv-picker-field";

    const circle = document.createElement("div");
    circle.className = "nv-picker-circle";
    circle.style.background = getCustomThemeColor(field.key) || field.fallback;

    const label = document.createElement("div");
    label.className = "nv-picker-field-label";
    label.textContent = field.label;

    const openField = (event) => {
      event.preventDefault();
      event.stopPropagation();
      document
        .querySelectorAll(".nv-picker-circle.editing")
        .forEach((element) => {
          element.classList.remove("editing");
        });
      circle.classList.add("editing");
      pickerState.activeField = field;
      pickerState.activeCircle = circle;
      svBox.classList.add("visible");
      sliders.classList.add("visible");
      hexRow.classList.add("visible");
      const color = getCustomThemeColor(field.key) || field.fallback;
      const hsv = hexToHsv(color);
      updateFromHsv(hsv.h, hsv.s, hsv.v);
    };

    pickerField.addEventListener("mousedown", openField);
    pickerField.addEventListener("touchstart", openField, { passive: false });
    pickerField.append(circle, label);
    grid.appendChild(pickerField);
  });

  return overlay;
}

function createThemeToggle(api) {
  const wrap = document.createElement("div");
  wrap.className = "nv-theme-wrap";

  const button = document.createElement("button");
  button.className = "nv-theme-btn";
  button.type = "button";
  button.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>';

  const dropdown = document.createElement("div");
  dropdown.className = "nv-theme-dropdown";

  const closeDropdown = () => dropdown.classList.remove("open");
  const onDocClick = (event) => {
    if (!wrap.contains(event.target)) {
      closeDropdown();
    }
  };
  document.addEventListener("click", onDocClick);

  THEMES.forEach((theme) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = `nv-theme-option${readerState.theme === theme.id ? " active" : ""}`;
    option.dataset.theme = theme.id;
    option.innerHTML = `<span class="nv-theme-dot" style="background:${theme.dot};border-color:${theme.border}"></span>${theme.label}`;
    const selectTheme = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      readerState.theme = theme.id;
      applyTheme(theme.id);
      await setArgumentSafe(api, "theme", theme.id);
      closeDropdown();
    };
    option.addEventListener("mousedown", (event) => {
      selectTheme(event).catch(() => {});
    });
    option.addEventListener(
      "touchstart",
      (event) => {
        selectTheme(event).catch(() => {});
      },
      { passive: false },
    );
    dropdown.appendChild(option);
  });

  const customOption = document.createElement("button");
  customOption.type = "button";
  customOption.className = `nv-theme-option${readerState.theme === "custom" ? " active" : ""}`;
  customOption.dataset.theme = "custom";
  customOption.style.cssText =
    "display:flex;align-items:center;gap:8px;width:100%;";

  const customDot = document.createElement("span");
  customDot.className = "nv-theme-dot nv-custom-dot";
  const customLabel = document.createElement("span");
  customLabel.style.cssText = "flex:1;text-align:left;";
  customLabel.textContent = "커스텀";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = `nv-custom-edit-btn${readerState.theme === "custom" ? " visible" : ""}`;
  editButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
  const openColorPanel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeDropdown();
    const overlay = ensureColorPickerOverlay(api);
    overlay.classList.add("open");
    const firstCircle = overlay.querySelector(".nv-picker-field");
    firstCircle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  };
  editButton.addEventListener("mousedown", openColorPanel);
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  editButton.addEventListener("touchstart", openColorPanel, { passive: false });

  customOption.append(customDot, customLabel, editButton);
  const selectCustom = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    readerState.theme = "custom";
    applyTheme("custom");
    await setArgumentSafe(api, "theme", "custom");
    closeDropdown();
  };
  customOption.addEventListener("mousedown", (event) => {
    selectCustom(event).catch(() => {});
  });
  customOption.addEventListener(
    "touchstart",
    (event) => {
      selectCustom(event).catch(() => {});
    },
    { passive: false },
  );
  dropdown.appendChild(customOption);

  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-dropdown-divider",
    }),
  );
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-section-label",
      textContent: "폰트",
    }),
  );

  FONTS.forEach((font) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = `nv-font-option${readerState.font === font.id ? " active" : ""}`;
    option.dataset.font = font.id;
    option.style.setProperty("font-family", font.family, "important");
    option.innerHTML = `<span class="nv-font-check">${readerState.font === font.id ? "✓" : ""}</span>${font.label}`;
    const selectFont = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      readerState.font = font.id;
      applyFont(font.id);
      await setArgumentSafe(api, "font", font.id);
    };
    option.addEventListener("mousedown", (event) => {
      selectFont(event).catch(() => {});
    });
    option.addEventListener(
      "touchstart",
      (event) => {
        selectFont(event).catch(() => {});
      },
      { passive: false },
    );
    dropdown.appendChild(option);
  });

  const fontCustomRow = document.createElement("div");
  fontCustomRow.className = "nv-font-custom-row";
  const fontCustomToggle = document.createElement("button");
  fontCustomToggle.type = "button";
  fontCustomToggle.className = "nv-font-custom-toggle";
  const fontCustomToggleLabel = document.createElement("span");
  fontCustomToggleLabel.className = "nv-font-custom-toggle-label";
  fontCustomToggleLabel.textContent = "직접 입력 (CSS)";
  const fontCustomToggleArrow = document.createElement("span");
  fontCustomToggleArrow.className = "nv-font-custom-toggle-arrow";
  fontCustomToggleArrow.textContent = "▼";
  fontCustomToggle.append(fontCustomToggleLabel, fontCustomToggleArrow);

  const fontCustomArea = document.createElement("div");
  fontCustomArea.className = "nv-font-custom-area";
  const fontCustomTextarea = document.createElement("textarea");
  fontCustomTextarea.className = "nv-font-custom-textarea";
  fontCustomTextarea.value = readerState.customFontCss;
  fontCustomTextarea.placeholder =
    '@font-face {\n  font-family: "MyFont";\n  src: url("...") format("woff2");\n}\n.novel-viewer * {\n  font-family: "MyFont" !important;\n}';

  const fontCustomButtons = document.createElement("div");
  fontCustomButtons.className = "nv-font-custom-btns";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "nv-font-custom-btn";
  clearButton.textContent = "초기화";
  clearButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    readerState.customFontCss = "";
    fontCustomTextarea.value = "";
    readerState.font = DEFAULT_SETTINGS.font;
    await persistCustomFontCss(api);
    await setArgumentSafe(api, "font", DEFAULT_SETTINGS.font);
    applyFont(DEFAULT_SETTINGS.font);
  });

  const applyButton = document.createElement("button");
  applyButton.type = "button";
  applyButton.className = "nv-font-custom-btn primary";
  applyButton.textContent = "적용";
  applyButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    readerState.customFontCss = fontCustomTextarea.value;
    readerState.font = "_custom";
    await persistCustomFontCss(api);
    await setArgumentSafe(api, "font", "_custom");
    applyFont(DEFAULT_SETTINGS.font);
  });

  fontCustomButtons.append(clearButton, applyButton);
  fontCustomArea.append(fontCustomTextarea, fontCustomButtons);
  fontCustomToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = fontCustomArea.classList.toggle("open");
    fontCustomToggleArrow.classList.toggle("open", isOpen);
  });
  fontCustomRow.append(fontCustomToggle, fontCustomArea);
  dropdown.appendChild(fontCustomRow);

  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-dropdown-divider",
    }),
  );
  const bookmarkRow = document.createElement("button");
  bookmarkRow.type = "button";
  bookmarkRow.className = "nv-bookmark-row";
  bookmarkRow.innerHTML =
    '<span class="nv-bookmark-label">프로필 이미지 영역</span><span class="nv-bookmark-switch"></span>';
  const toggleBookmark = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    readerState.showBookmark = !readerState.showBookmark;
    applyBookmarkVisibility();
    await setArgumentSafe(
      api,
      "bookmark",
      readerState.showBookmark ? "on" : "off",
    );
  };
  bookmarkRow.addEventListener("mousedown", (event) => {
    toggleBookmark(event).catch(() => {});
  });
  bookmarkRow.addEventListener(
    "touchstart",
    (event) => {
      toggleBookmark(event).catch(() => {});
    },
    { passive: false },
  );
  dropdown.appendChild(bookmarkRow);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("open");
  });

  wrap.append(button, dropdown);
  syncCustomDot();
  syncCustomEditButtons();
  applyBookmarkVisibility();
  return {
    element: wrap,
    cleanup: () => document.removeEventListener("click", onDocClick),
  };
}

async function ensureRootPopoverFallback(api) {
  const granted = await api.requestPluginPermission("mainDom");
  if (!granted) {
    return;
  }
  const rootDoc = await api.getRootDocument();
  if (!rootDoc) {
    return;
  }
  const existing = await rootDoc.querySelector(`.${ROOT_POPOVER_STYLE_CLASS}`);
  if (existing) {
    return;
  }
  const head = await rootDoc.querySelector("head");
  if (!head) {
    return;
  }
  const style = await rootDoc.createElement("style");
  await style.setClassName(ROOT_POPOVER_STYLE_CLASS);
  await style.setTextContent(ROOT_POPOVER_FALLBACK_CSS);
  await head.appendChild(style);
}

// Temporary bridge: reuse the app's already-rendered chat HTML until v3 exposes
// processed display output or inlay asset access directly to plugins.
async function loadProcessedMessageHtml(api, messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const granted = await api.requestPluginPermission("mainDom");
  if (!granted) {
    return [];
  }

  try {
    const rootDoc = await api.getRootDocument();
    if (!rootDoc) {
      return [];
    }

    const processedMessageHtml = [];
    for (let index = 0; index < messages.length; index += 1) {
      const messageEl = await rootDoc.querySelector(
        `.default-chat-screen .risu-chat[data-chat-index="${index}"] .chattext`,
      );
      const html = messageEl ? await messageEl.getInnerHTML() : "";
      processedMessageHtml.push(html || "");
    }
    return processedMessageHtml;
  } catch (error) {
    await api.log(
      `Ebook Reader processed message capture failed: ${error.message}`,
    );
    return [];
  }
}

function renderReaderBody(context) {
  const contentEl = getContentElement();
  if (!contentEl) {
    return;
  }

  contentEl.innerHTML =
    typeof context.renderedHtml === "string" && context.renderedHtml.length > 0
      ? context.renderedHtml
      : renderMessageContent(context);
  setupColumns(contentEl);
  readerState.currentPage = 0;
  updatePageInfo(contentEl);
  scrollToPage(contentEl, "auto");
}

function renderLoadingState(label) {
  ensureReaderStyle();
  document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
            <div class="novel-body">
                <div class="nv-loading">
                    <div class="nv-loading-stack">
                        <div class="nv-loading-label">${escapeHtml(label)}</div>
                        <div class="nv-loading-bar" aria-hidden="true"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function closeModalById(id) {
  document.getElementById(id)?.classList.remove("open");
}

function closeMoreMenu() {
  document.querySelector(".nv-more-menu")?.classList.remove("open");
}

function ensureMoreMenu() {
  const wrap = document.querySelector(".nv-more-wrap");
  if (!wrap) {
    return null;
  }
  let menu = wrap.querySelector(".nv-more-menu");
  if (menu) {
    return menu;
  }
  menu = document.createElement("div");
  menu.className = "nv-more-menu";
  menu.innerHTML = `
        <button class="nv-action-btn" type="button" data-action="open-bookmark-manager">책갈피 관리</button>
        <button class="nv-action-btn" type="button" data-action="open-cache-manager">판본 관리</button>
        <button class="nv-action-btn" type="button" disabled>원문 보기</button>
    `;
  wrap.appendChild(menu);
  return menu;
}

function buildCurrentSessionCacheSummary() {
  const context = readerState.context;
  if (!context) {
    return null;
  }
  const signature = readerState.currentCacheSignature;
  const entry = readerState.currentCacheEntry;
  return {
    title: getDisplayName(context),
    characterName: context.character?.name || "Character",
    updatedAt: entry?.updatedAt || null,
    messageCount: signature?.messageCount || context.messages?.length || 0,
    paragraphCount:
      entry?.paragraphCount || countRenderedParagraphs(context.renderedHtml || ""),
    cacheKey:
      readerState.currentCacheKey ||
      getReaderCacheKey(context.characterIndex, context.chatIndex),
    hasCache: Boolean(entry),
  };
}

function renderCacheRow(entry, isCurrent = false) {
  const stateText = isCurrent
    ? entry.hasCache
      ? "유효한 판본 있음"
      : "저장된 판본 없음"
    : entry.updatedAt
      ? formatCacheTimestamp(entry.updatedAt)
      : "없음";
  return `
        <div class="nv-cache-row" data-cache-key="${escapeHtml(entry.cacheKey)}">
            <div class="nv-cache-row-head">
                <div>
                    <div class="nv-cache-row-title">${escapeHtml(entry.title || "제목 없는 세션")}</div>
                    <div class="nv-cache-row-subtitle">${escapeHtml(entry.characterName || "캐릭터")} · ${isCurrent ? stateText : stateText}</div>
                </div>
                <button class="nv-cache-delete" type="button" data-action="delete-cache" data-cache-key="${escapeHtml(entry.cacheKey)}" aria-label="개별 삭제">삭제</button>
            </div>
            <div class="nv-cache-row-meta">
                <span>메시지 ${entry.messageCount || 0}</span>
                <span>문단 ${entry.paragraphCount || 0}</span>
            </div>
        </div>
    `;
}

function renderCurrentCacheCard(entry) {
  const stateText = entry.hasCache ? "유효한 판본 있음" : "저장된 판본 없음";
  const updatedText = entry.updatedAt
    ? formatCacheTimestamp(entry.updatedAt)
    : "아직 생성되지 않음";
  return `
        <div class="nv-cache-current-card" data-cache-key="${escapeHtml(entry.cacheKey)}">
            <div class="nv-cache-card-head">
                <div class="nv-cache-card-title">${escapeHtml(entry.title || "제목 없는 세션")}</div>
                <div class="nv-cache-card-subtitle">${escapeHtml(entry.characterName || "캐릭터")}</div>
            </div>
            <div class="nv-cache-card-meta">
                <span class="nv-cache-chip">${stateText}</span>
                <span class="nv-cache-chip">${updatedText}</span>
            </div>
            <div class="nv-cache-stats">
                <div class="nv-cache-stat">
                    <div class="nv-cache-stat-value">${entry.messageCount || 0}</div>
                    <div class="nv-cache-stat-label">메시지</div>
                </div>
                <div class="nv-cache-stat">
                    <div class="nv-cache-stat-value">${entry.paragraphCount || 0}</div>
                    <div class="nv-cache-stat-label">문단</div>
                </div>
                <div class="nv-cache-stat">
                    <div class="nv-cache-stat-value">${entry.hasCache ? "준비됨" : "없음"}</div>
                    <div class="nv-cache-stat-label">판본</div>
                </div>
            </div>
        </div>
    `;
}

function renderBookmarkCurrentCard(location) {
  return `
        <div class="nv-bookmark-current-card">
            <div class="nv-bookmark-title">${escapeHtml(formatLocationLabel(location))}</div>
            <div class="nv-bookmark-preview">${escapeHtml(location.preview || "현재 위치의 미리보기가 없습니다.")}</div>
            <div class="nv-bookmark-meta">
                <span class="nv-bookmark-chip">현재 위치</span>
                <span class="nv-bookmark-chip">${escapeHtml(formatLocationLabel(location))}</span>
            </div>
            <button class="nv-bookmark-primary" type="button" data-action="save-current-bookmark">현재 위치 저장</button>
        </div>
    `;
}

function renderLastLocationCard(location) {
  if (!location || (!location.updatedAt && !location.preview)) {
    return '<div class="nv-cache-empty">마지막 읽은 위치가 없습니다.</div>';
  }
  return `
        <div class="nv-bookmark-last-card">
            <div class="nv-bookmark-title">${escapeHtml(formatLocationLabel(location))}</div>
            <div class="nv-bookmark-preview">${escapeHtml(location.preview || "마지막 읽은 위치의 미리보기가 없습니다.")}</div>
            <div class="nv-bookmark-meta">
                <span class="nv-bookmark-chip">마지막 읽은 위치</span>
                <span class="nv-bookmark-chip">${escapeHtml(formatCacheTimestamp(location.updatedAt))}</span>
            </div>
        </div>
    `;
}

function renderBookmarkRow(bookmark) {
  return `
        <div class="nv-bookmark-item" data-bookmark-id="${escapeHtml(bookmark.id)}">
            <div class="nv-bookmark-item-head">
                <div>
                    <div class="nv-bookmark-item-title">${escapeHtml(formatLocationLabel(bookmark))}</div>
                    <div class="nv-bookmark-preview">${escapeHtml(bookmark.preview || "저장된 문단 미리보기가 없습니다.")}</div>
                </div>
                <div class="nv-bookmark-item-actions">
                    <button class="nv-bookmark-action" type="button" data-action="jump-bookmark" data-bookmark-id="${escapeHtml(bookmark.id)}">이동</button>
                    <button class="nv-bookmark-action" type="button" data-action="delete-bookmark" data-bookmark-id="${escapeHtml(bookmark.id)}">삭제</button>
                </div>
            </div>
            <div class="nv-bookmark-item-meta">
                <span class="nv-bookmark-chip">${escapeHtml(formatCacheTimestamp(bookmark.createdAt))}</span>
                <span class="nv-bookmark-chip">${escapeHtml(formatLocationLabel(bookmark))}</span>
            </div>
        </div>
    `;
}

function updateCurrentReadingLocation(contentEl, api, persist = true) {
  const location = getCurrentReaderLocation(contentEl);
  readerState.currentLocation = location;
  if (!readerState.currentCacheEntry) {
    return location;
  }
  readerState.currentCacheEntry.lastLocation = location;
  if (!persist || !api) {
    return location;
  }
  if (readerState.locationPersistTimer) {
    clearTimeout(readerState.locationPersistTimer);
  }
  readerState.locationPersistTimer = setTimeout(() => {
    persistCurrentCacheState(api).catch(() => {});
    readerState.locationPersistTimer = null;
  }, 150);
  return location;
}

async function saveCurrentBookmark(api, options = {}) {
  const { reopenPanel = false } = options;
  const contentEl = getContentElement();
  const location = updateCurrentReadingLocation(contentEl, api, false);
  if (!readerState.currentCacheEntry || !location) {
    return;
  }
  const existing = readerState.currentCacheEntry.bookmarks.find(
    (bookmark) =>
      bookmark.messageIndex === location.messageIndex &&
      bookmark.paragraphIndex === location.paragraphIndex,
  );
  if (existing) {
    existing.preview = location.preview;
    existing.createdAt = Date.now();
  } else {
    readerState.currentCacheEntry.bookmarks.unshift({
      id: makeBookmarkId(),
      messageIndex: location.messageIndex,
      paragraphIndex: location.paragraphIndex,
      preview: location.preview,
      createdAt: Date.now(),
    });
  }
  await persistCurrentCacheState(api);
  if (reopenPanel) {
    await openBookmarkPanel(api);
  }
}

async function ensureBookmarkPanel(api) {
  let panel = document.getElementById("nv-bookmark-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "nv-bookmark-panel";
    panel.className = "nv-bookmark-screen";
    panel.innerHTML = `
            <div class="nv-bookmark-shell">
                <div class="nv-modal-header">
                    <button class="nv-cache-back" type="button" data-action="close-bookmark-panel" aria-label="뒤로">${getNavIcon("prev")}</button>
                    <div class="nv-modal-title">책갈피</div>
                    <span class="nv-cache-header-spacer" aria-hidden="true"></span>
                </div>
                <div class="nv-bookmark-layout">
                    <section class="nv-bookmark-section">
                        <div class="nv-cache-section-title">현재 위치</div>
                        <div class="nv-bookmark-current"></div>
                    </section>
                    <section class="nv-bookmark-section">
                        <div class="nv-cache-section-title">마지막 읽은 위치</div>
                        <div class="nv-bookmark-last"></div>
                    </section>
                    <section class="nv-bookmark-section">
                        <div class="nv-cache-section-title">저장한 책갈피</div>
                        <div class="nv-bookmark-list"></div>
                    </section>
                </div>
            </div>
        `;
    panel
      .querySelector('[data-action="close-bookmark-panel"]')
      ?.addEventListener("click", () => {
        panel.classList.remove("open");
      });
    panel.addEventListener("click", async (event) => {
      const saveButton = event.target.closest('[data-action="save-current-bookmark"]');
      if (saveButton) {
        await saveCurrentBookmark(api, { reopenPanel: true });
        return;
      }

      const jumpButton = event.target.closest('[data-action="jump-bookmark"]');
      if (jumpButton) {
        const bookmarkId = jumpButton.dataset.bookmarkId;
        const bookmark = readerState.currentCacheEntry?.bookmarks.find(
          (item) => item.id === bookmarkId,
        );
        const contentEl = getContentElement();
        if (bookmark && contentEl && jumpToBookmark(contentEl, bookmark)) {
          updateCurrentReadingLocation(contentEl, api);
          panel.classList.remove("open");
        }
        return;
      }

      const deleteButton = event.target.closest('[data-action="delete-bookmark"]');
      if (!deleteButton) {
        return;
      }
      const bookmarkId = deleteButton.dataset.bookmarkId;
      if (!bookmarkId || !readerState.currentCacheEntry) {
        return;
      }
      readerState.currentCacheEntry.bookmarks = readerState.currentCacheEntry.bookmarks.filter(
        (item) => item.id !== bookmarkId,
      );
      await persistCurrentCacheState(api);
      await openBookmarkPanel(api);
    });
    const mountTarget = document.querySelector(".novel-viewer") || document.body;
    mountTarget.appendChild(panel);
  }
  return panel;
}

async function openBookmarkPanel(api) {
  const panel = await ensureBookmarkPanel(api);
  const contentEl = getContentElement();
  const currentLocation = updateCurrentReadingLocation(contentEl, api, false);
  const currentContainer = panel.querySelector(".nv-bookmark-current");
  const lastContainer = panel.querySelector(".nv-bookmark-last");
  const listContainer = panel.querySelector(".nv-bookmark-list");
  if (currentContainer) {
    currentContainer.innerHTML = renderBookmarkCurrentCard(currentLocation);
  }
  if (lastContainer) {
    lastContainer.innerHTML = renderLastLocationCard(
      normalizeReaderLocation(readerState.currentCacheEntry?.lastLocation),
    );
  }
  if (listContainer) {
    const bookmarks = readerState.currentCacheEntry?.bookmarks || [];
    listContainer.innerHTML =
      bookmarks.length > 0
        ? bookmarks.map((bookmark) => renderBookmarkRow(bookmark)).join("")
        : '<div class="nv-cache-empty">저장한 책갈피가 없습니다.</div>';
  }
  closeMoreMenu();
  panel.classList.add("open");
}

async function ensureCacheManagerModal(api) {
  let overlay = document.getElementById("nv-cache-manager-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "nv-cache-manager-modal";
    overlay.className = "nv-cache-manager-screen";
    overlay.innerHTML = `
            <div class="nv-cache-manager-shell">
                <div class="nv-modal-header">
                    <button class="nv-cache-back" type="button" data-action="close-cache-manager" aria-label="뒤로">${getNavIcon("prev")}</button>
                    <div class="nv-modal-title">판본 관리</div>
                    <span class="nv-cache-header-spacer" aria-hidden="true"></span>
                </div>
                <div class="nv-modal-body">
                    <div class="nv-cache-layout">
                        <section class="nv-cache-section">
                            <div class="nv-cache-section-title">읽고 있는 세션</div>
                            <div class="nv-cache-current"></div>
                        </section>
                        <section class="nv-cache-section">
                            <div class="nv-cache-list-header">
                                <div class="nv-cache-section-title">저장된 판본</div>
                                <button class="nv-cache-clear-all" type="button" data-action="clear-all-caches">전체 비우기</button>
                            </div>
                            <div class="nv-cache-list"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;
    overlay
      .querySelector('[data-action="close-cache-manager"]')
      ?.addEventListener("click", () => {
        overlay.classList.remove("open");
      });
    overlay
      .querySelector('[data-action="clear-all-caches"]')
      ?.addEventListener("click", async () => {
        if (!confirm("저장된 판본을 모두 삭제합니다. 계속하시겠습니까?")) {
          return;
        }
        await clearReaderEditionCaches(api);
        readerState.currentCacheEntry = null;
        await openCacheManagerModal(api);
      });
    overlay.addEventListener("click", async (event) => {
      const button = event.target.closest('[data-action="delete-cache"]');
      if (!button) {
        return;
      }
      const cacheKey = button.dataset.cacheKey;
      if (!cacheKey) {
        return;
      }
      if (!confirm("이 판본을 삭제하시겠습니까?")) {
        return;
      }
      await deleteReaderEditionCache(api, cacheKey);
      if (cacheKey === readerState.currentCacheKey) {
        readerState.currentCacheEntry = null;
      }
      await openCacheManagerModal(api);
    });
    const mountTarget = document.querySelector(".novel-viewer") || document.body;
    mountTarget.appendChild(overlay);
  }
  return overlay;
}

async function openCacheManagerModal(api) {
  const overlay = await ensureCacheManagerModal(api);
  const index = await getReaderCacheIndex(api);
  const currentSummary = buildCurrentSessionCacheSummary();
  const currentContainer = overlay.querySelector(".nv-cache-current");
  const listContainer = overlay.querySelector(".nv-cache-list");
  if (currentContainer) {
    currentContainer.innerHTML = currentSummary
      ? renderCurrentCacheCard(currentSummary)
      : '<div class="nv-cache-empty">열린 세션이 없습니다.</div>';
  }
  if (listContainer) {
    listContainer.innerHTML =
      index.entries.length > 0
        ? index.entries.map((entry) => renderCacheRow(entry)).join("")
        : '<div class="nv-cache-empty">저장된 판본이 없습니다.</div>';
  }
  closeMoreMenu();
  overlay.classList.add("open");
}

function toggleMoreMenu() {
  const menu = ensureMoreMenu();
  if (!menu) {
    return;
  }
  menu.classList.toggle("open");
}

function installReaderEvents(api) {
  readerState.cleanup?.();

  const contentEl = getContentElement();
  const closeLabelButton = document.querySelector(
    '[data-action="close-reader-label"]',
  );
  const bookmarkButton = document.querySelector(
    '[data-action="bookmark-placeholder"]',
  );
  const prevButton = document.querySelector('[data-action="prev"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const progressInput = getProgressInputElement();
  const moreButton = document.querySelector('[data-action="more-placeholder"]');
  const firstButton = document.querySelector('[data-action="first"]');
  const lastButton = document.querySelector('[data-action="last"]');
  const moreMenu = ensureMoreMenu();
  const openBookmarkManagerButton = moreMenu?.querySelector(
    '[data-action="open-bookmark-manager"]',
  );
  const openCacheManagerButton = moreMenu?.querySelector(
    '[data-action="open-cache-manager"]',
  );

  if (!contentEl) {
    return;
  }

  let touchStartX = 0;
  const onResize = () => {
    setupColumns(contentEl);
    updatePageInfo(contentEl);
    scrollToPage(contentEl, "auto");
    updateCurrentReadingLocation(contentEl, api);
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      closeReader(api).catch(() => {});
    } else if (event.key === "ArrowRight") {
      setPage(contentEl, readerState.currentPage + 1);
    } else if (event.key === "ArrowLeft") {
      setPage(contentEl, readerState.currentPage - 1);
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    if (event.deltaY > 0 || event.deltaX > 0) {
      setPage(contentEl, readerState.currentPage + 1);
    } else if (event.deltaY < 0 || event.deltaX < 0) {
      setPage(contentEl, readerState.currentPage - 1);
    }
  };

  const onScroll = () => {
    const nextPageState = resolveCurrentPageFromScroll(
      contentEl,
      readerState.navigationLockPage,
      readerState.totalPages,
    );
    readerState.currentPage = nextPageState.page;
    if (!nextPageState.keepNavigationLock) {
      clearNavigationPageLock();
    }
    updateIndicator();
    updateCurrentReadingLocation(contentEl, api);
  };

  const onTouchStart = (event) => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
  };

  const onTouchEnd = (event) => {
    const diff = touchStartX - (event.changedTouches[0]?.clientX || 0);
    if (Math.abs(diff) < 48) {
      return;
    }
    setPage(contentEl, readerState.currentPage + (diff > 0 ? 1 : -1));
  };

  const onClose = () => {
    closeReader(api).catch(() => {});
  };
  const onSaveBookmark = () => {
    saveCurrentBookmark(api).catch(() => {});
  };
  const onOpenBookmarkManager = () => {
    openBookmarkPanel(api).catch(() => {});
  };
  const onPrev = () => {
    setPage(contentEl, readerState.currentPage - 1);
  };
  const onNext = () => {
    setPage(contentEl, readerState.currentPage + 1);
  };
  const onFirst = () => {
    setPage(contentEl, 0);
  };
  const onLast = () => {
    setPage(contentEl, readerState.totalPages - 1);
  };
  const onMore = (event) => {
    event.stopPropagation();
    toggleMoreMenu();
  };
  const onProgressInput = (event) => {
    const value = Number.parseInt(event.currentTarget?.value || "", 10);
    if (!Number.isFinite(value)) {
      return;
    }
    readerState.pendingPage = Math.max(
      0,
      Math.min(value - 1, readerState.totalPages - 1),
    );
    updateIndicator();
  };
  const onProgressChange = (event) => {
    const value = Number.parseInt(event.currentTarget?.value || "", 10);
    if (!Number.isFinite(value)) {
      readerState.pendingPage = null;
      updateIndicator();
      return;
    }
    const pendingPage = Math.max(
      0,
      Math.min(value - 1, readerState.totalPages - 1),
    );
    setPage(contentEl, pendingPage);
  };
  const onOpenCacheManager = () => {
    openCacheManagerModal(api).catch(() => {});
  };
  const onDocumentClick = (event) => {
    if (!event.target.closest(".nv-more-wrap")) {
      closeMoreMenu();
    }
  };

  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocumentClick);
  contentEl.addEventListener("wheel", onWheel, { passive: false });
  contentEl.addEventListener("scroll", onScroll);
  contentEl.addEventListener("touchstart", onTouchStart, { passive: true });
  contentEl.addEventListener("touchend", onTouchEnd, { passive: true });
  closeLabelButton?.addEventListener("click", onClose);
  bookmarkButton?.addEventListener("click", onSaveBookmark);
  prevButton?.addEventListener("click", onPrev);
  nextButton?.addEventListener("click", onNext);
  progressInput?.addEventListener("input", onProgressInput);
  progressInput?.addEventListener("change", onProgressChange);
  moreButton?.addEventListener("click", onMore);
  openBookmarkManagerButton?.addEventListener("click", onOpenBookmarkManager);
  openCacheManagerButton?.addEventListener("click", onOpenCacheManager);
  firstButton?.addEventListener("click", onFirst);
  lastButton?.addEventListener("click", onLast);

  readerState.cleanup = () => {
    readerState.settingsCleanup?.();
    readerState.settingsCleanup = null;
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onDocumentClick);
    contentEl.removeEventListener("wheel", onWheel);
    contentEl.removeEventListener("scroll", onScroll);
    contentEl.removeEventListener("touchstart", onTouchStart);
    contentEl.removeEventListener("touchend", onTouchEnd);
    closeLabelButton?.removeEventListener("click", onClose);
    bookmarkButton?.removeEventListener("click", onSaveBookmark);
    prevButton?.removeEventListener("click", onPrev);
    nextButton?.removeEventListener("click", onNext);
    progressInput?.removeEventListener("input", onProgressInput);
    progressInput?.removeEventListener("change", onProgressChange);
    moreButton?.removeEventListener("click", onMore);
    openBookmarkManagerButton?.removeEventListener(
      "click",
      onOpenBookmarkManager,
    );
    openCacheManagerButton?.removeEventListener("click", onOpenCacheManager);
    firstButton?.removeEventListener("click", onFirst);
    lastButton?.removeEventListener("click", onLast);
    if (readerState.locationPersistTimer) {
      clearTimeout(readerState.locationPersistTimer);
      readerState.locationPersistTimer = null;
    }
    clearNavigationPageLock();
  };

  updateCurrentReadingLocation(contentEl, api, false);
  updateProgressControl();
}

function renderReaderShell(context, api) {
  ensureReaderStyle();
  const characterRibbon = context.characterPortrait
    ? `
              <div class="bookmark-container bookmark-container-left" data-has-image="true">
                  <div class="bookmark-ribbon">
                      <div class="bookmark-images">
                          <div class="bookmark-portrait" style="background-image:url('${escapeHtml(context.characterPortrait)}')"></div>
                      </div>
                  </div>
              </div>`
    : `<div class="bookmark-container bookmark-container-left" data-has-image="false"></div>`;
  // TODO: turn persona portrait into an overlay bookmark UI when the bookmark
  // interaction model is implemented for both desktop and mobile readers.
  const personaRibbon = context.personaPortrait
    ? `
            <div class="bookmark-container bookmark-container-right" data-has-image="true">
                <div class="bookmark-ribbon bookmark-ribbon-right">
                    <div class="bookmark-images">
                        <div class="bookmark-portrait bookmark-portrait-right" style="background-image:url('${escapeHtml(context.personaPortrait)}')"></div>
                    </div>
                </div>
            </div>`
    : `<div class="bookmark-container bookmark-container-right" data-has-image="false"></div>`;

  // TODO: wire the bookmark button to session bookmark state after caching and
  // annotation data models are implemented.
  // TODO: replace the more button placeholder with a reader action sheet that
  // exposes raw-view, notes, highlights, and cache controls.
  document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
             <div class="novel-header">
                 <button class="nv-topbar-btn" type="button" data-action="close-reader-label" aria-label="Close reader">${getNavIcon("close")}</button>
                 <span class="to-name">${getDisplayName(context)}</span>
                 <button class="nv-topbar-btn" type="button" data-action="bookmark-placeholder" aria-label="Bookmarks">${getNavIcon("bookmark")}</button>
              </div>
              <div class="bookmark-row">
                  ${characterRibbon}
                  ${personaRibbon}
             </div>
            <div class="novel-body">
                <div class="novel-content"></div>
            </div>
             <div class="novel-page-footer">
                 <div data-slot="settings"></div>
                 <button class="novel-page-btn" type="button" data-action="prev">${getNavIcon("prev")}</button>
                 <div class="novel-page-progress">
                     <input class="novel-page-progress-slider" type="range" min="1" max="1" value="1" step="1" data-action="page-progress" aria-label="Jump to page" />
                     <span class="novel-page-indicator">1 / 1</span>
                 </div>
                 <button class="novel-page-btn" type="button" data-action="next">${getNavIcon("next")}</button>
                 <div class="nv-more-wrap">
                     <button class="nv-more-btn" type="button" data-action="more-placeholder" aria-label="Reader menu">${getNavIcon("hamburger")}</button>
                 </div>
              </div>
        </div>
    `;

  readerState.settingsCleanup?.();
  const settingsSlot = document.querySelector('[data-slot="settings"]');
  const settingsUi = createThemeToggle(api);
  settingsSlot?.appendChild(settingsUi.element);
  readerState.settingsCleanup = settingsUi.cleanup;
  applyTheme(readerState.theme);
  applyFont(readerState.font);
  applyBookmarkVisibility();
}

async function closeReader(api) {
  readerState.cleanup?.();
  readerState.cleanup = null;
  closeMoreMenu();
  closeModalById("nv-cache-manager-modal");
  closeModalById("nv-bookmark-panel");
  await api.hideContainer();
}

function renderErrorState(api, message) {
  ensureReaderStyle();
  document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
            <div class="novel-body">
                <div class="nv-error">
                    <strong>Ebook Reader failed to load</strong>
                    <div>${message}</div>
                    <button class="nv-button" type="button" data-action="close">Close</button>
                </div>
            </div>
        </div>
    `;

  document
    .querySelector('[data-action="close"]')
    ?.addEventListener("click", () => {
      closeReader(api).catch(() => {});
    });
}

async function loadCurrentReaderContext(api) {
  try {
    const characterIndex = await api.getCurrentCharacterIndex();
    const chatIndex = await api.getCurrentChatIndex();
    const character = await api.getCharacterFromIndex(characterIndex);
    const chat = await api.getChatFromIndex(characterIndex, chatIndex);
    const db = await api.getDatabase(["personas", "selectedPersona"]);
    const personas = Array.isArray(db?.personas) ? db.personas : [];
    const selectedPersona = Number.isInteger(db?.selectedPersona)
      ? db.selectedPersona
      : 0;
    const activePersona = personas[selectedPersona] || null;
    const characterPortrait = await loadAssetDataUrl(api, character?.image);
    const personaPortrait = activePersona?.icon
      ? await loadAssetDataUrl(api, activePersona.icon)
      : "";
    const messages = Array.isArray(chat?.message) ? chat.message : [];

    return {
      ok: true,
      characterIndex,
      chatIndex,
      character,
      chat,
      personas,
      selectedPersona,
      activePersona,
      characterPortrait,
      personaPortrait,
      messages,
    };
  } catch (error) {
    await api.log(`Ebook Reader context load failed: ${error.message}`);
    return {
      ok: false,
      error,
      characterIndex: -1,
      chatIndex: -1,
      character: null,
      chat: null,
      messages: [],
    };
  }
}

async function prepareReaderEdition(api, context) {
  const signature = buildReaderCacheSignature(context.messages);
  const cacheKey = getReaderCacheKey(context.characterIndex, context.chatIndex);
  readerState.currentCacheKey = cacheKey;
  readerState.currentCacheSignature = signature;

  const cacheEntry = await loadReaderEditionCache(api, cacheKey);
  if (isReaderEditionCacheValid(cacheEntry, signature)) {
    readerState.currentCacheEntry = normalizeReaderEditionCache(cacheEntry);
    return {
      ...context,
      renderedHtml: cacheEntry.renderedHtml,
    };
  }

  renderLoadingState("리더 준비 중");
  const processedMessageHtml = await loadProcessedMessageHtml(api, context.messages);
  const messages = context.messages.map((message, index) => ({
    ...message,
    processedHtml: processedMessageHtml[index] || "",
  }));
  const editionContext = {
    ...context,
    processedMessageHtml,
    messages,
  };
  const renderedHtml = renderMessageContent(editionContext);
  const nextCacheEntry = {
    cacheKey,
    updatedAt: Date.now(),
    messageCount: signature.messageCount,
    lastMessageHash: signature.lastMessageHash,
    paragraphCount: countRenderedParagraphs(renderedHtml),
    renderedHtml,
    bookmarks: [],
    lastLocation: {
      messageIndex: 0,
      paragraphIndex: 0,
      preview: "",
      updatedAt: null,
    },
  };
  await saveReaderEditionCache(api, context, nextCacheEntry);
  readerState.currentCacheEntry = normalizeReaderEditionCache(nextCacheEntry);
  return {
    ...editionContext,
    renderedHtml,
  };
}

async function openReader(api) {
  try {
    await loadReaderSettings(api);
    await ensureRootPopoverFallback(api);
    await api.showContainer("fullscreen");
    renderLoadingState("세션 확인 중");
    const context = await loadCurrentReaderContext(api);
    if (!context.ok) {
      readerState.context = null;
      renderErrorState(
        api,
        context.error?.message || "Unable to load the current chat.",
      );
      return;
    }
    renderLoadingState("판본 확인 중");
    const preparedContext = await prepareReaderEdition(api, context);
    readerState.context = preparedContext;
    await setPluginStorageItem(api, "readerLastOpenAt", Date.now());
    renderReaderShell(preparedContext, api);
    renderReaderBody(preparedContext);
    installReaderEvents(api);
  } catch (error) {
    renderErrorState(api, error.message);
    await api.log(`Ebook Reader open failed: ${error.message}`);
  }
}

(async () => {
  try {
    await risuai.registerSetting(
      "Ebook Reader",
      async () => {
        await openReader(risuai);
      },
      "📖",
      "html",
    );

    await risuai.registerButton(
      {
        name: "Ebook Reader",
        icon: "📖",
        iconType: "html",
        location: "chat",
      },
      async () => {
        await openReader(risuai);
      },
    );
  } catch (error) {
    await risuai.log(`Ebook Reader bootstrap failed: ${error.message}`);
  }
})();
