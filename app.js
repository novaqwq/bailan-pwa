// app.js - 摆烂导师 PWA 主程序
;(function() {
  'use strict'

  const { getRecords, saveAllRecords, saveRecord, deleteRecord,
          getUserInfo, saveUserInfo, getFavorites, saveFavorites,
          formatDate } = Storage
  const { generateReview, generateAcademicAnswer, generateFunnyQuestion,
          getRandomQuestion, RANK_COMMENTS, AI_CONFIG, setApiKey } = AI

  // ===== Rank System =====
  const RANK_LIST = [
    { name: '摸鱼学徒', emoji: '\u{1F3A3}', color: '#90EE90', minCount: 0, sequence: 9 },
    { name: '拖延者', emoji: '\u23F3', color: '#6A5ACD', minCount: 2, sequence: 8 },
    { name: '卧龙', emoji: '\u{1F409}', color: '#2E8B57', minCount: 5, sequence: 7 },
    { name: '咸鱼', emoji: '\u{1F41F}', color: '#4169E1', minCount: 9, sequence: 6 },
    { name: '摆烂大师', emoji: '\u{1FA86}', color: '#C23152', minCount: 14, sequence: 5 },
    { name: '怠惰主教', emoji: '\u{1F56F}', color: '#8B008B', minCount: 20, sequence: 4 },
    { name: '隐于市', emoji: '\u{1F32B}', color: '#7F8C8D', minCount: 28, sequence: 3 },
    { name: '查无此人', emoji: '\u{1F573}', color: '#2C3E50', minCount: 38, sequence: 2 },
    { name: '观棋者', emoji: '\u{1F441}', color: '#9B59B6', minCount: 50, sequence: 1 },
    { name: '烂柯人', emoji: '\u265F', color: '#FFD700', minCount: 65, sequence: 0 }
  ]

  const RANK_DESC = {
    '摸鱼学徒': '刚踏入摆烂之道的学徒，每日摸鱼不得低于清醒时长的一半。这是所有摆烂人的起点，从这里开始，你将学会如何在忙碌的世界中找到属于自己的慵懒角落。',
    '拖延者': '明天再说吧——刀砍在身上都等会儿再流血。拖延不是懒惰，而是一种生活艺术。你已经开始掌握摆烂的精髓：把今天的事留给明天，把明天的事留给后天。',
    '卧龙': '躺着的龙，草堂春睡足，窗外日迟迟。小心三顾茅庐。你已经达到了卧龙境界，躺得如此安详，如此从容。但记住，真正的卧龙从不主动出山。',
    '咸鱼': '咸鱼翻身？不存在的。但每日可爆发一次，翻完继续躺。你已领悟咸鱼的至高境界：不是不能翻身，而是不想翻身。偶尔的爆发只是为了证明，我选择躺平。',
    '摆烂大师': '大师级摆烂！拒绝足以改变命运的机会，且毫不后悔。你已超脱凡俗，面对诱惑心如止水。升职加薪？不感兴趣。人生巅峰？不如躺着。',
    '怠惰主教': '半神级别的怠惰，能让敌人十年没用的能力直接失灵。你已接近神明，你的怠惰本身就是一种力量。在你的气场范围内，所有人都会不自觉地想要休息。',
    '隐于市': '大隐隐于市，万人之中待一年，无人记得你的脸。你已融入人群，成为背景的一部分。不是隐身，而是让所有人自动忽略你的存在。这是摆烂的至高境界之一。',
    '查无此人': '无法被占卜、追踪、记录。查无此人，薪照发。你已超越物理存在，成为系统中的一个bug。考勤系统找不到你，但工资照常发放。这是所有打工人的终极梦想。',
    '观棋者': '观棋不语，一观三年。众神俱损，唯观棋者全胜。你已超脱胜负，成为旁观者。看着世人忙碌，你只是静静地看着。时间流逝，唯有你永恒不变。',
    '烂柯人': '序列0！一局观罢，斧柄已烂，沧海桑田，唯你尚存。你已达到摆烂的终极境界。当你回过神来，世界已经变了模样，但你依然在这里，依然摆烂。'
  }

  const SLACKING_TYPES = ['发呆', '睡觉', '打游戏', '摸鱼', '躺平']
  const ENCOURAGE_MSGS = [
    '很棒！休息是人类合法权利',
    '大脑成功充电，允许继续摆烂',
    '这次摆烂，完全不用感到愧疚',
    '恭喜，成功完成一次精神出逃',
    '摆烂进度 +1，你做得很好',
    '今天的摆烂额度已使用，心安理得！'
  ]

  // ===== State =====
  const state = {
    currentPage: 'index',
    showSettings: false,
    // index
    taskText: '', selectedType: '', moodText: '',
    submitting: false, lastReview: '', showPopup: false, popupMessage: '',
    // history
    // certificate
    nickname: '', generating: false, certRevealed: false, certImageURL: '',
    // qa
    currentQuestion: '', customQuestion: '', activeQuestion: '',
    answer: '', answerHtml: '', loading: false,
    isFavorited: false, paperLoading: false, paperAnswer: '', paperAnswerHtml: '',
    showArtifact: false,
    // rank detail (sub-page)
    rankDetailName: null
  }

  // ===== Utility Functions =====
  function $(sel) { return document.querySelector(sel) }
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }

  function calcStats(records) {
    const total = records.length
    const now = new Date()
    const today = now.toDateString()
    const todayCount = records.filter(r => new Date(r.timestamp).toDateString() === today).length

    const monday = new Date(now)
    monday.setHours(0, 0, 0, 0)
    const dayOfWeek = monday.getDay() || 7
    monday.setDate(monday.getDate() - dayOfWeek + 1)
    const weekCount = records.filter(r => new Date(r.timestamp) >= monday).length

    let consecutive = 0
    if (records.length > 0) {
      const sorted = records.slice().sort((a, b) => b.timestamp - a.timestamp)
      const todayDate = new Date(now)
      todayDate.setHours(0, 0, 0, 0)
      const checkDate = new Date(todayDate)
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toDateString()
        if (sorted.some(r => new Date(r.timestamp).toDateString() === dateStr)) {
          consecutive++
          checkDate.setDate(checkDate.getDate() - 1)
        } else break
      }
    }

    const rank = getRank(total)
    return { total, consecutive, rank, todayCount, weekCount }
  }

  function getRank(total) {
    for (let i = 0; i < RANK_LIST.length; i++) {
      if (total >= RANK_LIST[i].minCount) return { ...RANK_LIST[i] }
    }
    return { ...RANK_LIST[0] }
  }

  function showToast(msg) {
    const container = $('#toast')
    container.innerHTML = `<div class="toast">${esc(msg)}</div>`
    setTimeout(() => { container.innerHTML = '' }, 2000)
  }

  function showModal(title, content, onConfirm) {
    const overlay = $('#modal-overlay')
    $('#modal-title').textContent = title
    $('#modal-content').textContent = content
    $('#modal-actions').innerHTML = `
      <button class="modal-btn modal-btn-cancel" id="modal-cancel">取消</button>
      <button class="modal-btn modal-btn-confirm" id="modal-confirm">确认</button>
    `
    overlay.style.display = 'flex'
    $('#modal-cancel').onclick = () => { overlay.style.display = 'none' }
    $('#modal-confirm').onclick = () => { overlay.style.display = 'none'; onConfirm() }
  }

  function parseMarkdown(text) {
    if (!text) return ''
    const lines = text.split('\n')
    const htmlParts = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (/^\|.*\|$/.test(line.trim())) {
        let tableHtml = '<table>'
        let inBody = false
        while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
          const row = lines[i].trim()
          if (/^\|[\s\-:|]+\|$/.test(row)) { inBody = true; i++; continue }
          const cells = row.split('|').slice(1, -1).map(c => c.trim())
          const tag = inBody ? 'td' : 'th'
          const cellHtml = cells.map(c => `<${tag}>${esc(c)}</${tag}>`).join('')
          tableHtml += `<tr>${cellHtml}</tr>`
          i++
        }
        tableHtml += '</table>'
        htmlParts.push(tableHtml)
        continue
      }
      if (/^-\s+/.test(line)) {
        let listHtml = '<ul>'
        while (i < lines.length && /^-\s+/.test(lines[i])) {
          listHtml += `<li>${esc(lines[i].replace(/^-\s+/, ''))}</li>`
          i++
        }
        listHtml += '</ul>'
        htmlParts.push(listHtml)
        continue
      }
      const trimmed = line.trim()
      if (/^[-*_]{3,}$/.test(trimmed)) {
        htmlParts.push('<div class="paper-divider"></div>')
        i++; continue
      }
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const sizes = { 1: '19px', 2: '17px', 3: '15px' }
        const colors = { 1: '#e94560', 2: '#e94560', 3: '#333' }
        htmlParts.push(`<div style="font-size:${sizes[level]};font-weight:bold;color:${colors[level]};padding:8px 0 4px 0;">${esc(headingMatch[2]).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div>`)
        i++; continue
      }
      let processed = esc(line)
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      htmlParts.push(processed)
      i++
    }
    return htmlParts.join('<br>')
  }

  // ===== Router =====
  function navigateTo(page) {
    state.currentPage = page
    state.rankDetailName = null
    render()
    $('#page-container').scrollTop = 0
    updateTabBar()
  }

  function navigateToRankDetail(name) {
    state.rankDetailName = name
    state.currentPage = 'rankDetail'
    render()
    $('#page-container').scrollTop = 0
  }

  function updateTabBar() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      const page = tab.dataset.page
      tab.classList.toggle('active', page === state.currentPage ||
        (state.currentPage === 'rankDetail' && page === 'rank'))
    })
    const tabBar = $('#tab-bar')
    tabBar.style.display = state.currentPage === 'rankDetail' ? 'none' : ''
  }

  function handleHash() {
    const hash = location.hash.replace('#', '') || '/'
    const pageMap = { '/': 'index', '/history': 'history', '/certificate': 'certificate', '/rank': 'rank', '/qa': 'qa' }
    const page = pageMap[hash] || 'index'
    state.currentPage = page
    state.rankDetailName = null
    render()
    updateTabBar()
  }

  // ===== Render Functions =====
  function render() {
    const container = $('#page-container')
    switch (state.currentPage) {
      case 'index': container.innerHTML = renderIndex(); break
      case 'history': container.innerHTML = renderHistory(); break
      case 'certificate': container.innerHTML = renderCertificate(); break
      case 'rank': container.innerHTML = renderRank(); break
      case 'qa': container.innerHTML = renderQA(); break
      case 'rankDetail': container.innerHTML = renderRankDetail(); break
    }
  }

  // --- Index Page ---
  function renderIndex() {
    const records = getRecords()
    const stats = calcStats(records)
    const currentRankIndex = RANK_LIST.findIndex(r => r.name === stats.rank.name)
    const recent = records.slice(-5).reverse()

    console.log('[renderIndex] state.showSettings:', state.showSettings)
    
    const settingsHtml = state.showSettings ? `
      <div class="settings-panel">
        <input type="password" id="api-key-input" placeholder="输入 DeepSeek API Key" value="${esc(AI_CONFIG.API_KEY)}">
        <button class="settings-save-btn" data-action="save-api-key">保存</button>
      </div>
    ` : ''

    const rankStepsHtml = RANK_LIST.map((r, i) => `
      <div class="rank-step ${i <= currentRankIndex ? 'reached' : ''}" data-action="tap-rank" data-name="${r.name}">
        <span class="rank-step-emoji">${r.emoji}</span>
        <span class="rank-step-name" style="color:${r.color}">${r.name}</span>
        <span class="rank-step-days">${r.minCount}次</span>
      </div>
    `).join('')

    const typesHtml = SLACKING_TYPES.map(t => `
      <span class="type-tag ${state.selectedType === t ? 'active' : ''}" data-action="select-type" data-type="${t}">${t}</span>
    `).join('')

    const recentHtml = recent.length > 0 ? `
      <div class="recent-card card">
        <span class="section-title">最近摆烂</span>
        <div class="recent-list">
          ${recent.map(r => `
            <div class="recent-item">
              <div class="recent-item-left">
                ${r.type ? `<span class="recent-type-tag">${esc(r.type)}</span>` : ''}
                <span class="recent-task">${esc(r.task)}</span>
              </div>
              <span class="recent-date">${formatDate(r.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''

    const reviewHtml = state.lastReview ? `
      <div class="result-card card">
        <div class="result-header">
          <span class="result-icon">🤖</span>
          <span class="result-title">好友点评</span>
        </div>
        <div class="result-text">${esc(state.lastReview)}</div>
      </div>
    ` : ''

    const popupHtml = state.showPopup ? `
      <div class="popup-overlay" data-action="close-popup">
        <div class="popup-card" data-action="">
          <span class="popup-emoji">🎉</span>
          <span class="popup-message">${esc(state.popupMessage)}</span>
          <button class="popup-btn" data-action="close-popup">继续摆烂</button>
        </div>
      </div>
    ` : ''

    return `
      ${settingsHtml}
      <div class="settings-bar">
        <button class="settings-btn" data-action="toggle-settings">${state.showSettings ? '收起设置' : 'API 设置'}</button>
      </div>
      <div class="container">
        <div class="status-card card">
          <div class="rank-display">
            <span class="rank-emoji">${stats.rank.emoji}</span>
            <span class="rank-name" style="color:${stats.rank.color}" data-action="tap-rank" data-name="${stats.rank.name}">${stats.rank.name}</span>
          </div>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-num">${stats.todayCount}</span>
              <span class="stat-label">今日摆烂(次)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">${stats.weekCount}</span>
              <span class="stat-label">本周摆烂(次)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">${stats.total}</span>
              <span class="stat-label">累计摆烂(次)</span>
            </div>
          </div>
          <div class="rank-progress">${rankStepsHtml}</div>
        </div>

        <div class="input-card card">
          <div class="input-header">
            <span class="input-title">今天怎么摆的？</span>
            <span class="input-subtitle">选个类型，记录你的摆烂瞬间</span>
          </div>
          <div class="type-selector">${typesHtml}</div>
          <textarea class="task-input" id="task-input" placeholder="具体摆了啥..." maxlength="200">${esc(state.taskText)}</textarea>
          <input class="mood-input" id="mood-input" placeholder="此刻心情..." maxlength="30" value="${esc(state.moodText)}">
          <div class="btn-row">
            <button class="btn-primary" data-action="submit-record" ${state.submitting ? 'disabled' : ''}>
              ${state.submitting ? '好友点评中...' : '记一笔摆烂'}
            </button>
          </div>
        </div>

        ${reviewHtml}
        ${recentHtml}

        <div class="motto-card card">
          <span class="motto-text">摆烂不是放弃世界，而是拒绝被世界定义</span>
        </div>
      </div>
      ${popupHtml}
    `
  }

  // --- History Page ---
  function renderHistory() {
    const records = getRecords().slice().reverse()
    if (records.length === 0) {
      return `
        <div class="container">
          <div class="header-card card">
            <span class="header-title">你的摆烂编年史</span>
            <span class="header-subtitle">共 0 条摆烂记录</span>
          </div>
          <div class="empty-state">
            <span class="empty-emoji">🎉</span>
            <span class="empty-text">还没有摆烂记录</span>
            <span class="empty-hint">去首页记一笔吧~</span>
          </div>
        </div>
      `
    }

    const recordsHtml = records.map(r => `
      <div class="record-card card">
        <div class="record-header">
          <span class="record-date">${formatDate(r.timestamp)}</span>
          <span class="record-delete" data-action="delete-record" data-ts="${r.timestamp}">删除</span>
        </div>
        <span class="record-task">${esc(r.task)}</span>
        ${r.review ? `
          <div class="record-review">
            <span class="review-label">🤖 AI复盘：</span>
            <span class="review-text">${esc(r.review)}</span>
          </div>
        ` : ''}
      </div>
    `).join('')

    return `
      <div class="container">
        <div class="header-card card">
          <span class="header-title">你的摆烂编年史</span>
          <span class="header-subtitle">共 ${records.length} 条摆烂记录</span>
        </div>
        <div class="record-list">${recordsHtml}</div>
      </div>
    `
  }

  // --- Certificate Page ---
  function renderCertificate() {
    const records = getRecords()
    const stats = calcStats(records)
    const userInfo = getUserInfo()
    if (!state.nickname && userInfo.nickname) state.nickname = userInfo.nickname

    const certHtml = state.certImageURL ? `
      <div class="cert-canvas-wrap cert-revealed">
        <img src="${state.certImageURL}" style="max-width:100%;height:auto;border-radius:4px;" alt="位格证明">
      </div>
    ` : `
      <div class="cert-canvas-wrap">
        <canvas id="cert-canvas" width="600" height="840" style="width:300px;height:420px;"></canvas>
      </div>
    `

    const generatingHtml = state.generating ? `
      <div class="ritual-overlay">
        <div class="ritual-ring ritual-ring-outer"></div>
        <div class="ritual-ring ritual-ring-middle"></div>
        <div class="ritual-ring ritual-ring-inner"></div>
        <span class="ritual-text">绘制位格证明...</span>
      </div>
    ` : ''

    return `
      <div class="container">
        <div class="cert-preview">
          ${certHtml}
          ${generatingHtml}
        </div>

        <div class="input-section card">
          <span class="input-label">你的名字（将印在证明上）</span>
          <input class="name-input" id="name-input" placeholder="输入你的大名" value="${esc(state.nickname)}">
        </div>

        <div class="cert-info card">
          <div class="info-row">
            <span class="info-label">摆烂称号</span>
            <span class="info-value" style="color:${stats.rank.color}" data-action="tap-rank" data-name="${stats.rank.name}">${stats.rank.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">累计摆烂</span>
            <span class="info-value">${stats.total} 次</span>
          </div>
          <div class="info-row">
            <span class="info-label">连续摆烂</span>
            <span class="info-value">${stats.consecutive} 天</span>
          </div>
        </div>

        <div class="cert-actions">
          <button class="btn-primary" data-action="generate-cert" ${state.generating ? 'disabled' : ''}>生成证明</button>
          ${state.certImageURL ? `<button class="btn-download" data-action="download-cert">保存到本地</button>` : ''}
        </div>
      </div>
    `
  }

  // --- Rank Page (Local Stats) ---
  function renderRank() {
    const records = getRecords()
    const stats = calcStats(records)
    const currentRank = stats.rank
    const currentIdx = RANK_LIST.findIndex(r => r.name === currentRank.name)
    const nextRank = currentIdx > 0 ? RANK_LIST[currentIdx - 1] : null
    const prevRank = currentIdx < RANK_LIST.length - 1 ? RANK_LIST[currentIdx + 1] : null

    const nextHtml = nextRank ? `
      <div class="info-card card">
        <span class="section-title">下一序列</span>
        <div class="nav-rank-row" data-action="tap-rank" data-name="${nextRank.name}">
          <span class="nav-rank-emoji">${nextRank.emoji}</span>
          <div class="nav-rank-info">
            <span class="nav-rank-name" style="color:${nextRank.color}">${nextRank.name}</span>
            <span class="nav-rank-seq">序列 ${nextRank.sequence}</span>
          </div>
          <span class="nav-rank-arrow">›</span>
        </div>
      </div>
    ` : ''

    const prevHtml = prevRank ? `
      <div class="info-card card">
        <span class="section-title">上一序列</span>
        <div class="nav-rank-row" data-action="tap-rank" data-name="${prevRank.name}">
          <span class="nav-rank-emoji">${prevRank.emoji}</span>
          <div class="nav-rank-info">
            <span class="nav-rank-name" style="color:${prevRank.color}">${prevRank.name}</span>
            <span class="nav-rank-seq">序列 ${prevRank.sequence}</span>
          </div>
          <span class="nav-rank-arrow">‹</span>
        </div>
      </div>
    ` : ''

    const progressToNext = nextRank ? Math.min(100, Math.round((stats.total / nextRank.minCount) * 100)) : 100

    return `
      <div class="container">
        <div class="rank-header-card card">
          <span class="rank-big-emoji">${currentRank.emoji}</span>
          <span class="rank-big-name" style="color:${currentRank.color}">${currentRank.name}</span>
          <span class="rank-big-seq">序列 ${currentRank.sequence}</span>
        </div>

        <div class="rank-desc-card card">
          <span class="section-title">称号描述</span>
          <span class="rank-desc-text">${RANK_DESC[currentRank.name] || ''}</span>
        </div>

        <div class="card" style="padding:15px;">
          <span class="section-title">当前进度</span>
          <div class="stats-row" style="margin-bottom:12px;">
            <div class="stat-item">
              <span class="stat-num">${stats.total}</span>
              <span class="stat-label">累计摆烂(次)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">${stats.consecutive}</span>
              <span class="stat-label">连续摆烂(天)</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">${stats.todayCount}</span>
              <span class="stat-label">今日(次)</span>
            </div>
          </div>
          ${nextRank ? `
            <div style="font-size:12px;color:#999;margin-bottom:6px;">距离「${nextRank.name}」还需 ${nextRank.minCount - stats.total} 次</div>
            <div style="height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${progressToNext}%;background:linear-gradient(90deg,#e94560,#c23152);border-radius:3px;transition:width 0.3s;"></div>
            </div>
          ` : '<div style="font-size:13px;color:#FFD700;font-weight:bold;text-align:center;">已达最高序列！</div>'}
        </div>

        <div class="info-card card">
          <span class="section-title">晋升条件</span>
          <div class="condition-row">
            <span class="condition-label">累计摆烂</span>
            <span class="condition-value">${currentRank.minCount} 次</span>
          </div>
        </div>

        ${nextHtml}
        ${prevHtml}

        <div class="motto-card card">
          <span class="motto-text">全部段位一览</span>
        </div>
        <div class="card" style="padding:10px;">
          ${RANK_LIST.map(r => `
            <div class="nav-rank-row" data-action="tap-rank" data-name="${r.name}" style="padding:8px 4px;">
              <span class="nav-rank-emoji" style="font-size:20px;">${r.emoji}</span>
              <div class="nav-rank-info">
                <span class="nav-rank-name" style="color:${r.color};font-size:13px;">${r.name}</span>
                <span class="nav-rank-seq">序列 ${r.sequence} · ${r.minCount}次</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  // --- Rank Detail Sub-page ---
  function renderRankDetail() {
    const name = state.rankDetailName
    const rankInfo = RANK_LIST.find(r => r.name === name)
    if (!rankInfo) return '<div class="container"><div class="card"><p>序列不存在</p></div></div>'

    const idx = RANK_LIST.findIndex(r => r.name === name)
    const nextRank = idx > 0 ? RANK_LIST[idx - 1] : null
    const prevRank = idx < RANK_LIST.length - 1 ? RANK_LIST[idx + 1] : null

    const nextHtml = nextRank ? `
      <div class="info-card card">
        <span class="section-title">下一序列</span>
        <div class="nav-rank-row" data-action="view-rank-detail" data-name="${nextRank.name}">
          <span class="nav-rank-emoji">${nextRank.emoji}</span>
          <div class="nav-rank-info">
            <span class="nav-rank-name" style="color:${nextRank.color}">${nextRank.name}</span>
            <span class="nav-rank-seq">序列 ${nextRank.sequence}</span>
          </div>
          <span class="nav-rank-arrow">›</span>
        </div>
      </div>
    ` : ''

    const prevHtml = prevRank ? `
      <div class="info-card card">
        <span class="section-title">上一序列</span>
        <div class="nav-rank-row" data-action="view-rank-detail" data-name="${prevRank.name}">
          <span class="nav-rank-emoji">${prevRank.emoji}</span>
          <div class="nav-rank-info">
            <span class="nav-rank-name" style="color:${prevRank.color}">${prevRank.name}</span>
            <span class="nav-rank-seq">序列 ${prevRank.sequence}</span>
          </div>
          <span class="nav-rank-arrow">‹</span>
        </div>
      </div>
    ` : ''

    return `
      <div class="container">
        <div style="padding:8px 0 4px;">
          <span data-action="back-to-rank" style="font-size:14px;color:#e94560;cursor:pointer;">← 返回排行</span>
        </div>
        <div class="rank-header-card card" style="background:${rankInfo.color}15">
          <span class="rank-big-emoji">${rankInfo.emoji}</span>
          <span class="rank-big-name" style="color:${rankInfo.color}">${rankInfo.name}</span>
          <span class="rank-big-seq">序列 ${rankInfo.sequence}</span>
        </div>
        <div class="info-card card">
          <span class="section-title">称号描述</span>
          <span class="rank-desc-text">${RANK_DESC[name] || ''}</span>
        </div>
        <div class="info-card card">
          <span class="section-title">晋升条件</span>
          <div class="condition-row">
            <span class="condition-label">累计摆烂</span>
            <span class="condition-value">${rankInfo.minCount} 次</span>
          </div>
        </div>
        ${nextHtml}
        ${prevHtml}
      </div>
    `
  }

  // --- QA Page ---
  function renderQA() {
    if (!state.currentQuestion) state.currentQuestion = getRandomQuestion()

    const favorites = getFavorites()
    state.isFavorited = state.answer && favorites.some(f => f.question === state.currentQuestion)

    const answerHtml = state.answer ? `
      <div class="answer-section card">
        <div class="answer-header">
          <span class="answer-icon">🐟</span>
          <span class="answer-title">研究成果</span>
        </div>
        <div class="answer-content">${state.answerHtml || esc(state.answer)}</div>
        <div class="answer-actions">
          <button class="btn-paper" data-action="generate-paper" ${state.paperLoading ? 'disabled' : ''}>
            ${state.paperLoading ? '撰写中...' : '生成SHIT期刊论文'}
          </button>
          ${state.paperAnswer ? `
            <div class="paper-divider"></div>
            <div class="paper-text">${state.paperAnswerHtml || esc(state.paperAnswer)}</div>
          ` : ''}
          <div class="qa-fav-row">
            <button class="btn-fav ${state.isFavorited ? 'active' : 'inactive'}" data-action="toggle-fav">
              ${state.isFavorited ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      </div>
    ` : ''

    const favHtml = favorites.length > 0 ? `
      <div class="favorites-section card">
        <span class="section-title">我的收藏</span>
        <div class="favorites-list">
          ${favorites.map((f, i) => `
            <div class="favorite-item">
              <span class="favorite-question" data-action="view-fav" data-index="${i}">${esc(f.question)}</span>
              <span class="favorite-preview">${esc(f.answer)}</span>
              <span class="favorite-delete" data-action="delete-fav" data-index="${i}">删除</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''

    const artifactHtml = state.showArtifact ? `
      <div class="artifact-modal" data-action="hide-artifact">
        <div class="artifact-modal-content" data-action="">
          <div class="artifact-modal-header">
            <span class="artifact-modal-title">封印物档案</span>
            <span class="artifact-modal-close" data-action="hide-artifact">✕</span>
          </div>
          <div class="artifact-modal-body">
            <div class="artifact-field">
              <span class="artifact-label">编号</span>
              <span class="artifact-value">0-0</span>
            </div>
            <div class="artifact-field">
              <span class="artifact-label">名称</span>
              <span class="artifact-value artifact-name">咸鱼</span>
            </div>
            <div class="artifact-field">
              <span class="artifact-label">危险等级</span>
              <span class="artifact-value artifact-danger">极高</span>
            </div>
            <div class="artifact-section">
              <span class="artifact-section-title">能力</span>
              <span class="artifact-section-text">能够回答提问者的任何问题，无论领域、无论深浅。其回答往往蕴含着某种超越常理的"真理"，令人在阅读后产生强烈的认同感与满足感。</span>
            </div>
            <div class="artifact-section">
              <span class="artifact-section-title">负面效果</span>
              <span class="artifact-section-text">其回答未必是提问者真正需要的答案，但必定是提问者最想看到的答案。长期接触者会逐渐丧失对原本事务的兴趣，不由自主地沉迷于向咸鱼提问的行为中，最终放弃一切正事，沉沦于摆烂的深渊。</span>
            </div>
            <div class="artifact-section">
              <span class="artifact-section-title">附录</span>
              <span class="artifact-section-text">咸鱼圣殿将其列为最高优先级封印物，并非因为其破坏力，而是因为——迄今为止，尚无任何人能在连续提问三次后仍保持对工作的热情。</span>
            </div>
          </div>
        </div>
      </div>
    ` : ''

    return `
      <div class="container">
        <div class="question-section card">
          <div class="section-title-row">
            <span class="section-title" style="margin-bottom:0;">今日课题</span>
            <span class="artifact-info-btn" data-action="show-artifact">ⓘ</span>
          </div>
          <div class="question-display">
            <span class="question-text">${esc(state.currentQuestion)}</span>
          </div>
          <div class="btn-row">
            <button class="btn-secondary" data-action="ai-question" ${state.aiQuestionLoading ? 'disabled' : ''}>
              ${state.aiQuestionLoading ? '出题中...' : 'AI出题'}
            </button>
            <button class="btn-primary" data-action="generate-answer" ${state.loading ? 'disabled' : ''}>
              ${state.loading ? '研究中...' : '开始研究'}
            </button>
          </div>
        </div>

        <div class="custom-section card">
          <span class="section-title">自定义课题</span>
          <textarea class="custom-input" id="custom-input" placeholder="输入你的离谱问题..." maxlength="100">${esc(state.customQuestion)}</textarea>
          <button class="btn-primary" data-action="generate-custom" ${state.loading ? 'disabled' : ''}>
            ${state.loading ? '研究中...' : '研究这个问题'}
          </button>
        </div>

        ${answerHtml}
        ${favHtml}
      </div>
      ${artifactHtml}
    `
  }

  // ===== Event Handling =====
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]')
    if (!target) return
    const action = target.dataset.action

    switch (action) {
      case 'select-type':
        state.selectedType = state.selectedType === target.dataset.type ? '' : target.dataset.type
        render(); break

      case 'submit-record':
        handleSubmit(); break

      case 'close-popup':
        state.showPopup = false; render(); break

      case 'delete-record':
        handleDeleteRecord(Number(target.dataset.ts)); break

      case 'generate-cert':
        handleGenerateCert(); break

      case 'download-cert':
        handleDownloadCert(); break

      case 'tap-rank':
        if (target.dataset.name) navigateToRankDetail(target.dataset.name); break

      case 'view-rank-detail':
        if (target.dataset.name) { state.rankDetailName = target.dataset.name; render(); $('#page-container').scrollTop = 0; } break

      case 'back-to-rank':
        navigateTo('rank'); break

      case 'generate-answer':
        handleGenerateAnswer(state.currentQuestion); break

      case 'generate-custom': {
        const input = $('#custom-input')
        const q = input ? input.value.trim() : state.customQuestion
        if (!q) { showToast('请输入问题'); return }
        handleGenerateAnswer(q); break
      }

      case 'ai-question':
        handleAIGenerateQuestion(); break

      case 'toggle-fav':
        handleToggleFavorite(); break

      case 'view-fav': {
        const idx = Number(target.dataset.index)
        const fav = getFavorites()[idx]
        if (fav) {
          state.currentQuestion = fav.question
          state.answer = fav.answer
          state.answerHtml = parseMarkdown(fav.answer)
          state.customQuestion = ''
          state.paperAnswer = ''
          state.paperAnswerHtml = ''
          render()
          $('#page-container').scrollTop = 0
        }
        break
      }

      case 'delete-fav': {
        const idx = Number(target.dataset.index)
        const favs = getFavorites().filter((_, i) => i !== idx)
        saveFavorites(favs)
        render(); break
      }

      case 'generate-paper':
        handleGeneratePaper(); break

      case 'show-artifact':
        state.showArtifact = true; render(); break

      case 'hide-artifact':
        state.showArtifact = false; render(); break

      case 'toggle-settings':
        state.showSettings = !state.showSettings; render(); break

      case 'save-api-key': {
        const input = $('#api-key-input')
        if (input) {
          setApiKey(input.value.trim())
          showToast('API Key 已保存')
          state.showSettings = false
          render()
        }
        break
      }
    }
  })

  // Handle input events via delegation
  document.addEventListener('input', function(e) {
    if (e.target.id === 'task-input') state.taskText = e.target.value
    if (e.target.id === 'mood-input') state.moodText = e.target.value
    if (e.target.id === 'name-input') {
      state.nickname = e.target.value
      saveUserInfo({ nickname: e.target.value })
    }
    if (e.target.id === 'custom-input') state.customQuestion = e.target.value
  })

  // ===== Action Handlers =====
  function handleSubmit() {
    const task = state.taskText.trim()
    const type = state.selectedType
    if (!task && !type) { showToast('选个类型或写点什么吧~'); return }
    if (state.submitting) return

    state.submitting = true
    const records = getRecords()
    const displayTask = task || type
    const record = {
      task: displayTask,
      type,
      mood: state.moodText.trim(),
      timestamp: Date.now(),
      review: ''
    }

    const allRecords = saveRecord(record)
    const stats = calcStats(allRecords)
    render()

    generateReview(displayTask, stats.consecutive, stats.rank.name, type, record.mood)
      .then(review => {
        const recs = getRecords()
        recs[recs.length - 1].review = review
        saveAllRecords(recs)

        state.submitting = false
        state.lastReview = review
        state.taskText = ''
        state.selectedType = ''
        state.moodText = ''

        const msg = ENCOURAGE_MSGS[Math.floor(Math.random() * ENCOURAGE_MSGS.length)]
        state.showPopup = true
        state.popupMessage = msg
        render()
      })
      .catch(err => {
        state.submitting = false
        render()
        if (err.message === 'API_KEY_MISSING') {
          showToast('请先设置 API Key')
          state.showSettings = true
          render()
        } else {
          showToast('AI开小差了，再试一次~')
        }
      })
  }

  function handleDeleteRecord(ts) {
    showModal('确认删除', '这条摆烂记录就当作没发生过？', () => {
      deleteRecord(ts)
      showToast('已删除')
      render()
    })
  }

  function handleGenerateCert() {
    const nickname = state.nickname.trim()
    if (!nickname) { showToast('先输入名字~'); return }
    if (state.generating) return

    state.generating = true
    state.certRevealed = false
    state.certImageURL = ''
    render()

    setTimeout(() => {
      drawCertificate(nickname)
    }, 1500)
  }

  function drawCertificate(nickname) {
    const canvas = document.getElementById('cert-canvas')
    if (!canvas) { state.generating = false; render(); return }

    const ctx = canvas.getContext('2d')
    const w = 600, h = 840
    const records = getRecords()
    const stats = calcStats(records)

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#FFFDF7')
    grad.addColorStop(1, '#FFF8F0')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Border
    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 4
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.strokeStyle = 'rgba(233,69,96,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(35, 35, w - 70, h - 70)

    // Title
    ctx.fillStyle = '#e94560'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('序 列 位 格', w / 2, 120)

    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(150, 150); ctx.lineTo(w - 150, 150); ctx.stroke()

    ctx.fillStyle = '#999'
    ctx.font = '24px sans-serif'
    ctx.fillText('咸鱼圣殿 颁发', w / 2, 190)

    ctx.fillStyle = '#666'
    ctx.font = '28px sans-serif'
    ctx.fillText('兹证明', w / 2, 260)

    ctx.fillStyle = '#e94560'
    ctx.font = 'bold 44px sans-serif'
    ctx.fillText(nickname, w / 2, 330)

    ctx.fillStyle = '#666'
    ctx.font = '28px sans-serif'
    ctx.fillText('同学', w / 2, 380)

    ctx.fillStyle = '#888'
    ctx.font = '26px sans-serif'
    ctx.fillText(`累计摆烂 ${stats.total} 次`, w / 2, 450)

    ctx.fillStyle = stats.rank.color
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('在咸鱼圣殿中位列', w / 2, 520)
    ctx.fillText(`「${stats.rank.name}」`, w / 2, 570)

    ctx.fillStyle = '#999'
    ctx.font = '22px sans-serif'
    ctx.fillText('望再接再厉，继续摆烂', w / 2, 650)

    const now = new Date()
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    ctx.fillStyle = '#bbb'
    ctx.font = '20px sans-serif'
    ctx.fillText(dateStr, w / 2, 720)

    // Stamp
    ctx.strokeStyle = 'rgba(233,69,96,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(w - 120, h - 120, 50, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = 'rgba(233,69,96,0.15)'
    ctx.fill()
    ctx.fillStyle = '#e94560'
    ctx.font = '16px sans-serif'
    ctx.fillText('咸鱼圣殿', w - 120, h - 115)

    try {
      state.certImageURL = canvas.toDataURL('image/png')
    } catch { state.certImageURL = '' }

    state.generating = false
    state.certRevealed = true
    render()
    showToast('证明已生成~')
  }

  function handleDownloadCert() {
    if (!state.certImageURL) return
    const a = document.createElement('a')
    a.href = state.certImageURL
    a.download = `摆烂位格证明_${state.nickname || '匿名'}.png`
    a.click()
    showToast('已保存')
  }

  function handleGenerateAnswer(question) {
    if (state.loading) return
    state.loading = true
    state.answer = ''
    state.answerHtml = ''
    state.activeQuestion = question
    state.paperAnswer = ''
    state.paperAnswerHtml = ''
    render()

    generateAcademicAnswer(question)
      .then(answer => {
        state.answer = answer
        state.answerHtml = parseMarkdown(answer)
        state.loading = false
        render()
      })
      .catch(err => {
        state.loading = false
        render()
        if (err.message === 'API_KEY_MISSING') {
          showToast('请先设置 API Key')
          state.showSettings = true
          render()
        } else {
          showToast('研究失败，再试一次~')
        }
      })
  }

  function handleAIGenerateQuestion() {
    if (state.aiQuestionLoading) return
    state.aiQuestionLoading = true
    render()

    generateFunnyQuestion()
      .then(q => {
        state.currentQuestion = q
        state.answer = ''
        state.answerHtml = ''
        state.activeQuestion = ''
        state.aiQuestionLoading = false
        state.paperAnswer = ''
        state.paperAnswerHtml = ''
        render()
      })
      .catch(() => {
        state.aiQuestionLoading = false
        render()
        showToast('出题失败，再试一次~')
      })
  }

  function handleToggleFavorite() {
    const favorites = getFavorites()
    if (state.isFavorited) {
      const newFavs = favorites.filter(f => f.question !== state.currentQuestion)
      saveFavorites(newFavs)
      state.isFavorited = false
      showToast('已取消收藏')
    } else {
      if (!state.answer) return
      const newItem = { question: state.currentQuestion, answer: state.answer, timestamp: Date.now() }
      saveFavorites([newItem, ...favorites])
      state.isFavorited = true
      showToast('已收藏')
    }
    render()
  }

  function handleGeneratePaper() {
    if (state.paperLoading || !state.activeQuestion) return
    state.paperLoading = true
    render()

    const fullPrompt = `${state.activeQuestion}\n\n请生成完整的SHIT期刊论文，包含摘要、引言、方法论、实验数据、结论和致谢。`
    generateAcademicAnswer(fullPrompt, true)
      .then(paper => {
        state.paperAnswer = paper
        state.paperAnswerHtml = parseMarkdown(paper)
        state.paperLoading = false
        render()
      })
      .catch(() => {
        state.paperLoading = false
        render()
        showToast('论文撰写失败')
      })
  }

  // ===== Init =====
  function init() {
    console.log('[Init] Starting initialization...')
    console.log('[Init] AI_CONFIG.API_KEY:', AI_CONFIG.API_KEY ? '已设置' : '未设置')
    console.log('[Init] state.showSettings before:', state.showSettings)
    
    // 确保初始化时设置面板关闭
    state.showSettings = false
    
    console.log('[Init] state.showSettings after:', state.showSettings)
    
    window.addEventListener('hashchange', handleHash)
    handleHash()
    
    console.log('[Init] Initialization complete')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
