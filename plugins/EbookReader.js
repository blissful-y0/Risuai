//@api 3.0
//@name 📚 리수북스 (RisuBooks)
//@version 7.0.0
//@arg theme string Reader theme
//@arg font string Reader font
//@arg bookmark string Bookmark visibility

const READER_STYLE_ID = "nv-reader-style";
const CUSTOM_FONT_STYLE_ID = "nv-reader-custom-font";
const CACHE_INDEX_KEY = "readerCacheIndex";
const CACHE_ENTRY_PREFIX = "readerCache:";
const READER_EDITION_CACHE_VERSION = 2;
const THEMES = [
  { id: "light", label: "기본", dot: "#ffffff", border: "#cccccc" },
  { id: "dark", label: "다크", dot: "#1c1a18", border: "#5a5040" },
  { id: "vintage", label: "빈티지", dot: "#f0e8d8", border: "#c8b898" },
  { id: "gray", label: "그레이", dot: "#4f4f4f", border: "#707070" },
  { id: "green", label: "그린", dot: "#22403d", border: "#4a7a72" },
  { id: "navy", label: "네이비", dot: "#1e2a3a", border: "#3a5068" },
  { id: "rose", label: "로제", dot: "#2c1a24", border: "#6a3a50" },
  { id: "midnight", label: "미드나잇", dot: "#0e0e12", border: "#2a2a36" },
];
const FONTS = [
  { id: "BookkMyungjo", label: "부크크명조", family: '"BookkMyungjo", serif' },
  {
    id: "MaruBuri",
    label: "마루부리",
    family: '"MaruBuri", serif',
  },
  {
    id: "RIDIBatang",
    label: "리디바탕",
    family: '"RIDIBatang", serif',
  },
  {
    id: "KoPubBatang",
    label: "KoPub바탕",
    family: '"KoPubBatang", serif',
  },
  {
    id: "Pretendard",
    label: "프리텐다드",
    family: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
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
    "--nv-overlay-bg": "rgba(255, 255, 255, 0.95)",
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
    "--nv-overlay-bg": "rgba(28, 26, 24, 0.95)",
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
    "--nv-overlay-bg": "rgba(240, 232, 216, 0.95)",
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
    "--nv-overlay-bg": "rgba(79, 79, 79, 0.95)",
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
    "--nv-overlay-bg": "rgba(34, 64, 61, 0.95)",
  },
  navy: {
    "--nv-bg": "#1e2a3a",
    "--nv-text": "#b0c4d8",
    "--nv-text-muted": "#5a7a94",
    "--nv-header": "#7a9ab4",
    "--nv-header-name": "#c8dae8",
    "--nv-highlight-bg": "#263646",
    "--nv-highlight-text": "#d4e4f0",
    "--nv-rule": "#1a2432",
    "--nv-shadow": "rgba(0, 0, 0, 0.6)",
    "--nv-controls-bg": "#162230",
    "--nv-controls-hover": "rgba(140, 180, 210, 0.08)",
    "--nv-overlay-bg": "rgba(30, 42, 58, 0.95)",
  },
  rose: {
    "--nv-bg": "#2c1a24",
    "--nv-text": "#d4b0c0",
    "--nv-text-muted": "#8a5a70",
    "--nv-header": "#b07a90",
    "--nv-header-name": "#e0c4d2",
    "--nv-highlight-bg": "#3a2430",
    "--nv-highlight-text": "#e8d0dc",
    "--nv-rule": "#241820",
    "--nv-shadow": "rgba(0, 0, 0, 0.6)",
    "--nv-controls-bg": "#221420",
    "--nv-controls-hover": "rgba(200, 150, 170, 0.08)",
    "--nv-overlay-bg": "rgba(44, 26, 36, 0.95)",
  },
  midnight: {
    "--nv-bg": "#0e0e12",
    "--nv-text": "#c0c0cc",
    "--nv-text-muted": "#5a5a6a",
    "--nv-header": "#8888a0",
    "--nv-header-name": "#d4d4e0",
    "--nv-highlight-bg": "#1a1a22",
    "--nv-highlight-text": "#e0e0ea",
    "--nv-rule": "#1a1a20",
    "--nv-shadow": "rgba(0, 0, 0, 0.7)",
    "--nv-controls-bg": "#0a0a10",
    "--nv-controls-hover": "rgba(160, 160, 190, 0.06)",
    "--nv-overlay-bg": "rgba(14, 14, 18, 0.95)",
  },
};
const readerState = {
  context: null,
  currentPage: 0,
  totalPages: 1,
  pendingPage: null,
  replyModeEnabled: false,
  replyComposerHost: null,
  replyComposerPlaceholder: null,
  replyComposerElement: null,
  replyComposerOriginalStyle: "",
  navigationLockPage: null,
  navigationLockTimer: null,
  theme: "light",
  font: "BookkMyungjo",
  showBookmark: true,
  customColors: null,
  customFontCss: "",
  lineSpacing: 1.85,
  fontSize: 16,
  pagePadding: 64,
  hidePatterns: [],
  cleanup: null,
  settingsCleanup: null,
  currentCacheKey: "",
  currentCacheEntry: null,
  currentCacheSignature: null,
  currentLocation: null,
  locationPersistTimer: null,
  streamingPollTimer: null,
  streamingInFlight: false,
  streamAutoFollow: false,
  lastPersistedCacheSignature: null,
  replyModeWatchActive: false,
  replyModeWatchUntil: 0,
  replyAwaitingResponse: false,
  replyAwaitingResponseSince: 0,
  replyComposerBridgeCleanup: null,
  mainDomPermissionGranted: false,
};

const REPLY_MODE_MAX_WAIT_MS = 120000;
const REPLY_MODE_IDLE_WATCH_MS = 5000;

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
    await api.log(`RisuBooks image load failed (${assetKey}): ${error.message}`);
  }

  return "";
}

function withTimeout(promise, ms, fallbackValue) {
  let settled = false;
  let timerId = null;

  return new Promise((resolve) => {
    timerId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(fallbackValue);
    }, ms);

    promise
      .then((value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timerId);
        resolve(value);
      })
      .catch(() => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timerId);
        resolve(fallbackValue);
      });
  });
}

