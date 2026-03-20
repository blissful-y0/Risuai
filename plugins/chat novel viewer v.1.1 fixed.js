//@name chat-novel-viewer-v1.1 fixed
//@display-name Chat Novel Viewer v1.1 fixed
//@arg wordsPerPage int
//@arg fontSize int
//@arg fontFamily string
//@arg fontWeight int
//@arg lineHeight int
//@arg letterSpacing int
//@arg pageColor string
//@arg pageBrightness int
//@arg headerColor string
//@arg buttonX int
//@arg buttonY int
//@arg twoPageMode string

let viewerWindow = null;
let currentPages = [];
let currentPageIndex = 0;
let sidebarButton = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isButtonControlMode = false;
let keydownHandler = null;
let savedNovels = [];
let folders = [];
let currentFileName = '';
let currentNovelContent = '';
let isFullscreen = false;
let currentFolderId = null;

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Global config object
let globalConf = {
    fs: 16,
    lh: 180,
    ls: 0,
    font: 'Noto Serif KR',
    fw: 400,
    words: 400,
    header: '#fef3c7',
    bg: '#fffbeb',
    brightness: 100,
    mode: false
};

const STORAGE_KEY_NOVELS = 'chat-novel-viewer-novels';
const STORAGE_KEY_FOLDERS = 'chat-novel-viewer-folders';
const STORAGE_KEY_SETTINGS = 'chat-novel-viewer-settings';
const PLUGIN_NAME = 'chat-novel-viewer-v1';

const isMobile = () => window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function loadData() {
    try {
        savedNovels = JSON.parse(localStorage.getItem(STORAGE_KEY_NOVELS) || '[]');
        folders = JSON.parse(localStorage.getItem(STORAGE_KEY_FOLDERS) || '[]');
    } catch (e) { console.error(e); }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY_NOVELS, JSON.stringify(savedNovels));
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(globalConf));
}

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS));
        if (s) {
            Object.keys(globalConf).forEach(k => {
                if (s[k] !== undefined) globalConf[k] = s[k];
            });
        }
    } catch (e) {}
}

function saveNovel(fileName, content, bookmark = null, folderId = null) {
    const idx = savedNovels.findIndex(n => n.fileName === fileName);
    const data = {
        fileName, content, savedAt: new Date().toISOString(),
        bookmark: bookmark !== null ? bookmark : (idx >= 0 ? savedNovels[idx].bookmark : null),
        folderId: folderId !== null ? folderId : (idx >= 0 ? savedNovels[idx].folderId : null)
    };
    if (idx >= 0) savedNovels[idx] = data; else savedNovels.push(data);
    saveData();
}

function moveNovelToFolder(fileName, folderId) {
    const novel = savedNovels.find(n => n.fileName === fileName);
    if (novel) {
        novel.folderId = folderId;
        saveData();
    }
}

function deleteNovel(fileName) {
    savedNovels = savedNovels.filter(n => n.fileName !== fileName);
    saveData();
}

function saveBookmark(fileName, idx) {
    const n = savedNovels.find(x => x.fileName === fileName);
    if(n) { n.bookmark = idx; saveData(); }
}

function removeBookmark(fileName) {
    const n = savedNovels.find(x => x.fileName === fileName);
    if(n) { n.bookmark = null; saveData(); }
}

function createFolder(name) {
    const colors = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#ef4444', '#8b5cf6'];
    const newFolder = {
        id: Date.now().toString(),
        name: name,
        color: colors[Math.floor(Math.random() * colors.length)],
        createdAt: new Date().toISOString()
    };
    folders.push(newFolder);
    saveData();
    return newFolder;
}

function changeFolderColor(id, newColor) {
    const f = folders.find(x => x.id === id);
    if(f) { f.color = newColor; saveData(); }
}

function deleteFolder(folderId) {
    folders = folders.filter(f => f.id !== folderId);
    savedNovels.forEach(file => { if (file.folderId === folderId) file.folderId = null; });
    saveData();
}

function loadResources() {
    const id = 'cnv-fonts-final-v5';
    if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700;800&family=Merriweather:wght@300;400;700;900&family=Playfair+Display:wght@400;700;900&family=Lora:wght@400;700&family=Crimson+Text:wght@400;700&family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Hahmlet:wght@300;400;600;900&family=Nanum+Gothic:wght@400;700;800&family=Noto+Serif+KR:wght@300;400;700;900&family=Roboto:wght@400;500;700;900&family=Orbit&family=Nanum+Myeongjo:wght@400;700;800&display=swap';
        document.head.appendChild(link);
    }
    const pid = 'cnv-font-pretendard';
    if (!document.getElementById(pid)) {
        const link = document.createElement('link');
        link.id = pid;
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
        document.head.appendChild(link);
    }
}

function isVolumeOrChapter(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) return { type: 'markdown', isVolume: false };
    if (trimmed.startsWith('##')) return { type: 'markdown', isVolume: true };
    if (trimmed.match(/^볼륨\s*\d+/i) || trimmed.match(/^volume\s*\d+/i)) return { type: 'text', isVolume: true };
    if (trimmed.match(/^챕터\s*\d+/i) || trimmed.match(/^chapter\s*\d+/i)) return { type: 'text', isVolume: false };
    return null;
}

function calculatePageLimit(baseWords, fontSize) {
    const ratio = 16 / fontSize;
    return Math.max(30, Math.floor(baseWords * ratio * ratio));
}

