//@name risu_notification
//@display-name AI Response Notifier
//@api 3.0
//@version 1.1.0

/**
 * AI Response Notifier
 *
 * AI 응답이 완료되면 소리로 알려줍니다.
 * 설정 버튼(플러그인 설정 메뉴)을 통해 on/off 조정 가능.
 *
 * 주의: 플러그인은 샌드박스 iframe 안에서 실행됩니다.
 *       메시지 전송 시 beforeRequest 훅에서 AudioContext를 자동으로 활성화합니다.
 *       소리가 안 들리면 설정에서 "소리 테스트"를 한 번 눌러주세요.
 */

(async () => {
    try {

        // ── 기본 설정값 ────────────────────────────────────────
        const DEFAULTS = {
            sound_enabled: '1',  // 소리 알림
            notif_enabled: '1',  // 브라우저 알림
        };

        async function getSetting(key) {
            const val = await Risuai.pluginStorage.getItem(key);
            return val !== null && val !== undefined ? val : DEFAULTS[key];
        }

        async function setSetting(key, val) {
            await Risuai.pluginStorage.setItem(key, val);
        }

        // ── AudioContext 관리 ───────────────────────────────────
        let audioCtx = null;

        function ensureAudioContext() {
            if (!audioCtx || audioCtx.state === 'closed') {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            return audioCtx;
        }

        // AudioContext 활성화 시도
        // 샌드박스 iframe(allow-scripts only)에서는 메인 앱 클릭이 전달되지 않으므로
        // document 이벤트 리스너 방식은 무효. beforeRequest 훅에서 호출해야 함
        // Chrome 72+는 postMessage를 통해 user activation을 전파하므로 이 시점에 resume 가능
        function warmupAudio() {
            try {
                const ctx = ensureAudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume().catch(() => {});
                }
            } catch (_) {}
        }

        // 톤 재생 (AudioContext가 running이어야 동작)
        async function playBeep() {
            try {
                const ctx = ensureAudioContext();

                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                // 디스코드풍: 높은 음 → 낮은 음 하강, 볼륨 크게
                function playTone(startTime, freq) {
                    const osc  = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, startTime);

                    gain.gain.setValueAtTime(0,    startTime);
                    gain.gain.linearRampToValueAtTime(0.65, startTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

                    osc.start(startTime);
                    osc.stop(startTime + 0.18);
                }

                const now = ctx.currentTime;
                playTone(now,        1200); // 첫 음: 높게
                playTone(now + 0.2,   900); // 둘째 음: 낮게
            } catch (e) {
                console.log('[Notifier] 소리 재생 실패: ' + e.message);
            }
        }

        // ── 브라우저 알림 ────────────────────────────────────────
        function tryShowNotification(content) {
            try {
                if (!('Notification' in window)) return;
                if (Notification.permission === 'granted') {
                    const stripped = content.replace(/<[^>]*>/g, '').trim();
                    const preview = stripped.slice(0, 80);
                    const body = preview + (stripped.length > 80 ? '…' : '');
                    const noti = new Notification('Risuai — 응답 완료', {
                        body: body || 'AI 응답이 도착했습니다.',
                        silent: true,
                    });
                    noti.onclick = () => window.focus();
                } else if (Notification.permission === 'default') {
                    Notification.requestPermission().then(perm => {
                        if (perm === 'granted') tryShowNotification(content);
                    }).catch(() => {});
                }
            } catch (_) {
                // 샌드박스 iframe에서 차단될 수 있음 — 무시
            }
        }

        // ── 훅 핸들러 (removeRisuReplacer에 같은 참조를 넘겨야 하므로 변수로 저장) ──

        // beforeRequest: 유저 메시지 전송 시 AudioContext 워밍업
        // Chrome 72+에서 postMessage를 통해 user activation이 샌드박스 iframe으로 전파됨
        const beforeRequestHandler = async (messages, _type) => {
            warmupAudio();
            return messages;
        };

        // afterRequest: AI 응답 완료 시 소리/알림 실행
        const afterRequestHandler = async (content, _type) => {
            try {
                const soundEnabled = await getSetting('sound_enabled') === '1';
                const notifEnabled = await getSetting('notif_enabled') === '1';

                // fire-and-forget: 소리/알림이 응답을 블록하지 않도록
                if (soundEnabled) playBeep().catch(() => {});
                if (notifEnabled) tryShowNotification(content);
            } catch (e) {
                console.log('[Notifier] 오류: ' + e.message);
            }
            return content;
        };

        await Risuai.addRisuReplacer('beforeRequest', beforeRequestHandler);
        await Risuai.addRisuReplacer('afterRequest', afterRequestHandler);

        // ── 플러그인 언로드 시 훅 정리 ──────────────────────────────
        // replacerbeforeRequest / replacerafterRequest Set은 자동 정리되지 않으므로
        // onUnload에서 반드시 removeRisuReplacer를 호출해야 함
        Risuai.onUnload(async () => {
            await Risuai.removeRisuReplacer('beforeRequest', beforeRequestHandler);
            await Risuai.removeRisuReplacer('afterRequest', afterRequestHandler);
            if (audioCtx) {
                audioCtx.close().catch(() => {});
                audioCtx = null;
            }
        });

        // ── 설정 UI ──────────────────────────────────────────────
        async function buildSettingsUI() {
            const sound = await getSetting('sound_enabled');
            const notif = await getSetting('notif_enabled');

            document.body.innerHTML = `
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: #1a1a2e;
                        color: #e0e0e0;
                        padding: 32px;
                        min-height: 100vh;
                    }
                    h1 { font-size: 1.3rem; margin-bottom: 8px; color: #fff; }
                    .hint { font-size: 0.8rem; color: #888; margin-bottom: 24px; line-height: 1.5; }
                    .row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 14px 0;
                        border-bottom: 1px solid #2a2a3e;
                    }
                    .label { font-size: 0.95rem; }
                    .sub   { font-size: 0.78rem; color: #888; margin-top: 3px; }
                    .toggle {
                        position: relative;
                        width: 48px; height: 26px;
                        flex-shrink: 0;
                    }
                    .toggle input { opacity: 0; width: 0; height: 0; }
                    .slider {
                        position: absolute; inset: 0;
                        background: #444; border-radius: 26px;
                        cursor: pointer; transition: background .2s;
                    }
                    .slider::before {
                        content: '';
                        position: absolute;
                        width: 20px; height: 20px;
                        left: 3px; top: 3px;
                        background: #fff; border-radius: 50%;
                        transition: transform .2s;
                    }
                    input:checked + .slider { background: #6c63ff; }
                    input:checked + .slider::before { transform: translateX(22px); }
                    .btn-close {
                        margin-top: 32px;
                        padding: 10px 28px;
                        background: #6c63ff; color: #fff;
                        border: none; border-radius: 8px;
                        font-size: 0.95rem; cursor: pointer;
                    }
                    .btn-close:hover { background: #5a52d5; }
                    .btn-test {
                        margin-top: 8px;
                        padding: 10px 28px;
                        background: #2a2a3e; color: #ccc;
                        border: 1px solid #444; border-radius: 8px;
                        font-size: 0.95rem; cursor: pointer;
                        margin-right: 12px;
                    }
                    .btn-test:hover { background: #333; }
                    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
                </style>

                <h1>🔔 AI Response Notifier</h1>
                <p class="hint">ℹ️ 소리가 처음 안 들리면 아래 "소리 테스트"를 한 번 눌러<br>
                오디오를 활성화하세요. 이후 메시지 전송 시 자동 활성화됩니다.</p>

                <div class="row">
                    <div>
                        <div class="label">소리 알림</div>
                        <div class="sub">응답 완료 시 알림음 재생</div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="sound" ${sound === '1' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="row">
                    <div>
                        <div class="label">브라우저 알림</div>
                        <div class="sub">탭이 백그라운드일 때 시스템 알림 표시</div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="notif" ${notif === '1' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <br>
                <div class="actions">
                    <button class="btn-test" id="test-btn">🔊 소리 테스트</button>
                    <button class="btn-close" id="close-btn">저장 후 닫기</button>
                </div>
            `;

            document.getElementById('test-btn').addEventListener('click', () => {
                warmupAudio(); // 테스트 버튼 클릭 = iframe 내 유저 제스처
                playBeep();
            });

            document.getElementById('close-btn').addEventListener('click', async () => {
                await setSetting('sound_enabled', document.getElementById('sound').checked ? '1' : '0');
                await setSetting('notif_enabled', document.getElementById('notif').checked ? '1' : '0');
                await Risuai.hideContainer();
            });
        }

        Risuai.registerSetting(
            'AI Response Notifier',
            async () => {
                await buildSettingsUI();
                await Risuai.showContainer('fullscreen');
            },
            '🔔',
            'html'
        );

        console.log('[Notifier] AI Response Notifier 로드 완료');

    } catch (error) {
        console.log('[Notifier] 초기화 오류: ' + error.message);
    }
})();