async function loadAssetDataUrlSafe(api, path, timeoutMs = 1800) {
  return withTimeout(loadAssetDataUrl(api, path), timeoutMs, "");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

        @font-face {
            font-family: "MaruBuri";
            src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff") format("woff");
            font-weight: 400;
            font-display: swap;
        }

        @font-face {
            font-family: "RIDIBatang";
            src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff") format("woff");
            font-weight: 400;
            font-display: swap;
        }

        @font-face {
            font-family: "KoPubBatang";
            src: url("https://cdn.jsdelivr.net/font-kopub/1.0/KoPubBatang-Light.woff") format("woff");
            font-weight: 400;
            font-display: swap;
        }

        @font-face {
            font-family: "KoPubBatang";
            src: url("https://cdn.jsdelivr.net/font-kopub/1.0/KoPubBatang-Bold.woff") format("woff");
            font-weight: 700;
            font-display: swap;
        }

        @font-face {
            font-family: "Pretendard Variable";
            src: url("https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2") format("woff2");
            font-weight: 100 900;
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
            --nv-overlay-bg: rgba(255, 255, 255, 0.95);
            --nv-body-font: "BookkMyungjo", serif;
            --nv-ui-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --nv-radius-sm: 4px;
            --nv-radius-md: 8px;
            --nv-radius-lg: 12px;
            --nv-radius-full: 999px;
            --nv-transition: 150ms ease;
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

        /* ── 오버레이 헤더 ── */
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


        .novel-body {
            position: absolute;
            inset: 0;
            overflow: hidden;
            padding: 0 var(--nv-page-padding, 64px);
        }

        .novel-content {
            width: 100%;
            height: 100%;
            column-count: 2;
            column-gap: 64px;
            column-rule: none;
            text-align: justify;
            font-size: var(--nv-font-size, 16px);
            line-height: var(--nv-line-spacing, 1.85);
            color: var(--nv-text);
            font-family: var(--nv-body-font);
            overflow-x: scroll;
            overflow-y: hidden;
            padding: 48px 0 56px;
            scrollbar-width: none;
            will-change: scroll-position;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
        }

        .novel-viewer.reply-mode .novel-content {
            padding-bottom: var(--nv-reply-content-padding, 168px);
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

        .nv-reader-message {
            break-inside: avoid-column;
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

         .nv-hidden-story {
             margin: 0 0 1.1em 0;
             border: 1px solid var(--nv-rule);
             border-radius: 14px;
             background: color-mix(in srgb, var(--nv-bg) 92%, var(--nv-highlight-bg) 8%);
             break-inside: avoid-column;
             overflow: hidden;
         }

         .nv-hidden-story-summary {
             display: flex;
             flex-direction: column;
             gap: 4px;
             list-style: none;
             cursor: pointer;
             padding: 12px 14px;
             color: var(--nv-text);
             font-family: var(--nv-ui-font);
             font-size: 13px;
             font-weight: 600;
         }

         .nv-hidden-story-summary::-webkit-details-marker {
             display: none;
         }

         .nv-hidden-story-title {
             display: block;
         }

         .nv-hidden-story-scene {
             display: block;
             color: var(--nv-text-muted);
             font-size: 11px;
             font-weight: 500;
         }

         .nv-hidden-story-body {
             padding: 0 14px 14px;
             border-top: 1px solid var(--nv-rule);
         }

         .nv-hidden-story-body p:first-child,
         .nv-hidden-story-body blockquote:first-child,
         .nv-hidden-story-body ul:first-child,
         .nv-hidden-story-body hr:first-child {
             margin-top: 12px;
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

        .nv-processed-message .x-risu-image-container,
        .nv-processed-message [class*="risu-image"] {
            display: none;
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

        /* ── 오버레이 푸터 ── */
        .novel-page-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px 20px calc(env(safe-area-inset-bottom, 0px) + 20px);
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
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
        }

        .novel-page-progress-slider:disabled {
            cursor: default;
            opacity: 0.45;
        }

        .novel-page-indicator {
            font-size: 12px;
            color: var(--nv-text-muted);
            min-width: 48px;
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        /* ── 바텀시트 메뉴 ── */
        .nv-bottomsheet-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 1102;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .nv-bottomsheet-backdrop.open {
            opacity: 1;
            pointer-events: auto;
        }

        .nv-bottomsheet {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(280px, 75vw);
            z-index: 1103;
            background: var(--nv-bg);
            border-left: 1px solid var(--nv-rule);
            padding: calc(env(safe-area-inset-top, 0px) + 12px) 8px calc(env(safe-area-inset-bottom, 0px) + 12px);
            transform: translateX(100%);
            transition: transform 0.25s ease;
            display: flex;
            flex-direction: column;
            gap: 2px;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
        }

        .nv-bottomsheet.open {
            transform: translateX(0);
        }

        .nv-bottomsheet-handle {
            display: none;
        }

        .nv-bottomsheet-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border: none;
            background: none;
            color: var(--nv-text);
            font-family: var(--nv-ui-font);
            font-size: 15px;
            line-height: 1.4;
            cursor: pointer;
            border-radius: var(--nv-radius-md);
            transition: background var(--nv-transition);
            width: 100%;
            text-align: left;
        }

        .nv-bottomsheet-item:hover {
            background: var(--nv-controls-hover);
        }

        .nv-bottomsheet-item:active {
            opacity: 0.8;
        }

        .nv-bottomsheet-item svg {
            width: 20px;
            height: 20px;
            color: var(--nv-text-muted);
            flex-shrink: 0;
        }

        /* ── 테마 설정 센터 모달 ── */
        .nv-theme-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 1104;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .nv-theme-modal-backdrop.open {
            opacity: 1;
            pointer-events: auto;
        }

        /* 오른쪽 시트 */
        .nv-theme-modal {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(320px, 80vw);
            z-index: 1105;
            background: var(--nv-bg);
            border-left: 1px solid var(--nv-rule);
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.25s ease;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
        }

        .nv-theme-modal.open {
            transform: translateX(0);
        }

        .nv-theme-modal-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px 10px;
            border-bottom: 1px solid var(--nv-rule);
            flex-shrink: 0;
        }

        @media (min-width: 640px) {
            .nv-theme-modal-header {
                padding: 14px 12px 10px;
            }
        }

        .nv-theme-modal-header .nv-overlay-btn {
            width: 36px;
            height: 36px;
        }

        .nv-theme-modal-header .nv-overlay-btn svg {
            width: 18px;
            height: 18px;
        }

        .nv-theme-modal-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-theme-modal-body {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 16px);
        }

        .nv-theme-modal-body::-webkit-scrollbar {
            display: none;
        }

        /* 모달 안에선 드롭다운 항상 보이게 + 인라인 */
        .nv-theme-modal-body .nv-theme-dropdown {
            display: block !important;
            position: static !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            max-width: none !important;
            min-width: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            z-index: auto !important;
        }

        /* 테마 팔레트 가로 그리드 */
        .nv-theme-modal-body .nv-theme-palette {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 4px;
            padding: 12px 12px 8px;
        }

        /* ── 상시 진행바 ── */
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
            width: 0%;
            background: var(--nv-text-muted);
            opacity: 0.4;
            transition: width 0.3s ease;
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

        /* ── 캐시 관리 모달 래퍼 ── */
        .nv-cache-manager-screen {
            position: fixed;
            inset: 0;
            display: none;
            width: 100%;
            height: 100%;
            background: var(--nv-bg, #ffffff);
            z-index: 1106;
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
            scrollbar-width: none;
        }

        .nv-cache-manager-shell::-webkit-scrollbar {
            display: none;
        }

        /* ── 라이브러리 헤더 ── */
        .nv-library-header {
            display: flex;
            align-items: center;
            padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px;
            gap: 8px;
            border-bottom: 1px solid var(--nv-rule);
            position: sticky;
            top: 0;
            background: var(--nv-bg);
            z-index: 1;
        }

        .nv-library-title {
            font-size: 17px;
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
            padding: 8px 12px;
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
            font-weight: 500;
            font-family: var(--nv-ui-font);
            line-height: 1.4;
            padding: 20px 16px 8px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .nv-library-hero {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            padding: 0 16px 20px;
        }

        .nv-library-cover {
            width: 88px;
            height: 124px;
            border-radius: 3px;
            background: linear-gradient(145deg,
                color-mix(in srgb, var(--nv-highlight-bg) 60%, var(--nv-bg)),
                color-mix(in srgb, var(--nv-highlight-bg) 90%, var(--nv-bg)));
            flex-shrink: 0;
            overflow: hidden;
            box-shadow:
                0 1px 3px rgba(0, 0, 0, 0.12),
                0 4px 8px rgba(0, 0, 0, 0.06);
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
            font-size: 28px;
            color: var(--nv-text-muted);
            opacity: 0.25;
            font-family: var(--nv-body-font);
        }

        .nv-library-hero-info {
            flex: 1;
            min-width: 0;
            padding-top: 2px;
            font-family: var(--nv-ui-font);
        }

        .nv-library-hero-title {
            font-size: 16px;
            font-weight: 700;
            line-height: 1.35;
            color: var(--nv-header-name);
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .nv-library-hero-author {
            font-size: 13px;
            color: var(--nv-text-muted);
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .nv-library-hero-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 12px;
            color: var(--nv-text-muted);
            line-height: 1.4;
        }

        .nv-library-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 7px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.02em;
            background: color-mix(in srgb, var(--nv-highlight-bg) 50%, var(--nv-bg));
            color: var(--nv-text);
            width: fit-content;
        }

        /* ── 판본 그리드 ── */
        .nv-library-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 16px 10px;
            border-top: 1px solid var(--nv-rule);
        }

        .nv-library-section-title {
            font-size: 13px;
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
            grid-template-columns: repeat(2, 1fr);
            gap: 14px 12px;
            padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .nv-library-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            min-width: 0;
        }

        .nv-library-item-cover {
            aspect-ratio: 5 / 7;
            border-radius: 3px;
            overflow: hidden;
            background: linear-gradient(145deg,
                color-mix(in srgb, var(--nv-highlight-bg) 60%, var(--nv-bg)),
                color-mix(in srgb, var(--nv-highlight-bg) 90%, var(--nv-bg)));
            box-shadow:
                0 1px 3px rgba(0, 0, 0, 0.1),
                0 3px 6px rgba(0, 0, 0, 0.05);
            position: relative;
            transition: transform var(--nv-transition), box-shadow var(--nv-transition);
        }

        .nv-library-item-cover:hover {
            transform: translateY(-2px);
            box-shadow:
                0 2px 6px rgba(0, 0, 0, 0.12),
                0 6px 12px rgba(0, 0, 0, 0.08);
        }

        .nv-library-item-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .nv-library-item-delete {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            background: rgba(0, 0, 0, 0.55);
            color: white;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            line-height: 1;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            transition: background var(--nv-transition);
        }

        .nv-library-item-delete:hover {
            background: rgba(0, 0, 0, 0.75);
        }

        .nv-library-item:hover .nv-library-item-delete {
            display: inline-flex;
        }

        .nv-library-item-title {
            font-size: 12px;
            font-weight: 600;
            line-height: 1.35;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nv-text);
            font-family: var(--nv-ui-font);
        }

        .nv-library-item-sub {
            font-size: 11px;
            color: var(--nv-text-muted);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-top: -2px;
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-library-empty {
            padding: 48px 16px;
            text-align: center;
            color: var(--nv-text-muted);
            font-size: 13px;
            font-family: var(--nv-ui-font);
            line-height: 1.5;
            opacity: 0.6;
        }

        @media (min-width: 420px) {
            .nv-library-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 640px) {
            .nv-library-grid { grid-template-columns: repeat(4, 1fr); }
            .nv-library-hero { padding: 0 20px 24px; }
            .nv-library-current-label { padding: 24px 20px 10px; }
            .nv-library-section-header { padding: 20px 20px 12px; }
            .nv-library-grid { padding: 0 20px 32px; gap: 16px; }
            .nv-library-header { padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 14px; }
            .nv-library-cover { width: 100px; height: 140px; }
            .nv-library-hero-title { font-size: 18px; }
        }

        @media (min-width: 900px) {
            .nv-cache-manager-shell {
                max-width: 640px;
                margin: 0 auto;
            }
            .nv-library-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* ── 책갈피 리본 ── */
        .nv-bookmark-ribbon-container {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            z-index: 4;
            pointer-events: none;
            overflow: hidden;
        }

        .nv-bookmark-ribbon {
            position: absolute;
            right: 0;
            width: 36px;
            pointer-events: none;
            filter: drop-shadow(-1px 2px 4px rgba(0, 0, 0, 0.15));
        }

        .nv-bookmark-ribbon-inner {
            width: 100%;
            height: 100%;
            clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), 50% 100%, 0 calc(100% - 14px));
            overflow: hidden;
            background: linear-gradient(180deg, #c8a87a, #a08060);
        }

        .nv-bookmark-ribbon-inner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .nv-bookmark-ribbon-fallback {
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #c8a87a, #a08060);
        }

        @media (max-width: 1024px) {
            .nv-bookmark-ribbon {
                width: 30px;
            }
        }

        /* ── 숨김 패턴 시트 ── */
        .nv-hidepattern-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 1106;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .nv-hidepattern-backdrop.open {
            opacity: 1;
            pointer-events: auto;
        }

        .nv-hidepattern-sheet {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(360px, 85vw);
            z-index: 1107;
            background: var(--nv-bg);
            border-left: 1px solid var(--nv-rule);
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.25s ease;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
        }

        .nv-hidepattern-sheet.open {
            transform: translateX(0);
        }

        .nv-hidepattern-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: calc(env(safe-area-inset-top, 0px) + 14px) 12px 10px;
            border-bottom: 1px solid var(--nv-rule);
            flex-shrink: 0;
        }

        .nv-hidepattern-title {
            flex: 1;
            font-size: 15px;
            font-weight: 600;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-hidepattern-body {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .nv-hidepattern-body::-webkit-scrollbar {
            display: none;
        }

        .nv-hidepattern-desc {
            font-size: 12px;
            color: var(--nv-text-muted);
            font-family: var(--nv-ui-font);
            line-height: 1.5;
            margin-bottom: 4px;
        }

        .nv-hidepattern-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .nv-hidepattern-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border: 1px solid var(--nv-rule);
            border-radius: var(--nv-radius-md);
            background: var(--nv-highlight-bg);
        }

        .nv-hidepattern-item code {
            flex: 1;
            font-size: 12px;
            font-family: monospace;
            color: var(--nv-text);
            word-break: break-all;
            line-height: 1.4;
        }

        .nv-hidepattern-remove {
            border: none;
            background: none;
            color: var(--nv-text-muted);
            cursor: pointer;
            font-size: 16px;
            padding: 2px 6px;
            border-radius: var(--nv-radius-sm);
            flex-shrink: 0;
            transition: color var(--nv-transition);
        }

        .nv-hidepattern-remove:hover {
            color: var(--nv-text);
        }

        .nv-hidepattern-add-row {
            display: flex;
            gap: 6px;
            margin-top: 4px;
        }

        .nv-hidepattern-input {
            flex: 1;
            border: 1px solid var(--nv-rule);
            border-radius: var(--nv-radius-md);
            background: var(--nv-bg);
            color: var(--nv-text);
            font-size: 13px;
            font-family: monospace;
            padding: 8px 10px;
            outline: none;
        }

        .nv-hidepattern-input:focus {
            border-color: var(--nv-text-muted);
        }

        .nv-hidepattern-add-btn {
            border: none;
            border-radius: var(--nv-radius-md);
            background: var(--nv-text);
            color: var(--nv-bg);
            font-family: var(--nv-ui-font);
            font-size: 13px;
            font-weight: 600;
            padding: 8px 14px;
            cursor: pointer;
            flex-shrink: 0;
            transition: opacity var(--nv-transition);
        }

        .nv-hidepattern-add-btn:hover {
            opacity: 0.9;
        }

        /* ── 텍스트 편집 팝오버 ── */
        .nv-edit-popover {
            position: fixed;
            z-index: 50;
            background: var(--nv-bg);
            border: 1px solid var(--nv-rule);
            border-radius: var(--nv-radius-md);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            padding: 4px;
            display: none;
            gap: 2px;
        }

        .nv-edit-popover.visible {
            display: flex;
        }

        .nv-edit-popover-btn {
            border: none;
            background: none;
            color: var(--nv-text);
            font-family: var(--nv-ui-font);
            font-size: 13px;
            padding: 8px 14px;
            cursor: pointer;
            border-radius: var(--nv-radius-sm);
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background var(--nv-transition);
            white-space: nowrap;
        }

        .nv-edit-popover-btn:hover {
            background: var(--nv-controls-hover);
        }

        .nv-edit-popover-btn svg {
            width: 14px;
            height: 14px;
            color: var(--nv-text-muted);
        }

        /* ── 텍스트 편집 모달 ── */
        .nv-edit-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 60;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .nv-edit-modal-backdrop.open {
            opacity: 1;
            pointer-events: auto;
        }

        .nv-edit-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            z-index: 61;
            background: var(--nv-bg);
            border: 1px solid var(--nv-rule);
            border-radius: var(--nv-radius-lg);
            width: min(520px, calc(100vw - 32px));
            max-height: min(80vh, 600px);
            display: flex;
            flex-direction: column;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .nv-edit-modal.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }

        .nv-edit-modal-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 12px 10px;
            border-bottom: 1px solid var(--nv-rule);
            flex-shrink: 0;
        }

        .nv-edit-modal-title {
            flex: 1;
            font-size: 15px;
            font-weight: 600;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-edit-modal-body {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 12px;
            gap: 12px;
        }

        .nv-edit-textarea {
            flex: 1;
            width: 100%;
            min-height: 200px;
            resize: none;
            border: 1px solid var(--nv-rule);
            border-radius: var(--nv-radius-md);
            background: var(--nv-highlight-bg);
            color: var(--nv-text);
            font-family: var(--nv-body-font);
            font-size: 14px;
            line-height: 1.7;
            padding: 12px;
            box-sizing: border-box;
            outline: none;
        }

        .nv-edit-textarea:focus {
            border-color: var(--nv-text-muted);
        }

        .nv-edit-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            flex-shrink: 0;
        }

        .nv-edit-btn {
            border: none;
            border-radius: var(--nv-radius-md);
            padding: 8px 18px;
            cursor: pointer;
            font-family: var(--nv-ui-font);
            font-size: 13px;
            font-weight: 600;
            transition: background var(--nv-transition);
        }

        .nv-edit-btn-cancel {
            background: var(--nv-controls-hover);
            color: var(--nv-text);
        }

        .nv-edit-btn-cancel:hover {
            background: var(--nv-rule);
        }

        .nv-edit-btn-save {
            background: var(--nv-text);
            color: var(--nv-bg);
        }

        .nv-edit-btn-save:hover {
            opacity: 0.9;
        }

        @media (max-width: 1024px) {
            .nv-edit-modal {
                width: calc(100vw - 24px);
            }
        }

        /* ── 편집 모드: 뒤 화면 정지 ── */
        .novel-viewer[data-edit-mode="true"] .novel-body,
        .novel-viewer[data-edit-mode="true"] .novel-header,
        .novel-viewer[data-edit-mode="true"] .novel-page-footer,
        .novel-viewer[data-edit-mode="true"] .nv-progress-bar,
        .novel-viewer[data-edit-mode="true"] .nv-bookmark-ribbon-container {
            pointer-events: none;
        }

        .novel-viewer[data-edit-mode="true"] .novel-content {
            overflow: hidden;
        }

        /* ── Focus 접근성 ── */
        .novel-viewer button:focus-visible,
        .novel-viewer input:focus-visible {
            outline: 2px solid var(--nv-text);
            outline-offset: 2px;
        }

        .nv-bookmark-screen {
            position: fixed;
            inset: 0;
            display: none;
            width: 100%;
            height: 100%;
            background: var(--nv-bg, #ffffff);
            z-index: 1107;
        }

        .nv-bookmark-screen.open {
            display: block;
        }

        .nv-bookmark-shell {
            width: 100%;
            height: 100%;
            overflow: auto;
            overflow-x: hidden;
            background: var(--nv-bg, #ffffff);
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }

        .nv-bookmark-shell::-webkit-scrollbar {
            display: none;
        }

        .nv-bookmark-layout {
            width: 100%;
            display: grid;
            gap: 0;
            padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        @media (min-width: 900px) {
            .nv-bookmark-shell {
                max-width: 640px;
                margin: 0 auto;
            }
        }

        .nv-bookmark-section {
            display: grid;
            gap: 0;
            padding: 0;
        }

        .nv-bookmark-section-label {
            font-size: 11px;
            color: var(--nv-text-muted);
            font-weight: 500;
            font-family: var(--nv-ui-font);
            line-height: 1.4;
            padding: 20px 16px 8px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .nv-bookmark-section + .nv-bookmark-section {
            border-top: 1px solid var(--nv-rule);
        }

        .nv-bookmark-current-card,
        .nv-bookmark-last-card {
            display: grid;
            gap: 10px;
            padding: 12px 16px 16px;
        }

        .nv-bookmark-item {
            display: grid;
            gap: 8px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--nv-rule);
        }

        .nv-bookmark-item:last-child {
            border-bottom: none;
        }

        .nv-bookmark-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-bookmark-preview {
            font-size: 13px;
            line-height: 1.6;
            color: var(--nv-text);
            font-family: var(--nv-body-font);
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }

        .nv-bookmark-meta,
        .nv-bookmark-item-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0;
        }

        .nv-bookmark-chip {
            display: inline-flex;
            align-items: center;
            color: var(--nv-text-muted);
            font-size: 11px;
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-bookmark-chip + .nv-bookmark-chip::before {
            content: "·";
            margin: 0 6px;
            opacity: 0.4;
        }

        .nv-bookmark-primary {
            min-height: 36px;
            padding: 0 16px;
            border-radius: var(--nv-radius-md);
            border: none;
            background: var(--nv-controls-hover);
            color: var(--nv-header-name);
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-ui-font);
            font-size: 13px;
            font-weight: 600;
            justify-self: start;
            transition: background var(--nv-transition);
        }

        .nv-bookmark-primary:hover {
            background: var(--nv-highlight-bg);
        }

        .nv-bookmark-list {
            display: grid;
            gap: 0;
        }

        .nv-bookmark-item-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .nv-bookmark-item-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            line-height: 1.4;
        }

        .nv-bookmark-item-actions {
            display: inline-flex;
            gap: 4px;
            flex-shrink: 0;
        }

        .nv-bookmark-action {
            min-height: 28px;
            padding: 0 10px;
            border-radius: var(--nv-radius-md);
            border: none;
            background: transparent;
            color: var(--nv-text-muted);
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-ui-font);
            font-size: 11px;
            transition: all var(--nv-transition);
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

        /* ── 테마 옵션 (가로 팔레트) ── */
        .nv-theme-option {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 6px;
            border: none;
            background: none;
            color: var(--nv-text-muted);
            cursor: pointer;
            padding: 10px 4px;
            border-radius: var(--nv-radius-md);
            font-family: var(--nv-ui-font);
            font-size: 11px;
            line-height: 1.3;
            transition: background var(--nv-transition);
        }

        .nv-theme-option:hover {
            background: var(--nv-controls-hover);
        }

        .nv-theme-option.active {
            color: var(--nv-text);
            font-weight: 600;
        }

        .nv-theme-dot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid transparent;
            flex-shrink: 0;
            transition: border-color var(--nv-transition), transform var(--nv-transition);
        }

        .nv-theme-option.active .nv-theme-dot {
            border-color: var(--nv-text);
            transform: scale(1.1);
        }

        .nv-dropdown-divider {
            height: 1px;
            background: var(--nv-rule);
            margin: 4px 12px;
        }

        .nv-section-label {
            padding: 12px 14px 6px;
            color: var(--nv-text-muted);
            font-size: 11px;
            font-family: var(--nv-ui-font);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        /* ── 폰트 옵션 ── */
        .nv-font-option {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            border: none;
            background: none;
            color: var(--nv-text);
            border-radius: var(--nv-radius-md);
            padding: 10px 14px;
            cursor: pointer;
            text-align: left;
            font-size: 13px;
            line-height: 1.4;
            transition: background var(--nv-transition);
        }

        .nv-font-option:hover {
            background: var(--nv-controls-hover);
        }

        .nv-font-option.active {
            font-weight: 700;
            color: var(--nv-header-name);
        }

        .nv-font-check {
            width: 18px;
            height: 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 13px;
            color: var(--nv-text-muted);
        }

        .nv-font-option.active .nv-font-check {
            color: var(--nv-header-name);
        }

        /* ── 커스텀 테마 편집 ── */
        .nv-custom-edit-btn {
            display: none;
            align-items: center;
            gap: 6px;
            width: 100%;
            border: none;
            background: none;
            color: var(--nv-text-muted);
            cursor: pointer;
            border-radius: var(--nv-radius-md);
            padding: 8px 14px;
            font-family: var(--nv-ui-font);
            font-size: 12px;
            line-height: 1.4;
            transition: background var(--nv-transition), color var(--nv-transition);
        }

        .nv-custom-edit-btn.visible {
            display: flex;
        }

        .nv-custom-edit-btn:hover {
            background: var(--nv-controls-hover);
            color: var(--nv-text);
        }

        .nv-custom-edit-btn svg {
            width: 14px;
            height: 14px;
        }

        /* ── 커스텀 폰트 CSS ── */
        .nv-font-custom-row {
            padding: 2px 6px 6px;
        }

        .nv-font-custom-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            border: none;
            background: none;
            color: var(--nv-text-muted);
            border-radius: var(--nv-radius-md);
            padding: 8px 10px;
            cursor: pointer;
            font: inherit;
            font-family: var(--nv-ui-font);
            font-size: 12px;
            transition: background var(--nv-transition);
        }

        .nv-font-custom-toggle:hover {
            background: var(--nv-controls-hover);
        }

        .nv-font-custom-toggle-label {
            flex: 1;
            text-align: left;
        }

        .nv-font-custom-toggle-arrow {
            transition: transform 0.2s ease;
            font-size: 10px;
        }

        .nv-font-custom-toggle-arrow.open {
            transform: rotate(180deg);
        }

        .nv-font-custom-area {
            display: none;
            margin-top: 6px;
            padding: 0 4px;
        }

        .nv-font-custom-area.open {
            display: block;
        }

        .nv-font-custom-textarea {
            width: 100%;
            min-height: 80px;
            resize: vertical;
            border-radius: var(--nv-radius-md);
            border: 1px solid var(--nv-rule);
            background: var(--nv-highlight-bg);
            color: var(--nv-text);
            font: 12px/1.5 monospace;
            padding: 10px;
            box-sizing: border-box;
        }

        .nv-font-custom-btns {
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            margin-top: 8px;
        }

        .nv-font-custom-btn {
            border: none;
            border-radius: var(--nv-radius-md);
            padding: 6px 12px;
            cursor: pointer;
            background: var(--nv-controls-hover);
            color: var(--nv-text);
            font: inherit;
            font-family: var(--nv-ui-font);
            font-size: 12px;
            transition: background var(--nv-transition);
        }

        .nv-font-custom-btn:hover {
            background: var(--nv-highlight-bg);
        }

        .nv-font-custom-btn.primary {
            background: var(--nv-text-muted);
            color: var(--nv-bg);
        }

        .nv-font-custom-btn.primary:hover {
            opacity: 0.9;
        }

        /* ── 줄 간격 슬라이더 ── */
        .nv-line-spacing-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 14px 12px;
        }

        .nv-line-spacing-slider {
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

        .nv-line-spacing-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--nv-text);
            border: 3px solid var(--nv-bg);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            cursor: pointer;
        }

        .nv-line-spacing-value {
            font-size: 13px;
            font-weight: 600;
            color: var(--nv-header-name);
            font-family: var(--nv-ui-font);
            min-width: 28px;
            text-align: right;
            font-variant-numeric: tabular-nums;
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
                padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px 8px;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                background: var(--nv-bg);
            }

            .novel-body {
                padding: 0 var(--nv-page-padding, 28px);
            }

            .novel-content {
                column-count: 1;
                column-gap: 0;
                font-size: var(--nv-font-size, 15px);
                line-height: var(--nv-line-spacing, 1.85);
                padding: 40px 0 52px;
            }

            .novel-viewer.reply-mode .novel-content {
                padding-bottom: var(--nv-reply-content-padding, 196px);
            }

            .novel-page-footer {
                padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                background: var(--nv-bg);
            }

            .nv-overlay-btn {
                width: 44px;
                height: 44px;
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

            /* ── 라이브러리 모바일 ── */
            .nv-library-item-delete {
                display: inline-flex;
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


async function getArgumentOrDefault(api, key) {
  try {
    const value = await api.getArgument(key);
    return typeof value === "string" && value.length > 0
      ? value
      : DEFAULT_SETTINGS[key];
  } catch (error) {
    await api.log(`RisuBooks getArgument failed (${key}): ${error.message}`);
    return DEFAULT_SETTINGS[key];
  }
}

async function setArgumentSafe(api, key, value) {
  try {
    await api.setArgument(key, value);
  } catch (error) {
    await api.log(`RisuBooks setArgument failed (${key}): ${error.message}`);
  }
}

async function getPluginStorageItem(api, key, fallback) {
  try {
    const value = await api.pluginStorage.getItem(key);
    return value ?? fallback;
  } catch (error) {
    await api.log(
      `RisuBooks pluginStorage read failed (${key}): ${error.message}`,
    );
    return fallback;
  }
}

async function setPluginStorageItem(api, key, value) {
  try {
    await api.pluginStorage.setItem(key, value);
  } catch (error) {
    await api.log(
      `RisuBooks pluginStorage write failed (${key}): ${error.message}`,
    );
  }
}

async function removePluginStorageItem(api, key) {
  try {
    await api.pluginStorage.removeItem(key);
  } catch (error) {
    await api.log(
      `RisuBooks pluginStorage remove failed (${key}): ${error.message}`,
    );
  }
}

async function getPluginStorageKeys(api) {
  try {
    const keys = await api.pluginStorage.keys();
    return Array.isArray(keys) ? keys : [];
  } catch (error) {
    await api.log(
      `RisuBooks pluginStorage keys failed: ${error.message}`,
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

function serializeReaderCacheSignature(signature) {
  if (!signature) {
    return "";
  }
  return `${signature.messageCount}:${signature.lastMessageHash}`;
}

function isReaderEditionCacheValid(cacheEntry, signature) {
  if (!cacheEntry || !signature) {
    return false;
  }
  return (
    cacheEntry.cacheVersion === READER_EDITION_CACHE_VERSION &&
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
    cacheVersion:
      typeof cacheEntry.cacheVersion === "number" ? cacheEntry.cacheVersion : 0,
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
  const normalizedEntry = {
    ...cacheEntry,
    cacheVersion: READER_EDITION_CACHE_VERSION,
  };
  await setPluginStorageItem(api, cacheKey, normalizedEntry);
  const index = await getReaderCacheIndex(api);
  const nextEntries = index.entries.filter((entry) => entry.cacheKey !== cacheKey);
  nextEntries.unshift({
    cacheKey,
    characterIndex: context.characterIndex,
    chatIndex: context.chatIndex,
    title: getDisplayName(context),
    characterName: context.character?.name || "Character",
    characterPortrait: context.characterPortrait || null,
    updatedAt: normalizedEntry.updatedAt,
    messageCount: normalizedEntry.messageCount,
    paragraphCount: normalizedEntry.paragraphCount,
    lastMessageHash: normalizedEntry.lastMessageHash,
  });
  await setReaderCacheIndex(api, { entries: nextEntries });
  return normalizedEntry;
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
  readerState.lastPersistedCacheSignature = serializeReaderCacheSignature({
    messageCount: readerState.currentCacheEntry.messageCount,
    lastMessageHash: readerState.currentCacheEntry.lastMessageHash,
  });
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
  const bg = vars["--nv-bg"] || "#2a2a2a";
  vars["--nv-overlay-bg"] = bg.startsWith("#")
    ? `rgba(${parseInt(bg.slice(1, 3), 16)}, ${parseInt(bg.slice(3, 5), 16)}, ${parseInt(bg.slice(5, 7), 16)}, 0.95)`
    : "rgba(0, 0, 0, 0.95)";
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
  const lineSpacing = await getPluginStorageItem(api, "lineSpacing", 1.85);
  const fontSize = await getPluginStorageItem(api, "fontSize", 16);
  const pagePadding = await getPluginStorageItem(api, "pagePadding", 64);

  readerState.theme = normalizeTheme(theme);
  readerState.font = normalizeFont(font);
  readerState.showBookmark = bookmark !== "off";
  readerState.customColors =
    customColors && typeof customColors === "object" ? customColors : {};
  readerState.customFontCss =
    typeof customFontCss === "string" ? customFontCss : "";
  readerState.lineSpacing =
    typeof lineSpacing === "number" ? lineSpacing : 1.85;
  readerState.fontSize =
    typeof fontSize === "number" ? fontSize : 16;
  readerState.pagePadding =
    typeof pagePadding === "number" ? pagePadding : 64;
  const hidePatterns = await getPluginStorageItem(api, "hidePatterns", []);
  readerState.hidePatterns = Array.isArray(hidePatterns) ? hidePatterns : [];
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

  let strippedText = value
    .replace(/\[LBDATA START][\s\S]*?\[LBDATA END]\n*/gi, "")
    .replace(/<Thoughts>[\s\S]*?<\/Thoughts>\s*/gi, "")
    .replace(/<details[\s\S]*?<\/details>\s*/gi, "")
    .replace(/System Message:\s*\[.*?\].*$/gm, "")
    .replace(/<img\s*=\s*["'][^"']*["']\s*>/gi, "")
    .replace(/<img\s+src\s*=\s*["'][^"']*["']\s*\/?>/gi, "")
    .replace(/&lt;img\s*=\s*["'][^"']*["']\s*&gt;/gi, "")
    .replace(/&lt;img\s+src\s*=\s*["'][^"']*["']\s*\/?&gt;/gi, "")
    .replace(/\[💡[^\]]*\]/g, "")
    .replace(/☆\s*\[(?:Date|Time|Location|Name|Level|Stat|EXP|HP|MP|SP|Strength|Constitution|Agility|Intelligence|Sense|Class|Weapons|Accessories|Armor|Items|Currencies|Skills|Quests)[^\]]*(?:\|[^\]]*)*\]/gi, "");

  if (Array.isArray(readerState.hidePatterns)) {
    for (const pattern of readerState.hidePatterns) {
      if (!pattern || typeof pattern !== "string") continue;
      try {
        strippedText = strippedText.replace(new RegExp(pattern, "gm"), "");
      } catch (_) {}
    }
  }

  strippedText = strippedText.replace(/\n{3,}/g, "\n\n").trim();

  if (!isHtml) {
    return strippedText;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = strippedText;
  wrapper
    .querySelectorAll(
      "details, .lb-rerolling, .lb-pending, lb-rerolling, lb-interacting, .x-risu-image-container, [class*='risu-image']",
    )
    .forEach((element) => element.remove());
  return wrapper.innerHTML.trim();
}

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
      ".x-risu-lb-xnai-inlay-wrapper, .lb-xnai-inlay-wrapper, .x-risu-lb-xnai-kv-wrapper, .lb-xnai-kv-wrapper, .risu-inlay-image, lb-xnai, dialog[popover], [popover], video[src], audio[src], source[src]",
    )
    .forEach((element) => element.remove());
  return wrapper.innerHTML.trim();
}

function shouldUseProcessedHtml(html) {
  if (typeof html !== "string" || html.trim().length === 0) {
    return false;
  }

  return /<[a-z][\s\S]*?>/i.test(html);
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

function parseHiddenStoryBlocks(value) {
  const source = typeof value === "string" ? value : "";
  // HiddenStory raw markers:
  // {HiddenStory} ... {/HiddenStory}
  // <hsNarrative> ... </hsNarrative>
  if (!source.includes("{HiddenStory}")) {
    return [{ type: "text", content: source }];
  }

  const blocks = [];
  const pattern = /{HiddenStory}([\s\S]*?){\/HiddenStory}/gi;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const [rawBlock, innerBlock] = match;
    const before = source.slice(cursor, match.index);
    if (before.trim()) {
      blocks.push({ type: "text", content: before.trim() });
    }

    const titleMatch = innerBlock.match(/\[hsTitle:\s*([^\]]+)\]/i);
    const sceneMatch = innerBlock.match(/\[hsScene:\s*([^\]]+)\]/i);
    const narrativeMatch = innerBlock.match(/<hsNarrative>([\s\S]*?)<\/hsNarrative>/i);
    const narrative = narrativeMatch
      ? narrativeMatch[1].trim()
      : innerBlock
          .replace(/\[hsTitle:\s*[^\]]+\]/gi, "")
          .replace(/\[hsScene:\s*[^\]]+\]/gi, "")
          .replace(/<\/?hsNarrative>/gi, "")
          .trim();

    blocks.push({
      type: "hiddenStory",
      raw: rawBlock,
      title: titleMatch ? titleMatch[1].trim() : "히든 스토리",
      scene: sceneMatch ? sceneMatch[1].trim() : "",
      narrative,
    });

    cursor = match.index + rawBlock.length;
  }

  const after = source.slice(cursor);
  if (after.trim()) {
    blocks.push({ type: "text", content: after.trim() });
  }

  return blocks;
}