function cleanText(text) {
    if (!text) return "";
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/&[a-zA-Z]+;/gi, '');
    text = text.replace(/&#\d+;/g, '');
    text = text.replace(/"{3,}/g, '"');
    text = text.replace(/'{3,}/g, "'");
    text = text.replace(/\*{2,}html[A-Z]*/gi, '');
    text = text.replace(/html[A-Z]*/gi, '');
    text = text.replace(/STATUS["']{1,}/gi, '');
    text = text.replace(/^\d+가 말했다\./gm, '');
    text = text.replace(/["\']⬥.*?["\']/gs, '');
    text = text.replace(/["']{2,}/g, '"');
    text = text.replace(/▽+/g, '');
    text = text.replace(/⬥+/g, '');
    text = text.replace(/^\d{1,2}\|\d{4}\s+\d{1,2}:\d{2}\(.\).*$/gm, '');
    text = text.replace(/^[📅🕐📍👔🎭💭].*$/gm, '');
    text = text.replace(/\n{4,}/g, '\n\n\n');
    return text;
}

function convertMessageToNovel(speaker, message, charName) {
    speaker = speaker.replace(/\{\{char\}\}/gi, charName || '그').replace(/\{\{user\}\}/gi, '나');
    message = cleanText(message);
    
    let statusBlocks = [];
    message = message.replace(/\[([^\]]+)\]/g, (match, content) => {
        if (/YEAR|DATE|TIME|PLACE|AFFECTION|INNER_THOUGHT/i.test(content)) {
            statusBlocks.push(match);
            return '';
        }
        return match;
    });
    
    const parts = message.split(/(\*[^*]+\*)/g);
    let actions = [];
    let dialogues = [];
    parts.forEach(part => {
        part = part.trim();
        if (!part) return;
        if (part.startsWith('*') && part.endsWith('*')) actions.push(part.slice(1, -1).trim());
        else dialogues.push(part);
    });
    
    let result = '';
    if (statusBlocks.length > 0) result += statusBlocks.join(' ') + '\n\n';
    if (actions.length > 0) {
        result += actions.join(' ');
        if (dialogues.length > 0) result += ' ';
    }
    if (dialogues.length > 0) {
        result += dialogues.join(' ');
    } else if (actions.length === 0 && statusBlocks.length === 0) {
        result = message;
    }
    return result;
}

function processJsonChat(json) {
    let novelText = '';
    let charName = '캐릭터';
    try { const char = globalThis.__pluginApis__?.getChar(); if(char) charName = char.name; } catch(e){}
    
    let chats = [];
    if (json.chats) chats = json.chats;
    else if (json.data && json.data.chats) chats = json.data.chats;
    else if (Array.isArray(json)) chats = json;
    
    chats.forEach((chat, index) => {
        const speaker = chat.name || chat.role || chat.speaker || '화자';
        let message = chat.data || chat.message || chat.content || '';
        message = cleanText(message);
        if (message && message.trim()) {
            novelText += convertMessageToNovel(speaker, message, charName);
            if (index < chats.length - 1) novelText += '\n\n';
        }
    });
    return novelText;
}

function processTextChat(text) {
    let novelText = '';
    let charName = '캐릭터';
    try { const char = globalThis.__pluginApis__?.getChar(); if(char) charName = char.name; } catch(e){}
    const lines = text.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        line = cleanText(line);
        if (!line || line.trim() === '') continue;
        if (line.startsWith('###') || line.startsWith('##') || 
            line.match(/^볼륨\s*\d+/i) || line.match(/^챕터\s*\d+/i) ||
            line.match(/^volume\s*\d+/i) || line.match(/^chapter\s*\d+/i)) {
            novelText += line + '\n\n';
            continue;
        }
        novelText += line + '\n\n';
    }
    return novelText;
}

function addFloatingButton() {
    const mobile = isMobile();
    
    const container = document.createElement('div');
    container.id = 'novel-viewer-button-container';
    
    if (mobile) {
        let savedX = parseInt(getArg(`${PLUGIN_NAME}::buttonX`));
        let savedY = parseInt(getArg(`${PLUGIN_NAME}::buttonY`));
        if (isNaN(savedX) || savedX < 0 || savedX > window.innerWidth - 64) savedX = window.innerWidth / 2 - 32;
        if (isNaN(savedY) || savedY < 0 || savedY > window.innerHeight - 64) savedY = 20;
        container.style.cssText = `position:fixed; bottom:${savedY}px; left:${savedX}px; z-index:9999; display:flex; flex-direction:column; align-items:center; gap:8px; touch-action:none;`;
    } else {
        const x = parseInt(getArg(`${PLUGIN_NAME}::buttonX`)) || 20;
        const y = parseInt(getArg(`${PLUGIN_NAME}::buttonY`)) || 80;
        container.style.cssText = `position:fixed; left:${x}px; bottom:${y}px; z-index:9999; display:flex; flex-direction:column; gap:8px;`;
    }

    const button = document.createElement('button');
    button.id = 'novel-viewer-floating-btn';
    button.title = '채팅 로그 소설 뷰어';
    const btnSize = mobile ? '64px' : '60px';
    button.style.cssText = `width:${btnSize}; height:${btnSize}; background:linear-gradient(135deg, #3b82f6, #2563eb); border:none; border-radius:50%; cursor:pointer; box-shadow:0 4px 16px rgba(59,130,246,0.4); display:flex; align-items:center; justify-content:center; transition:transform 0.2s; font-size:32px;`;
    button.innerHTML = `📖`;

    container.appendChild(button);
    document.body.appendChild(container);

    if (mobile) {
        let touchStartXBtn = 0;
        let touchStartYBtn = 0;
        let initialXBtn = 0;
        let initialYBtn = 0;
        let isDraggingBtn = false;
        let touchMoved = false;

        button.addEventListener('touchstart', (e) => {
            touchStartXBtn = e.touches[0].clientX;
            touchStartYBtn = e.touches[0].clientY;
            initialXBtn = parseInt(container.style.left);
            initialYBtn = parseInt(container.style.bottom);
            isDraggingBtn = true;
            touchMoved = false;
        });
        button.addEventListener('touchmove', (e) => {
            if (!isDraggingBtn) return;
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartXBtn;
            const deltaY = -(touchY - touchStartYBtn);
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                touchMoved = true;
                e.preventDefault();
                const newX = Math.max(0, Math.min(initialXBtn + deltaX, window.innerWidth - 64));
                const newY = Math.max(0, Math.min(initialYBtn + deltaY, window.innerHeight - 64));
                container.style.left = newX + 'px';
                container.style.bottom = newY + 'px';
            }
        });
        button.addEventListener('touchend', (e) => {
            if (isDraggingBtn) {
                if (touchMoved) {
                    const x = parseInt(container.style.left);
                    const y = parseInt(container.style.bottom);
                    setArg(`${PLUGIN_NAME}::buttonX`, x);
                    setArg(`${PLUGIN_NAME}::buttonY`, y);
                } else {
                    createViewerUI();
                }
                isDraggingBtn = false;
                touchMoved = false;
            }
        });
    }

    if (!mobile) {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'button-control-panel';
        controlPanel.style.cssText = `display:none; background:white; border-radius:12px; padding:12px; box-shadow:0 4px 12px rgba(0,0,0,0.15); flex-direction:column; gap:8px;`;
        controlPanel.innerHTML = `
            <div style="text-align:center; font-size:12px; color:#1e40af; font-weight:bold; margin-bottom:4px;">버튼 이동</div>
            <div style="display:grid; grid-template-columns:repeat(3,36px); gap:4px; justify-items:center;">
                <div></div>
                <button id="move-up" style="width:36px; height:36px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:18px;">↑</button>
                <div></div>
                <button id="move-left" style="width:36px; height:36px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:18px;">←</button>
                <button id="move-center" style="width:36px; height:36px; background:#dc2626; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">✕</button>
                <button id="move-right" style="width:36px; height:36px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:18px;">→</button>
                <div></div>
                <button id="move-down" style="width:36px; height:36px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:18px;">↓</button>
                <div></div>
            </div>
        `;
        container.appendChild(controlPanel);

        const moveButton = (dx, dy) => {
            const currentX = parseInt(container.style.left);
            const currentY = parseInt(container.style.bottom);
            const newX = Math.max(0, Math.min(currentX + dx, window.innerWidth - 60));
            const newY = Math.max(0, Math.min(currentY + dy, window.innerHeight - 60));
            container.style.left = newX + 'px';
            container.style.bottom = newY + 'px';
            setArg(`${PLUGIN_NAME}::buttonX`, newX);
            setArg(`${PLUGIN_NAME}::buttonY`, newY);
        };
        document.getElementById('move-up').onclick = () => moveButton(0, 10);
        document.getElementById('move-down').onclick = () => moveButton(0, -10);
        document.getElementById('move-left').onclick = () => moveButton(-10, 0);
        document.getElementById('move-right').onclick = () => moveButton(10, 0);
        document.getElementById('move-center').onclick = () => { controlPanel.style.display = 'none'; isButtonControlMode = false; };
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            isButtonControlMode = !isButtonControlMode;
            controlPanel.style.display = isButtonControlMode ? 'flex' : 'none';
        });

        let hasMoved = false;
        button.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || isButtonControlMode) return;
            isDragging = true;
            hasMoved = false;
            const rect = container.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            button.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            hasMoved = true;
            let newLeft = e.clientX - dragOffset.x;
            let newTop = e.clientY - dragOffset.y;
            const width = container.offsetWidth;
            const height = container.offsetHeight;
            const maxX = window.innerWidth - width;
            const maxY = window.innerHeight - height;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            const newBottom = window.innerHeight - (newTop + height);
            container.style.left = newLeft + 'px';
            container.style.bottom = newBottom + 'px';
        });
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            button.style.cursor = 'pointer';
            const x = parseInt(container.style.left);
            const y = parseInt(container.style.bottom);
            setArg(`${PLUGIN_NAME}::buttonX`, x);
            setArg(`${PLUGIN_NAME}::buttonY`, y);
            if (!hasMoved && !isButtonControlMode) createViewerUI();
            isDragging = false;
            hasMoved = false;
        });
    }
    sidebarButton = container;
}

