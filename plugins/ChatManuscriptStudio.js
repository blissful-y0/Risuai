//@name ChatManuscriptStudio
//@display-name Chat Manuscript Studio
//@api 3.0
//@version 0.1.0

const testExports = {}

if (globalThis.__RISU_PLUGIN_TEST__) {
  globalThis.__RISU_PLUGIN_TEST__.ChatManuscriptStudio = testExports
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeYamlString(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"')
}

function cleanMarkupNoise(text) {
  return String(text ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeSessionText(text) {
  return cleanMarkupNoise(text)
}

function getMessageText(message) {
  if (typeof message === 'string') {
    return message
  }

  if (typeof message?.data === 'string') {
    return message.data
  }

  if (typeof message?.content === 'string') {
    return message.content
  }

  return ''
}

function normalizeSessionMessages(messages, characterName) {
  if (!Array.isArray(messages)) {
    return ''
  }

  const normalized = messages
    .map((message) => {
      const text = cleanMarkupNoise(getMessageText(message))
      if (!text) {
        return ''
      }

      const role = message?.role === 'char'
        ? characterName || 'Character'
        : message?.role === 'user'
          ? 'User'
          : ''

      return role ? `${role}: ${text}` : text
    })
    .filter(Boolean)

  return normalized.join('\n\n').trim()
}

function buildTemporaryTitle(sessionLike) {
  const messages = Array.isArray(sessionLike?.messages) ? sessionLike.messages : []
  const firstMeaningful = messages
    .map((message) => cleanMarkupNoise(getMessageText(message)))
    .find(Boolean) ?? 'Untitled Session'

  return firstMeaningful.slice(0, 32)
}

function getSessionManuscript(sessionLike = {}) {
  if (sessionLike.manuscript) {
    return normalizeSessionText(sessionLike.manuscript)
  }

  if (sessionLike.text) {
    return normalizeSessionText(sessionLike.text)
  }

  return normalizeSessionMessages(sessionLike.messages, sessionLike.characterName)
}

function resolvePluginStorage() {
  return globalThis.risuai?.pluginStorage ?? globalThis.Risuai?.pluginStorage ?? globalThis.pluginStorage ?? null
}

async function readPluginState(key, fallbackValue) {
  try {
    const storage = resolvePluginStorage()
    if (!storage) {
      return fallbackValue
    }

    const raw = await storage.getItem(key)
    return raw == null ? fallbackValue : raw
  } catch {
    return fallbackValue
  }
}

async function writePluginState(key, value) {
  try {
    const storage = resolvePluginStorage()
    if (!storage) {
      return false
    }

    await storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

async function loadLibraryCharacters() {
  return readPluginState('library.characters', {})
}

async function loadLibrarySessions() {
  return readPluginState('library.sessions', {})
}

async function loadLibraryExports() {
  return readPluginState('library.exports', {})
}

async function loadReaderPreferences() {
  return readPluginState('reader.preferences', {})
}

async function saveSessionManuscript(sessionId, metadata) {
  const sessions = await loadLibrarySessions()
  const nextSessions = {
    ...sessions,
    [sessionId]: {
      ...(sessions[sessionId] ?? {}),
      ...metadata
    }
  }

  await writePluginState('library.sessions', nextSessions)
  return nextSessions[sessionId]
}

async function saveExportProject(exportId, metadata) {
  const exportsState = await loadLibraryExports()
  const nextExports = {
    ...exportsState,
    [exportId]: {
      ...(exportsState[exportId] ?? {}),
      ...metadata
    }
  }

  await writePluginState('library.exports', nextExports)
  return nextExports[exportId]
}

async function loadCurrentCharacterSummary(api) {
  try {
    const characterIndex = await api.getCurrentCharacterIndex()
    const chatIndex = await api.getCurrentChatIndex()
    const character = await api.getCharacterFromIndex(characterIndex)
    const currentChat = await api.getChatFromIndex(characterIndex, chatIndex)

    return { characterIndex, chatIndex, character, currentChat }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await api.log(`ChatManuscriptStudio current character load failed: ${message}`)
    return {
      characterIndex: -1,
      chatIndex: -1,
      character: null,
      currentChat: null
    }
  }
}

async function loadCharacterSessions(api, characterIndex) {
  try {
    const character = await api.getCharacterFromIndex(characterIndex)
    const chats = Array.isArray(character?.chats) ? character.chats : []

    return chats.map((chat, chatIndex) => ({
      chatIndex,
      chat
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await api.log(`ChatManuscriptStudio session load failed: ${message}`)
    return []
  }
}

function selectInitialCharacterIndex(characters, currentCharacterIndex) {
  if (typeof currentCharacterIndex === 'number' && currentCharacterIndex >= 0 && currentCharacterIndex < characters.length) {
    return currentCharacterIndex
  }

  return characters.length > 0 ? 0 : -1
}

function renderCharacterShelf(characters, selectedIndex) {
  return characters.map((character, index) => {
    const name = character?.name ?? character?.chaName ?? `Character ${index + 1}`
    const selected = index === selectedIndex
    return `
      <button type="button" class="cms-character-card" data-character-index="${index}" data-selected="${selected}">
        <span class="cms-character-name">${escapeHtml(name)}</span>
      </button>
    `
  }).join('\n')
}

function renderSessionBrowser(sessions, savedSessions = {}) {
  return sessions.map((sessionEntry, index) => {
    const chatIndex = sessionEntry?.chatIndex ?? index
    const savedEntry = savedSessions?.[chatIndex] ?? {}
    const chat = sessionEntry?.chat ?? {}
    const title = savedEntry.title ?? buildTemporaryTitle(chat)

    return `
      <article class="cms-session-card" data-chat-index="${chatIndex}">
        <h3 class="cms-session-title">${escapeHtml(title)}</h3>
      </article>
    `
  }).join('\n')
}

function buildCurrentCharacterMarkup(currentCharacterName) {
  return `
    <aside class="cms-current-character-panel">
      <strong>Current Character Workspace</strong>
      <p>This reader opens for the current character only.</p>
      <p>${escapeHtml(currentCharacterName || 'Current character')}</p>
    </aside>
  `
}

function getWorkspaceStyles() {
  return `
    .cms-workspace-style {
      display: none;
    }

    :root {
      color-scheme: dark;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(128, 96, 64, 0.18), transparent 28%),
        linear-gradient(180deg, #19161f 0%, #0e1016 100%);
      color: #eadfce;
      font-family: "Iowan Old Style", "Palatino Linotype", "Noto Serif KR", serif;
    }

    .cms-app {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 280px 320px minmax(0, 1fr);
      gap: 18px;
      min-height: 100vh;
      padding: 24px;
    }

    .cms-character-shelf,
    .cms-session-browser,
    .cms-reader-view,
    .cms-export-view,
    .cms-current-character-panel {
      box-sizing: border-box;
      border: 1px solid rgba(234, 223, 206, 0.08);
      border-radius: 24px;
      background: rgba(20, 18, 24, 0.82);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(14px);
    }

    .cms-character-shelf,
    .cms-session-browser,
    .cms-current-character-panel {
      padding: 18px;
      align-self: start;
    }

    .cms-character-shelf {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .cms-character-card {
      width: 100%;
      border: 1px solid rgba(234, 223, 206, 0.1);
      border-radius: 16px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      color: #eadfce;
      text-align: left;
      cursor: pointer;
      transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .cms-character-card[data-selected="true"] {
      border-color: rgba(219, 176, 116, 0.65);
      background: linear-gradient(180deg, rgba(107, 74, 48, 0.34), rgba(53, 39, 30, 0.5));
      transform: translateY(-1px);
    }

    .cms-character-name {
      display: block;
      font-size: 15px;
      line-height: 1.5;
    }

    .cms-session-browser {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: calc(100vh - 48px);
      overflow: auto;
    }

    .cms-session-card {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(234, 223, 206, 0.08);
      background: rgba(255, 255, 255, 0.025);
    }

    .cms-session-title {
      margin: 0;
      font-size: 16px;
      line-height: 1.55;
      color: #f3e9da;
    }

    .cms-reader-view,
    .cms-export-view {
      min-width: 0;
      padding: 28px;
    }

    .cms-reader {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 104px);
      color: #eadfce;
    }

    .cms-reader-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(234, 223, 206, 0.08);
    }

    .cms-reader-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .cms-reader-title {
      margin: 0;
      font-size: 30px;
      line-height: 1.25;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff6ea;
    }

    .cms-close-button {
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(234, 223, 206, 0.14);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      color: #eadfce;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      flex: 0 0 auto;
    }

    .cms-reader-controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .cms-reader-controls button {
      border: 1px solid rgba(234, 223, 206, 0.14);
      border-radius: 999px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.04);
      color: #eadfce;
      cursor: pointer;
    }

    .cms-page-info {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      color: #cbbba6;
      font-size: 13px;
    }

    .cms-reader-body {
      flex: 1;
      padding: 30px 6px 0;
      font-size: 17px;
      line-height: 2;
      color: #eadfce;
      column-count: 2;
      column-gap: 44px;
      column-rule: 1px solid rgba(234, 223, 206, 0.08);
    }

    .cms-reader-body p {
      margin: 0 0 1.1em;
      break-inside: avoid;
      text-align: justify;
    }

    .cms-export-view:empty {
      display: none;
    }

    .cms-export-fallback {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cms-export-fallback p,
    .cms-current-character-panel p {
      margin: 0;
      line-height: 1.7;
      color: #d6c8b5;
    }

    .cms-export-fallback textarea {
      min-height: 220px;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(234, 223, 206, 0.12);
      border-radius: 16px;
      padding: 14px;
      resize: vertical;
      background: rgba(6, 8, 12, 0.5);
      color: #f7efe4;
      font: 13px/1.7 "SFMono-Regular", "Consolas", monospace;
    }

    .cms-current-character-panel strong {
      display: block;
      margin-bottom: 8px;
      color: #fff1dc;
    }

    @media (max-width: 1180px) {
      .cms-app {
        grid-template-columns: 240px 280px minmax(0, 1fr);
      }

      .cms-reader-body {
        column-count: 1;
      }
    }

    @media (max-width: 900px) {
      .cms-app {
        grid-template-columns: 1fr;
      }

      .cms-character-shelf,
      .cms-session-browser,
      .cms-current-character-panel,
      .cms-reader-view {
        max-height: none;
      }

      .cms-reader {
        min-height: auto;
      }

      .cms-reader-header {
        flex-direction: column;
        align-items: stretch;
      }

      .cms-reader-controls {
        justify-content: flex-start;
      }
    }
  `
}

function buildWorkspaceShellMarkup({ characters = [], selectedIndex = -1, sessions = [], savedSessions = {}, currentCharacterName = '' } = {}) {
  const shelfMarkup = characters.length > 0
    ? `<aside class="cms-character-shelf">${renderCharacterShelf(characters, selectedIndex)}</aside>`
    : buildCurrentCharacterMarkup(currentCharacterName)

  return `
    <style class="cms-workspace-style">${getWorkspaceStyles()}</style>
    <div class="cms-app">
      ${shelfMarkup}
      <section class="cms-session-browser">${renderSessionBrowser(sessions, savedSessions)}</section>
      <section class="cms-reader-view"></section>
      <section class="cms-export-view"></section>
    </div>
  `
}

function renderWorkspaceShell(state = {}) {
  document.body.innerHTML = buildWorkspaceShellMarkup(state)
}

function buildInitialWorkspaceState(currentSummary, savedSessions = {}) {
  const currentCharacter = currentSummary?.character ?? null
  const characters = currentCharacter ? [currentCharacter] : []
  const sessions = Array.isArray(currentCharacter?.chats)
    ? currentCharacter.chats.map((chat, chatIndex) => ({ chatIndex, chat }))
    : []

  return {
    characters,
    selectedIndex: characters.length > 0 ? 0 : -1,
    sessions,
    savedSessions,
    currentCharacterName: currentCharacter?.name ?? currentCharacter?.chaName ?? ''
  }
}

function paginateManuscript(text, pageSize = 1800) {
  const content = String(text ?? '')
  if (!content) {
    return ['']
  }

  const pages = []
  for (let index = 0; index < content.length; index += pageSize) {
    pages.push(content.slice(index, index + pageSize))
  }

  return pages.length > 0 ? pages : ['']
}

function formatReaderBody(pageText) {
  const paragraphs = String(pageText ?? '')
    .split(/\n{2,}/)
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return '<p></p>'
  }

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function renderReaderMarkup(sessionLike = {}, options = {}) {
  const currentPage = Math.max(1, Number(options.currentPage ?? 1))
  const pageSize = Number(options.pageSize ?? 1800)
  const manuscript = getSessionManuscript(sessionLike)
  const pages = paginateManuscript(manuscript, pageSize)
  const totalPages = pages.length
  const pageIndex = Math.min(currentPage, totalPages) - 1
  const pageNumber = pageIndex + 1
  const title = sessionLike?.title || buildTemporaryTitle(sessionLike)

  return `
    <article class="cms-reader" data-page="${pageNumber}">
      <header class="cms-reader-header">
        <div class="cms-reader-header-left">
          <button type="button" class="cms-close-button" data-action="close" aria-label="Close reader">×</button>
          <h2 class="cms-reader-title">${escapeHtml(title)}</h2>
        </div>
        <div class="cms-reader-controls">
          <button type="button" data-action="prev-page">Prev</button>
          <button type="button" data-action="next-page">Next</button>
          <button type="button" data-action="bookmark">Bookmark</button>
          <button type="button" data-action="edit-metadata">Edit</button>
          <button type="button" data-action="save-session">Save</button>
          <span class="cms-page-info">${pageNumber} / ${totalPages}</span>
        </div>
      </header>
      <div class="cms-reader-body">${formatReaderBody(pages[pageIndex])}</div>
    </article>
  `
}

function reduceReaderPage(currentPage, totalPages, action) {
  if (action === 'prev-page') {
    return Math.max(1, currentPage - 1)
  }

  if (action === 'next-page') {
    return Math.min(totalPages, currentPage + 1)
  }

  return currentPage
}

function updatePageInfo(page, totalPages) {
  const pageInfo = document.querySelector('.cms-page-info')
  const label = `${page} / ${totalPages}`

  if (pageInfo) {
    pageInfo.textContent = label
  }

  return label
}

function renderReader(sessionLike = {}, options = {}) {
  const readerView = document.querySelector('.cms-reader-view')
  if (!readerView) {
    return ''
  }

  const markup = renderReaderMarkup(sessionLike, options)
  readerView.innerHTML = markup
  const pages = paginateManuscript(getSessionManuscript(sessionLike), Number(options.pageSize ?? 1800))
  const page = Math.max(1, Math.min(Number(options.currentPage ?? 1), pages.length))
  updatePageInfo(page, pages.length)
  return markup
}

function bindWorkspaceEvents(state) {
  const root = document.body
  if (!root?.addEventListener) {
    return
  }

  root.addEventListener('click', async (event) => {
    const actionTarget = event.target?.closest?.('[data-action]')
    if (!actionTarget) {
      return
    }

    const action = actionTarget.getAttribute('data-action')
    if (action === 'close') {
      await state.api.hideContainer()
      return
    }

    if (action === 'prev-page' || action === 'next-page') {
      const totalPages = paginateManuscript(getSessionManuscript(state.currentSession), state.pageSize).length
      state.currentPage = reduceReaderPage(state.currentPage, totalPages, action)
      renderReader(state.currentSession, {
        currentPage: state.currentPage,
        pageSize: state.pageSize
      })
      return
    }

    if (action === 'bookmark' || action === 'save-session') {
      await saveSessionManuscript(String(state.currentSessionId), {
        title: state.currentSession?.title || buildTemporaryTitle(state.currentSession),
        bookmarkPage: state.currentPage,
        manuscript: getSessionManuscript(state.currentSession)
      })
      return
    }

    if (action === 'edit-metadata') {
      await state.api.log('ChatManuscriptStudio metadata editing UI is not wired yet.')
    }
  })
}

function serializeFrontMatter(meta) {
  const lines = ['---']

  for (const [key, value] of Object.entries(meta)) {
    if (value == null || value === '') {
      continue
    }

    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) {
        lines.push(`  - "${escapeYamlString(item)}"`)
      }
      continue
    }

    lines.push(`${key}: "${escapeYamlString(value)}"`)
  }

  lines.push('---')
  return lines.join('\n')
}

function composeMarkdownExport(exportProject) {
  const title = exportProject?.title || 'Untitled Work'
  const sessions = Array.isArray(exportProject?.sessions) ? exportProject.sessions : []
  const frontMatter = serializeFrontMatter({
    title,
    author: exportProject?.author || '',
    character: exportProject?.characterName || '',
    source: 'RisuAI chat sessions',
    created: new Date().toISOString().slice(0, 10),
    tags: exportProject?.tags || []
  })

  const sections = sessions.map((session, index) => {
    const sessionTitle = session?.title || `Session ${index + 1}`
    const manuscript = session?.manuscript || ''
    return `## Session ${index + 1}. ${sessionTitle}\n\n${manuscript}`
  }).join('\n\n')

  return `${frontMatter}\n\n# ${title}\n\n${sections}`.trim()
}

function renderExportFallback(content) {
  return `
    <div class="cms-export-fallback">
      <p>Direct download was blocked. Copy the markdown below.</p>
      <textarea readonly>${escapeHtml(content)}</textarea>
    </div>
  `
}

async function copyMarkdownFallback(content) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content)
    return true
  }

  return false
}

async function downloadMarkdownFile(name, content) {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = name
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    return { ok: true, mode: 'download' }
  } catch {
    const copied = await copyMarkdownFallback(content)
    return {
      ok: copied,
      mode: copied ? 'clipboard' : 'manual',
      markup: renderExportFallback(content)
    }
  }
}

async function openWorkspace(api) {
  const currentSummary = await loadCurrentCharacterSummary(api)
  const savedSessions = await loadLibrarySessions()
  const initialState = buildInitialWorkspaceState(currentSummary, savedSessions)

  await api.showContainer('fullscreen')
  renderWorkspaceShell(initialState)
  const currentSession = currentSummary.currentChat ?? {}
  const state = {
    api,
    currentSession,
    currentSessionId: currentSummary.chatIndex,
    currentPage: 1,
    pageSize: 1800
  }
  bindWorkspaceEvents(state)
  renderReader(currentSession, {
    currentPage: state.currentPage,
    pageSize: state.pageSize
  })
}

Object.assign(testExports, {
  escapeHtml,
  escapeYamlString,
  cleanMarkupNoise,
  normalizeSessionText,
  normalizeSessionMessages,
  buildTemporaryTitle,
  getSessionManuscript,
  resolvePluginStorage,
  readPluginState,
  writePluginState,
  loadLibraryCharacters,
  loadLibrarySessions,
  loadLibraryExports,
  loadReaderPreferences,
  saveSessionManuscript,
  saveExportProject,
  loadCurrentCharacterSummary,
  loadCharacterSessions,
  selectInitialCharacterIndex,
  renderCharacterShelf,
  renderSessionBrowser,
  buildCurrentCharacterMarkup,
  buildWorkspaceShellMarkup,
  buildInitialWorkspaceState,
  paginateManuscript,
  renderReaderMarkup,
  reduceReaderPage,
  updatePageInfo,
  renderReader,
  bindWorkspaceEvents,
  serializeFrontMatter,
  composeMarkdownExport,
  renderExportFallback,
  copyMarkdownFallback,
  downloadMarkdownFile
})

;(async () => {
  try {
    await risuai.registerSetting('Chat Manuscript Studio', async () => {
      await openWorkspace(risuai)
    }, '📚', 'html')

    await risuai.registerButton({
      name: 'Chat Manuscript Studio',
      icon: '📚',
      iconType: 'html',
      location: 'chat'
    }, async () => {
      await openWorkspace(risuai)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await risuai.log(`ChatManuscriptStudio bootstrap failed: ${message}`)
  }
})()