function renderHiddenStoryBlock(block, role, messageIndex, paragraphIndexStart) {
  const summaryAttrs = ` data-reader-anchor="true" data-message-index="${messageIndex}" data-paragraph-index="${paragraphIndexStart}"`;
  const narrativeBlocks = String(block.narrative || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const bodyHtml = narrativeBlocks
    .map((paragraph, paragraphOffset) =>
      renderMarkdownBlock(
        paragraph,
        role,
        messageIndex,
        paragraphIndexStart + paragraphOffset + 1,
      ),
    )
    .join("");

  return {
    html: `<details class="nv-hidden-story"><summary class="nv-hidden-story-summary"${summaryAttrs}><span class="nv-hidden-story-title">${escapeHtml(block.title || "히든 스토리")}</span>${block.scene ? `<span class="nv-hidden-story-scene">${escapeHtml(block.scene)}</span>` : ""}</summary><div class="nv-hidden-story-body">${bodyHtml}</div></details>`,
    paragraphCount: 1 + narrativeBlocks.length,
  };
}

function renderMessageSlice(context, startMessageIndex = 0) {
  const messages = context.messages
    .map((message, messageIndex) => ({ message, messageIndex }))
    .filter(({ messageIndex }) => messageIndex >= startMessageIndex)
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

  return messages
    .map(({ message, messageIndex }) => {
      const processedHtml = stripReaderMetaBlocks(message.processedHtml, true);
      const readableHtml = stripIllustrationBlocks(processedHtml, true);
      if (shouldUseProcessedHtml(readableHtml)) {
        return `<section class="nv-reader-message" data-message-block-index="${messageIndex}" data-role="${escapeHtml(message.role || "")}"><div class="nv-processed-message" data-role="${escapeHtml(message.role || "")}" data-reader-anchor="true" data-message-index="${messageIndex}" data-paragraph-index="0">${readableHtml}</div></section>`;
      }

      const plainText = stripReaderMetaBlocks(message.data);
      const readableText = stripIllustrationBlocks(plainText);
      if (!readableText) {
        return "";
      }
      const segments = parseHiddenStoryBlocks(readableText);
      let paragraphIndex = 0;
      const blockHtml = segments
        .map((segment) => {
          if (segment.type === "hiddenStory") {
            const rendered = renderHiddenStoryBlock(
              segment,
              message.role,
              messageIndex,
              paragraphIndex,
            );
            paragraphIndex += rendered.paragraphCount;
            return rendered.html;
          }

          const blocks = String(segment.content || "")
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

          if (blocks.length === 0 && String(segment.content || "").trim()) {
            blocks.push(String(segment.content || "").trim());
          }

          return blocks
            .map((block) => {
              const html = renderMarkdownBlock(
                block,
                message.role,
                messageIndex,
                paragraphIndex,
              );
              paragraphIndex += 1;
              return html;
            })
            .join("");
        })
        .join("");
      return `<section class="nv-reader-message" data-message-block-index="${messageIndex}" data-role="${escapeHtml(message.role || "")}">${blockHtml}</section>`;
    })
    .join("");
}

function renderMessageContent(context) {
  const html = renderMessageSlice(context, 0);
  if (html.length > 0) {
    return html;
  }
  return `<div class="nv-empty">No readable messages in this chat.</div>`;
}

function getMessageComparableKey(message) {
  if (!message || typeof message !== "object") {
    return "";
  }
  return JSON.stringify({
    role: message.role || "",
    data: message.data || "",
    processedHtml: message.processedHtml || "",
    disabled: message.disabled || false,
    isComment: Boolean(message.isComment),
  });
}

function findFirstChangedMessageIndex(previousMessages, nextMessages) {
  const prev = Array.isArray(previousMessages) ? previousMessages : [];
  const next = Array.isArray(nextMessages) ? nextMessages : [];
  const sharedLength = Math.min(prev.length, next.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (getMessageComparableKey(prev[index]) !== getMessageComparableKey(next[index])) {
      return index;
    }
  }
  if (prev.length !== next.length) {
    return sharedLength;
  }
  return -1;
}

let _contentEl = null;
let _indicatorEl = null;
function getContentElement() {
  if (!_contentEl || !_contentEl.isConnected) {
    _contentEl = document.querySelector(".novel-content");
  }
  return _contentEl;
}

function getIndicatorElement() {
  if (!_indicatorEl || !_indicatorEl.isConnected) {
    _indicatorEl = document.querySelector(".novel-page-indicator");
  }
  return _indicatorEl;
}

function getProgressInputElement() {
  return document.querySelector('[data-action="page-progress"]');
}

let _cachedAnchors = null;
let _cachedAnchorsParent = null;
function getReaderAnchors(contentEl = getContentElement()) {
  if (!contentEl) {
    return [];
  }
  if (_cachedAnchorsParent === contentEl && _cachedAnchors) {
    return _cachedAnchors;
  }
  _cachedAnchors = Array.from(contentEl.querySelectorAll('[data-reader-anchor="true"]'));
  _cachedAnchorsParent = contentEl;
  return _cachedAnchors;
}

function invalidateAnchorCache() {
  _cachedAnchors = null;
  _cachedAnchorsParent = null;
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
    bookmarkFilled:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path></svg>',
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
    contentEl.style.columnGap = "0px";
  } else {
    const gap = 64;
    const colWidth = Math.max(
      260,
      Math.floor((contentEl.clientWidth - gap) / 2),
    );
    contentEl.style.columnCount = "auto";
    contentEl.style.columnWidth = `${colWidth}px`;
    contentEl.style.columnGap = `${gap}px`;
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
  updateProgressBar();
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

function setPage(contentEl, nextPage, behavior = "smooth") {
  readerState.pendingPage = null;
  readerState.currentPage = Math.max(
    0,
    Math.min(nextPage, readerState.totalPages - 1),
  );
  scrollToPage(contentEl, behavior);
}

function getCurrentReaderLocation(contentEl = getContentElement()) {
  const anchors = getReaderAnchors(contentEl);
  if (anchors.length === 0 || !contentEl) {
    return normalizeReaderLocation(null);
  }

  const pageWidth = getPageWidth(contentEl);
  const currentPage = readerState.currentPage;
  const pageLeft = currentPage * pageWidth;
  const pageRight = pageLeft + contentEl.clientWidth;

  let bestAnchor = anchors[0];
  let bestDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const left = anchor.offsetLeft;
    if (left < pageLeft - pageWidth || left > pageRight + pageWidth) continue;
    const top = anchor.offsetTop;
    const dist = Math.abs(left - pageLeft) * 10000 + top;
    if (dist < bestDist) {
      bestDist = dist;
      bestAnchor = anchor;
    }
  }

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

function jumpToBookmark(contentEl, location, behavior = "smooth") {
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
  scrollToPage(contentEl, behavior);
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

function applyLineSpacing(value) {
  const viewer = getViewerElement();
  if (!viewer) return;
  const clamped = Math.max(1.2, Math.min(3.0, Number(value) || 1.85));
  readerState.lineSpacing = clamped;
  viewer.style.setProperty("--nv-line-spacing", String(clamped));
  recalcPages();
}

function applyFontSize(value) {
  const viewer = getViewerElement();
  if (!viewer) return;
  const clamped = Math.max(12, Math.min(28, Number(value) || 16));
  readerState.fontSize = clamped;
  viewer.style.setProperty("--nv-font-size", `${clamped}px`);
  recalcPages();
}

function applyPagePadding(value) {
  const viewer = getViewerElement();
  if (!viewer) return;
  const clamped = Math.max(8, Math.min(120, Number(value) || 64));
  readerState.pagePadding = clamped;
  viewer.style.setProperty("--nv-page-padding", `${clamped}px`);
  recalcPages();
}

function recalcPages() {
  const contentEl = getContentElement();
  if (!contentEl) return;
  setupColumns(contentEl);
  updatePageInfo(contentEl);
  scrollToPage(contentEl, "auto");
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

  const palette = document.createElement("div");
  palette.className = "nv-theme-palette";

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
    palette.appendChild(option);
  });

  const customOption = document.createElement("button");
  customOption.type = "button";
  customOption.className = `nv-theme-option${readerState.theme === "custom" ? " active" : ""}`;
  customOption.dataset.theme = "custom";

  const customDot = document.createElement("span");
  customDot.className = "nv-theme-dot nv-custom-dot";
  customOption.append(customDot);
  customOption.append(document.createTextNode("커스텀"));

  const selectCustom = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    readerState.theme = "custom";
    applyTheme("custom");
    await setArgumentSafe(api, "theme", "custom");
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
  palette.appendChild(customOption);
  dropdown.appendChild(palette);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = `nv-custom-edit-btn${readerState.theme === "custom" ? " visible" : ""}`;
  editButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 색상 편집';
  const openColorPanel = (event) => {
    event.preventDefault();
    event.stopPropagation();
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
  dropdown.appendChild(editButton);

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
    applyFont("_custom");
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
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-section-label",
      textContent: "줄 간격",
    }),
  );

  const lineSpacingRow = document.createElement("div");
  lineSpacingRow.className = "nv-line-spacing-row";

  const lineSpacingValue = document.createElement("span");
  lineSpacingValue.className = "nv-line-spacing-value";
  lineSpacingValue.textContent = readerState.lineSpacing.toFixed(1);

  const lineSpacingSlider = document.createElement("input");
  lineSpacingSlider.type = "range";
  lineSpacingSlider.className = "nv-line-spacing-slider";
  lineSpacingSlider.min = "1.2";
  lineSpacingSlider.max = "3.0";
  lineSpacingSlider.step = "0.1";
  lineSpacingSlider.value = String(readerState.lineSpacing);

  lineSpacingSlider.addEventListener("input", () => {
    const val = Number.parseFloat(lineSpacingSlider.value);
    lineSpacingValue.textContent = val.toFixed(1);
    applyLineSpacing(val);
  });

  lineSpacingSlider.addEventListener("change", async () => {
    await setPluginStorageItem(api, "lineSpacing", readerState.lineSpacing);
  });

  lineSpacingRow.append(lineSpacingSlider, lineSpacingValue);
  dropdown.appendChild(lineSpacingRow);

  // ── 글자 크기 ──
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-dropdown-divider",
    }),
  );
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-section-label",
      textContent: "글자 크기",
    }),
  );

  const fontSizeRow = document.createElement("div");
  fontSizeRow.className = "nv-line-spacing-row";

  const fontSizeValue = document.createElement("span");
  fontSizeValue.className = "nv-line-spacing-value";
  fontSizeValue.textContent = `${readerState.fontSize}`;

  const fontSizeSlider = document.createElement("input");
  fontSizeSlider.type = "range";
  fontSizeSlider.className = "nv-line-spacing-slider";
  fontSizeSlider.min = "12";
  fontSizeSlider.max = "28";
  fontSizeSlider.step = "1";
  fontSizeSlider.value = String(readerState.fontSize);

  fontSizeSlider.addEventListener("input", () => {
    const val = Number.parseInt(fontSizeSlider.value, 10);
    fontSizeValue.textContent = `${val}`;
    applyFontSize(val);
  });

  fontSizeSlider.addEventListener("change", async () => {
    await setPluginStorageItem(api, "fontSize", readerState.fontSize);
  });

  fontSizeRow.append(fontSizeSlider, fontSizeValue);
  dropdown.appendChild(fontSizeRow);

  // ── 여백 ──
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-dropdown-divider",
    }),
  );
  dropdown.appendChild(
    Object.assign(document.createElement("div"), {
      className: "nv-section-label",
      textContent: "여백",
    }),
  );

  const paddingRow = document.createElement("div");
  paddingRow.className = "nv-line-spacing-row";

  const paddingValue = document.createElement("span");
  paddingValue.className = "nv-line-spacing-value";
  paddingValue.textContent = `${readerState.pagePadding}`;

  const paddingSlider = document.createElement("input");
  paddingSlider.type = "range";
  paddingSlider.className = "nv-line-spacing-slider";
  paddingSlider.min = "8";
  paddingSlider.max = "120";
  paddingSlider.step = "4";
  paddingSlider.value = String(readerState.pagePadding);

  paddingSlider.addEventListener("input", () => {
    const val = Number.parseInt(paddingSlider.value, 10);
    paddingValue.textContent = `${val}`;
    applyPagePadding(val);
  });

  paddingSlider.addEventListener("change", async () => {
    await setPluginStorageItem(api, "pagePadding", readerState.pagePadding);
  });

  paddingRow.append(paddingSlider, paddingValue);
  dropdown.appendChild(paddingRow);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("open");
  });

  wrap.append(button, dropdown);
  syncCustomDot();
  syncCustomEditButtons();
  return {
    element: wrap,
    cleanup: () => document.removeEventListener("click", onDocClick),
  };
}

