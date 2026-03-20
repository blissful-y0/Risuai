import { describe, expect, test } from 'vitest'
import { shouldEnableServiceWorker } from './serviceWorkerPolicy'

describe('shouldEnableServiceWorker', () => {
    test('노드 self-host에서는 service worker를 비활성화한다', () => {
        expect(shouldEnableServiceWorker({
            allowNodeServiceWorker: false,
            hasServiceWorker: true,
            isNodeServer: true,
            isTauri: false,
        })).toBe(false)
    })

    test('노드 self-host라도 서버 플래그가 켜져 있으면 service worker를 활성화한다', () => {
        expect(shouldEnableServiceWorker({
            allowNodeServiceWorker: true,
            hasServiceWorker: true,
            isNodeServer: true,
            isTauri: false,
        })).toBe(true)
    })

    test('tauri에서는 service worker를 비활성화한다', () => {
        expect(shouldEnableServiceWorker({
            allowNodeServiceWorker: false,
            hasServiceWorker: true,
            isNodeServer: false,
            isTauri: true,
        })).toBe(false)
    })

    test('일반 웹 환경에서 service worker API가 있으면 활성화한다', () => {
        expect(shouldEnableServiceWorker({
            allowNodeServiceWorker: false,
            hasServiceWorker: true,
            isNodeServer: false,
            isTauri: false,
        })).toBe(true)
    })

    test('브라우저가 service worker API를 지원하지 않으면 비활성화한다', () => {
        expect(shouldEnableServiceWorker({
            allowNodeServiceWorker: true,
            hasServiceWorker: false,
            isNodeServer: false,
            isTauri: false,
        })).toBe(false)
    })
})
