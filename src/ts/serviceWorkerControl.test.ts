import { describe, expect, test } from 'vitest'
import { waitForServiceWorkerControl } from './serviceWorkerControl'

class FakeServiceWorkerContainer extends EventTarget {
    controller: unknown = null
    ready: Promise<unknown> = Promise.resolve()
}

describe('waitForServiceWorkerControl', () => {
    test('이미 controller가 있으면 바로 true를 반환한다', async () => {
        const serviceWorker = new FakeServiceWorkerContainer()
        serviceWorker.controller = { active: true }

        const result = await waitForServiceWorkerControl(serviceWorker, async () => {})

        expect(result).toBe(true)
    })

    test('controllerchange가 오면 true를 반환한다', async () => {
        const serviceWorker = new FakeServiceWorkerContainer()

        const resultPromise = waitForServiceWorkerControl(serviceWorker, async () => {})

        serviceWorker.controller = { active: true }
        serviceWorker.dispatchEvent(new Event('controllerchange'))

        await expect(resultPromise).resolves.toBe(true)
    })

    test('timeout 안에 controllerchange가 없으면 false를 반환한다', async () => {
        const serviceWorker = new FakeServiceWorkerContainer()

        const result = await waitForServiceWorkerControl(serviceWorker, async () => {}, 0)

        expect(result).toBe(false)
    })
})
