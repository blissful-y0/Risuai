import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { describe, expect, test } from 'vitest'

const pluginPath = resolve(dirname(fileURLToPath(import.meta.url)), 'ChatManuscriptStudio.js')
const src = readFileSync(pluginPath, 'utf8')

async function loadPluginForTest() {
  const testHook: Record<string, any> = {}
  const document = {
    body: {
      innerHTML: '',
      appendChild: () => {},
      removeChild: () => {}
    },
    createElement: () => ({
      href: '',
      download: '',
      style: {},
      click: () => {},
      remove: () => {}
    }),
    querySelector: () => null
  }
  const pluginStorage = {
    store: new Map<string, any>(),
    async getItem(key: string) {
      return this.store.get(key)
    },
    async setItem(key: string, value: any) {
      this.store.set(key, value)
    }
  }
  const risuai = {
    registerSetting: async () => {},
    registerButton: async () => {},
    showContainer: async () => {},
    log: async () => {},
    getDatabase: async () => ({ characters: [] }),
    getCurrentCharacterIndex: async () => 0,
    getCurrentChatIndex: async () => 0,
    getCharacterFromIndex: async () => ({ chats: [] }),
    getChatFromIndex: async () => null
  }

  const context = {
    document,
    pluginStorage,
    navigator: {
      clipboard: {
        writeText: async () => {}
      }
    },
    Blob,
    URL: {
      createObjectURL: () => 'blob://test',
      revokeObjectURL: () => {}
    },
    setTimeout,
    risuai,
    globalThis: {
      __RISU_PLUGIN_TEST__: testHook
    }
  }

  vm.runInNewContext(src, context, { filename: pluginPath })
  await Promise.resolve()

  return testHook.ChatManuscriptStudio
}