// Temporary bridge: reuse the app's already-rendered chat HTML until v3 exposes
// processed display output or inlay asset access directly to plugins.
function parseHostChatIndex(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : -1;
}

async function ensureHostMessagesRendered(api, rootDoc, expectedCount) {
  if (!rootDoc || !Number.isFinite(expectedCount) || expectedCount <= 0) {
    return;
  }

  let previousOldestIndex = Number.POSITIVE_INFINITY;
  let stagnantPasses = 0;

  for (let pass = 0; pass < 48; pass += 1) {
    const renderedMessages = await rootDoc.querySelectorAll(
      ".default-chat-screen .risu-chat",
    );
    const indexedMessages = [];
    for (const messageEl of renderedMessages) {
      const chatIndex = parseHostChatIndex(
        await messageEl.getAttribute("data-chat-index"),
      );
      if (chatIndex >= 0) {
        indexedMessages.push({ chatIndex, messageEl });
      }
    }

    if (indexedMessages.length >= expectedCount) {
      return;
    }

    indexedMessages.sort((left, right) => left.chatIndex - right.chatIndex);
    const oldestRendered = indexedMessages[0];
    if (!oldestRendered) {
      await sleep(80);
      continue;
    }

    if (oldestRendered.chatIndex <= 0) {
      await sleep(80);
      continue;
    }

    await oldestRendered.messageEl.scrollIntoView({ behavior: "instant", block: "start" });
    await sleep(90);

    if (oldestRendered.chatIndex === previousOldestIndex) {
      stagnantPasses += 1;
      if (stagnantPasses >= 5) {
        break;
      }
    } else {
      stagnantPasses = 0;
      previousOldestIndex = oldestRendered.chatIndex;
    }
  }

  await api.log(
    `RisuBooks host render preload incomplete: expected ${expectedCount} messages`,
  );
}