function createViewerUI() {
    if (viewerWindow) viewerWindow.remove();
    loadData();
    loadResources();

    const mobile = isMobile();
    
    // Init globalConf from args if not already set, or just overwrite
    globalConf.fs = parseInt(getArg(`${PLUGIN_NAME}::fontSize`)) || (mobile ? 14 : 16);
    globalConf.lh = parseInt(getArg(`${PLUGIN_NAME}::lineHeight`)) || 180;
    globalConf.ls = parseInt(getArg(`${PLUGIN_NAME}::letterSpacing`)) || 0;
    globalConf.font = getArg(`${PLUGIN_NAME}::fontFamily`) || 'Noto Serif KR';
    globalConf.fw = parseInt(getArg(`${PLUGIN_NAME}::fontWeight`)) || 400;
    globalConf.words = parseInt(getArg(`${PLUGIN_NAME}::wordsPerPage`)) || (mobile ? 250 : 400);
    globalConf.header = getArg(`${PLUGIN_NAME}::headerColor`) || '#fef3c7';
    globalConf.bg = getArg(`${PLUGIN_NAME}::pageColor`) || '#fffbeb';
    globalConf.brightness = parseInt(getArg(`${PLUGIN_NAME}::pageBrightness`)) || 100;
    globalConf.mode = mobile ? false : (getArg(`${PLUGIN_NAME}::twoPageMode`) === 'true');

    // Overwrite with saved settings if available
    loadSettings();

    const isDarkHeader = ['#1f2937', '#1e3a8a', '#374151', '#7f1d1d', '#831843', '#7c2d12', '#581c87'].includes(globalConf.header);
    const headerTxtColor = isDarkHeader ? '#ffffff' : '#374151';

    const wrapper = document.createElement('div');
    wrapper.id = 'chat-novel-viewer';
    
    if (mobile) {
        wrapper.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:#fff; z-index:10000; display:flex; flex-direction:column; overflow:hidden; font-family:${globalConf.font}, sans-serif; transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;`;
    } else {
        wrapper.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:${globalConf.mode?'1200px':'900px'}; height:85vh; background:#fff; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.3); z-index:10000; display:flex; flex-direction:column; overflow:hidden; font-family:${globalConf.font}, sans-serif; transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;`;
    }

    const headerHTML = `
<div id="cnv-header" style="padding:${mobile?'16px 12px':'12px 16px'}; background:${globalConf.header}; display:flex; align-items:center; gap:${mobile?'8px':'12px'}; flex-shrink:0; position:relative; z-index:20;">
    <div style="display:flex; gap:4px;">
        <button id="close-btn" style="width:${mobile?'16px':'12px'}; height:${mobile?'16px':'12px'}; border-radius:50%; background:#ff5f56; border:none; cursor:pointer;"></button>
        <button id="home-btn" style="width:${mobile?'16px':'12px'}; height:${mobile?'16px':'12px'}; border-radius:50%; background:#ffbd2e; border:none; cursor:pointer;"></button>
        ${!mobile ? '<button id="full-btn" style="width:12px; height:12px; border-radius:50%; background:#27c93f; border:none; cursor:pointer;"></button>' : ''}
    </div>
    <div style="flex:1; background:${isDarkHeader?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)'}; border-radius:6px; padding:${mobile?'8px 12px':'6px 12px'}; display:flex; align-items:center; gap:8px; min-width:0;">
        <span style="font-size:${mobile?'18px':'16px'};">🔒</span>
        <span id="url-text" style="font-size:${mobile?'14px':'13px'}; color:${headerTxtColor}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; width:100%;">New Tab</span>
    </div>
    <button id="menu-btn" style="background:none; border:none; font-size:${mobile?'24px':'20px'}; cursor:pointer; color:${headerTxtColor}; padding:8px;">⚙</button>
</div>

<div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999;">
    <div style="position:absolute; bottom:0; left:0; right:0; background:#fff; border-radius:20px 20px 0 0; max-height:80vh; overflow-y:auto; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="margin:0; font-size:18px; color:#1f2937;">설정</h3>
            <button id="close-modal" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6b7280; padding:0; width:32px; height:32px;">✕</button>
        </div>
        <div id="modal-settings-content"></div>
    </div>
</div>

<div id="settings-menu" style="display:none; position:absolute; top:50px; right:16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:280px; z-index:9999; max-height:calc(100vh - 100px); overflow-y:auto;">
    <div id="desktop-settings-content"></div>
</div>
`;

    const homeHTML = `
<div id="home-view" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
    <div style="padding:${mobile?'20px 16px':'24px'}; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:${mobile?'24px':'20px'}; font-weight:bold; color:#1f2937; margin-bottom:8px;">📚 나의 서재</div>
        <div style="font-size:${mobile?'14px':'13px'}; color:#6b7280;">소설 브라우저로 편안하게 읽어보세요</div>
    </div>
    <div style="padding:${mobile?'12px 16px':'16px 24px'}; display:flex; gap:12px; border-bottom:1px solid #e5e7eb;">
        <button id="file-open" style="padding:${mobile?'8px 16px':'10px 20px'}; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-size:${mobile?'15px':'13px'}; font-weight:500; flex:1;">📄 파일 열기</button>
        <button id="folder-new" style="padding:${mobile?'8px 16px':'10px 20px'}; background:#8b5cf6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:${mobile?'15px':'13px'}; font-weight:500; flex:1;">📁 폴더</button>
        <input type="file" id="h-file" accept=".json,.txt" style="display:none;">
    </div>
    ${mobile ? `
    <div style="padding:16px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:12px; color:#374151; line-height:1.6;">
            <strong>📱 사용법</strong>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; margin-top:8px;">
                <div>• 🔴 버튼: 나가기</div>
                <div>• ⚙️ 버튼: 뷰어 설정</div>
                <div>• 🟠 버튼: 홈으로</div>
                <div>• 📁 폴더: 길게 누르면 관리</div>
                <div>• 🔖 책갈피: 현재 페이지 저장</div>
                <div>• 좌우 스와이프: 페이지 이동</div>
                <div>• 📄 파일: 길게 누르면 메뉴</div>
                <div>• 🔍 버튼: 페이지 탐색</div>
            </div>
            <div style="margin-top:8px; padding:8px; background:#fef2f2; border-left:3px solid #dc2626; border-radius:4px; color:#991b1b; font-size:11px;">
                ⚠️ 챗 네비 플러그인을 사용 중일 경우 채팅창 내부에서 챗 로그 뷰어를 열지 마세요.
            </div>
        </div>
    </div>
    ` : `
    <div style="padding:16px 24px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:12px; color:#374151; line-height:1.6;">
            <strong>사용법</strong>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; margin-top:8px;">
                <div>• 🔴 버튼: 나가기</div>
                <div>• ⚙ 버튼: 뷰어 설정</div>
                <div>• 🟠 버튼: 홈 화면 이동</div>
                <div>• 📁 폴더: 우클릭으로 관리</div>
                <div>• 🟢 버튼: 전체 화면</div>
                <div>• 🔖 책갈피: 현재 페이지 저장</div>
                <div>• ← → 키: 페이지 이동</div>
                <div>• 📄 파일: 우클릭으로 메뉴</div>
                <div>• 🔍 버튼: 페이지 탐색</div>
            </div>
            <div style="margin-top:8px; padding:8px; background:#fef2f2; border-left:3px solid #dc2626; border-radius:4px; color:#991b1b; font-size:11px;">
                ⚠️ 챗 네비 플러그인을 사용 중일 경우 채팅창 내부에서 챗 로그 뷰어를 열지 마세요.
            </div>
        </div>
    </div>
    `}
    <div style="padding:${mobile?'12px 16px':'16px 24px'}; border-bottom:1px solid #e5e7eb;">
        <div id="path-txt" style="font-size:${mobile?'15px':'14px'}; color:#374151; font-weight:500;">내 서재</div>
    </div>
    <div style="flex:1; overflow-y:auto; padding:${mobile?'16px':'24px'};">
        <div id="file-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(${mobile?'90px':'100px'}, 1fr)); gap:${mobile?'12px':'16px'};"></div>
    </div>
</div>
    `;

    const readerHTML = `
<div id="reader-view" style="flex:1; display:none; flex-direction:column; overflow:hidden;">
    <div id="cnv-body" style="flex:1; display:flex; background:${globalConf.bg}; font-family:'${globalConf.font}', serif; position:relative; overflow:hidden; filter:brightness(${globalConf.brightness}%);">
        <div id="page-area" style="flex:1; display:flex; overflow:hidden;"></div>
        
        <div id="scroll-controls" style="position:absolute; top:50%; right:${mobile?'12px':'16px'}; transform:translateY(-50%); display:flex; flex-direction:column; gap:8px;">
            <button id="scroll-up" style="width:32px; height:32px; background:transparent; color:#9ca3af; border:1px solid #d1d5db; border-radius:50%; cursor:pointer; font-size:14px; font-weight:bold; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">↑</button>
            <button id="scroll-down" style="width:32px; height:32px; background:transparent; color:#9ca3af; border:1px solid #d1d5db; border-radius:50%; cursor:pointer; font-size:14px; font-weight:bold; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">↓</button>
        </div>
    </div>
    
    <div id="bottom-seek-bar" style="display:none; padding:10px 20px; background:#f3f4f6; border-top:1px solid #e5e7eb;">
        <input type="range" id="page-slider" min="0" max="100" value="0" style="width:100%;">
    </div>

    <div style="padding:${mobile?'16px 12px':'12px 20px'}; background:#fafafa; display:flex; align-items:center; justify-content:space-between; border-top:1px solid #e5e7eb; gap:12px;">
        <button id="nav-back" style="padding:${mobile?'12px 16px':'8px 16px'}; background:#e5e7eb; border:none; border-radius:6px; cursor:pointer; font-size:${mobile?'16px':'14px'}; font-weight:500; min-width:${mobile?'80px':'auto'};">← 이전</button>
        <div style="display:flex; align-items:center; gap:${mobile?'16px':'12px'}; flex:1; justify-content:center;">
            <span id="page-stat" style="font-size:${mobile?'15px':'13px'}; color:#6b7280; font-weight:500;"></span>
            <button id="seek-toggle-btn" style="border:none; background:none; font-size:${mobile?'24px':'20px'}; cursor:pointer; padding:0;">🔍</button>
            <button id="bm-btn" style="border:none; background:none; font-size:${mobile?'28px':'20px'}; cursor:pointer; padding:0;">🔖</button>
        </div>
        <button id="nav-fwd" style="padding:${mobile?'12px 16px':'8px 16px'}; background:#e5e7eb; border:none; border-radius:6px; cursor:pointer; font-size:${mobile?'16px':'14px'}; font-weight:500; min-width:${mobile?'80px':'auto'};">다음 →</button>
    </div>
</div>
    `;

    const css = `<style>
        #chat-novel-viewer * { box-sizing:border-box; }
        .f-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:${mobile?'16px 8px':'12px'}; text-align:center; cursor:pointer; transition:all 0.2s; }
        .f-card:active { background:#f3f4f6; transform:scale(0.95); }
        ${!mobile ? '.f-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); transform:translateY(-2px); }' : ''}
        ${mobile ? '#scroll-up:active, #scroll-down:active { background:rgba(255, 255, 255, 0.9); color:#374151; }' : '#scroll-up:hover, #scroll-down:hover { background:#f3f4f6; color:#374151; border-color:#9ca3af; }'}
        ${mobile ? '' : '#scroll-up:active, #scroll-down:active { background:#e5e7eb; }'}
        input[type="range"] { -webkit-appearance: none; appearance: none; background:#e5e7eb; border-radius:4px; height:${mobile?'8px':'6px'}; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width:${mobile?'24px':'16px'}; height:${mobile?'24px':'16px'}; background:#3b82f6; cursor:pointer; border-radius:4px; }
        input[type="range"]::-moz-range-thumb { width:${mobile?'24px':'16px'}; height:${mobile?'24px':'16px'}; background:#3b82f6; cursor:pointer; border-radius:4px; border:none; }
        input[type="number"], select { border:1px solid #d1d5db; }
    </style>`;

    wrapper.innerHTML = css + headerHTML + homeHTML + readerHTML;
    document.body.appendChild(wrapper);
    viewerWindow = wrapper;

    const settingsContent = `
        <div style="margin-bottom:12px;">
            <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">헤더 색상</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${['#fef3c7','#1f2937','#dbeafe','#fee2e2','#d1fae5','#7c2d12','#1e3a8a','#581c87','#065f46','#b91c1c'].map(c => 
                    `<div class="h-c" data-c="${c}" style="width:${mobile?'36px':'28px'}; height:${mobile?'36px':'28px'}; background:${c}; border-radius:4px; cursor:pointer; border:2px solid #e5e7eb;"></div>`
                ).join('')}
            </div>
        </div>
        <div style="margin-bottom:12px;">
            <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">페이지 색상</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${['#fffbeb','#ffffff','#f3f4f6','#ecfdf5','#1f2937'].map(c => 
                    `<div class="p-c" data-c="${c}" style="width:${mobile?'36px':'28px'}; height:${mobile?'36px':'28px'}; background:${c}; border-radius:4px; cursor:pointer; border:2px solid #e5e7eb;"></div>`
                ).join('')}
            </div>
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">페이지 밝기 <span id="d-brightness">${globalConf.brightness}%</span></label>
            <input type="range" id="i-brightness" min="50" max="150" value="${globalConf.brightness}" style="width:100%; margin-top:4px;">
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">글자 크기 <span id="d-fs">${globalConf.fs}px</span></label>
            <input type="range" id="i-fs" min="12" max="32" value="${globalConf.fs}" style="width:100%; margin-top:4px;">
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">글자 굵기</label>
            <select id="i-fw" style="width:100%; padding:${mobile?'12px':'6px'}; border-radius:4px; margin-top:4px; font-size:${mobile?'16px':'14px'};">
                <option value="400" ${globalConf.fw===400?'selected':''}>보통 (400)</option>
                <option value="700" ${globalConf.fw===700?'selected':''}>굵게 (700)</option>
                <option value="900" ${globalConf.fw===900?'selected':''}>더 굵게 (900)</option>
            </select>
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">행간 <span id="d-lh">${globalConf.lh}%</span></label>
            <input type="range" id="i-lh" min="100" max="300" step="10" value="${globalConf.lh}" style="width:100%; margin-top:4px;">
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">자간 <span id="d-ls">${globalConf.ls}px</span></label>
            <input type="range" id="i-ls" min="-2" max="6" value="${globalConf.ls}" style="width:100%; margin-top:4px;">
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">폰트</label>
            <select id="i-font" style="width:100%; padding:${mobile?'12px':'6px'}; border-radius:4px; margin-top:4px; font-size:${mobile?'16px':'14px'};">
                <option value="Noto Serif KR" ${globalConf.font==='Noto Serif KR'?'selected':''}>명조체 (Noto Serif KR)</option>
                <option value="Pretendard" ${globalConf.font==='Pretendard'?'selected':''}>프리텐다드 (Pretendard)</option>
                <option value="Gowun Dodum" ${globalConf.font==='Gowun Dodum'?'selected':''}>고운돋움 (Gowun Dodum)</option>
                <option value="Nanum Myeongjo" ${globalConf.font==='Nanum Myeongjo'?'selected':''}>나눔명조</option>
                <option value="Orbit" ${globalConf.font==='Orbit'?'selected':''}>오르빗</option>
                <option value="Gowun Batang" ${globalConf.font==='Gowun Batang'?'selected':''}>고운바탕</option>
                <option value="EB Garamond" ${globalConf.font==='EB Garamond'?'selected':''}>EB Garamond</option>
                <option value="Merriweather" ${globalConf.font==='Merriweather'?'selected':''}>Merriweather</option>
                <option value="Playfair Display" ${globalConf.font==='Playfair Display'?'selected':''}>Playfair Display</option>
                <option value="Lora" ${globalConf.font==='Lora'?'selected':''}>Lora</option>
                <option value="Crimson Text" ${globalConf.font==='Crimson Text'?'selected':''}>Crimson Text</option>
            </select>
        </div>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px; color:#6b7280;">단어수/페이지 (16px 기준)</label>
            <input type="number" id="i-words" min="100" max="1000" step="50" value="${globalConf.words}" style="width:100%; padding:${mobile?'12px':'6px'}; border-radius:4px; margin-top:4px; font-size:${mobile?'16px':'14px'};">
        </div>
        ${!mobile ? `<button id="mode-btn" style="width:100%; padding:8px; border:1px solid #e5e7eb; border-radius:6px; background:#f9fafb; cursor:pointer; font-size:13px;">📖 ${globalConf.mode?'두 페이지':'한 페이지'}</button>` : ''}
    `;

    if (mobile) {
        document.getElementById('modal-settings-content').innerHTML = settingsContent;
    } else {
        document.getElementById('desktop-settings-content').innerHTML = settingsContent;
    }

    renderFiles();
    setupEvents();
}

