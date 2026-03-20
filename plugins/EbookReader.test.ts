import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const sourcePath = resolve(process.cwd(), 'plugins/EbookReader.js')
const legacyPath = resolve(process.cwd(), 'plugins/EbookReader_v3.js')
const src = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : ''

function extractFunctionSource(source: string, name: string) {
    const start = source.indexOf(`function ${name}(`)
    expect(start).toBeGreaterThan(-1)

    const bodyStart = source.indexOf('{', start)
    expect(bodyStart).toBeGreaterThan(-1)

    let depth = 0
    for (let index = bodyStart; index < source.length; index++) {
        const char = source[index]
        if (char === '{') {
            depth += 1
        } else if (char === '}') {
            depth -= 1
            if (depth === 0) {
                return source.slice(start, index + 1)
            }
        }
    }

    throw new Error(`Unable to extract function ${name}`)
}

describe('EbookReader contract', () => {
    test('uses a single ebook reader source file', () => {
        expect(existsSync(sourcePath)).toBe(true)
        expect(existsSync(legacyPath)).toBe(false)
    })

    test('declares API 3.0 metadata and plugin entry points', () => {
        expect(src).toContain('//@api 3.0')
        expect(src).toContain('registerSetting(')
        expect(src).toContain('showContainer(')
    })

    test('loads current reader data through v3 chat APIs', () => {
        expect(src).toContain('getCurrentCharacterIndex')
        expect(src).toContain('getCurrentChatIndex')
        expect(src).toContain('getChatFromIndex')
        expect(src).toContain('function ensureReaderMainDomPermission')
        expect(src).toContain('await ensureReaderMainDomPermission(api)')
        expect(src).toContain('function withTimeout')
        expect(src).toContain('function loadAssetDataUrlSafe')
        expect(src).toContain('Promise.all([')
        expect(src).toContain('withTimeout(api.getCurrentCharacterIndex(), 4000, -1)')
        expect(src).toContain('withTimeout(api.getCurrentChatIndex(), 4000, -1)')
        expect(src).toContain('withTimeout(api.getChatFromIndex(characterIndex, chatIndex), 8000, null)')
        expect(src).not.toContain("querySelectorAll('.novel-viewer')")
        expect(src).not.toContain('mutationObs.observe(document.body')
    })

    test('renders a plugin-owned reader shell', () => {
        expect(src).toContain('document.body.innerHTML')
        expect(src).toContain('novel-viewer')
        expect(src).toContain('novel-header')
        expect(src).toContain('novel-body')
        expect(src).toContain('novel-page-footer')
        expect(src).toContain('nv-progress-bar')
        expect(src).toContain('data-action="open-reader-menu"')
    })

    test('implements iframe page navigation without legacy window globals', () => {
        expect(src).toContain('function renderMessageContent')
        expect(src).toContain('function updatePageInfo')
        expect(src).toContain('function scrollToPage')
        expect(src).not.toContain('window._nvPageState')
        expect(src).not.toContain('window._nvWheelLocks')
    })

    test('adds a release-to-jump progress slider in the footer', () => {
        expect(src).toContain('function getProgressInputElement')
        expect(src).toContain('function updateProgressControl')
        expect(src).toContain('function getPendingPage')
        expect(src).toContain('class="novel-page-progress-slider"')
        expect(src).toContain('class="novel-page-indicator"')
        expect(src).toContain('data-action="page-progress"')
        expect(src).toContain('type="range"')
        expect(src).toContain('progressInput?.addEventListener("input", onProgressInput)')
        expect(src).toContain('progressInput?.addEventListener("change", onProgressChange)')
        expect(src).toContain('setPage(contentEl, pendingPage, "auto")')
    })

    test('keeps desktop page state stable during smooth two-page navigation scroll events', () => {
        expect(src).toContain('function resolveCurrentPageFromScroll')

        const factory = new Function(`
            ${extractFunctionSource(src, 'getPageWidth')}
            ${extractFunctionSource(src, 'resolveCurrentPageFromScroll')}
            return { getPageWidth, resolveCurrentPageFromScroll };
        `)

        const previousWindow = globalThis.window
        globalThis.window = {
            getComputedStyle: () => ({ columnGap: '60px' }),
        } as unknown as Window & typeof globalThis

        try {
            const { getPageWidth, resolveCurrentPageFromScroll } = factory() as {
                getPageWidth: (contentEl: { clientWidth: number }) => number
                resolveCurrentPageFromScroll: (
                    contentEl: { clientWidth: number; scrollWidth: number; scrollLeft: number },
                    navigationLockPage: number | null,
                    totalPages: number,
                ) => { page: number; keepNavigationLock: boolean }
            }

            const contentEl = {
                clientWidth: 1000,
                scrollWidth: 30000,
                scrollLeft: 0,
            }

            const pageWidth = getPageWidth(contentEl)
            contentEl.scrollLeft = pageWidth * 20.4

            const duringSmoothScroll = resolveCurrentPageFromScroll(contentEl, 21, 120)
            expect(duringSmoothScroll.page).toBe(21)
            expect(duringSmoothScroll.keepNavigationLock).toBe(true)

            const withoutLock = resolveCurrentPageFromScroll(contentEl, null, 120)
            expect(withoutLock.page).toBe(20)
            expect(withoutLock.keepNavigationLock).toBe(false)

            contentEl.scrollLeft = pageWidth * 21
            const afterScrollSettles = resolveCurrentPageFromScroll(contentEl, 21, 120)
            expect(afterScrollSettles.page).toBe(21)
            expect(afterScrollSettles.keepNavigationLock).toBe(false)
        } finally {
            globalThis.window = previousWindow
        }
    })

    test('stores reader settings through v3 storage APIs', () => {
        expect(src).toContain('getArgument(')
        expect(src).toContain('setArgument(')
        expect(src).toContain('pluginStorage')
        expect(src).toContain('getPluginStorageItem(')
        expect(src).toContain('setPluginStorageItem(')
        expect(src).not.toContain('localStorage.getItem(')
        expect(src).not.toContain('localStorage.setItem(')
    })

    test('defines per-session edition cache keys and validation helpers', () => {
        expect(src).toContain('const READER_EDITION_CACHE_VERSION = 2;')
        expect(src).toContain('const CACHE_INDEX_KEY = "readerCacheIndex"')
        expect(src).toContain('const CACHE_ENTRY_PREFIX = "readerCache:"')
        expect(src).toContain('function getReaderCacheKey')
        expect(src).toContain('function buildReaderCacheSignature')
        expect(src).toContain('messageCount')
        expect(src).toContain('lastMessageHash')
        expect(src).toContain('function isReaderEditionCacheValid')
        expect(src).toContain('cacheEntry.cacheVersion === READER_EDITION_CACHE_VERSION')
        expect(src).toContain('function loadReaderEditionCache')
        expect(src).toContain('function saveReaderEditionCache')
    })

    test('adds explicit loading stages before the reader renders', () => {
        expect(src).toContain('function renderLoadingState')
        expect(src).toContain('세션 확인 중')
        expect(src).toContain('판본 확인 중')
        expect(src).toContain('리더 준비 중')
    })

    test('adds a bottomsheet reader menu and cache management screen for reader actions', () => {
        expect(src).toContain('function openReaderMenu')
        expect(src).toContain('function closeReaderMenu')
        expect(src).toContain('function ensureCacheManagerModal')
        expect(src).toContain('function openCacheManagerModal')
        expect(src).toContain('class="nv-bottomsheet"')
        expect(src).toContain('class="nv-bottomsheet-backdrop"')
        expect(src).toContain('data-action="open-reader-menu"')
        expect(src).toContain('data-action="open-theme-modal"')
        expect(src).not.toContain('data-action="refresh-main-dom-permission"')
        expect(src).not.toContain('data-role="main-dom-permission-label"')
        expect(src).not.toContain('이북리더 (비허용)')
        expect(src).toContain('nv-cache-manager-screen')
        expect(src).toContain('nv-library-header')
        expect(src).toContain('nv-library-current-label')
        expect(src).toContain('nv-library-grid')
        expect(src).toContain('캐시 관리')
        expect(src).toContain('읽고 있는 세션')
        expect(src).toContain('저장된 판본')
        expect(src).toContain('전체 비우기')
        expect(src).toContain('z-index: 1102;')
        expect(src).toContain('z-index: 1103;')
    })

    test('adds a reply mode bridge that reuses the host chat composer through mainDom', () => {
        expect(src).toContain('replyModeEnabled')
        expect(src).toContain('replyComposerHost')
        expect(src).toContain('replyComposerPlaceholder')
        expect(src).toContain('replyComposerElement')
        expect(src).toContain('replyComposerOriginalStyle')
        expect(src).toContain('function enableReplyMode')
        expect(src).toContain('function disableReplyMode')
        expect(src).toContain('function restoreReplyComposer')
        expect(src).toContain('requestPluginPermission("mainDom")')
        expect(src).toContain('.default-chat-screen .text-input-area')
        expect(src).toContain('textarea.text-input-area')
        expect(src).toContain('".text-input-area"')
        expect(src).toContain('let candidate = await textarea.getParent()')
        expect(src).toContain('while (candidate && depth < 6)')
        expect(src).toContain('const sendButton = await candidate.querySelector(".button-icon-send")')
        expect(src).toContain('const candidateButtons = await candidate.querySelectorAll("button")')
        expect(src).toContain('return fallback')
        expect(src).toContain('const clickId = await composerRow.addEventListener("click", () => {')
        expect(src).toContain('replaceWith(placeholder)')
        expect(src).toContain('appendChild(composerRow)')
        expect(src).toContain('await composerRow.getStyleAttribute()')
        expect(src).toContain('position: static !important;')
        expect(src).toContain('width: 100% !important;')
        expect(src).toContain('await composerRow.setStyleAttribute(')
        expect(src).toContain('renderReaderBody(readerState.context, { followTail: true })')
        expect(src).toContain('window.addEventListener("pagehide", onPageHide);')
        expect(src).toContain('window.addEventListener("beforeunload", onPageHide);')
        expect(src).toContain('fastCleanupReplyModeState();')
        expect(src).toContain('답장 모드')
    })

    test('polls the current chat for streaming updates while reply mode is active', () => {
        expect(src).toContain('streamingPollTimer')
        expect(src).toContain('streamingInFlight')
        expect(src).toContain('streamAutoFollow')
        expect(src).toContain('lastPersistedCacheSignature')
        expect(src).toContain('replyModeWatchActive')
        expect(src).toContain('replyAwaitingResponse')
        expect(src).toContain('const REPLY_MODE_MAX_WAIT_MS = 120000;')
        expect(src).toContain('const REPLY_MODE_IDLE_WATCH_MS = 5000;')
        expect(src).toContain('function scheduleStreamingSync')
        expect(src).toContain('function stopStreamingSync')
        expect(src).toContain('function fastCleanupReplyModeState')
        expect(src).toContain('function syncStreamingReader')
        expect(src).toContain('function shouldContinueStreamingSync')
        expect(src).toContain('chat?.isStreaming')
        expect(src).toContain('Date.now() - readerState.replyAwaitingResponseSince < REPLY_MODE_MAX_WAIT_MS')
        expect(src).toContain('if (!readerState.replyModeEnabled || !readerState.replyModeWatchActive) {')
        expect(src).toContain('await api.getChatFromIndex(')
        expect(src).toContain('scheduleStreamingSync(api')
        expect(src).toContain('await persistCurrentCacheState(api)')
        expect(src).toContain('latestRole === "user"')
        expect(src).toContain('const charMessageAdded =')
        expect(src).toContain('isStreaming ? 120 : readerState.replyAwaitingResponse ? 180 : 500')
        expect(src).toContain('nextMessages.length > previousMessageCount')
    })

    test('measures the reader footer instead of using a hard-coded reply composer offset', () => {
        expect(src).toContain('function getReplyComposerBottomOffset')
        expect(src).toContain('const footer = document.querySelector(".novel-page-footer")')
        expect(src).toContain('footer.getBoundingClientRect().height')
        expect(src).not.toContain('bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);')

        const factory = new Function(`
            ${extractFunctionSource(src, 'getReplyComposerBottomOffset')}
            return { getReplyComposerBottomOffset };
        `)

        const previousDocument = globalThis.document
        globalThis.document = {
            querySelector: (selector: string) =>
                selector === '.novel-page-footer'
                    ? {
                          getBoundingClientRect: () => ({ height: 72 }),
                      }
                    : null,
        } as unknown as Document

        try {
            const { getReplyComposerBottomOffset } = factory() as {
                getReplyComposerBottomOffset: () => number
            }
            expect(getReplyComposerBottomOffset()).toBe(72)
        } finally {
            globalThis.document = previousDocument
        }
    })

    test('adds a tail-focused streaming patch path instead of always rebuilding the full reader', () => {
        expect(src).toContain('function renderMessageSlice')
        expect(src).toContain('function patchReaderTailMessages')
        expect(src).toContain('patchReaderTailMessages(contentEl')
    })

    test('temporarily hides the lifted host composer while iframe menus and panels are open', () => {
        expect(src).toContain('function syncReplyComposerOverlayVisibility')
        expect(src).toContain('readerState.replyComposerHost')
        expect(src).toContain('document.querySelector(".nv-bottomsheet.open")')
        expect(src).toContain('document.querySelector(".nv-theme-modal.open")')
        expect(src).toContain('document.querySelector(".nv-cache-manager-screen.open")')
        expect(src).toContain('document.querySelector(".nv-bookmark-screen.open")')
        expect(src).toContain('display: none !important;')
        expect(src).toContain('syncReplyComposerOverlayVisibility().catch(() => {});')
    })

    test('uses a solid full-screen cache manager instead of a translucent overlay', () => {
        expect(src).toContain('.nv-cache-manager-screen {')
        expect(src).toContain('position: fixed;')
        expect(src).toContain('inset: 0;')
        expect(src).toContain('background: var(--nv-bg, #ffffff);')
        expect(src).toContain('width: 100%;')
        expect(src).toContain('height: 100%;')
        expect(src).not.toContain('background: rgba(0, 0, 0, 0.08);')
    })

    test('mounts the cache manager inside the reader so theme variables apply', () => {
        expect(src).toContain('const mountTarget = document.querySelector(".novel-viewer") || document.body')
        expect(src).toContain('mountTarget.appendChild(overlay)')
    })

    test('styles cache management like a reader library view with a hero summary card', () => {
        expect(src).toContain('.nv-cache-manager-shell {')
        expect(src).toContain('.nv-library-header {')
        expect(src).toContain('.nv-library-current-label {')
        expect(src).toContain('.nv-library-hero {')
        expect(src).toContain('.nv-library-hero-info {')
        expect(src).toContain('.nv-library-grid {')
        expect(src).toContain('.nv-library-item {')
    })

    test('adds per-session bookmark storage and reader-anchor metadata', () => {
        expect(src).toContain('function saveCurrentBookmark')
        expect(src).toContain('function jumpToBookmark')
        expect(src).toContain('function getCurrentReaderLocation')
        expect(src).toContain('function persistCurrentCacheState')
        expect(src).toContain('cacheEntry?.bookmarks || []')
        expect(src).toContain('messageIndex')
        expect(src).toContain('paragraphIndex')
        expect(src).toContain('data-reader-anchor="true"')
        expect(src).toContain('data-message-index=')
        expect(src).toContain('data-paragraph-index=')
    })

    test('adds a bookmark panel with save, jump, and delete actions', () => {
        expect(src).toContain('function ensureBookmarkPanel')
        expect(src).toContain('function openBookmarkPanel')
        expect(src).toContain('현재 위치 저장')
        expect(src).toContain('저장한 책갈피')
        expect(src).toContain('마지막 읽은 위치')
        expect(src).toContain('data-action="open-bookmark-manager"')
        expect(src).toContain('data-action="jump-bookmark"')
        expect(src).toContain('data-action="delete-bookmark"')
    })

    test('uses the header bookmark button to save the current location directly', () => {
        expect(src).toContain('data-action="bookmark-placeholder"')
        expect(src).toContain('const onSaveBookmark = async () => {')
        expect(src).toContain('await saveCurrentBookmark(api);')
        expect(src).toContain('const onSaveBookmarkSafe = () => { onSaveBookmark().catch(() => {}); };')
        expect(src).toContain('bookmarkButton?.addEventListener("click", onSaveBookmarkSafe)')
    })

    test('uses a hamburger icon and bottomsheet menu for the footer action button', () => {
        expect(src).toContain('hamburger:')
        expect(src).toContain('data-action="open-reader-menu"')
        expect(src).toContain('.nv-bottomsheet {')
        expect(src).toContain('.nv-bottomsheet-backdrop {')
        expect(src).toContain('transform: translateY(100%);')
        expect(src).toContain('.nv-bottomsheet.open {')
    })

    test('registers a launch button and close behavior', () => {
        expect(src).toContain('registerButton(')
        expect(src).toContain('hideContainer(')
        expect(src).toContain('data-action="close-reader-label"')
        expect(src).toContain('await openReader(risuai)')
        expect(src).toMatch(/location:\s*["']chat["']/)
        expect(src).not.toMatch(/location:\s*["']hamburger["']/)
        expect(src).not.toMatch(/location:\s*["']action["']/)
    })

    test('uses a shared ebook-style top bar and bottom footer across desktop and mobile', () => {
        expect(src).toContain('class="novel-header"')
        expect(src).toContain('data-action="close-reader-label"')
        expect(src).toContain('data-action="bookmark-placeholder"')
        expect(src).toContain('data-action="open-reader-menu"')
        expect(src).toContain('class="nv-overlay-title"')
        expect(src).toContain('class="nv-overlay-btn"')
        expect(src).toContain('class="nv-slider-row"')
        expect(src).toContain('font-family: var(--nv-ui-font);')
        expect(src).not.toContain('data-action="close" aria-label="Close reader"')
    })

    test('keeps mobile and tablet in fullscreen while forcing single-page layout', () => {
        expect(src).toContain('@media screen and (max-width: 1024px)')
        expect(src).toContain('html,')
        expect(src).toContain('width: 100vw;')
        expect(src).toContain('height: 100dvh;')
        expect(src).toContain('height: 100%;')
        expect(src).toContain('border-radius: 0;')
        expect(src).toContain('place-items: stretch;')
        expect(src).toContain('window.innerWidth <= 1024')
        expect(src).not.toContain('width: 92vw;')
        expect(src).not.toContain('min(80dvh, 760px)')
    })

    test('uses a bottom footer toolbar on mobile and tablet instead of a floating overlay', () => {
        expect(src).toContain('.novel-page-footer {')
        expect(src).toContain('position: absolute;')
        expect(src).toContain('left: 0;')
        expect(src).toContain('right: 0;')
        expect(src).toContain('bottom: 0;')
        expect(src).toContain('border-top: 1px solid var(--nv-rule);')
        expect(src).toContain('padding: 14px 20px calc(env(safe-area-inset-bottom, 0px) + 20px);')
        expect(src).toContain('padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);')
        expect(src).toContain('backdrop-filter: blur(20px);')
    })

    test('centers the title in the top bar and uses a centered theme modal instead of a footer sheet', () => {
        expect(src).toContain('.nv-overlay-title {')
        expect(src).toContain('text-align: center;')
        expect(src).toContain('flex: 1;')
        expect(src).toContain('.nv-theme-modal {')
        expect(src).toContain('top: 0;')
        expect(src).toContain('right: 0;')
        expect(src).toContain('width: min(300px, 80vw);')
        expect(src).toContain('@media (min-width: 640px)')
        expect(src).toContain('top: 50%;')
        expect(src).toContain('left: 50%;')
        expect(src).toContain('transform: translate(-50%, -50%) scale(0.95);')
        expect(src).toContain('width: 380px;')
    })

    test('uses a slimmer header and truncates long titles with an ellipsis', () => {
        expect(src).toContain('padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px 10px;')
        expect(src).toContain('padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px 8px;')
        expect(src).toContain('width: 40px;')
        expect(src).toContain('height: 40px;')
        expect(src).toContain('font-size: 14px;')
        expect(src).toContain('white-space: nowrap;')
        expect(src).toContain('overflow: hidden;')
        expect(src).toContain('text-overflow: ellipsis;')
    })

    test('anchors the palette dropdown inside the viewport on desktop-sized layouts', () => {
        expect(src).toContain('.nv-theme-dropdown {')
        expect(src).toContain('left: 0;')
        expect(src).toContain('right: auto;')
        expect(src).toContain('max-width: min(320px, calc(100vw - 24px));')
    })

    test('presents the plugin as an ebook reader product', () => {
        expect(src).toContain('Ebook Reader')
        expect(src).not.toContain('Novel Reader')
        expect(src).not.toContain('Novel reader')
    })

    test('routes failed current-chat loads into a plugin-owned error view', () => {
        expect(src).toContain('function renderErrorState')
        expect(src).toContain('getCurrentCharacterIndex')
        expect(src).toContain('getCurrentChatIndex')
        expect(src).toContain('getChatFromIndex')
        expect(src).toContain('if (!context.ok)')
    })

    test('uses the current session title in the header before falling back to character name', () => {
        expect(src).toContain('function getDisplayName')
        expect(src).toContain('context.chat?.name')
        expect(src).toContain('context.character?.name')
        expect(src).not.toContain('From.</span>')
    })

    test('restores the advanced reader settings controls inside the theme modal', () => {
        expect(src).toContain('function createThemeToggle')
        expect(src).toContain('nv-theme-dropdown')
        expect(src).toContain('nv-font-option')
        expect(src).toContain('nv-line-spacing-slider')
        expect(src).toContain('pagePadding')
        expect(src).toContain('data-slot="settings"')
        expect(src).toContain('.nv-theme-modal-body .nv-theme-dropdown')
    })

    test('restores the custom theme editor overlay from v2', () => {
        expect(src).toContain('nv-picker-overlay')
        expect(src).toContain('nv-picker-box')
        expect(src).toContain('nv-custom-edit-btn')
        expect(src).toContain('classList.add(')
    })

    test('loads character and persona portraits for reader library and future reply surfaces', () => {
        expect(src).toContain('personaPortrait')
        expect(src).toContain('characterPortrait')
        expect(src).toContain('api.getCharacterFromIndex(characterIndex)')
        expect(src).toContain('getDatabase(["personas", "selectedPersona"])')
        expect(src).toContain('let characterPortrait = ""')
        expect(src).toContain('let personaPortrait = ""')
        expect(src).not.toContain('content: "User";')
        expect(src).not.toContain('content: "Char";')
    })

    test('renders the supported novel markdown subset', () => {
        expect(src).toContain('function formatInlineMarkdown')
        expect(src).toContain('function renderMarkdownBlock')
        expect(src).toContain('<strong>$1</strong>')
        expect(src).toContain('<em>$1</em>')
        expect(src).toContain('class="nv-md-rule"')
        expect(src).toContain('class="nv-md-quote"')
        expect(src).toContain('class="nv-md-list"')
    })

    test('captures processed main-chat HTML for reader rendering', () => {
        expect(src).toContain('function loadProcessedMessageHtml')
        expect(src).toContain('function ensureHostMessagesRendered')
        expect(src).toContain('.default-chat-screen')
        expect(src).toContain('.default-chat-screen .risu-chat')
        expect(src).toContain('scrollIntoView({ behavior: "instant", block: "start" })')
        expect(src).toContain('await sleep(')
        expect(src).toContain('await ensureHostMessagesRendered(api, rootDoc, messages.length)')
        expect(src).toContain('getRootDocument()')
        expect(src).toContain('.default-chat-screen .risu-chat[data-chat-index="')
        expect(src).toContain('.chattext')
        expect(src).toContain('getInnerHTML()')
        expect(src).toContain('processedMessageHtml')
        expect(src).toContain('message.processedHtml')
        expect(src).toContain('messageEl ? await messageEl.getInnerHTML() : ""')
    })

    test('strips meta blocks like lbdata, thoughts, and details wrappers from reader output', () => {
        expect(src).toContain('function stripReaderMetaBlocks')
        expect(src).toContain('LBDATA START')
        expect(src).toContain('LBDATA END')
        expect(src).toContain('<details')
        expect(src).toContain('<Thoughts>')
        expect(src).toContain('lb-rerolling')
        expect(src).toContain('lb-pending')
        expect(src).toContain('stripReaderMetaBlocks(message.processedHtml, true)')
        expect(src).toContain('stripReaderMetaBlocks(message.data)')
    })

    test('removes illustration tags and inlay markers from reader output', () => {
        expect(src).toContain('function stripIllustrationBlocks')
        expect(src).toContain('<lb-xnai')
        expect(src).toContain('{{(inlay|inlayed|inlayeddata)::')
        expect(src).toContain('stripIllustrationBlocks(processedHtml, true)')
        expect(src).toContain('stripIllustrationBlocks(plainText)')
    })

    test('renders HiddenStory blocks as collapsed reader details cards', () => {
        expect(src).toContain('function parseHiddenStoryBlocks')
        expect(src).toContain('function renderHiddenStoryBlock')
        expect(src).toContain('class="nv-hidden-story"')
        expect(src).toContain('class="nv-hidden-story-summary"')
        expect(src).toContain('class="nv-hidden-story-title"')
        expect(src).toContain('class="nv-hidden-story-scene"')
        expect(src).toContain('class="nv-hidden-story-body"')
    })

    test('shipping plugin is API 3.0', () => {
        expect(src).toContain('//@api 3.0')
    })
})