async function loadProcessedMessageHtml(api, messages, startIndex = 0) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  if (!readerState.mainDomPermissionGranted) {
    console.log("RisuBooks: processed HTML capture skipped (mainDom denied)");
    return [];
  }

  try {
    const rootDoc = await api.getRootDocument();
    if (!rootDoc) {
      return [];
    }

    if (startIndex === 0) {
      await ensureHostMessagesRendered(api, rootDoc, messages.length);
    }

    const normalizedStart = Math.max(0, Math.min(startIndex, messages.length - 1));
    const processedMessageHtml = [];
    for (let index = 0; index < messages.length; index += 1) {
      if (index < normalizedStart) {
        processedMessageHtml.push("");
        continue;
      }
      const messageEl = await rootDoc.querySelector(
        `.default-chat-screen .risu-chat[data-chat-index="${index}"] .chattext`,
      );
      const html = messageEl ? await messageEl.getInnerHTML() : "";
      processedMessageHtml.push(html || "");
    }
    return processedMessageHtml;
  } catch (error) {
    await api.log(
      `RisuBooks processed message capture failed: ${error.message}`,
    );
    return [];
  }
}

function patchReaderTailMessages(contentEl, context, startMessageIndex) {
  if (!contentEl || startMessageIndex <= 0) {
    return false;
  }

  if (!contentEl.querySelector(".nv-reader-message")) {
    return false;
  }

  contentEl.querySelectorAll(".nv-reader-message").forEach((block) => {
    const blockIndex = clampParagraphIndex(block.dataset.messageBlockIndex);
    if (blockIndex >= startMessageIndex) {
      block.remove();
    }
  });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderMessageSlice(context, startMessageIndex);
  Array.from(wrapper.childNodes).forEach((node) => {
    contentEl.appendChild(node);
  });
  return true;
}

