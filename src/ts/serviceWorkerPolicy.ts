interface ServiceWorkerPolicyOptions {
    allowNodeServiceWorker: boolean
    hasServiceWorker: boolean
    isNodeServer: boolean
    isTauri: boolean
}

export function shouldEnableServiceWorker(options: ServiceWorkerPolicyOptions) {
    // Node self-host는 기본적으로 SW를 끄되, PWA 용도로 명시적으로 켠 서버만 예외로 허용한다.
    if (options.isNodeServer) {
        return options.allowNodeServiceWorker && options.hasServiceWorker
    }

    // Tauri는 브라우저 정적 호스팅 환경이 아니므로 웹 서비스워커를 켤 필요가 없다.
    if (options.isTauri) {
        return false
    }

    // 마지막으로 브라우저가 API 자체를 지원하는지 확인해 웹 배포에서만 SW를 활성화한다.
    return options.hasServiceWorker
}
