-- ============================================================
--  ⚡ GigaTrans — 영출 번역 모듈
--  output 트리거 + manual 트리거 공유 코드
-- ============================================================

local TAG_OPEN  = '<GigaTrans>'
local TAG_CLOSE = '</GigaTrans>'
local TAG_PAT   = '<GigaTrans>(.-)</GigaTrans>'
local CTRL_TAG  = '<GT-CTRL/>'
local CTRL_PAT  = '<GT%-CTRL/>'  -- gsub용 이스케이프 패턴


local PROTECTED_TAGS = {
  'Thoughts', 'Before_Response', 'memo', 'RP%-Guide',
  'Metatron', 'CMLS', 'WorldManager', 'Prototype', 'Fold'
}

local RETRYABLE = {
  [429]=true,[500]=true,[502]=true,[503]=true,
  [504]=true,[522]=true,[524]=true,[525]=true
}
local FATAL = {
  'model_not_supported','model_not_found','invalid_api_key',
  'authentication','unauthorized','forbidden','invalid_request',
  'billing','quota_exceeded','permission',
}
local MAX_RETRY = 5

local LOCK_KEY = '__gt_busy'
local LOCK_RID_KEY = '__gt_busy_rid'
local LOCK_IDX_KEY = '__gt_busy_idx'
local LOCK_AT_KEY = '__gt_busy_at'
local LOCK_WHY_KEY = '__gt_busy_why'
local LOCK_TTL_SEC = 180
local reqSeq = 0
local setLock

local function nextReqId()
  reqSeq = reqSeq + 1
  return tostring(os.time()) .. '-' .. tostring(reqSeq)
end

local function safeLen(v)
  if type(v) == 'string' then return #v end
  return 0
end

local function bool01(v)
  return v and '1' or '0'
end

local function isBlankVar(v)
  return v == nil or v == '' or v == 'null'
end

local function getLockMeta(tid)
  return {
    busy = getChatVar(tid, LOCK_KEY) or '0',
    rid = getChatVar(tid, LOCK_RID_KEY) or '',
    idx = getChatVar(tid, LOCK_IDX_KEY) or '',
    at = getChatVar(tid, LOCK_AT_KEY) or '',
    why = getChatVar(tid, LOCK_WHY_KEY) or '',
  }
end

local function gtlog(tid, stage, extra)
  local meta = getLockMeta(tid)
  local base = '[GigaTrans][' .. tostring(tid) .. '][' .. stage .. ']'
  local lockInfo =
    ' lock=' .. tostring(meta.busy) ..
    ' rid=' .. tostring(meta.rid) ..
    ' idx=' .. tostring(meta.idx) ..
    ' at=' .. tostring(meta.at) ..
    ' why=' .. tostring(meta.why)

  if extra and extra ~= '' then
    print(base .. lockInfo .. ' ' .. extra)
  else
    print(base .. lockInfo)
  end
end

-- Cross-engine shared lock via chatVar
local function isLocked(tid)
  local busy = getChatVar(tid, LOCK_KEY)
  if busy ~= '1' then return false end

  local rid = getChatVar(tid, LOCK_RID_KEY)
  local idx = getChatVar(tid, LOCK_IDX_KEY)
  local atRaw = getChatVar(tid, LOCK_AT_KEY)
  local why = getChatVar(tid, LOCK_WHY_KEY)

  if isBlankVar(rid) or isBlankVar(idx) or isBlankVar(atRaw) or isBlankVar(why) then
    gtlog(tid, 'lock.recover', 'reason=orphan_metadata')
    setLock(tid, false)
    return false
  end

  local atNum = tonumber(atRaw)
  if not atNum then
    gtlog(tid, 'lock.recover', 'reason=bad_timestamp raw=' .. tostring(atRaw))
    setLock(tid, false)
    return false
  end

  local age = os.time() - atNum
  if age > LOCK_TTL_SEC then
    gtlog(tid, 'lock.recover', 'reason=stale age=' .. tostring(age))
    setLock(tid, false)
    return false
  end

  return true