function createPages(text, wordsPerPage) {
    currentPages = [];
    const lines = text.split('\n');
    let currentPageContent = '';
    let wordCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            currentPageContent += '\n';
            continue;
        }
        const lineWords = trimmedLine.split(/\s+/).filter(w => w.length > 0).length;
        const check = isVolumeOrChapter(line);
        if (check) {
            if (currentPageContent.trim()) currentPages.push(currentPageContent.trim());
            currentPageContent = line + '\n';
            wordCount = lineWords;
        } else if (wordCount + lineWords > wordsPerPage && currentPageContent.trim()) {
            currentPages.push(currentPageContent.trim());
            currentPageContent = line + '\n';
            wordCount = lineWords;
        } else {
            currentPageContent += line + '\n';
            wordCount += lineWords;
        }
    }
    if (currentPageContent.trim()) currentPages.push(currentPageContent.trim());
    currentPageIndex = 0;
}

function openNovel(n) {
    currentFileName = n.fileName;
    currentNovelContent = n.content;
    const limit = calculatePageLimit(globalConf.words, globalConf.fs);
    createPages(n.content, limit);
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('reader-view').style.display = 'flex';
    document.getElementById('url-text').textContent = n.fileName;
    if (n.bookmark != null) currentPageIndex = n.bookmark;
    renderPage();
    updateBookmark();
    updateSlider();
    if (isMobile()) setupTouchGestures();
}

