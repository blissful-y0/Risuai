interface ServiceWorkerPolicyOptions {
    hasServiceWorker: boolean
    isNodeServer: boolean
    isTauri: boolean
}

export function shouldEnableServiceWorker(options: ServiceWorkerPolicyOptions) {
    // Node self-host는 서버가 자산을 직접 제공하므로 SW 초기화 이득보다 /sw 경로 불일치 리스크가 더 크다.
    if (options.isNodeServer) {
        return false
    }

    // Tauri는 브라우저 정적 호스팅 환경이 아니므로 웹 서비스워커를 켤 필요가 없다.
    if (options.isTauri) {
        return false
    }

    // 마지막으로 브라우저가 API 자체를 지원하는지 확인해 웹 배포에서만 SW를 활성화한다.
    return options.hasServiceWorker
}