end
setLock = function(tid, val, meta)
  meta = meta or {}
  setChatVar(tid, LOCK_KEY, val and '1' or '0')
  if val then
    setChatVar(tid, LOCK_RID_KEY, tostring(meta.rid or ''))
    setChatVar(tid, LOCK_IDX_KEY, tostring(meta.idx or ''))
    setChatVar(tid, LOCK_AT_KEY, tostring(os.time()))
    setChatVar(tid, LOCK_WHY_KEY, tostring(meta.why or ''))
  else
    setChatVar(tid, LOCK_RID_KEY, '')
    setChatVar(tid, LOCK_IDX_KEY, '')
    setChatVar(tid, LOCK_AT_KEY, '')
    setChatVar(tid, LOCK_WHY_KEY, '')
  end
end

-- ============================================================
--  Toggle helpers
-- ============================================================

local function tog(tid, key)
  return getGlobalVar(tid, 'toggle_' .. key) or ''
end
local function togOn(tid, key)
  return tog(tid, key) == '1'
end
local function togNum(tid, key)
  return tonumber(tog(tid, key)) or 0
end
local function togText(tid, key)
  local v = tog(tid, key)
  if v == '' or v == 'null' then return nil end
  return v
end

-- ============================================================
--  Lorebook preset matching (삽화 모듈 패턴)
-- ============================================================

local function getPriorityLoreBook(tid, comment)
  local books = getLoreBooks(tid, comment)
  if not books or #books == 0 then return nil end
  table.sort(books, function(a, b)
    return (a.insertorder or 0) > (b.insertorder or 0)
  end)
  return books[1]
end

-- ============================================================
--  Protected tag handling
-- ============================================================

-- JS 정규식 → Lua 패턴 기본 변환
local function jsToLua(js)
  -- (?:...) 제거 → 내용만
  js = js:gsub('%(%?:', '(')
  -- JS 이스케이프 → Lua 이스케이프
  js = js:gsub('\\%[', '%%[')
  js = js:gsub('\\%]', '%%]')
  js = js:gsub('\\%(', '%%(')
  js = js:gsub('\\%)', '%%)')
  js = js:gsub('\\%.', '%%.')
  js = js:gsub('\\%+', '%%+')
  js = js:gsub('\\%*', '%%*')
  js = js:gsub('\\%-', '%%-')
  js = js:gsub('\\%?', '%%?')
  js = js:gsub('\\%^', '%%^')
  js = js:gsub('\\%$', '%%$')
  js = js:gsub('\\d', '%%d')
  js = js:gsub('\\w', '%%w')
  js = js:gsub('\\s', '%%s')
  js = js:gsub('\\D', '%%D')
  js = js:gsub('\\W', '%%W')
  js = js:gsub('\\S', '%%S')
  -- \| → 리터럴 |
  js = js:gsub('\\|', '|')
  -- {n,m} 수량자 → 제거 (미지원, 경고만)
  js = js:gsub('%{%d+,%d*%}', '*')
  return js
end

-- 마커 모드: "시작→끝" → Lua 패턴
local function markerToLua(marker)
  local s, e = marker:match('^(.-)→(.+)$')
  if not s or not e then
    -- → 없으면 전체를 시작 마커로, 줄 끝까지 매칭
    s = marker
    e = nil
  end
  -- 특수문자 이스케이프
  local function esc(str)
    return str:gsub('([%(%)%.%%%+%-%*%?%[%]%^%$])', '%%%1')
  end
  if e then
    return esc(s) .. '.-' .. esc(e)
  else
    return esc(s) .. '.*'
  end
end