function renderPage() {
    const area = document.getElementById('page-area');
    const stat = document.getElementById('page-stat');
    if (!area || currentPages.length === 0) return;
    const mobile = isMobile();
    const color = ['#1f2937', '#374151', '#111827'].includes(globalConf.bg) ? '#f3f4f6' : '#1f2937';
    const padding = mobile ? '20px 16px' : '40px';
    const css = `padding:${padding}; overflow-y:auto; font-size:${globalConf.fs}px; line-height:${globalConf.lh}%; letter-spacing:${globalConf.ls}px; white-space:pre-wrap; color:${color}; font-family:'${globalConf.font}', serif; font-weight:${globalConf.fw};`;
    
    const format = (t) => {
        let cleaned = t || '';
        cleaned = cleaned.replace(/^##([^#].*)$/gm, '<div style="font-size:1.8em; font-weight:bold; margin:1.5em 0; text-align:center; border-bottom:2px solid currentColor; padding-bottom:0.5em;">$1</div>');
        cleaned = cleaned.replace(/^###([^#].*)$/gm, '<div style="font-size:1.4em; font-weight:bold; margin:1.2em 0; text-align:center;">$1</div>');
        cleaned = cleaned.replace(/^(볼륨\s*\d+.*)$/gmi, '<div style="font-size:1.8em; font-weight:bold; margin:1.5em 0; text-align:center; border-bottom:2px solid currentColor; padding-bottom:0.5em;">$1</div>');
        cleaned = cleaned.replace(/^(챕터\s*\d+.*)$/gmi, '<div style="font-size:1.4em; font-weight:bold; margin:1.2em 0; text-align:center;">$1</div>');
        cleaned = cleaned.replace(/^(volume\s*\d+.*)$/gmi, '<div style="font-size:1.8em; font-weight:bold; margin:1.5em 0; text-align:center; border-bottom:2px solid currentColor; padding-bottom:0.5em;">$1</div>');
        cleaned = cleaned.replace(/^(chapter\s*\d+.*)$/gmi, '<div style="font-size:1.4em; font-weight:bold; margin:1.2em 0; text-align:center;">$1</div>');
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        cleaned = cleaned.replace(/\n/g, '<br>');
        return cleaned;
    };

    if (globalConf.mode && !mobile) {
        area.innerHTML = `
            <div id="page-left" style="${css} flex:1; border-right:1px solid rgba(0,0,0,0.05);">${format(currentPages[currentPageIndex])}</div>
            <div id="page-right" style="${css} flex:1;">${format(currentPages[currentPageIndex+1] || '')}</div>
        `;
        stat.textContent = `${currentPageIndex+1}-${Math.min(currentPageIndex+2, currentPages.length)} / ${currentPages.length}`;
    } else {
        area.innerHTML = `<div id="page-single" style="${css} flex:1; max-width:${mobile?'100%':'800px'}; margin:0 auto;">${format(currentPages[currentPageIndex])}</div>`;
        stat.textContent = `${currentPageIndex+1} / ${currentPages.length}`;
    }
}

function updateBookmark() {
    const n = savedNovels.find(x => x.fileName === currentFileName);
    const btn = document.getElementById('bm-btn');
    if(n && n.bookmark === currentPageIndex) { btn.style.opacity='1'; }
    else { btn.style.opacity='0.3'; }
}

function updateSlider() {
    const slider = document.getElementById('page-slider');
    if(slider) {
        slider.max = currentPages.length - 1;
        slider.value = currentPageIndex;
    }
}

function setupTouchGestures() {
    const pageArea = document.getElementById('page-area');
    if (!pageArea) return;
    pageArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    pageArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleGesture();
    }, false);
}