function renderReaderBody(context, options = {}) {
  const { resetPage = false, followTail = false, tailStartMessageIndex = null } = options;
  const contentEl = getContentElement();
  if (!contentEl) {
    return "";
  }

  const previousPage = readerState.currentPage;
  const previousLocation =
    readerState.currentLocation || getCurrentReaderLocation(contentEl);

  const shouldPatchTail =
    Number.isInteger(tailStartMessageIndex) && tailStartMessageIndex > 0;
  const patchedTail = shouldPatchTail
    ? patchReaderTailMessages(contentEl, context, tailStartMessageIndex)
    : false;
  if (!patchedTail) {
    invalidateAnchorCache();
    contentEl.innerHTML =
      typeof context.renderedHtml === "string" && context.renderedHtml.length > 0
        ? context.renderedHtml
        : renderMessageContent(context);
  }

  setupColumns(contentEl);
  updatePageInfo(contentEl);

  if (followTail) {
    readerState.currentPage = Math.max(0, readerState.totalPages - 1);
    scrollToPage(contentEl, "auto");
    readerState.currentLocation = getCurrentReaderLocation(contentEl);
    return contentEl.innerHTML;
  }

  if (resetPage) {
    readerState.currentPage = 0;
    scrollToPage(contentEl, "auto");
    readerState.currentLocation = getCurrentReaderLocation(contentEl);
    return contentEl.innerHTML;
  }

  if (previousLocation && jumpToBookmark(contentEl, previousLocation, "auto")) {
    readerState.currentLocation = normalizeReaderLocation(previousLocation);
    return contentEl.innerHTML;
  }

  readerState.currentPage = Math.max(
    0,
    Math.min(previousPage, readerState.totalPages - 1),
  );
  scrollToPage(contentEl, "auto");
  readerState.currentLocation = getCurrentReaderLocation(contentEl);
  return contentEl.innerHTML;
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


function getCurrentThemeVars() {
  return readerState.theme === "custom"
    ? buildCustomThemeVars()
    : THEME_VARS[readerState.theme] || THEME_VARS.light;
}

function getReplyComposerBottomOffset() {
  const footer = document.querySelector(".novel-page-footer");
  if (!footer) {
    return 0;
  }
  const height = footer.getBoundingClientRect().height;
  return Math.max(0, Math.ceil(height || footer.offsetHeight || 0));
}

async function syncReplyComposerLayout(host, shouldHide) {
  const vars = getCurrentThemeVars();
  const bottomOffset = getReplyComposerBottomOffset();
  const hostRect = await host.getBoundingClientRect();
  const composerHeight = Math.max(56, Math.ceil(hostRect?.height || 0));
  const viewer = getViewerElement();
  viewer?.style.setProperty(
    "--nv-reply-content-padding",
    `${bottomOffset + composerHeight + 28}px`,
  );

  await host.setStyleAttribute(`
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(env(safe-area-inset-bottom, 0px) + ${bottomOffset}px);
    z-index: 1001;
    padding: 12px 16px;
    background: ${vars["--nv-overlay-bg"] || vars["--nv-bg"] || "#ffffff"};
    border-top: 1px solid ${vars["--nv-rule"] || "#e5e5e5"};
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
    ${shouldHide ? "display: none !important;" : "display: block !important;"}
  `);
}

async function syncReplyComposerOverlayVisibility() {
  const host = readerState.replyComposerHost;
  if (host) {
    const shouldHide = Boolean(
      document.querySelector(".nv-bottomsheet.open") ||
      document.querySelector(".nv-theme-modal.open") ||
      document.querySelector(".nv-cache-manager-screen.open") ||
      document.querySelector(".nv-bookmark-screen.open"),
    );

    await syncReplyComposerLayout(host, shouldHide);
  }
}

function syncReplyModeUi() {
  const viewer = getViewerElement();
  viewer?.classList.toggle("reply-mode", readerState.replyModeEnabled);
  if (!readerState.replyModeEnabled) {
    viewer?.style.removeProperty("--nv-reply-content-padding");
  }
  const label = document.querySelector('[data-role="reply-mode-label"]');
  if (label) {
    label.textContent = readerState.replyModeEnabled
      ? "답장 모드 끄기"
      : "답장 모드 켜기";
  }
  syncReplyComposerOverlayVisibility().catch(() => {});
}

async function ensureReaderMainDomPermission(api) {
  if (readerState.mainDomPermissionGranted) {
    return true;
  }
  const granted = await api.requestPluginPermission("mainDom");
  readerState.mainDomPermissionGranted = Boolean(granted);
  console.log("RisuBooks: mainDom permission", {
    granted: readerState.mainDomPermissionGranted,
  });
  return readerState.mainDomPermissionGranted;
}

async function findReplyComposerRow(rootDoc) {
  const textareaSelectors = [
    ".default-chat-screen .text-input-area",
    "textarea.text-input-area",
    ".text-input-area",
  ];
  let textarea = null;
  for (let index = 0; index < textareaSelectors.length; index += 1) {
    textarea = await rootDoc.querySelector(textareaSelectors[index]);
    if (textarea) {
      break;
    }
  }
  if (!textarea) {
    return null;
  }
  let candidate = await textarea.getParent();
  let fallback = candidate;
  let depth = 0;
  while (candidate && depth < 6) {
    const candidateTextarea = await candidate.querySelector(".text-input-area");
    const sendButton = await candidate.querySelector(".button-icon-send");
    const candidateButtons = await candidate.querySelectorAll("button");
    if (
      candidateTextarea &&
      (sendButton || candidateButtons.length >= 2)
    ) {
      return candidate;
    }
    if (candidateButtons.length > 0) {
      fallback = candidate;
    }
    candidate = await candidate.getParent();
    depth += 1;
  }
  return fallback;
}

async function restoreReplyComposer() {
  const placeholder = readerState.replyComposerPlaceholder;
  const composerRow = readerState.replyComposerElement;
  const host = readerState.replyComposerHost;
  const originalStyle = readerState.replyComposerOriginalStyle || "";

  if (placeholder && composerRow) {
    await composerRow.setStyleAttribute(originalStyle);
    await placeholder.replaceWith(composerRow);
  }
  if (host) {
    await host.remove();
  }

  readerState.replyComposerHost = null;
  readerState.replyComposerPlaceholder = null;
  readerState.replyComposerElement = null;
  readerState.replyComposerOriginalStyle = "";
}

function stopStreamingSync() {
  if (readerState.streamingPollTimer) {
    clearTimeout(readerState.streamingPollTimer);
    readerState.streamingPollTimer = null;
  }
  readerState.streamingInFlight = false;
}

function fastCleanupReplyModeState() {
  stopStreamingSync();
  readerState.replyModeEnabled = false;
  readerState.replyModeWatchActive = false;
  readerState.replyModeWatchUntil = 0;
  readerState.replyAwaitingResponse = false;
  readerState.replyAwaitingResponseSince = 0;
  readerState.streamAutoFollow = false;
}

function shouldContinueStreamingSync(isStreaming) {
  if (isStreaming) {
    return true;
  }
  if (readerState.replyAwaitingResponse) {
    if (Date.now() - readerState.replyAwaitingResponseSince < REPLY_MODE_MAX_WAIT_MS) {
      return true;
    }
    readerState.replyAwaitingResponse = false;
    readerState.replyAwaitingResponseSince = 0;
  }
  if (!readerState.replyModeEnabled || !readerState.replyModeWatchActive) {
    return false;
  }
  if (Date.now() >= readerState.replyModeWatchUntil) {
    readerState.replyModeWatchActive = false;
    return false;
  }
  return true;
}

function armReplyModeWatch(api, delay = 120, duration = 15000) {
  if (!readerState.replyModeEnabled) {
    return;
  }
  readerState.replyModeWatchActive = true;
  readerState.replyModeWatchUntil = Math.max(
    readerState.replyModeWatchUntil || 0,
    Date.now() + duration,
  );
  readerState.streamAutoFollow = true;
  scheduleStreamingSync(api, delay);
}

function scheduleStreamingSync(api, delay = 180) {
  if (readerState.streamingPollTimer) {
    clearTimeout(readerState.streamingPollTimer);
  }
  readerState.streamingPollTimer = setTimeout(() => {
    readerState.streamingPollTimer = null;
    syncStreamingReader(api).catch((error) => {
      api.log(`RisuBooks streaming sync failed: ${error.message}`).catch(() => {});
    });
  }, delay);
}

function hasChangedReaderSignature(
  nextSignature,
  prevSignature = readerState.currentCacheSignature,
) {
  if (!prevSignature) {
    return true;
  }
  return (
    nextSignature.messageCount !== prevSignature.messageCount ||
    nextSignature.lastMessageHash !== prevSignature.lastMessageHash
  );
}

function disableStreamingAutoFollow() {
  readerState.streamAutoFollow = false;
  readerState.replyModeWatchActive = false;
}

async function syncStreamingReader(api) {
  if (readerState.streamingInFlight || !readerState.context) {
    return;
  }

  readerState.streamingInFlight = true;
  try {
    const baseContext = readerState.context;
    const previousMessageCount = Array.isArray(baseContext.messages)
      ? baseContext.messages.length
      : 0;
    const chat = await api.getChatFromIndex(
      baseContext.characterIndex,
      baseContext.chatIndex,
    );
    const messages = Array.isArray(chat?.message) ? chat.message : [];
    const nextSignature = buildReaderCacheSignature(messages);
    const isStreaming = Boolean(chat?.isStreaming);
    const signatureChanged = hasChangedReaderSignature(nextSignature);
    const firstChangedMessageIndex = signatureChanged
      ? findFirstChangedMessageIndex(baseContext.messages, messages)
      : -1;

    if (signatureChanged) {
      const baseProcessedMessageHtml = Array.isArray(baseContext.processedMessageHtml)
        ? baseContext.processedMessageHtml
        : [];
      const processedMessageHtmlTail = await loadProcessedMessageHtml(
        api,
        messages,
        Math.max(0, firstChangedMessageIndex),
      );
      const processedMessageHtml = messages.map((_, index) =>
        index < firstChangedMessageIndex
          ? baseProcessedMessageHtml[index] || ""
          : processedMessageHtmlTail[index] || "",
      );
      const nextMessages = messages.map((message, index) => ({
        ...message,
        processedHtml: processedMessageHtml[index] || "",
      }));
      const nextContext = {
        ...baseContext,
        chat,
        messages: nextMessages,
        processedMessageHtml,
      };
      const latestRole = nextMessages[nextMessages.length - 1]?.role;
      const messageCountIncreased = nextMessages.length > previousMessageCount;
      const userMessageAdded =
        readerState.replyModeEnabled && messageCountIncreased && latestRole === "user";
      const charMessageAdded =
        readerState.replyModeEnabled && messageCountIncreased && latestRole === "char";

      if (userMessageAdded) {
        readerState.replyAwaitingResponse = true;
        readerState.replyAwaitingResponseSince = Date.now();
      }
      if (charMessageAdded && !isStreaming) {
        readerState.replyAwaitingResponse = false;
        readerState.replyAwaitingResponseSince = 0;
      }

      const shouldFollowTail =
        readerState.streamAutoFollow ||
        isStreaming ||
        userMessageAdded ||
        charMessageAdded;

      readerState.context = nextContext;
      readerState.currentCacheSignature = nextSignature;

      const renderedHtml = renderReaderBody(nextContext, {
        followTail: shouldFollowTail,
        tailStartMessageIndex: firstChangedMessageIndex,
      });
      nextContext.renderedHtml = renderedHtml;

      if (readerState.currentCacheEntry) {
        readerState.currentCacheEntry.messageCount = nextSignature.messageCount;
        readerState.currentCacheEntry.lastMessageHash = nextSignature.lastMessageHash;
        readerState.currentCacheEntry.paragraphCount =
          countRenderedParagraphs(renderedHtml);
        readerState.currentCacheEntry.renderedHtml = renderedHtml;
        if (!isStreaming) {
          readerState.currentCacheEntry.updatedAt = Date.now();
        }
      }
    }

    const currentSignatureToken = serializeReaderCacheSignature(
      readerState.currentCacheSignature,
    );
    const persistedSignatureToken =
      readerState.lastPersistedCacheSignature || "";
    if (
      !isStreaming &&
      readerState.currentCacheEntry &&
      currentSignatureToken !== persistedSignatureToken
    ) {
      await persistCurrentCacheState(api);
    }

    if (shouldContinueStreamingSync(isStreaming)) {
      scheduleStreamingSync(
        api,
        isStreaming ? 120 : readerState.replyAwaitingResponse ? 180 : 500,
      );
      return;
    }

    readerState.replyModeWatchActive = false;
    readerState.replyAwaitingResponse = false;
    readerState.replyAwaitingResponseSince = 0;
    stopStreamingSync();
  } finally {
    readerState.streamingInFlight = false;
  }
}

async function enableReplyMode(api) {
  if (readerState.replyModeEnabled) {
    return true;
  }

  const granted = await ensureReaderMainDomPermission(api);
  if (!granted) {
    readerState.mainDomPermissionGranted = false;
    return false;
  }

  const rootDoc = await api.getRootDocument();
  if (!rootDoc) {
    return false;
  }

  const composerRow = await findReplyComposerRow(rootDoc);
  const body = await rootDoc.querySelector("body");
  if (!composerRow || !body) {
    await api.log("RisuBooks reply mode failed: host composer row not found.");
    return false;
  }

  const host = await rootDoc.createElement("div");
  await host.setClassName("nv-reply-composer-host");

  const placeholder = await rootDoc.createElement("div");
  await placeholder.setClassName("nv-reply-composer-placeholder");
  await placeholder.setStyleAttribute("display:none !important;");
  const originalComposerStyle = await composerRow.getStyleAttribute();

  await composerRow.replaceWith(placeholder);
  await body.appendChild(host);
  await host.appendChild(composerRow);
  await composerRow.setStyleAttribute(`
    ${originalComposerStyle || ""}
    position: static !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    top: auto !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    background: transparent !important;
    z-index: auto !important;
  `);

  const textInput = await composerRow.querySelector(".text-input-area");
  await textInput?.focus();

  const bridgeListenerIds = [];
  const watchFromComposer = () => {
    readerState.replyAwaitingResponse = true;
    readerState.replyAwaitingResponseSince = Date.now();
    armReplyModeWatch(api, 90);
  };
  if (textInput) {
    const keydownId = await textInput.addEventListener("keydown", (event) => {
      if (event?.key === "Enter" && !event?.isComposing) {
        watchFromComposer();
      }
    });
    bridgeListenerIds.push({ element: textInput, type: "keydown", id: keydownId });
  }
  const clickId = await composerRow.addEventListener("click", () => {
    watchFromComposer();
  });
  bridgeListenerIds.push({ element: composerRow, type: "click", id: clickId });

  readerState.replyComposerHost = host;
  readerState.replyComposerPlaceholder = placeholder;
  readerState.replyComposerElement = composerRow;
  readerState.replyComposerOriginalStyle = originalComposerStyle || "";
  readerState.replyComposerBridgeCleanup = async () => {
    for (const listener of bridgeListenerIds) {
      await listener.element.removeEventListener(listener.type, listener.id);
    }
  };
  readerState.replyModeEnabled = true;
  readerState.streamAutoFollow = true;
  readerState.replyModeWatchActive = true;
  readerState.replyModeWatchUntil = Date.now() + REPLY_MODE_IDLE_WATCH_MS;
  readerState.replyAwaitingResponse = false;
  readerState.replyAwaitingResponseSince = 0;
  syncReplyModeUi();
  if (readerState.context) {
    const renderedHtml = renderReaderBody(readerState.context, { followTail: true });
    readerState.context.renderedHtml = renderedHtml;
  }
  await syncReplyComposerOverlayVisibility();
  scheduleStreamingSync(api, 120);
  return true;
}

async function disableReplyMode() {
  if (!readerState.replyModeEnabled) {
    return;
  }
  stopStreamingSync();
  await readerState.replyComposerBridgeCleanup?.();
  readerState.replyComposerBridgeCleanup = null;
  await restoreReplyComposer();
  readerState.replyModeEnabled = false;
  readerState.replyModeWatchActive = false;
  readerState.replyModeWatchUntil = 0;
  readerState.replyAwaitingResponse = false;
  readerState.replyAwaitingResponseSince = 0;
  syncReplyModeUi();
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
    characterPortrait: context.characterPortrait || null,
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

function renderCoverImage(portrait, fallbackChar) {
  if (portrait) {
    return `<img src="${escapeHtml(portrait)}" alt="" loading="lazy">`;
  }
  const initial = fallbackChar || "本";
  return `<div class="nv-library-cover-placeholder">${escapeHtml(initial)}</div>`;
}

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

function renderCurrentCacheCard(entry) {
  const stateText = entry.hasCache ? "판본 준비됨" : "저장된 판본 없음";
  const updatedText = entry.updatedAt
    ? formatCacheTimestamp(entry.updatedAt)
    : "아직 생성되지 않음";
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
    return '<div class="nv-library-empty">마지막 읽은 위치가 없습니다.</div>';
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
  renderBookmarkRibbons();
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
                <div class="nv-library-header">
                    <button class="nv-overlay-btn" type="button" data-action="close-bookmark-panel" aria-label="뒤로">${getNavIcon("prev")}</button>
                    <div class="nv-library-title">책갈피</div>
                </div>
                <div class="nv-bookmark-layout">
                    <section class="nv-bookmark-section">
                        <div class="nv-bookmark-section-label">현재 위치</div>
                        <div class="nv-bookmark-current"></div>
                    </section>
                    <section class="nv-bookmark-section">
                        <div class="nv-bookmark-section-label">마지막 읽은 위치</div>
                        <div class="nv-bookmark-last"></div>
                    </section>
                    <section class="nv-bookmark-section">
                        <div class="nv-bookmark-section-label">저장한 책갈피</div>
                        <div class="nv-bookmark-list"></div>
                    </section>
                </div>
            </div>
        `;
    panel
      .querySelector('[data-action="close-bookmark-panel"]')
      ?.addEventListener("click", () => {
        panel.classList.remove("open");
        syncReplyComposerOverlayVisibility().catch(() => {});
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
          syncReplyComposerOverlayVisibility().catch(() => {});
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
      renderBookmarkRibbons();
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
        : '<div class="nv-library-empty">저장한 책갈피가 없습니다.</div>';
  }

  panel.classList.add("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

async function ensureCacheManagerModal(api) {
  let overlay = document.getElementById("nv-cache-manager-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "nv-cache-manager-modal";
    overlay.className = "nv-cache-manager-screen";
    overlay.innerHTML = `
            <div class="nv-cache-manager-shell">
                <div class="nv-library-header">
                    <button class="nv-overlay-btn" type="button" data-action="close-cache-manager" aria-label="뒤로">${getNavIcon("prev")}</button>
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
        `;
    overlay
      .querySelector('[data-action="close-cache-manager"]')
      ?.addEventListener("click", () => {
        overlay.classList.remove("open");
        syncReplyComposerOverlayVisibility().catch(() => {});
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
      : '<div class="nv-library-empty">열린 세션이 없습니다.</div>';
  }
  if (listContainer) {
    listContainer.innerHTML =
      index.entries.length > 0
        ? index.entries.map((entry) => renderCacheRow(entry)).join("")
        : '<div class="nv-library-empty">저장된 판본이 없습니다.</div>';
  }
  const countEl = overlay.querySelector(".nv-library-section-count");
  if (countEl) {
    countEl.textContent = index.entries.length > 0 ? `${index.entries.length}권` : "";
  }
  overlay.classList.add("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

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

// ── 텍스트 편집 ──

function getMessageIndexFromSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return -1;
  const node = sel.anchorNode;
  const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  if (!el) return -1;
  const msgBlock = el.closest("[data-message-block-index]");
  if (!msgBlock) return -1;
  return Number.parseInt(msgBlock.dataset.messageBlockIndex, 10);
}

function ensureEditPopover() {
  let popover = document.getElementById("nv-edit-popover");
  if (popover) return popover;
  popover = document.createElement("div");
  popover.id = "nv-edit-popover";
  popover.className = "nv-edit-popover";
  popover.innerHTML = `
    <button class="nv-edit-popover-btn" data-action="edit-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      편집
    </button>`;
  const viewer = getViewerElement() || document.body;
  viewer.appendChild(popover);
  return popover;
}

function showEditPopover(x, y) {
  const popover = ensureEditPopover();
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;
  popover.classList.add("visible");

  const rect = popover.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    popover.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    popover.style.top = `${y - rect.height - 8}px`;
  }
}

function hideEditPopover() {
  document.getElementById("nv-edit-popover")?.classList.remove("visible");
}

function ensureEditModal() {
  let modal = document.getElementById("nv-edit-modal");
  if (modal) return { backdrop: document.getElementById("nv-edit-modal-backdrop"), modal };
  const backdrop = document.createElement("div");
  backdrop.id = "nv-edit-modal-backdrop";
  backdrop.className = "nv-edit-modal-backdrop";
  modal = document.createElement("div");
  modal.id = "nv-edit-modal";
  modal.className = "nv-edit-modal";
  modal.innerHTML = `
    <div class="nv-edit-modal-header">
      <span class="nv-edit-modal-title">메시지 편집</span>
      <button class="nv-overlay-btn" data-action="close-edit-modal" aria-label="닫기">${getNavIcon("close")}</button>
    </div>
    <div class="nv-edit-modal-body">
      <textarea class="nv-edit-textarea"></textarea>
      <div class="nv-edit-actions">
        <button class="nv-edit-btn nv-edit-btn-cancel" data-action="close-edit-modal">취소</button>
        <button class="nv-edit-btn nv-edit-btn-save" data-action="save-edit">저장</button>
      </div>
    </div>`;
  const viewer = getViewerElement() || document.body;
  viewer.appendChild(backdrop);
  viewer.appendChild(modal);
  return { backdrop, modal };
}

function openEditModal(messageIndex, messageText) {
  const { backdrop, modal } = ensureEditModal();
  const textarea = modal.querySelector(".nv-edit-textarea");
  if (textarea) {
    textarea.value = messageText;
    textarea.dataset.messageIndex = String(messageIndex);
  }
  backdrop.classList.add("open");
  modal.classList.add("open");
  const viewer = getViewerElement();
  if (viewer) viewer.dataset.editMode = "true";
  textarea?.focus();
}

function closeEditModal() {
  document.getElementById("nv-edit-modal-backdrop")?.classList.remove("open");
  document.getElementById("nv-edit-modal")?.classList.remove("open");
  const viewer = getViewerElement();
  if (viewer) delete viewer.dataset.editMode;
}

async function saveEditedMessage(api) {
  const modal = document.getElementById("nv-edit-modal");
  const textarea = modal?.querySelector(".nv-edit-textarea");
  if (!textarea) return;

  const messageIndex = Number.parseInt(textarea.dataset.messageIndex, 10);
  const newText = textarea.value;
  if (!Number.isFinite(messageIndex) || messageIndex < 0) return;

  const context = readerState.context;
  if (!context) return;

  try {
    const chat = await api.getChatFromIndex(context.characterIndex, context.chatIndex);
    if (!chat || !Array.isArray(chat.message) || !chat.message[messageIndex]) return;

    chat.message[messageIndex].data = newText;
    await api.setChatToIndex(context.characterIndex, context.chatIndex, chat);

    context.messages = chat.message;

    if (readerState.currentCacheEntry) {
      readerState.currentCacheEntry.renderedHtml = null;
      readerState.currentCacheSignature = null;
    }

    closeEditModal();

    const contentEl = getContentElement();
    if (contentEl) {
      const currentPage = readerState.currentPage;
      invalidateAnchorCache();
      contentEl.innerHTML = renderMessageContent(context);
      setupColumns(contentEl);
      updatePageInfo(contentEl);
      setPage(contentEl, currentPage, "auto");
      renderBookmarkRibbons();
    }
  } catch (error) {
    await api.log(`RisuBooks: edit save failed: ${error.message}`);
  }
}

// ── 숨김 패턴 관리 ──

function ensureHidePatternSheet() {
  let backdrop = document.getElementById("nv-hidepattern-backdrop");
  if (backdrop) return { backdrop, sheet: document.getElementById("nv-hidepattern-sheet") };

  backdrop = document.createElement("div");
  backdrop.id = "nv-hidepattern-backdrop";
  backdrop.className = "nv-hidepattern-backdrop";

  const sheet = document.createElement("div");
  sheet.id = "nv-hidepattern-sheet";
  sheet.className = "nv-hidepattern-sheet";
  sheet.innerHTML = `
    <div class="nv-hidepattern-header">
      <button class="nv-overlay-btn" data-action="close-hide-patterns" aria-label="닫기">${getNavIcon("close")}</button>
      <span class="nv-hidepattern-title">숨김 패턴</span>
    </div>
    <div class="nv-hidepattern-body">
      <div class="nv-hidepattern-desc">
        리더에서 숨길 텍스트 패턴을 정규식으로 추가합니다.<br>
        예: <code>System Message:.*</code>, <code>\\[시스템\\].*</code>, <code>OOC:.*</code>
      </div>
      <div class="nv-hidepattern-list"></div>
      <div class="nv-hidepattern-add-row">
        <input class="nv-hidepattern-input" type="text" placeholder="정규식 패턴 입력">
        <button class="nv-hidepattern-add-btn" data-action="add-hide-pattern">추가</button>
      </div>
    </div>`;

  const viewer = getViewerElement() || document.body;
  viewer.appendChild(backdrop);
  viewer.appendChild(sheet);
  return { backdrop, sheet };
}

function renderHidePatternList() {
  const list = document.querySelector(".nv-hidepattern-list");
  if (!list) return;
  const patterns = readerState.hidePatterns;
  if (!patterns.length) {
    list.innerHTML = '<div style="color:var(--nv-text-muted);font-size:12px;padding:8px 0;font-family:var(--nv-ui-font)">등록된 패턴이 없습니다.</div>';
    return;
  }
  list.innerHTML = patterns.map((p, i) => `
    <div class="nv-hidepattern-item">
      <code>${escapeHtml(p)}</code>
      <button class="nv-hidepattern-remove" data-action="remove-hide-pattern" data-pattern-index="${i}">×</button>
    </div>`).join("");
}

function openHidePatternSheet() {
  const { backdrop, sheet } = ensureHidePatternSheet();
  renderHidePatternList();
  backdrop.classList.add("open");
  sheet.classList.add("open");
}

function closeHidePatternSheet() {
  document.getElementById("nv-hidepattern-backdrop")?.classList.remove("open");
  document.getElementById("nv-hidepattern-sheet")?.classList.remove("open");
}

function openReaderMenu() {
  document.querySelector(".nv-bottomsheet-backdrop")?.classList.add("open");
  document.querySelector(".nv-bottomsheet")?.classList.add("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

function closeReaderMenu() {
  document.querySelector(".nv-bottomsheet-backdrop")?.classList.remove("open");
  document.querySelector(".nv-bottomsheet")?.classList.remove("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

function openThemeModal() {
  document.querySelector(".nv-theme-modal-backdrop")?.classList.add("open");
  document.querySelector(".nv-theme-modal")?.classList.add("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

function closeThemeModal() {
  document.querySelector(".nv-theme-modal-backdrop")?.classList.remove("open");
  document.querySelector(".nv-theme-modal")?.classList.remove("open");
  syncReplyComposerOverlayVisibility().catch(() => {});
}

function updateBookmarkIcon() {
  const btn = document.querySelector('[data-action="bookmark-placeholder"]');
  if (!btn) return;

  const contentEl = getContentElement();
  const bookmarks = readerState.currentCacheEntry?.bookmarks;
  let hasBookmarkOnPage = false;

  if (contentEl && Array.isArray(bookmarks) && bookmarks.length > 0) {
    const pageWidth = getPageWidth(contentEl);
    const currentPage = readerState.currentPage;
    hasBookmarkOnPage = bookmarks.some((bm) => {
      const anchor = contentEl.querySelector(
        `[data-reader-anchor="true"][data-message-index="${bm.messageIndex}"][data-paragraph-index="${bm.paragraphIndex}"]`,
      );
      if (!anchor) return false;
      return Math.floor(anchor.offsetLeft / Math.max(pageWidth, 1)) === currentPage;
    });
  }

  btn.innerHTML = getNavIcon(hasBookmarkOnPage ? "bookmarkFilled" : "bookmark");
  btn.dataset.bookmarked = hasBookmarkOnPage ? "true" : "false";
}

function renderBookmarkRibbons() {
  const contentEl = getContentElement();
  const bodyEl = contentEl?.parentElement;
  if (!contentEl || !bodyEl) return;

  let container = bodyEl.querySelector(".nv-bookmark-ribbon-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "nv-bookmark-ribbon-container";
    bodyEl.appendChild(container);
  }
  container.innerHTML = "";

  const bookmarks = readerState.currentCacheEntry?.bookmarks;
  if (!Array.isArray(bookmarks) || bookmarks.length === 0) return;

  const portrait = readerState.context?.personaPortrait || readerState.context?.characterPortrait;
  const bodyRect = bodyEl.getBoundingClientRect();
  const pageWidth = getPageWidth(contentEl);
  const currentPage = readerState.currentPage;
  const RIBBON_HEIGHT = 100;
  let ribbonPlaced = false;

  for (const bm of bookmarks) {
    if (ribbonPlaced) break;

    const anchor = contentEl.querySelector(
      `[data-reader-anchor="true"][data-message-index="${bm.messageIndex}"][data-paragraph-index="${bm.paragraphIndex}"]`,
    );
    if (!anchor) continue;

    const anchorPage = Math.floor(anchor.offsetLeft / Math.max(pageWidth, 1));
    if (anchorPage !== currentPage) continue;

    const ribbon = document.createElement("div");
    ribbon.className = "nv-bookmark-ribbon";
    ribbon.dataset.bookmarkId = bm.id;
    ribbon.style.top = "0px";
    ribbon.style.height = `${RIBBON_HEIGHT}px`;

    if (portrait) {
      ribbon.innerHTML = `<div class="nv-bookmark-ribbon-inner"><img src="${escapeHtml(portrait)}" alt=""></div>`;
    } else {
      ribbon.innerHTML = `<div class="nv-bookmark-ribbon-inner"><div class="nv-bookmark-ribbon-fallback"></div></div>`;
    }

    container.appendChild(ribbon);
    ribbonPlaced = true;
  }
  updateBookmarkIcon();
}

let _progressFillEl = null;
function updateProgressBar() {
  if (!_progressFillEl || !_progressFillEl.isConnected) {
    _progressFillEl = document.querySelector(".nv-progress-fill");
  }
  if (!_progressFillEl) return;
  const pct = readerState.totalPages > 1
    ? (readerState.currentPage / (readerState.totalPages - 1)) * 100
    : 0;
  _progressFillEl.style.width = `${Math.min(100, pct)}%`;
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
  const progressInput = getProgressInputElement();
  const menuButton = document.querySelector('[data-action="open-reader-menu"]');
  const menuBackdrop = document.querySelector('[data-action="close-reader-menu"]');
  const openBookmarkManagerButton = document.querySelector(
    '[data-action="open-bookmark-manager"]',
  );
  const openCacheManagerButton = document.querySelector(
    '[data-action="open-cache-manager"]',
  );
  const replyModeButton = document.querySelector(
    '[data-action="toggle-reply-mode"]',
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
    syncReplyComposerOverlayVisibility().catch(() => {});
  };

  const onKeydown = (event) => {
    const isEditing = getViewerElement()?.dataset.editMode === "true";
    if (isEditing) {
      if (event.key === "Escape") closeEditModal();
      return;
    }
    if (event.key === "Escape") {
      closeReader(api).catch(() => {});
    } else if (event.key === "ArrowRight") {
      disableStreamingAutoFollow();
      setPage(contentEl, readerState.currentPage + 1);
    } else if (event.key === "ArrowLeft") {
      disableStreamingAutoFollow();
      setPage(contentEl, readerState.currentPage - 1);
    }
  };

  const onWheel = (event) => {
    if (getViewerElement()?.dataset.editMode === "true") return;
    event.preventDefault();
    disableStreamingAutoFollow();
    if (event.deltaY > 0 || event.deltaX > 0) {
      setPage(contentEl, readerState.currentPage + 1);
    } else if (event.deltaY < 0 || event.deltaX < 0) {
      setPage(contentEl, readerState.currentPage - 1);
    }
  };

  let lastRenderedPage = -1;
  let scrollRafId = null;
  const onScroll = () => {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
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
      updateProgressBar();
      if (readerState.currentPage !== lastRenderedPage) {
        lastRenderedPage = readerState.currentPage;
        renderBookmarkRibbons();
      }
      updateCurrentReadingLocation(contentEl, api);
    });
  };

  const onContentClick = (event) => {
    if (event.target.closest("a, button, input, [data-action]")) return;
    const rect = contentEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = x / rect.width;
    if (pct < 0.3) {
      hideReaderOverlay();
      onPrev();
    } else if (pct > 0.7) {
      hideReaderOverlay();
      onNext();
    } else {
      toggleReaderOverlay();
    }
  };

  const onTouchStart = (event) => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
  };

  const onTouchEnd = (event) => {
    const diff = touchStartX - (event.changedTouches[0]?.clientX || 0);
    if (Math.abs(diff) < 48) {
      return;
    }
    disableStreamingAutoFollow();
    hideReaderOverlay();
    setPage(contentEl, readerState.currentPage + (diff > 0 ? 1 : -1));
  };

  const onClose = () => {
    closeReader(api).catch(() => {});
  };
  const onSaveBookmark = async () => {
    const btn = document.querySelector('[data-action="bookmark-placeholder"]');
    const hasBookmark = btn?.dataset.bookmarked === "true";
    if (hasBookmark) {
      const cacheEntry = readerState.currentCacheEntry;
      if (!cacheEntry || !Array.isArray(cacheEntry.bookmarks)) return;
      const contentEl2 = getContentElement();
      if (!contentEl2) return;
      const pageWidth2 = getPageWidth(contentEl2);
      const currentPage2 = readerState.currentPage;
      const toRemove = cacheEntry.bookmarks.filter((bm) => {
        const anchor = contentEl2.querySelector(
          `[data-reader-anchor="true"][data-message-index="${bm.messageIndex}"][data-paragraph-index="${bm.paragraphIndex}"]`,
        );
        if (!anchor) return false;
        return Math.floor(anchor.offsetLeft / Math.max(pageWidth2, 1)) === currentPage2;
      });
      if (toRemove.length > 0) {
        const removeIds = new Set(toRemove.map((bm) => bm.id));
        cacheEntry.bookmarks = cacheEntry.bookmarks.filter((item) => !removeIds.has(item.id));
        await persistCurrentCacheState(api);
      }
      renderBookmarkRibbons();
      updateBookmarkIcon();
    } else {
      await saveCurrentBookmark(api);
    }
  };
  const onOpenMenu = () => { openReaderMenu(); };
  const onCloseMenu = () => { closeReaderMenu(); };
  const themeModalBtn = document.querySelector('[data-action="open-theme-modal"]');
  const themeModalCloseEls = document.querySelectorAll('[data-action="close-theme-modal"]');

  const onOpenThemeModal = () => {
    closeReaderMenu();
    openThemeModal();
  };
  const onCloseThemeModal = () => {
    closeThemeModal();
  };
  const onOpenBookmarkManager = () => {
    closeReaderMenu();
    openBookmarkPanel(api).catch(() => {});
  };
  const onPrev = () => {
    disableStreamingAutoFollow();
    setPage(contentEl, readerState.currentPage - 1);
  };
  const onNext = () => {
    disableStreamingAutoFollow();
    setPage(contentEl, readerState.currentPage + 1);
  };
  const onFirst = () => {
    disableStreamingAutoFollow();
    setPage(contentEl, 0);
  };
  const onLast = () => {
    disableStreamingAutoFollow();
    setPage(contentEl, readerState.totalPages - 1);
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
    disableStreamingAutoFollow();
    const pendingPage = Math.max(
      0,
      Math.min(value - 1, readerState.totalPages - 1),
    );
    setPage(contentEl, pendingPage, "auto");
  };
  const onOpenCacheManager = () => {
    closeReaderMenu();
    openCacheManagerModal(api).catch(() => {});
  };
  const onOpenHidePatterns = () => {
    closeReaderMenu();
    openHidePatternSheet();
  };
  const onHidePatternAction = async (event) => {
    const addBtn = event.target.closest('[data-action="add-hide-pattern"]');
    if (addBtn) {
      const input = document.querySelector(".nv-hidepattern-input");
      const val = input?.value?.trim();
      if (!val) return;
      try { new RegExp(val); } catch (_) { return; }
      readerState.hidePatterns.push(val);
      await setPluginStorageItem(api, "hidePatterns", readerState.hidePatterns);
      if (input) input.value = "";
      renderHidePatternList();
      return;
    }
    const removeBtn = event.target.closest('[data-action="remove-hide-pattern"]');
    if (removeBtn) {
      const idx = Number.parseInt(removeBtn.dataset.patternIndex, 10);
      if (Number.isFinite(idx) && idx >= 0) {
        readerState.hidePatterns.splice(idx, 1);
        await setPluginStorageItem(api, "hidePatterns", readerState.hidePatterns);
        renderHidePatternList();
      }
      return;
    }
    const closeBtn = event.target.closest('[data-action="close-hide-patterns"]');
    if (closeBtn) {
      closeHidePatternSheet();
    }
  };
  const onToggleReplyMode = () => {
    closeReaderMenu();
    const action = readerState.replyModeEnabled
      ? disableReplyMode()
      : enableReplyMode(api);
    Promise.resolve(action).catch((error) => {
      api.log(`RisuBooks reply mode failed: ${error.message}`).catch(() => {});
    });
  };
  const onPageHide = () => {
    fastCleanupReplyModeState();
    closeReader(api).catch(() => {});
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  document.addEventListener("keydown", onKeydown);
  contentEl.addEventListener("wheel", onWheel, { passive: false });
  contentEl.addEventListener("scroll", onScroll);
  contentEl.addEventListener("touchstart", onTouchStart, { passive: true });
  contentEl.addEventListener("touchend", onTouchEnd, { passive: true });
  closeLabelButton?.addEventListener("click", onClose);
  const onSaveBookmarkSafe = () => { onSaveBookmark().catch(() => {}); };
  bookmarkButton?.addEventListener("click", onSaveBookmarkSafe);
  contentEl.addEventListener("click", onContentClick);

  let editMessageIndex = -1;
  let selectionTimer = null;
  const onSelectionChange = () => {
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        hideEditPopover();
        return;
      }
      editMessageIndex = getMessageIndexFromSelection();
      if (editMessageIndex < 0) {
        hideEditPopover();
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showEditPopover(rect.left + rect.width / 2 - 30, rect.top - 44);
    }, 200);
  };

  const onEditAction = (event) => {
    const btn = event.target.closest('[data-action="edit-message"]');
    if (btn && editMessageIndex >= 0) {
      hideEditPopover();
      const msg = readerState.context?.messages?.[editMessageIndex];
      if (msg) {
        openEditModal(editMessageIndex, msg.data || "");
      }
      window.getSelection()?.removeAllRanges();
    }
    const closeBtn = event.target.closest('[data-action="close-edit-modal"]');
    if (closeBtn) {
      closeEditModal();
    }
    const saveBtn = event.target.closest('[data-action="save-edit"]');
    if (saveBtn) {
      saveEditedMessage(api).catch(() => {});
    }
  };

  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("click", onEditAction);

  progressInput?.addEventListener("input", onProgressInput);
  progressInput?.addEventListener("change", onProgressChange);
  menuButton?.addEventListener("click", onOpenMenu);
  menuBackdrop?.addEventListener("click", onCloseMenu);
  themeModalBtn?.addEventListener("click", onOpenThemeModal);
  themeModalCloseEls.forEach((el) => el.addEventListener("click", onCloseThemeModal));
  openBookmarkManagerButton?.addEventListener("click", onOpenBookmarkManager);
  openCacheManagerButton?.addEventListener("click", onOpenCacheManager);
  const hidePatternsBtn = document.querySelector('[data-action="open-hide-patterns"]');
  hidePatternsBtn?.addEventListener("click", onOpenHidePatterns);
  document.addEventListener("click", onHidePatternAction);
  replyModeButton?.addEventListener("click", onToggleReplyMode);

  readerState.cleanup = () => {
    readerState.settingsCleanup?.();
    readerState.settingsCleanup = null;
    stopStreamingSync();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("selectionchange", onSelectionChange);
    document.removeEventListener("click", onEditAction);
    hideEditPopover();
    closeEditModal();
    contentEl.removeEventListener("wheel", onWheel);
    contentEl.removeEventListener("scroll", onScroll);
    contentEl.removeEventListener("touchstart", onTouchStart);
    contentEl.removeEventListener("touchend", onTouchEnd);
    closeLabelButton?.removeEventListener("click", onClose);
    bookmarkButton?.removeEventListener("click", onSaveBookmarkSafe);
    contentEl.removeEventListener("click", onContentClick);
    progressInput?.removeEventListener("input", onProgressInput);
    progressInput?.removeEventListener("change", onProgressChange);
    menuButton?.removeEventListener("click", onOpenMenu);
    menuBackdrop?.removeEventListener("click", onCloseMenu);
    themeModalBtn?.removeEventListener("click", onOpenThemeModal);
    themeModalCloseEls.forEach((el) => el.removeEventListener("click", onCloseThemeModal));
    openBookmarkManagerButton?.removeEventListener("click", onOpenBookmarkManager);
    openCacheManagerButton?.removeEventListener("click", onOpenCacheManager);
    hidePatternsBtn?.removeEventListener("click", onOpenHidePatterns);
    document.removeEventListener("click", onHidePatternAction);
    closeHidePatternSheet();
    replyModeButton?.removeEventListener("click", onToggleReplyMode);
    if (readerState.locationPersistTimer) {
      clearTimeout(readerState.locationPersistTimer);
      readerState.locationPersistTimer = null;
    }
    clearNavigationPageLock();
  };

  updateCurrentReadingLocation(contentEl, api, false);
  updateProgressControl();
  renderBookmarkRibbons();
}

function renderReaderShell(context, api) {
  ensureReaderStyle();
  readerState.replyModeEnabled = false;
  readerState.replyComposerHost = null;
  readerState.replyComposerPlaceholder = null;
  readerState.replyComposerElement = null;
  readerState.replyComposerOriginalStyle = "";
  readerState.replyComposerBridgeCleanup = null;
  readerState.streamAutoFollow = false;
  readerState.replyModeWatchActive = false;
  readerState.replyModeWatchUntil = 0;
  readerState.mainDomPermissionGranted = false;

  document.body.innerHTML = `
        <div class="novel-viewer" data-theme="light">
            <!-- 오버레이 헤더 -->
            <div class="novel-header">
                <button class="nv-overlay-btn" type="button" data-action="close-reader-label" aria-label="뒤로">${getNavIcon("prev")}</button>
                <div class="nv-overlay-title">${getDisplayName(context)}</div>
                <button class="nv-overlay-btn" type="button" data-action="bookmark-placeholder" aria-label="북마크">${getNavIcon("bookmark")}</button>
            </div>

            <!-- 본문 -->
            <div class="novel-body">
                <div class="novel-content"></div>
            </div>

            <!-- 상시 진행바 -->
            <div class="nv-progress-bar">
                <div class="nv-progress-fill"></div>
            </div>

            <!-- 오버레이 푸터 -->
            <div class="novel-page-footer">
                <div class="nv-slider-row">
                    <input class="novel-page-progress-slider" type="range" min="1" max="1" value="1" step="1" data-action="page-progress" aria-label="페이지 이동" />
                    <span class="novel-page-indicator">1 / 1</span>
                    <button class="nv-overlay-btn" type="button" data-action="open-reader-menu" aria-label="메뉴">${getNavIcon("hamburger")}</button>
                </div>
            </div>

            <!-- 바텀시트 메뉴 -->
            <div class="nv-bottomsheet-backdrop" data-action="close-reader-menu"></div>
            <div class="nv-bottomsheet">
                <div class="nv-bottomsheet-handle"></div>
                <button class="nv-bottomsheet-item" type="button" data-action="open-theme-modal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    테마 설정
                </button>
                <button class="nv-bottomsheet-item" type="button" data-action="open-cache-manager">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                    판본 관리
                </button>
                <button class="nv-bottomsheet-item" type="button" data-action="open-bookmark-manager">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>
                    책갈피
                </button>
                <button class="nv-bottomsheet-item" type="button" data-action="open-hide-patterns">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                    숨김 패턴
                </button>
                <button class="nv-bottomsheet-item" type="button" data-action="toggle-reply-mode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span data-role="reply-mode-label">답장 모드 켜기</span>
                </button>
            </div>

            <!-- 테마 설정 센터 모달 -->
            <div class="nv-theme-modal-backdrop" data-action="close-theme-modal"></div>
            <div class="nv-theme-modal">
                <div class="nv-theme-modal-header">
                    <button class="nv-overlay-btn" type="button" data-action="close-theme-modal" aria-label="닫기">${getNavIcon("close")}</button>
                    <span class="nv-theme-modal-title">테마 설정</span>
                </div>
                <div class="nv-theme-modal-body" data-slot="settings"></div>
            </div>
        </div>
    `;

  readerState.settingsCleanup?.();
  const settingsSlot = document.querySelector('[data-slot="settings"]');
  if (settingsSlot) {
    const settingsUi = createThemeToggle(api);
    const dropdown = settingsUi.element.querySelector(".nv-theme-dropdown");
    if (dropdown) {
      settingsSlot.appendChild(dropdown);
    }
    readerState.settingsCleanup = settingsUi.cleanup;
  }
  applyTheme(readerState.theme);
  applyFont(readerState.font);
  applyLineSpacing(readerState.lineSpacing);
  applyFontSize(readerState.fontSize);
  applyPagePadding(readerState.pagePadding);
  syncReplyModeUi();
}

async function closeReader(api) {
  stopStreamingSync();
  await disableReplyMode();
  readerState.cleanup?.();
  readerState.cleanup = null;

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
                    <strong>RisuBooks failed to load</strong>
                    <div>${escapeHtml(message)}</div>
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
    console.log("RisuBooks: loading current reader context");
    const [characterIndex, chatIndex] = await Promise.all([
      withTimeout(api.getCurrentCharacterIndex(), 10000, -1),
      withTimeout(api.getCurrentChatIndex(), 10000, -1),
    ]);
    console.log("RisuBooks: current indexes", {
      characterIndex,
      chatIndex,
    });
    if (characterIndex < 0 || chatIndex < 0) {
      throw new Error("Timed out while resolving the current chat session.");
    }
    const chat = await withTimeout(api.getChatFromIndex(characterIndex, chatIndex), 15000, null);
    console.log("RisuBooks: current chat loaded", {
      hasChat: Boolean(chat),
      messageCount: Array.isArray(chat?.message) ? chat.message.length : -1,
    });
    if (!chat) {
      throw new Error("Timed out while loading the current chat.");
    }
    const messages = Array.isArray(chat?.message) ? chat.message : [];

    let character = null;
    let personas = [];
    let selectedPersona = 0;
    let activePersona = null;
    let characterPortrait = "";
    let personaPortrait = "";
    try {
      character = await withTimeout(api.getCharacterFromIndex(characterIndex), 10000, null);
      const db = await withTimeout(api.getDatabase(["personas", "selectedPersona"]), 10000, null);
      personas = Array.isArray(db?.personas) ? db.personas : [];
      selectedPersona = Number.isInteger(db?.selectedPersona) ? db.selectedPersona : 0;
      activePersona = personas[selectedPersona] || null;
      characterPortrait = await loadAssetDataUrlSafe(api, character?.image);
      personaPortrait = activePersona?.icon
        ? await loadAssetDataUrlSafe(api, activePersona.icon)
        : "";
    } catch (_) {}

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
    await api.log(`RisuBooks context load failed: ${error.message}`);
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
  console.log("RisuBooks: preparing reader edition", {
    messageCount: Array.isArray(context?.messages) ? context.messages.length : -1,
  });
  const signature = buildReaderCacheSignature(context.messages);
  const signatureToken = serializeReaderCacheSignature(signature);
  const cacheKey = getReaderCacheKey(context.characterIndex, context.chatIndex);
  readerState.currentCacheKey = cacheKey;
  readerState.currentCacheSignature = signature;

  const cacheEntry = await loadReaderEditionCache(api, cacheKey);
  if (isReaderEditionCacheValid(cacheEntry, signature)) {
    console.log("RisuBooks: using cached edition", { cacheKey });
    readerState.currentCacheEntry = normalizeReaderEditionCache(cacheEntry);
    readerState.lastPersistedCacheSignature = signatureToken;
    return {
      ...context,
      processedMessageHtml: [],
      renderedHtml: cacheEntry.renderedHtml,
    };
  }

  renderLoadingState("리더 준비 중");
  const processedMessageHtml = await withTimeout(
    loadProcessedMessageHtml(api, context.messages),
    15000,
    null,
  );
  if (!processedMessageHtml) {
    throw new Error("Timed out while building the reader edition.");
  }
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
    cacheVersion: READER_EDITION_CACHE_VERSION,
    updatedAt: Date.now(),
    messageCount: signature.messageCount,
    lastMessageHash: signature.lastMessageHash,
    paragraphCount: countRenderedParagraphs(renderedHtml),
    renderedHtml,
    bookmarks: cacheEntry?.bookmarks || [],
    lastLocation: {
      messageIndex: 0,
      paragraphIndex: 0,
      preview: "",
      updatedAt: null,
    },
  };
  await saveReaderEditionCache(api, context, nextCacheEntry);
  readerState.currentCacheEntry = normalizeReaderEditionCache(nextCacheEntry);
  readerState.lastPersistedCacheSignature = signatureToken;
  return {
    ...editionContext,
    renderedHtml,
  };
}

async function openReader(api) {
  try {
    console.log("RisuBooks: open requested");
    await loadReaderSettings(api);
    await ensureReaderMainDomPermission(api);
    await api.showContainer("fullscreen");
    renderLoadingState("세션 확인 중");
    const context = await withTimeout(
      loadCurrentReaderContext(api),
      12000,
      null,
    );
    if (!context) {
      readerState.context = null;
      renderErrorState(api, "Unable to load the current chat.");
      return;
    }
    if (!context.ok) {
      readerState.context = null;
      renderErrorState(
        api,
        context.error?.message || "Unable to load the current chat.",
      );
      return;
    }
    renderLoadingState("판본 확인 중");
    console.log("RisuBooks: context ready");
    const preparedContext = await withTimeout(
      prepareReaderEdition(api, context),
      20000,
      null,
    );
    if (!preparedContext) {
      throw new Error("Timed out while preparing the ebook reader.");
    }
    console.log("RisuBooks: edition ready");
    readerState.context = preparedContext;
    await setPluginStorageItem(api, "readerLastOpenAt", Date.now());
    renderReaderShell(preparedContext, api);
    renderReaderBody(preparedContext, { resetPage: true });
    installReaderEvents(api);
  } catch (error) {
    renderErrorState(api, error.message);
    await api.log(`RisuBooks open failed: ${error.message}`);
  }
}

(async () => {
  try {
    await risuai.registerSetting(
      "RisuBooks",
      async () => {
        await openReader(risuai);
      },
      "📚",
      "html",
    );

    await risuai.registerButton(
      {
        name: "RisuBooks",
        icon: "📚",
        iconType: "html",
        location: "chat",
      },
      async () => {
        await openReader(risuai);
      },
    );
  } catch (error) {
    await risuai.log(`RisuBooks bootstrap failed: ${error.message}`);
  }
})();