-- 커스텀 패턴 파싱 (;; 구분)
local function parsePatterns(str, mode)
  local pats = {}
  if not str or str == '' then return pats end
  for p in str:gmatch('[^;]+') do
    p = p:gsub('^%s+', ''):gsub('%s+$', '')
    if p ~= '' then
      if mode == '마커' or mode == '0' or mode == '' then
        p = markerToLua(p)
      elseif mode == 'JS변환' or mode == '2' then
        p = jsToLua(p)
      end
      -- mode == 'Lua' or mode == '1': 그대로 사용
      -- Lua 모드: 그대로 사용
      pats[#pats + 1] = p
    end
  end
  return pats
end

-- 커스텀 패턴으로 블록 추출
local function extractByPatterns(body, patterns, target)
  for _, pat in ipairs(patterns) do
    print('[GigaTrans] 패턴 적용: ' .. pat)
    local count = 0
    while true do
      local ok, match = pcall(string.match, body, '(' .. pat .. ')')
      if not ok then
        print('[GigaTrans] 패턴 오류: ' .. tostring(match))
        break
      end
      if not match then break end
      count = count + 1
      target[#target + 1] = match
      local ok2, result = pcall(string.gsub, body, pat, '', 1)
      if ok2 then body = result else break end
      if count > 50 then break end
    end
    if count > 0 then
      print('[GigaTrans] 매칭 ' .. count .. '건 추출')
    else
      print('[GigaTrans] 매칭 실패')
    end
  end
  return body
end

local function extractProtected(text, tid)
  local head, tail = {}, {}
  local body = text

  -- XML-style protected tags → head (Thoughts, Before_Response, etc.)
  for _, tn in ipairs(PROTECTED_TAGS) do
    local clean = tn:gsub('%%%-', '-')
    local closeTag = '</' .. clean .. '>'
    local openPat = '<' .. tn .. '>'
    while true do
      local s = body:find(openPat)
      if not s then break end
      local e = body:find(closeTag, s)
      if not e then break end
      local block = body:sub(s, e + #closeTag - 1)
      head[#head + 1] = block
      body = body:sub(1, s - 1) .. body:sub(e + #closeTag)
    end
  end

  -- hidden-story details → head
  for b in body:gmatch('<details class="hidden%-story">.-</details>') do
    head[#head + 1] = b
  end
  body = body:gsub('<details class="hidden%-story">.-</details>', '')

  -- 커스텀 헤드 패턴
  if tid then
    local mode = getGlobalVar(tid, 'toggle_gigatrans.pat_mode') or '마커'
    local headPat = getGlobalVar(tid, 'toggle_gigatrans.head_pat') or ''
    if headPat ~= '' then
      print('[GigaTrans] 헤드 패턴 모드=' .. mode .. ' 입력=' .. headPat)
    end
    body = extractByPatterns(body, parsePatterns(headPat, mode), head)
  end

  -- LBDATA blocks → tail (--- 구분자 포함)
  while true do
    local s = body:find('%[LBDATA START%]')
    local e = body:find('%[LBDATA END%]')
    if not s or not e then break end
    local blockEnd = e + #'[LBDATA END]' - 1
    local startPos = s
    local before = body:sub(1, s - 1)
    local dashBefore = before:match('%-%-%-[ \t]*\n?$')
    if dashBefore then startPos = s - #dashBefore end
    local after = body:sub(blockEnd + 1)
    local dashAfter = after:match('^[ \t]*\n?%-%-%-')
    local endPos = blockEnd
    if dashAfter then endPos = blockEnd + #dashAfter end
    local block = body:sub(startPos, endPos)
    tail[#tail + 1] = block
    body = body:sub(1, startPos - 1) .. body:sub(endPos + 1)
  end

  -- 커스텀 테일 패턴
  if tid then
    local mode = getGlobalVar(tid, 'toggle_gigatrans.pat_mode') or '마커'
    local tailPat = getGlobalVar(tid, 'toggle_gigatrans.tail_pat') or ''
    if tailPat ~= '' then
      print('[GigaTrans] 테일 패턴 모드=' .. mode .. ' 입력=' .. tailPat)
    end
    body = extractByPatterns(body, parsePatterns(tailPat, mode), tail)
  end

  -- Strip existing GigaTrans/CTRL — 원문 보존
  local gs = body:find(TAG_OPEN, 1, true)
  local ge = body:find(TAG_CLOSE, 1, true)
  if gs and ge then
    local original = body:sub(gs + #TAG_OPEN, ge - 1)
    body = original:gsub('^%s+', ''):gsub('%s+$', '')
  end
  body = body:gsub(CTRL_PAT, '')

  -- head/tail에서도 CTRL 제거
  for i, h in ipairs(head) do head[i] = h:gsub(CTRL_PAT, '') end
  for i, t in ipairs(tail) do tail[i] = t:gsub(CTRL_PAT, '') end

  return body:gsub('^%s+', ''):gsub('%s+$', ''), head, tail
end

-- ============================================================
--  Error classification
-- ============================================================

local function isFatal(msg)
  if not msg then return false end
  local lo = msg:lower()
  for _, p in ipairs(FATAL) do
    if lo:find(p, 1, true) then return true end
  end
  return false
end

local function canRetry(msg)
  if isFatal(msg) then return false end
  local c = msg and msg:match('%((%d%d%d)%)')
  if c then return RETRYABLE[tonumber(c)] == true end
  return true
end

-- ============================================================
--  Prompt building
-- ============================================================

local function getPresetPrompt(tid)
  local presetName = togText(tid, 'gigatrans.preset') or '1'
  local book = getPriorityLoreBook(tid, '번역 ' .. presetName)
  if not book then
    book = getPriorityLoreBook(tid, '번역 1')
  end
  if not book or not book.content or book.content == '' then
    return nil, '프리셋 로어북 "번역 ' .. presetName .. '"을 찾을 수 없습니다.\n모듈 로어북에 "번역 1" 등의 엔트리를 추가하세요.'
  end
  return book.content, nil
end

local function buildContext(tid)
  local n = togNum(tid, 'gigatrans.context')
  if n <= 0 then return '' end

  local len = getChatLength(tid)
  if len <= 1 then return '' end

  local from = math.max(0, len - 1 - n)
  local parts = {}
  for i = from, len - 2 do
    local m = getChat(tid, i)
    if m then
      local r = m.role == 'char' and 'Assistant' or 'User'
      local d = (m.data or '')
      d = d:gsub(TAG_OPEN .. '.-' .. TAG_CLOSE, '')
      d = d:gsub(CTRL_PAT, '')
      d = d:gsub('^%s+', ''):gsub('%s+$', '')
      if d ~= '' then
        parts[#parts + 1] = '[' .. r .. ']: ' .. d
      end
    end
  end
  return table.concat(parts, '\n\n')
end

local function getActiveLore(tid)
  if not togOn(tid, 'gigatrans.lore') then return '' end
  local entries = getLoreBooks(tid, '')
  if not entries or #entries == 0 then return '' end
  local parts = {}
  for _, e in ipairs(entries) do
    if e.content and e.content ~= '' then
      parts[#parts + 1] = e.content
    end
  end
  return #parts > 0 and table.concat(parts, '\n\n---\n\n') or ''
end

local function getAuxValue(tid, toggleKey, lorePrefix)
  if togOn(tid, 'gigatrans.aux_lore') then
    local name = togText(tid, toggleKey) or '1'
    local book = getPriorityLoreBook(tid, lorePrefix .. ' ' .. name)
    if book and book.content and book.content ~= '' then
      return book.content
    end
    return ''
  else
    return togText(tid, toggleKey) or ''
  end
end

local function buildPrompt(tid, input)
  local preset, err = getPresetPrompt(tid)
  if not preset then return nil, err end

  local map = {
    ['{{slot::input}}']   = input,
    ['{{slot::desc}}']    = getDescription(tid) or '',
    ['{{slot::lore}}']    = getActiveLore(tid),
    ['{{slot::context}}'] = buildContext(tid),
    ['{{slot::tnote}}']   = getAuxValue(tid, 'gigatrans.tnote', '번역가의 노트'),
    ['{{slot::glossary}}']= getAuxValue(tid, 'gigatrans.glossary', '용어집'),
  }

  local pr = preset
  local hasInput = false
  for ph, val in pairs(map) do
    if pr:find(ph, 1, true) then
      if ph == '{{slot::input}}' then hasInput = true end
      pr = pr:gsub(ph, function() return val end)
    end
  end
  if not hasInput then
    pr = pr .. '\n\n' .. input
  end

  return pr, nil
end

-- ============================================================
--  LLM call with retry
-- ============================================================

local function callTranslate(tid, input, rid)
  local prompt, err = buildPrompt(tid, input)
  if not prompt then return nil, err end

  local msgs = { { role = 'user', content = prompt } }
  local lastErr
  gtlog(tid, 'llm.prepare', 'rid=' .. tostring(rid) .. ' inputLen=' .. tostring(safeLen(input)) .. ' promptLen=' .. tostring(safeLen(prompt)))

  for attempt = 0, MAX_RETRY do
    gtlog(tid, 'llm.call', 'rid=' .. tostring(rid) .. ' attempt=' .. tostring(attempt))
    local r = axLLM(tid, msgs, false)
    gtlog(
      tid,
      'llm.done',
      'rid=' .. tostring(rid) ..
      ' attempt=' .. tostring(attempt) ..
      ' success=' .. bool01(r and r.success) ..
      ' resultLen=' .. tostring(safeLen(r and r.result))
    )
    if r and r.success then
      local text = (r.result or ''):gsub('^%s+', ''):gsub('%s+$', '')
      -- 번역 모델이 재현한 제어 태그 제거
      text = text:gsub(CTRL_PAT, ''):gsub(TAG_OPEN, ''):gsub(TAG_CLOSE, '')
      return text, nil
    end
    lastErr = (r and r.result) or 'Unknown error'
    if not canRetry(lastErr) then return nil, lastErr end
  end

  return nil, lastErr
end

-- ============================================================
--  Core: translate message at index
-- ============================================================

local function translateAt(tid, idx, rid)
  local m = getChat(tid, idx)
  if not m then return false, 'No message at index ' .. tostring(idx) end
  if m.role ~= 'char' then return false, 'Not an assistant message' end

  gtlog(tid, 'translate.enter', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' dataLen=' .. tostring(safeLen(m.data or '')))
  local body, head, tail = extractProtected(m.data or '', tid)
  if body == '' then return false, 'Empty message body' end
  gtlog(tid, 'translate.extracted', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' bodyLen=' .. tostring(safeLen(body)) .. ' head=' .. tostring(#head) .. ' tail=' .. tostring(#tail))

  local tr, err = callTranslate(tid, body, rid)
  if not tr then return false, err end

  -- Layout: head → translation → <GigaTrans>original</GigaTrans> → tail → CTRL
  local parts = {}
  for _, h in ipairs(head) do parts[#parts + 1] = h end
  parts[#parts + 1] = tr
  parts[#parts + 1] = TAG_OPEN
  parts[#parts + 1] = body
  parts[#parts + 1] = TAG_CLOSE
  for _, t in ipairs(tail) do parts[#parts + 1] = t end
  parts[#parts + 1] = CTRL_TAG

  local final = table.concat(parts, '\n')
  -- 방어: CTRL 중복 제거 후 1개만 유지
  final = final:gsub(CTRL_PAT, '')
  final = final .. '\n' .. CTRL_TAG
  gtlog(tid, 'translate.beforeSetChat', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' finalLen=' .. tostring(safeLen(final)))
  setChat(tid, idx, final)
  gtlog(tid, 'translate.afterSetChat', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx))
  return true
end

-- ============================================================
--  Translate with duplicate guard
-- ============================================================

local function guardedTranslate(tid, idx, rid)
  rid = rid or nextReqId()
  gtlog(tid, 'guard.enter', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx))
  if isLocked(tid) then
    gtlog(tid, 'guard.reject', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' reason=locked')
    return false, '이미 번역 중입니다'
  end
  setLock(tid, true, { rid = rid, idx = idx, why = 'guardedTranslate' })
  gtlog(tid, 'guard.locked', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx))
  local success, ok, err = pcall(translateAt, tid, idx, rid)
  setLock(tid, false, { rid = rid, idx = idx, why = 'guardedTranslate_done' })  -- pcall 덕분에 에러 시에도 반드시 해제
  if not success then
    -- translateAt이 Lua 에러를 throw한 경우
    gtlog(tid, 'guard.throw', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' err=' .. tostring(ok))
    return false, tostring(ok)
  end
  gtlog(tid, 'guard.done', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' ok=' .. bool01(ok) .. ' err=' .. tostring(err))
  return ok, err
end

-- ============================================================
--  CTRL tag injection
-- ============================================================

local function injectCtrl(tid, idx)
  local m = getChat(tid, idx)
  if not m or m.role ~= 'char' then return end

  local data = m.data or ''
  if data:find(CTRL_TAG, 1, true) then
    gtlog(tid, 'ctrl.skip', 'idx=' .. tostring(idx) .. ' reason=already_present')
    return
  end

  gtlog(tid, 'ctrl.inject', 'idx=' .. tostring(idx) .. ' dataLen=' .. tostring(safeLen(data)))
  setChat(tid, idx, data .. '\n' .. CTRL_TAG)
end

-- ============================================================
--  listenEdit('editRequest') — reverse mode context swap
-- ============================================================

listenEdit('editRequest', function(tid, data, meta)
  if type(data) ~= 'table' then return data end
  local rev = togOn(tid, 'gigatrans.reverse')
  gtlog(tid, 'edit.enter', 'rev=' .. bool01(rev) .. ' items=' .. tostring(#data))

  for _, msg in ipairs(data) do
    if msg.content and type(msg.content) == 'string'
       and msg.content:find(TAG_OPEN, 1, true) then

      local s = msg.content:find(TAG_OPEN, 1, true)
      local e = msg.content:find(TAG_CLOSE, 1, true)
      if s and e then
        gtlog(tid, 'edit.swap', 'rev=' .. bool01(rev) .. ' contentLen=' .. tostring(safeLen(msg.content)))
        local original = msg.content:sub(s + #TAG_OPEN + 1, e - 1)
        local beforeGT = msg.content:sub(1, s - 1)   -- head tags + translation
        local afterGT  = msg.content:sub(e + #TAG_CLOSE) -- tail blocks + CTRL

        if rev then
          -- Reverse: remove <GigaTrans>block, keep head + translation + tail
          msg.content = beforeGT .. afterGT
        else
          -- Normal: keep head tags, replace translation with original
          -- Extract head tags from beforeGT, discard translation text
          local headParts = {}
          local temp = beforeGT
          for _, tn in ipairs(PROTECTED_TAGS) do
            local clean = tn:gsub('%%%-', '-')
            local openTag = '<' .. clean .. '>'
            local closeTag = '</' .. clean .. '>'
            while true do
              local ts = temp:find(openTag, 1, true)
              if not ts then break end
              local te = temp:find(closeTag, ts, true)
              if not te then break end
              headParts[#headParts + 1] = temp:sub(ts, te + #closeTag - 1)
              temp = temp:sub(1, ts - 1) .. temp:sub(te + #closeTag)
            end
          end
          -- Reconstruct: head tags + original + tail
          local result = table.concat(headParts, '\n')
          if #headParts > 0 then result = result .. '\n' end
          msg.content = result .. original .. afterGT
        end
      end
    end
    -- Clean CTRL tag
    if msg.content then
      msg.content = msg.content:gsub(CTRL_PAT, '')
    end
  end

  return data
end)

-- ============================================================
--  onOutput — auto CTRL injection + optional auto-translate
-- ============================================================

onOutput = async(function(tid)
  local rid = nextReqId()
  local len = getChatLength(tid)
  gtlog(tid, 'onOutput.enter', 'rid=' .. tostring(rid) .. ' len=' .. tostring(len))
  if len <= 0 then return end

  local lastIdx = len - 1
  local m = getChat(tid, lastIdx)
  if not m or m.role ~= 'char' then
    gtlog(tid, 'onOutput.skip', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(lastIdx) .. ' reason=not_char')
    return
  end
  gtlog(
    tid,
    'onOutput.last',
    'rid=' .. tostring(rid) ..
    ' idx=' .. tostring(lastIdx) ..
    ' hasGT=' .. bool01((m.data or ''):find(TAG_OPEN, 1, true) ~= nil) ..
    ' hasCTRL=' .. bool01((m.data or ''):find(CTRL_TAG, 1, true) ~= nil) ..
    ' dataLen=' .. tostring(safeLen(m.data or ''))
  )

  if togOn(tid, 'gigatrans.auto') then
    if not (m.data or ''):find(TAG_OPEN, 1, true) then
      local ok, err = guardedTranslate(tid, lastIdx, rid)
      if not ok and err then
        gtlog(tid, 'onOutput.fail', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(lastIdx) .. ' err=' .. tostring(err))
        alertError(tid, '⚡ 자동번역 실패: ' .. tostring(err))
        injectCtrl(tid, lastIdx)
      end
      return
    end
  end

  injectCtrl(tid, lastIdx)
end)

-- onButtonClick은 trigger_1_0.lua (manual 트리거)에서만 정의
-- risu-btn이 모든 triggerlua의 onButtonClick을 호출하므로
-- 여기서 정의하면 이중 실행됨