function handleGesture() {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) moveToNextPage();
            else moveToPrevPage();
        }
    }
}

function moveToPrevPage() {
    const step = (globalConf.mode && !isMobile()) ? 2 : 1;
    if (currentPageIndex >= step) currentPageIndex -= step;
    else currentPageIndex = 0;
    renderPage();
    updateBookmark();
    updateSlider();
}

function moveToNextPage() {
    const step = (globalConf.mode && !isMobile()) ? 2 : 1;
    if (currentPageIndex + step < currentPages.length) currentPageIndex += step;
    else currentPageIndex = Math.max(0, currentPages.length - 1);
    renderPage();
    updateBookmark();
    updateSlider();
}

function renderFiles() {
    const list = document.getElementById('file-grid');
    const path = document.getElementById('path-txt');
    if (!list) return;
    list.innerHTML = '';
    const mobile = isMobile();

    if (currentFolderId) {
        const f = folders.find(x => x.id === currentFolderId);
        path.innerHTML = `<span id="go-home" style="cursor:pointer;color:#2563eb">내 서재</span> > ${f.name}`;
        document.getElementById('go-home').onclick = () => { currentFolderId = null; renderFiles(); };
    } else {
        path.textContent = '내 서재';
    }

    const tFolders = currentFolderId ? [] : folders;
    tFolders.forEach(f => {
        const el = document.createElement('div');
        el.className = 'f-card';
        el.innerHTML = `
            <div style="font-size:${mobile?'36px':'32px'}; color:${f.color || '#60a5fa'}">
                <svg width="${mobile?'36':'32'}" height="${mobile?'36':'32'}" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <div style="font-size:${mobile?'13px':'12px'}; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</div>
        `;
        el.onclick = () => { currentFolderId = f.id; renderFiles(); };
        if (mobile) {
            let pressTimer;
            el.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    const action = prompt(`"${f.name}" 폴더 관리:\n1. 이름 변경\n2. 색상 변경\n3. 삭제\n번호 입력:`);
                    if (action === '1') {
                        const newName = prompt('새 이름:', f.name);
                        if (newName) { f.name = newName; saveData(); renderFiles(); }
                    } else if (action === '2') {
                        const c = prompt('색상 코드:', f.color);
                        if (c) { f.color = c; saveData(); renderFiles(); }
                    } else if (action === '3') {
                        if(confirm('삭제하시겠습니까?')) {
                            folders = folders.filter(x => x.id !== f.id);
                            saveData();
                            renderFiles();
                        }
                    }
                }, 500);
            });
            el.addEventListener('touchend', () => clearTimeout(pressTimer));
            el.addEventListener('touchmove', () => clearTimeout(pressTimer));
        } else {
            el.oncontextmenu = (e) => {
                e.preventDefault();
                const res = prompt(`[${f.name}] 관리\n1. 이름 변경\n2. 색상 변경\n3. 삭제\n번호 입력:`);
                if (res === '1') {
                    const newName = prompt('새 이름:', f.name);
                    if (newName) { f.name = newName; saveData(); renderFiles(); }
                } else if (res === '2') {
                    const c = prompt('색상 코드:', f.color);
                    if (c) { f.color = c; saveData(); renderFiles(); }
                } else if (res === '3') {
                    if(confirm('삭제합니까?')) { folders = folders.filter(x => x.id !== f.id); saveData(); renderFiles(); }
                }
            };
        }
        list.appendChild(el);
    });

    const tFiles = savedNovels.filter(n => n.folderId === currentFolderId);
    if(tFiles.length === 0 && tFolders.length === 0) list.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:${mobile?'40px 20px':'20px'}; font-size:${mobile?'15px':'14px'};">파일 없음</div>`;

    tFiles.forEach(n => {
        const el = document.createElement('div');
        el.className = 'f-card';
        el.innerHTML = `
            <div style="font-size:${mobile?'36px':'32px'}; position:relative;">📄${n.bookmark != null ? '<span style="position:absolute;bottom:0;right:0;font-size:' + (mobile?'18px':'16px') + ';">🔖</span>' : ''}</div>
            <div style="font-size:${mobile?'12px':'11px'}; margin-top:4px; height:2.4em; overflow:hidden; line-height:1.2; color:#374151;">${n.fileName}</div>
        `;
        el.onclick = () => openNovel(n);
        
        const manageFile = (isTouch) => {
            const options = ['1. 폴더로 이동', '2. 삭제'];
            const action = prompt(`"${n.fileName}" 관리:\n${options.join('\n')}\n번호 입력:`);
            if (action === '1') {
                const folderList = folders.map((f, idx) => `${idx+1}. ${f.name}`).join('\n');
                if(folders.length === 0) { alert('폴더가 없습니다.'); return; }
                const folderChoice = prompt(`폴더 선택:\n0. 폴더에서 빼기\n${folderList}\n번호 입력:`);
                const folderIdx = parseInt(folderChoice);
                if (folderChoice === '0') { moveNovelToFolder(n.fileName, null); renderFiles(); }
                else if (!isNaN(folderIdx) && folderIdx > 0 && folderIdx <= folders.length) {
                    moveNovelToFolder(n.fileName, folders[folderIdx-1].id);
                    renderFiles();
                }
            } else if (action === '2') {
                if(confirm(`"${n.fileName}"을((를) 삭제하시겠습니까?`)) { deleteNovel(n.fileName); renderFiles(); }
            }
        };

        if (mobile) {
            let pressTimer;
            el.addEventListener('touchstart', () => { pressTimer = setTimeout(() => manageFile(true), 500); });
            el.addEventListener('touchend', () => clearTimeout(pressTimer));
            el.addEventListener('touchmove', () => clearTimeout(pressTimer));
        } else {
            el.oncontextmenu = (e) => { e.preventDefault(); manageFile(false); };
        }
        list.appendChild(el);
    });
}