describe('ChatManuscriptStudio source contract', () => {
  test('declares API v3 metadata and fullscreen entry points', () => {
    expect(src).toContain('//@api 3.0')
    expect(src).toContain('registerSetting(')
    expect(src).toContain('registerButton(')
    expect(src).toContain("showContainer('fullscreen')")
  })

  test('exposes test helpers only through the explicit test hook', () => {
    expect(src).toContain('__RISU_PLUGIN_TEST__')
  })

  test('loads character and session context through v3 data APIs instead of DOM scanning', () => {
    expect(src).toContain('getCurrentCharacterIndex')
    expect(src).toContain('getCurrentChatIndex')
    expect(src).toContain('getCharacterFromIndex')
    expect(src).toContain('getChatFromIndex')
    expect(src).not.toContain("document.querySelector('.risu-chat")
    expect(src).not.toContain('localStorage.getItem(')
  })

  test('renders a plugin-owned manuscript workspace shell', () => {
    expect(src).toContain('document.body.innerHTML')
    expect(src).toContain('cms-workspace-style')
    expect(src).toContain('.cms-app')
    expect(src).toContain('cms-character-shelf')
    expect(src).toContain('cms-session-browser')
    expect(src).toContain('cms-reader-view')
    expect(src).toContain('cms-export-view')
  })

  test('normalizes session text conservatively and generates temporary titles', async () => {
    const api = await loadPluginForTest()

    expect(api.normalizeSessionText('<b>hello</b>\n\n\nworld')).toContain('hello')
    expect(api.normalizeSessionText('<b>hello</b>\n\n\nworld')).not.toContain('<b>')
    expect(api.normalizeSessionMessages([
      { role: 'char', data: '<b>hello</b>' },
      { role: 'user', data: 'world' }
    ], 'Hero')).toContain('hello')
    expect(api.buildTemporaryTitle({
      messages: [{ role: 'char', data: '비가 오는 밤이었다. 너는 문 앞에 서 있었다.' }]
    })).toBeTruthy()
  })

  test('stores manuscript metadata and reader state in pluginStorage', () => {
    expect(src).toContain('library.characters')
    expect(src).toContain('pluginStorage ??')
    expect(src).toContain('storage.getItem(')
    expect(src).toContain('storage.setItem(')
    expect(src).not.toContain('localStorage.setItem(')
  })

  test('implements reader controls and metadata editing hooks', () => {
    expect(src).toContain('function renderReader')
    expect(src).toContain('function updatePageInfo')
    expect(src).toContain('function saveSessionManuscript')
    expect(src).toContain('function paginateManuscript')
    expect(src).toContain("addEventListener('click'")
    expect(src).toContain('data-action="close"')
    expect(src).toContain('hideContainer()')
    expect(src).toContain('data-action="bookmark"')
    expect(src).toContain('data-action="save-session"')
    expect(src).toContain('data-action="prev-page"')
    expect(src).toContain('data-action="next-page"')
    expect(src).toContain('data-action="edit-metadata"')
  })

  test('builds release-style markdown from multiple selected sessions', async () => {
    const api = await loadPluginForTest()
    const md = api.composeMarkdownExport({
      title: 'Work Title',
      author: 'Pen Name',
      characterName: 'Character Name',
      sessions: [
        { title: '첫 만남', manuscript: '본문 A' },
        { title: '비 오는 날', manuscript: '본문 B' }
      ]
    })

    expect(md).toContain('title: "Work Title"')
    expect(md).toContain('# Work Title')
    expect(md).toContain('## Session 1. 첫 만남')
    expect(md).toContain('## Session 2. 비 오는 날')
  })

  test('includes browser download and fallback copy flow for exports', () => {
    expect(src).toContain('new Blob(')
    expect(src).toContain('URL.createObjectURL(')
    expect(src).toContain('a.download =')
    expect(src).toContain('navigator.clipboard')
    expect(src).toContain('cms-export-fallback')
  })

  test('builds current-character panel and session list', async () => {
    const api = await loadPluginForTest()
    const selectedIndex = api.selectInitialCharacterIndex([
      { name: 'A' },
      { name: 'B' }
    ], 1)

    const shelf = api.renderCharacterShelf([
      { name: 'A' },
      { name: 'B' }
    ], selectedIndex)

    const sessions = api.renderSessionBrowser([
      { chatIndex: 0, chat: { messages: [{ data: '첫 만남 장면' }] } }
    ], {
      0: { title: '커스텀 제목' }
    })

    expect(selectedIndex).toBe(1)
    expect(shelf).toContain('cms-character-card')
    expect(shelf).toContain('data-selected="true"')
    expect(sessions).toContain('커스텀 제목')
  })

  test('escapes html in rendered shelf, session, and reader markup', async () => {
    const api = await loadPluginForTest()

    const shelf = api.renderCharacterShelf([{ name: '<b>A</b>' }], 0)
    const sessions = api.renderSessionBrowser([{ chatIndex: 0, chat: { messages: [{ data: 'x' }] } }], {
      0: { title: '<img src=x onerror=1>' }
    })
    const reader = api.renderReaderMarkup({
      title: '<script>alert(1)</script>',
      messages: [{ data: '<b>본문</b>' }]
    })

    expect(shelf).toContain('&lt;b&gt;A&lt;/b&gt;')
    expect(shelf).not.toContain('<b>A</b>')
    expect(sessions).toContain('&lt;img src=x onerror=1&gt;')
    expect(reader).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(reader).not.toContain('<script>')
  })

  test('serializes front matter safely for quotes and multiline values', async () => {
    const api = await loadPluginForTest()
    const frontMatter = api.serializeFrontMatter({
      title: 'He said "hello"',
      description: 'line1\nline2',
      tags: ['a"b', 'line\nx']
    })

    expect(frontMatter).toContain('title: "He said \\"hello\\""')
    expect(frontMatter).toContain('description: "line1\\nline2"')
    expect(frontMatter).toContain('- "a\\"b"')
    expect(frontMatter).toContain('- "line\\nx"')
  })

  test('renders current-character workspace state and stores character metadata separately', async () => {
    const api = await loadPluginForTest()
    const characters = await api.loadLibraryCharacters()
    const shell = api.buildWorkspaceShellMarkup({
      currentCharacterName: 'Current Hero'
    })

    expect(characters).toEqual({})
    expect(shell).toContain('cms-current-character-panel')
    expect(shell).toContain('Current Hero')
  })

  test('paginates long manuscript text and renders only one active page at a time', async () => {
    const api = await loadPluginForTest()
    const pages = api.paginateManuscript('a'.repeat(2600), 1000)
    const markup = api.renderReaderMarkup({
      title: 'Long Session',
      manuscript: 'a'.repeat(2600)
    }, {
      currentPage: 2,
      pageSize: 1000
    })

    expect(pages.length).toBe(3)
    expect(markup).toContain('2 / 3')
    expect(markup).toContain('data-page="2"')
    expect(markup).not.toContain('data-page="1"')
    expect(markup).not.toContain('data-page="3"')
  })

  test('clamps reader page navigation actions within bounds', async () => {
    const api = await loadPluginForTest()

    expect(api.reduceReaderPage(1, 3, 'prev-page')).toBe(1)
    expect(api.reduceReaderPage(1, 3, 'next-page')).toBe(2)
    expect(api.reduceReaderPage(3, 3, 'next-page')).toBe(3)
  })

  test('builds an initial current-character workspace without loading the full catalog first', async () => {
    const api = await loadPluginForTest()
    const state = api.buildInitialWorkspaceState({
      characterIndex: 5,
      character: {
        name: 'Hero',
        chats: [
          { messages: [{ data: '첫 장면' }] },
          { messages: [{ data: '둘째 장면' }] }
        ]
      },
      currentChat: { messages: [{ data: '현재 세션' }] }
    }, {
      1: { title: '저장된 둘째 장면' }
    })

    expect(state.selectedIndex).toBe(0)
    expect(state.characters).toHaveLength(1)
    expect(state.sessions).toHaveLength(2)
    expect(state.savedSessions[1].title).toBe('저장된 둘째 장면')
  })
})
