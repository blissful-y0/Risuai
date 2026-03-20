interface ServiceWorkerControllerLike {
    controller: unknown
    ready: Promise<unknown>
    addEventListener: (
        type: 'controllerchange',
        listener: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions
    ) => void
    removeEventListener?: (
        type: 'controllerchange',
        listener: EventListenerOrEventListenerObject,
        options?: EventListenerOptions
    ) => void
}

export async function waitForServiceWorkerControl(
    serviceWorker: ServiceWorkerControllerLike,
    sleepFn: (ms: number) => Promise<unknown>,
    timeoutMs = 3000
) {
    await serviceWorker.ready

    // 이미 현재 페이지를 SW가 잡고 있으면 추가 대기 없이 바로 사용한다.
    if (serviceWorker.controller) {
        return true
    }

    return await new Promise<boolean>((resolve) => {
        let settled = false

        const finish = () => {
            if (settled) {
                return
            }
            settled = true
            serviceWorker.removeEventListener?.('controllerchange', onControllerChange)
            resolve(!!serviceWorker.controller)
        }

        const onControllerChange = () => {
            finish()
        }

        serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true })

        // 첫 설치/업데이트에서 controllerchange가 오지 않으면 무한 대기하지 않고 이번 로드에서는 SW를 포기한다.
        void sleepFn(timeoutMs).then(() => {
            finish()
        })
    })
}