function setupEvents() {
    const mobile = isMobile();
    
    // Update config helpers
    const set = (k, v) => {
        globalConf[k] = v;
        saveSettings();
        const keyMap = { fs: 'fontSize', lh: 'lineHeight', ls: 'letterSpacing', font: 'fontFamily', brightness: 'pageBrightness', fw: 'fontWeight' };
        if (typeof setArg === 'function' && keyMap[k]) setArg(`${PLUGIN_NAME}::${keyMap[k]}`, v);
        if(document.getElementById('reader-view').style.display !== 'none') renderPage();
    };

    document.getElementById('close-btn').onclick = () => {
        viewerWindow.remove();
        if(keydownHandler) document.removeEventListener('keydown', keydownHandler);
    };
    
    document.getElementById('home-btn').onclick = () => {
        document.getElementById('reader-view').style.display = 'none';
        document.getElementById('home-view').style.display = 'flex';
        document.getElementById('url-text').textContent = 'New Tab';
        currentFileName = '';
    };
    
    if (!mobile) {
        document.getElementById('full-btn').onclick = () => {
            isFullscreen = !isFullscreen;
            const v = document.getElementById('chat-novel-viewer');
            v.style.width = isFullscreen?'100vw':(globalConf.mode?'1200px':'900px');
            v.style.height = isFullscreen?'100vh':'85vh';
            v.style.borderRadius = isFullscreen?'0':'12px';
        };
    }

    document.getElementById('menu-btn').onclick = (e) => {
        e.stopPropagation();
        if (mobile) {
            const modal = document.getElementById('settings-modal');
            modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        } else {
            const m = document.getElementById('settings-menu');
            m.style.display = m.style.display === 'block' ? 'none' : 'block';
        }
    };

    if (mobile) {
        document.getElementById('close-modal').onclick = () => document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('settings-modal').onclick = (e) => { if (e.target.id === 'settings-modal') e.target.style.display = 'none'; };
    } else {
        document.addEventListener('click', (e) => {
            const m = document.getElementById('settings-menu');
            if(m && m.style.display==='block' && !m.contains(e.target) && e.target.id!=='menu-btn') m.style.display='none';
        });
    }

    // Color Pickers
    document.querySelectorAll('.h-c').forEach(c => c.onclick = () => {
        const color = c.dataset.c;
        globalConf.header = color;
        saveSettings();
        if (typeof setArg === 'function') setArg(`${PLUGIN_NAME}::headerColor`, color);
        document.getElementById('cnv-header').style.background = color;
        const isDark = ['#1f2937', '#1e3a8a', '#374151', '#7f1d1d', '#831843', '#7c2d12', '#581c87', '#065f46', '#b91c1c'].includes(color);
        const txt = isDark ? '#ffffff' : '#374151';
        document.getElementById('url-text').style.color = txt;
        document.getElementById('menu-btn').style.color = txt;
    });

    document.querySelectorAll('.p-c').forEach(c => c.onclick = () => {
        set('bg', c.dataset.c);
        if (typeof setArg === 'function') setArg(`${PLUGIN_NAME}::pageColor`, c.dataset.c);
        document.getElementById('cnv-body').style.background = c.dataset.c;
    });

    // Inputs
    const bindInput = (id, key, suffix='', onInput=null, onChange=null) => {
        const el = document.getElementById(id);
        const display = document.getElementById(id.replace('i-','d-'));
        if(!el) return;
        el.oninput = (e) => {
            const v = e.target.value;
            if(display) display.textContent = v + suffix;
            if(onInput) onInput(v);
        };
        el.onchange = (e) => {
            if(onChange) onChange(e.target.value);
            else set(key, e.target.value);
        };
    };

    bindInput('i-brightness', 'brightness', '%', (v) => {
        globalConf.brightness = v;
        document.getElementById('cnv-body').style.filter = `brightness(${v}%)`;
    }, (v) => {
        set('brightness', v);
    });

    bindInput('i-fs', 'fs', 'px', null, (v) => {
        const val = parseInt(v);
        globalConf.fs = val;
        saveSettings();
        if (typeof setArg === 'function') setArg(`${PLUGIN_NAME}::fontSize`, val);
        if (currentNovelContent && document.getElementById('reader-view').style.display !== 'none') {
            const currentText = currentPages[currentPageIndex] ? currentPages[currentPageIndex].substring(0, 50) : '';
            const limit = calculatePageLimit(globalConf.words, val);
            createPages(currentNovelContent, limit);
            if (currentText) {
                const newIdx = currentPages.findIndex(p => p.includes(currentText));
                if (newIdx !== -1) currentPageIndex = newIdx;
            }
            if (currentPageIndex >= currentPages.length) currentPageIndex = Math.max(0, currentPages.length - 1);
            renderPage();
            updateBookmark();
            updateSlider();
        }
    });

    bindInput('i-lh', 'lh', '%');
    bindInput('i-ls', 'ls', 'px');

    document.getElementById('i-fw').onchange = (e) => set('fw', e.target.value);

    document.getElementById('i-font').onchange = (e) => set('font', e.target.value);

    document.getElementById('i-words').onchange = (e) => {
        const newWords = parseInt(e.target.value);
        globalConf.words = newWords;
        saveSettings();
        if (typeof setArg === 'function') setArg(`${PLUGIN_NAME}::wordsPerPage`, newWords);
        if(currentNovelContent && document.getElementById('reader-view').style.display !== 'none') {
            const currentText = currentPages[currentPageIndex] ? currentPages[currentPageIndex].substring(0, 50) : '';
            const limit = calculatePageLimit(newWords, globalConf.fs);
            createPages(currentNovelContent, limit);
            if (currentText) {
                const newIdx = currentPages.findIndex(p => p.includes(currentText));
                if (newIdx !== -1) currentPageIndex = newIdx;
            }
            if (currentPageIndex >= currentPages.length) currentPageIndex = Math.max(0, currentPages.length - 1);
            renderPage();
            updateBookmark();
            updateSlider();
        }
    };

    if (!mobile && document.getElementById('mode-btn')) {
        document.getElementById('mode-btn').onclick = () => {
            globalConf.mode = !globalConf.mode;
            saveSettings();
            if (typeof setArg === 'function') setArg(`${PLUGIN_NAME}::twoPageMode`, globalConf.mode.toString());
            
            // UI Update
            document.getElementById('mode-btn').innerHTML = `📖 ${globalConf.mode?'두 페이지':'한 페이지'}`;
            const v = document.getElementById('chat-novel-viewer');
            if(!isFullscreen) v.style.width = globalConf.mode ? '1200px' : '900px';
            renderPage();
        };
    }

    document.getElementById('file-open').onclick = () => document.getElementById('h-file').click();
    document.getElementById('h-file').onchange = async (e) => {
        const f = e.target.files[0];
        if(!f) return;
        const t = await f.text();
        let content = t;
        if (f.name.endsWith('.json')) content = processJsonChat(JSON.parse(t));
        else content = processTextChat(t);
        saveNovel(f.name, content, null, currentFolderId);
        renderFiles();
    };
    
    document.getElementById('folder-new').onclick = () => {
        const n = prompt('폴더 이름:');
        if(n) { createFolder(n); renderFiles(); }
    };

    document.getElementById('nav-back').onclick = () => moveToPrevPage();
    document.getElementById('nav-fwd').onclick = () => moveToNextPage();
    
    document.getElementById('bm-btn').onclick = () => {
        const n = savedNovels.find(x => x.fileName === currentFileName);
        if(n) {
            if(n.bookmark === currentPageIndex) removeBookmark(currentFileName);
            else saveBookmark(currentFileName, currentPageIndex);
            updateBookmark();
        }
    };

    // Seek bar toggle
    document.getElementById('seek-toggle-btn').onclick = () => {
        const bar = document.getElementById('bottom-seek-bar');
        if (bar.style.display === 'none') bar.style.display = 'block';
        else bar.style.display = 'none';
    };

    // Slider
    const slider = document.getElementById('page-slider');
    slider.oninput = (e) => {
        currentPageIndex = parseInt(e.target.value);
        renderPage();
        updateBookmark();
    };

    // Scroll buttons (Hold, Double Click)
    const scrollAmount = 50;
    const getScrollElements = () => {
        if (globalConf.mode && !mobile) return [document.getElementById('page-left'), document.getElementById('page-right')];
        return [document.getElementById('page-single')];
    };

    const setupScrollBtn = (id, direction) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        let interval;
        const scroll = () => {
            getScrollElements().forEach(el => { if(el) el.scrollTop += (direction * scrollAmount); });
        };
        
        // Click
        btn.onclick = () => scroll();
        
        // Double Click (Fast Scroll - Smooth)
        btn.ondblclick = () => {
            getScrollElements().forEach(el => { 
                if(el) el.scrollTo({
                    top: el.scrollTop + (direction * scrollAmount * 10),
                    behavior: 'smooth'
                }); 
            });
        };

        // Hold
        const start = (e) => {
            if(e.type==='touchstart') e.preventDefault();
            interval = setInterval(scroll, 50);
        };
        const end = () => clearInterval(interval);

        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
        btn.addEventListener('touchstart', start);
        btn.addEventListener('touchend', end);
    };

    setupScrollBtn('scroll-up', -1);
    setupScrollBtn('scroll-down', 1);

    if (!mobile) {
        if(keydownHandler) document.removeEventListener('keydown', keydownHandler);
        keydownHandler = (e) => {
            if(!viewerWindow) return;
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            if(document.getElementById('reader-view').style.display !== 'none') {
                if(e.key==='ArrowLeft') { e.preventDefault(); moveToPrevPage(); }
                if(e.key==='ArrowRight') { e.preventDefault(); moveToNextPage(); }
                
                if(e.key==='ArrowUp') {
                    e.preventDefault();
                    getScrollElements().forEach(el => { if (el) el.scrollTop -= scrollAmount; });
                }
                if(e.key==='ArrowDown') {
                    e.preventDefault();
                    getScrollElements().forEach(el => { if (el) el.scrollTop += scrollAmount; });
                }
            }
            if(e.key==='Escape') viewerWindow.remove();
        };
        document.addEventListener('keydown', keydownHandler);
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(addFloatingButton, 500));
else setTimeout(addFloatingButton, 500);