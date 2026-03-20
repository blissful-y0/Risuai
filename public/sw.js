// @ts-nocheck

self.addEventListener('install', (event) => {
    // 업데이트 직후 waiting 상태에 오래 머물지 않도록 새 워커를 바로 활성 후보로 올린다.
    event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
    // 첫 설치/업데이트 직후에도 현재 페이지를 바로 점유해 /sw/init이 origin으로 새지 않게 한다.
    event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)
    const path = url.pathname.split('/')
    if(path[1] === 'sw'){
        try {
            switch (path[2]){
                case "check":{
                    let targetUrl = url
                    const headers = event.request.headers
                    const headerUrl = headers.get('x-register-url')
                    if(headerUrl){
                        targetUrl.pathname = decodeURIComponent(headerUrl)
                    }
                    event.respondWith(checkCache(targetUrl))
                    break
                }
                case "img": {
                    event.respondWith(getSource(url))
                    break
                }
                case "register": {
                    let targetUrl = url
                    const headers = event.request.headers
                    const headerUrl = headers.get('x-register-url')
                    if(headerUrl){
                        targetUrl.pathname = decodeURIComponent(headerUrl)
                    }
                    const noContentType = headers.get('x-no-content-type') === 'true'
                    event.respondWith(
                        registerCache(targetUrl, event.request.arrayBuffer(), noContentType)
                    )
                    break
                }
                case "init":{
                    event.respondWith(new Response("v2"))
                    break
                }
                case 'share':{
                    event.respondWith((async () => {
                        const formData = await event.request.formData();
                        /**
                         * @type {File}
                        */
                        const character = formData.get('character')
                        const preset = formData.get('preset')
                        const module = formData.get('module')
                        if(character){
                            const buf = await character.arrayBuffer()
                            await registerCache(`/sw/share/character`, buf, true)
                            return Response.redirect("/#share_character", 303)
                        }
                        if(preset){
                            const buf = await preset.arrayBuffer()
                            await registerCache(`/sw/share/preset`, buf, true)
                            return Response.redirect("/#share_preset", 303)
                        }
                        if(module){
                            const buf = await module.arrayBuffer()
                            await registerCache(`/sw/share/module`, buf, true)
                            return Response.redirect("/#share_module", 303)
                        }
                        return Response.redirect("/", 303)

                    })())
                    break
                }
                default: {
                    event.respondWith(new Response(
                        path[2]
                    ))
                }
            }
        } catch (error) {
            event.respondWith(new Response(`${error}`))
        }
    }
    if(path[1] === 'tf'){{
        event.respondWith(new Response("Cannot find resource from cache", {
            status: 404
        }))
    }}
})


async function checkCache(url){
    const cache = await caches.open('risuCache')

    if(url.pathname.startsWith("/sw/check")) {
        url.pathname = "/sw/img" + url.pathname.slice(9);
        return new Response(JSON.stringify({
            "able": !!(await cache.match(url))
        }))
    }

    return new Response(JSON.stringify({
        "able": !!(await cache.match(url))
    }))
}

async function getSource(url){
    const cache = await caches.open('risuCache')
    return await cache.match(url)
}

async function check(){

}

async function registerCache(urlr, buffer, noContentType = false){
    const cache = await caches.open('risuCache')
    const url = new URL(urlr)
    if(!noContentType){
        let path = url.pathname.split('/')
        path[2] = 'img'
        url.pathname = path.join('/')
    }
    const buf = new Uint8Array(await buffer)
    let headers = {
        "cache-control": "max-age=604800",
        "content-type": "image/png"
    }
    if(noContentType){
        delete headers["content-type"]
    }
    await cache.put(url, new Response(buf, {
        headers
    }))
    return new Response(JSON.stringify({
        "done": true
    }))
}
