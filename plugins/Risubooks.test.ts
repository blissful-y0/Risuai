import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const pluginPath = resolve(process.cwd(), 'plugins/Risubooks(v0.0.2).js')
const src = readFileSync(pluginPath, 'utf8')

function extractFunctionSource(source: string, name: string) {
    const asyncStart = source.indexOf(`async function ${name}(`)
    const start = asyncStart > -1 ? asyncStart : source.indexOf(`function ${name}(`)
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

describe('RisuBooks storage contract', () => {
    test('stores volatile reader state in device-local plugin storage', () => {
        expect(src).toContain('api.safeLocalStorage.getItem(key)')
        expect(src).toContain('api.safeLocalStorage.setItem(key, JSON.stringify(value))')
        expect(src).toContain('const LOCAL_STORAGE_PREFIX = "risubooks:";')
        expect(src).not.toContain('api.pluginStorage.setItem(')
        expect(src).not.toContain('api.pluginStorage.removeItem(')
        expect(src).not.toContain('api.pluginStorage.clear(')
    })

    test('stores large reader cache entries in IndexedDB instead of safeLocalStorage', () => {
        expect(src).toContain('const READER_CACHE_DB_NAME = "risubooks-cache";')
        expect(src).toContain('const READER_CACHE_STORE_NAME = "readerCache";')
        expect(src).toContain('function isReaderCacheStorageKey(key)')
        expect(src).toContain('await setReaderCacheItemToIdb(key, value);')
        expect(src).toContain('await getReaderCacheItemFromIdb(key);')
    })

    test('keeps small reader settings in safeLocalStorage', () => {
        const setSource = extractFunctionSource(src, 'setReaderStorageItem')
        expect(setSource).toContain('if (isReaderCacheStorageKey(key))')
        expect(setSource).toContain('const storage = await getReaderLocalStorage(api);')
        expect(setSource).toContain('await storage.setItem(getReaderStorageKey(key), value);')
    })

    test('migrates existing local reader caches into IndexedDB', () => {
        const migrationSource = extractFunctionSource(src, 'migrateReaderCacheToIdb')
        expect(migrationSource).toContain('readerCacheIdbMigrated')
        expect(migrationSource).toContain("key.startsWith(LOCAL_STORAGE_PREFIX)")
        expect(migrationSource).toContain('key.slice(LOCAL_STORAGE_PREFIX.length)')
        expect(migrationSource).toContain('isReaderCacheStorageKey(key)')
        expect(migrationSource).toContain('await setReaderCacheItemToIdb(key, value);')
        expect(migrationSource).toContain('await storage.removeItem(getReaderStorageKey(key));')
    })

    test('migrates legacy sync storage through read-only plugin storage access', () => {
        expect(src).toContain('function migrateLegacyPluginStorage')
        expect(src).toContain('api.pluginStorage.keys()')
        expect(src).toContain('api.pluginStorage.getItem(')
    })

    test('uses supported plugin alert APIs for reader notices', () => {
        expect(src).not.toContain('api.alertNormal?.(')
        expect(src).toContain('api.alert?.(')
    })

    test('keeps granted mainDom permission when rendering reader shell', () => {
        expect(extractFunctionSource(src, 'renderReaderShell')).not.toContain(
            'readerState.mainDomPermissionGranted = false;',
        )
    })

    test('host preload does not use restricted data attribute access on safe elements', () => {
        const preloadSource = extractFunctionSource(src, 'ensureHostMessagesRendered')
        expect(preloadSource).not.toContain('getAttribute("data-chat-index")')
        expect(preloadSource).not.toContain("getAttribute('data-chat-index')")
        expect(preloadSource).not.toContain('getOuterHTML()')
        expect(preloadSource).toContain('renderedCount')
    })

    test('collects only the message blocks intersecting the current page', () => {
        const factory = new Function(`
            ${extractFunctionSource(src, 'getMessageBlocksForPage')}
            return { getMessageBlocksForPage };
        `)

        const { getMessageBlocksForPage } = factory() as {
            getMessageBlocksForPage: (
                contentEl: { querySelectorAll: (selector: string) => any[] },
                pageIndex: number,
                pageWidth: number,
            ) => any[]
        }

        const block = (index: number, left: number, width: number) => ({
            dataset: { messageBlockIndex: String(index) },
            offsetLeft: left,
            offsetWidth: width,
            clientWidth: width,
        })

        const contentEl = {
            querySelectorAll: () => [
                block(0, 0, 150),
                block(1, 120, 160),
                block(2, 320, 120),
                block(3, 460, 90),
            ],
        }

        const page0 = getMessageBlocksForPage(contentEl, 0, 200)
        const page1 = getMessageBlocksForPage(contentEl, 1, 200)
        const page2 = getMessageBlocksForPage(contentEl, 2, 200)

        expect(page0.map((entry) => entry.dataset.messageBlockIndex)).toEqual(['0', '1'])
        expect(page1.map((entry) => entry.dataset.messageBlockIndex)).toEqual(['1', '2'])
        expect(page2.map((entry) => entry.dataset.messageBlockIndex)).toEqual(['2', '3'])
    })

    test('builds unique translation cache lookup candidates from raw and processed message content', () => {
        const factory = new Function(`
            ${extractFunctionSource(src, 'stripReaderMetaBlocks')}
            ${extractFunctionSource(src, 'stripIllustrationBlocks')}
            ${extractFunctionSource(src, 'buildTranslationLookupCandidates')}
            return { buildTranslationLookupCandidates };
        `)

        const previousDocument = globalThis.document
        const previousReaderState = (globalThis as any).readerState
        globalThis.document = {
            createElement: () => ({
                innerHTML: '',
                querySelectorAll: () => ({ forEach: () => {} }),
            }),
        } as unknown as Document
        ;(globalThis as any).readerState = { hidePatterns: [] }

        try {
            const { buildTranslationLookupCandidates } = factory() as {
                buildTranslationLookupCandidates: (message: {
                    data?: string
                    processedHtml?: string
                }) => string[]
            }

            expect(buildTranslationLookupCandidates({
                data: 'Hello world',
                processedHtml: '<p>Hello <strong>world</strong></p>',
            })).toEqual([
                'Hello world',
                '<p>Hello <strong>world</strong></p>',
            ])

            expect(buildTranslationLookupCandidates({
                data: 'Hello world',
                processedHtml: 'Hello world',
            })).toEqual(['Hello world'])
        } finally {
            globalThis.document = previousDocument
            ;(globalThis as any).readerState = previousReaderState
        }
    })

    test('invalidates reader cache when any earlier message changes', () => {
        const factory = new Function(`
            ${extractFunctionSource(src, 'hashString')}
            ${extractFunctionSource(src, 'buildReaderCacheSignature')}
            return { buildReaderCacheSignature };
        `)

        const { buildReaderCacheSignature } = factory() as {
            buildReaderCacheSignature: (
                messages: Array<{ role?: string; data?: string }>,
            ) => { messageCount: number; lastMessageHash: string }
        }

        const original = buildReaderCacheSignature([
            { role: 'user', data: 'first' },
            { role: 'char', data: 'last' },
        ])
        const editedEarlier = buildReaderCacheSignature([
            { role: 'user', data: 'first-edited' },
            { role: 'char', data: 'last' },
        ])

        expect(editedEarlier.messageCount).toBe(original.messageCount)
        expect(editedEarlier.lastMessageHash).not.toBe(original.lastMessageHash)
    })

    test('persists a rebuilt cache after reader-side message edits', () => {
        expect(src).toContain('async function syncCurrentReaderCacheAfterRender')
        const editSource = extractFunctionSource(src, 'saveEditedMessage')
        expect(editSource).toContain('const renderedHtml = renderMessageContent(context);')
        expect(editSource).toContain('await syncCurrentReaderCacheAfterRender(api, context, renderedHtml);')
    })

    test('stores enough metadata on cache entries to rebuild the cache index', () => {
        const saveSource = extractFunctionSource(src, 'saveReaderEditionCache')
        expect(saveSource).toContain('characterIndex: context.characterIndex')
        expect(saveSource).toContain('chatIndex: context.chatIndex')
        expect(saveSource).toContain('title: getDisplayName(context)')
        expect(saveSource).toContain('characterName: context.character?.name || "Character"')
    })

    test('repairs the cache index from saved cache entries when needed', () => {
        const indexSource = extractFunctionSource(src, 'getReaderCacheIndex')
        expect(indexSource).toContain('getReaderStorageKeys(api)')
        expect(indexSource).toContain('key.startsWith(CACHE_ENTRY_PREFIX)')
        expect(indexSource).toContain('await setReaderCacheIndex(api, { entries: rebuiltEntries });')
    })

    test('saveReaderEditionCache fails loudly when local persistence fails', () => {
        const saveSource = extractFunctionSource(src, 'saveReaderEditionCache')
        expect(saveSource).toContain('Failed to persist cache entry')
        expect(saveSource).toContain('Failed to persist cache index')
        expect(saveSource).toContain('RisuBooks: saving cache entry')
        expect(saveSource).toContain('RisuBooks: cache entry saved')
    })

    test('formats translation diagnostics for user-visible alerts', () => {
        const factory = new Function(`
            ${extractFunctionSource(src, 'summarizeTranslationDiagnostics')}
            return { summarizeTranslationDiagnostics };
        `)

        const { summarizeTranslationDiagnostics } = factory() as {
            summarizeTranslationDiagnostics: (entries: string[], limit?: number) => string
        }

        expect(summarizeTranslationDiagnostics([
            'scan: page=1/3 blocks=4,5',
            'cache miss (page=1 message=4): Hello world',
            'dom miss (page=1 message=4): host HTML matched original content',
        ])).toBe(
            '\n\n디버그:\n- scan: page=1/3 blocks=4,5\n- cache miss (page=1 message=4): Hello world\n- dom miss (page=1 message=4): host HTML matched original content',
        )
    })

    test('mirrors translation diagnostics to browser console', () => {
        expect(src).toContain('function emitTranslationDebugLog')
        expect(src).toContain('[RisuBooks debug]')
        expect(src).toContain('console.log(`[RisuBooks debug] ${message}`)')
    })

    test('logs translation cache candidate diagnostics on miss', async () => {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const factory = new AsyncFunction(`
            ${extractFunctionSource(src, 'emitTranslationDebugLog')}
            ${extractFunctionSource(src, 'stripReaderMetaBlocks')}
            ${extractFunctionSource(src, 'stripIllustrationBlocks')}
            ${extractFunctionSource(src, 'buildTranslationLookupCandidates')}
            ${extractFunctionSource(src, 'getCachedTranslationForMessage')}
            return { getCachedTranslationForMessage };
        `)

        const previousDocument = globalThis.document
        const previousReaderState = (globalThis as any).readerState
        globalThis.document = {
            createElement: () => ({
                innerHTML: '',
                querySelectorAll: () => ({ forEach: () => {} }),
            }),
        } as unknown as Document
        ;(globalThis as any).readerState = { hidePatterns: [] }

        try {
            const { getCachedTranslationForMessage } = await factory() as {
                getCachedTranslationForMessage: (
                    api: {
                        getTranslationCache: (value: string) => Promise<string | null>
                        log: (value: string) => Promise<void>
                    },
                    message: { data?: string; processedHtml?: string },
                    debugLabel?: string,
                ) => Promise<string>
            }

            const logs: string[] = []
            const api = {
                getTranslationCache: async () => null,
                log: async (value: string) => {
                    logs.push(value)
                },
            }

            await expect(getCachedTranslationForMessage(
                api,
                {
                    data: 'Hello world',
                    processedHtml: '<p>Hello world</p>',
                },
                'page=1 message=2',
            )).resolves.toBe('')
            expect(logs.some((entry) =>
                entry.includes('translation cache miss') &&
                entry.includes('page=1 message=2') &&
                entry.includes('Hello world'),
            )).toBe(true)
        } finally {
            globalThis.document = previousDocument
            ;(globalThis as any).readerState = previousReaderState
        }
    })

    test('captures translated host DOM even when cached reader messages have no processedHtml', async () => {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const factory = new AsyncFunction(`
            ${extractFunctionSource(src, 'emitTranslationDebugLog')}
            ${extractFunctionSource(src, 'stripReaderMetaBlocks')}
            ${extractFunctionSource(src, 'stripIllustrationBlocks')}
            ${extractFunctionSource(src, 'stripTranslationPreambleHtml')}
            async function ensureHostMessagesRendered() {}
            ${extractFunctionSource(src, 'getHostTranslatedMessageHtml')}
            return { getHostTranslatedMessageHtml };
        `)

        const previousDocument = globalThis.document
        const previousReaderState = (globalThis as any).readerState
        globalThis.document = {
            createElement: () => {
                const node = {
                    _html: '',
                    set innerHTML(value: string) {
                        this._html = value
                    },
                    get innerHTML() {
                        return this._html
                    },
                    querySelectorAll: () => ({ forEach: () => {} }),
                }
                return node
            },
        } as unknown as Document
        ;(globalThis as any).readerState = { hidePatterns: [], mainDomPermissionGranted: true }

        try {
            const { getHostTranslatedMessageHtml } = await factory() as {
                getHostTranslatedMessageHtml: (
                    api: {
                        getRootDocument: () => Promise<{
                            querySelector: (selector: string) => Promise<{ getInnerHTML: () => Promise<string> } | null>
                        }>
                        log: (value: string) => Promise<void>
                    },
                    messageIndex: number,
                    message: { processedHtml?: string },
                    currentOriginalHtml?: string,
                ) => Promise<string>
            }

            const api = {
                getRootDocument: async () => ({
                    querySelector: async () => ({
                        getInnerHTML: async () => '<p>번역된 본문</p>',
                    }),
                }),
                log: async () => {},
            }

            await expect(getHostTranslatedMessageHtml(
                api,
                3,
                {},
                '<p>Original body</p>',
            )).resolves.toBe('<p>번역된 본문</p>')
        } finally {
            globalThis.document = previousDocument
            ;(globalThis as any).readerState = previousReaderState
        }
    })

    test('preloads host chat messages before translated DOM lookup', async () => {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const factory = new AsyncFunction(`
            let renderedReady = false;
            let ensureCalls = 0;
            ${extractFunctionSource(src, 'emitTranslationDebugLog')}
            ${extractFunctionSource(src, 'stripReaderMetaBlocks')}
            ${extractFunctionSource(src, 'stripIllustrationBlocks')}
            ${extractFunctionSource(src, 'stripTranslationPreambleHtml')}
            async function ensureHostMessagesRendered() {
                ensureCalls += 1;
                renderedReady = true;
            }
            ${extractFunctionSource(src, 'getHostTranslatedMessageHtml')}
            return {
                getHostTranslatedMessageHtml,
                getEnsureCalls: () => ensureCalls,
            };
        `)

        const previousDocument = globalThis.document
        const previousReaderState = (globalThis as any).readerState
        globalThis.document = {
            createElement: () => {
                const node = {
                    _html: '',
                    set innerHTML(value: string) {
                        this._html = value
                    },
                    get innerHTML() {
                        return this._html
                    },
                    querySelectorAll: () => ({ forEach: () => {} }),
                }
                return node
            },
        } as unknown as Document
        ;(globalThis as any).readerState = {
            hidePatterns: [],
            mainDomPermissionGranted: true,
            context: {
                messages: [{}, {}, {}, {}, {}],
            },
        }

        try {
            const { getHostTranslatedMessageHtml, getEnsureCalls } = await factory() as {
                getHostTranslatedMessageHtml: (
                    api: {
                        getRootDocument: () => Promise<{
                            querySelector: (selector: string) => Promise<{ getInnerHTML: () => Promise<string> } | null>
                        }>
                        log: (value: string) => Promise<void>
                    },
                    messageIndex: number,
                    message: { processedHtml?: string },
                    currentOriginalHtml?: string,
                ) => Promise<string>
                getEnsureCalls: () => number
            }

            const api = {
                getRootDocument: async () => ({
                    querySelector: async () => ({
                        getInnerHTML: async () => '<p>번역된 본문</p>',
                    }),
                }),
                log: async () => {},
            }

            await expect(getHostTranslatedMessageHtml(
                api,
                3,
                {},
                '<p>Original body</p>',
            )).resolves.toBe('<p>번역된 본문</p>')
            expect(getEnsureCalls()).toBe(1)
        } finally {
            globalThis.document = previousDocument
            ;(globalThis as any).readerState = previousReaderState
        }
    })

    test('reports a diagnostic when translated DOM lookup is skipped without mainDom permission', async () => {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const factory = new AsyncFunction(`
            ${extractFunctionSource(src, 'emitTranslationDebugLog')}
            ${extractFunctionSource(src, 'getHostTranslatedMessageHtml')}
            return { getHostTranslatedMessageHtml };
        `)

        const previousReaderState = (globalThis as any).readerState
        ;(globalThis as any).readerState = { mainDomPermissionGranted: false }

        try {
            const { getHostTranslatedMessageHtml } = await factory() as {
                getHostTranslatedMessageHtml: (
                    api: { getRootDocument?: () => Promise<unknown> },
                    messageIndex: number,
                    message: { processedHtml?: string },
                    currentOriginalHtml?: string,
                    debugLabel?: string,
                    diagnostics?: string[],
                ) => Promise<string>
            }

            const diagnostics: string[] = []
            await expect(getHostTranslatedMessageHtml(
                {},
                0,
                {},
                '',
                'page=1 message=0',
                diagnostics,
            )).resolves.toBe('')
            expect(diagnostics).toContain(
                'dom miss (page=1 message=0): mainDom permission unavailable',
            )
        } finally {
            ;(globalThis as any).readerState = previousReaderState
        }
    })

    test('strips translation-process preamble from host translated DOM', async () => {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const factory = new AsyncFunction(`
            ${extractFunctionSource(src, 'emitTranslationDebugLog')}
            ${extractFunctionSource(src, 'stripReaderMetaBlocks')}
            ${extractFunctionSource(src, 'stripIllustrationBlocks')}
            ${extractFunctionSource(src, 'stripTranslationPreambleHtml')}
            async function ensureHostMessagesRendered() {}
            ${extractFunctionSource(src, 'getHostTranslatedMessageHtml')}
            return { getHostTranslatedMessageHtml };
        `)

        const previousDocument = globalThis.document
        const previousReaderState = (globalThis as any).readerState
        globalThis.document = {
            createElement: () => {
                const node = {
                    _html: '',
                    set innerHTML(value: string) {
                        this._html = value
                    },
                    get innerHTML() {
                        return this._html
                    },
                    querySelectorAll: () => ({ forEach: () => {} }),
                }
                return node
            },
        } as unknown as Document
        ;(globalThis as any).readerState = {
            hidePatterns: [],
            mainDomPermissionGranted: true,
            context: {
                messages: [{}],
            },
        }

        try {
            const { getHostTranslatedMessageHtml } = await factory() as {
                getHostTranslatedMessageHtml: (
                    api: {
                        getRootDocument: () => Promise<{
                            querySelector: (selector: string) => Promise<{ getInnerHTML: () => Promise<string> } | null>
                        }>
                        log: (value: string) => Promise<void>
                    },
                    messageIndex: number,
                    message: { processedHtml?: string },
                    currentOriginalHtml?: string,
                ) => Promise<string>
            }

            const hostHtml = [
                '<p><strong>Translation Process - A Summary</strong></p>',
                '<p>Okay, here’s what I’ve been thinking through for this translation.</p>',
                '<p>The final output needs to be only the translation itself. I’m ready to render the final output.</p>',
                '<p>키어런은 당장이라도 눈을 감고 잠들고 싶었다.</p>',
                '<p>터널 시야는 물러나지 않고 오히려 전진했다.</p>',
            ].join('')

            const api = {
                getRootDocument: async () => ({
                    querySelector: async () => ({
                        getInnerHTML: async () => hostHtml,
                    }),
                }),
                log: async () => {},
            }

            await expect(getHostTranslatedMessageHtml(
                api,
                0,
                {},
                '<p>Original body</p>',
            )).resolves.toBe([
                '<p>키어런은 당장이라도 눈을 감고 잠들고 싶었다.</p>',
                '<p>터널 시야는 물러나지 않고 오히려 전진했다.</p>',
            ].join(''))
        } finally {
            globalThis.document = previousDocument
            ;(globalThis as any).readerState = previousReaderState
        }
    })
})
