-- ============================================================
--  ⚡ GigaTrans — manual 트리거 전용 (onButtonClick)
--  risu-btn 클릭 시 이 트리거만 onButtonClick을 정의
-- ============================================================

local TAG_OPEN  = '<GigaTrans>'
local TAG_CLOSE = '</GigaTrans>'
local TAG_PAT   = '<GigaTrans>(.-)</GigaTrans>'
local CTRL_TAG  = '<GT-CTRL/>'
local CTRL_PAT  = '<GT%-CTRL/>'

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
--  Lorebook preset matching
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
  js = js:gsub('%(%?:', '(')
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
  js = js:gsub('\\|', '|')
  js = js:gsub('%{%d+,%d*%}', '*')
  return js
end

-- 마커 모드: "시작→끝" → Lua 패턴
local function markerToLua(marker)
  local s, e = marker:match('^(.-)→(.+)$')
  if not s or not e then
    s = marker
    e = nil
  end
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
      pats[#pats + 1] = p
    end
  end
  return pats
end

-- 커스텀 패턴으로 블록 추출
local function extractByPatterns(body, patterns, target)
  for _, pat in ipairs(patterns) do
    local count = 0
    while true do
      local ok, match = pcall(string.match, body, '(' .. pat .. ')')
      if not ok or not match then break end
      count = count + 1
      target[#target + 1] = match
      local ok2, result = pcall(string.gsub, body, pat, '', 1)
      if ok2 then
        body = result
      else break end
      if count > 50 then break end
    end
  end
  return body
end

local function extractProtected(text, tid)
  local head, tail = {}, {}
  local body = text

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

  for b in body:gmatch('<details class="hidden%-story">.-</details>') do
    head[#head + 1] = b
  end
  body = body:gsub('<details class="hidden%-story">.-</details>', '')

  -- 커스텀 헤드 패턴
  if tid then
    local mode = getGlobalVar(tid, 'toggle_gigatrans.pat_mode') or '마커'
    local headPat = getGlobalVar(tid, 'toggle_gigatrans.head_pat') or ''
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

  local parts = {}
  for _, h in ipairs(head) do parts[#parts + 1] = h end
  parts[#parts + 1] = tr
  parts[#parts + 1] = TAG_OPEN
  parts[#parts + 1] = body
  parts[#parts + 1] = TAG_CLOSE
  for _, t in ipairs(tail) do parts[#parts + 1] = t end
  parts[#parts + 1] = CTRL_TAG

  local final = table.concat(parts, '\n')
  final = final:gsub(CTRL_PAT, '')
  final = final .. '\n' .. CTRL_TAG
  gtlog(tid, 'translate.beforeSetChat', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx) .. ' finalLen=' .. tostring(safeLen(final)))
  setChat(tid, idx, final)
  gtlog(tid, 'translate.afterSetChat', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(idx))
  return true
end

-- ============================================================
--  onButtonClick — manual translate / retranslate
-- ============================================================

onButtonClick = async(function(tid, code)
  local rid = nextReqId()
  gtlog(tid, 'manual.click', 'rid=' .. tostring(rid) .. ' code=' .. tostring(code))

  local targetIdx = nil
  if type(code) == 'string' then
    local parsedIdx = code:match('^gt__re::(-?%d+)$')
    if parsedIdx then
      targetIdx = tonumber(parsedIdx)
      code = 'gt__re'
    end
  end

  if code == 'gt__re' or code == '⚡ 번역하기' then
    if isLocked(tid) then
      gtlog(tid, 'manual.reject', 'rid=' .. tostring(rid) .. ' reason=locked')
      alertError(tid, '이미 번역 중입니다')
      return
    end

    local len = getChatLength(tid)
    if len <= 0 then
      gtlog(tid, 'manual.empty', 'rid=' .. tostring(rid))
      alertError(tid, '번역할 메시지가 없습니다')
      return
    end

    if targetIdx ~= nil then
      gtlog(tid, 'manual.requested_target', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx))
      local m = getChat(tid, targetIdx)
      if m and m.role == 'char' then
        gtlog(tid, 'manual.target', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx) .. ' dataLen=' .. tostring(safeLen(m.data or '')))
        setLock(tid, true, { rid = rid, idx = targetIdx, why = 'manual' })
        gtlog(tid, 'manual.locked', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx))
        local success, ok, err = pcall(translateAt, tid, targetIdx, rid)
        setLock(tid, false, { rid = rid, idx = targetIdx, why = 'manual_done' })
        if not success then ok, err = false, tostring(ok) end
        if ok then
          gtlog(tid, 'manual.done', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx))
        else
          gtlog(tid, 'manual.fail', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx) .. ' err=' .. tostring(err))
          alertError(tid, '번역 실패: ' .. tostring(err))
        end
        reloadDisplay(tid)
        return
      end
      gtlog(tid, 'manual.target_miss', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(targetIdx) .. ' reason=not_char_or_missing')
    end

    for i = len - 1, 0, -1 do
      local m = getChat(tid, i)
      if m and m.role == 'char' then
        gtlog(tid, 'manual.target', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(i) .. ' dataLen=' .. tostring(safeLen(m.data or '')))
        setLock(tid, true, { rid = rid, idx = i, why = 'manual' })
        gtlog(tid, 'manual.locked', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(i))
        local success, ok, err = pcall(translateAt, tid, i, rid)
        setLock(tid, false, { rid = rid, idx = i, why = 'manual_done' })
        if not success then ok, err = false, tostring(ok) end
        if ok then
          gtlog(tid, 'manual.done', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(i))
        else
          gtlog(tid, 'manual.fail', 'rid=' .. tostring(rid) .. ' idx=' .. tostring(i) .. ' err=' .. tostring(err))
          alertError(tid, '번역 실패: ' .. tostring(err))
        end
        reloadDisplay(tid)
        return
      end
    end

    gtlog(tid, 'manual.no_char', 'rid=' .. tostring(rid))
    alertError(tid, '어시스턴트 메시지를 찾을 수 없습니다')
  end
end)
