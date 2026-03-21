// =====================================================================
// SmartGlass Customizer – app.js
// M5StickC Plus (240x135) の画面レイアウトをブラウザ上でカスタマイズ
// =====================================================================

(() => {
  'use strict';

  // ===== Constants =====
  const SCREEN_W = 240;
  const SCREEN_H = 135;
  const SCALE = 2;

  // ===== DOM Elements =====
  const screenEl = document.getElementById('m5stick-screen');
  const emptyState = document.getElementById('empty-state');
  const propsPanel = document.getElementById('properties-panel');
  const propsContent = document.getElementById('properties-content');
  const propBadge = document.getElementById('prop-type-badge');
  const propsToggleBtn = document.getElementById('props-toggle-btn');
  const toast = document.getElementById('toast');
  const ipInput = document.getElementById('m5stick-ip');
  const connectStatus = document.getElementById('connect-status');

  // ===== State =====
  let widgets = [];
  let selectedId = null;
  let nextId = 1;
  let clockInterval = null;
  let propsHidden = false;
  let m5stickIP = '';        // ★ M5StickのIPアドレス
  let isConnected = false;   // ★ 接続済みフラグ

  // ===== パステルカラー =====
  const PASTEL_COLORS = [
    '#FFB4B4', '#B4C8FF', '#B4FFC8', '#FFDCB4', '#DCB4FF',
    '#FFFFB4', '#C8FFFF', '#FFC8FF', '#C8FFDC', '#FFC8DC', '#DCDCFF'
  ];

  function getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  const SUBJECTS = [
    '代数', '幾何', '理科1', '理科2', '歴史', '地理',
    '現代文', '日本語表現', '英語A', '英語B', '基礎英語'
  ];

  // ===== Widget Defaults =====
  const WIDGET_DEFAULTS = {
    clock: {
      label: '時計',
      x: 150, y: 8,
      fontSize: 28,
      color: '#FFFFFF',
      content: ''
    },
    text: {
      label: 'テキスト',
      x: 10, y: 60,
      fontSize: 16,
      color: '#E0E0E0',
      content: ''
    },
    study: {
      label: '勉強タイマー',
      x: 140, y: 55,
      fontSize: 24,
      color: '#FFFFFF',
      content: ''
    },
    timer: {
      label: 'タイマー',
      x: 140, y: 90,
      fontSize: 24,
      color: '#34D399',
      content: '00:00'
    },
    piechart: {
      label: '円グラフ',
      x: 35, y: 35,
      fontSize: 8,
      color: '#FFFFFF',
      content: ''
    },
    schedule: {
      label: '予定',
      x: 10, y: 10,
      fontSize: 16,
      color: '#E0E0E0',
      content: ''
    },
    weather: {
      label: '天気',
      x: 140, y: 45,
      fontSize: 16,
      color: '#67E8F9',
      content: '晴れ 18度'
    }
  };

  const TYPE_LABELS = {
    clock: '🕐 時計', text: '✏️ テキスト', study: '📚 勉強タイマー',
    timer: '⏱️ タイマー', piechart: '🍩 円グラフ',
    schedule: '📅 予定', weather: '🌤️ 天気'
  };

  // =====================================================================
  // Widget Rendering
  // =====================================================================

  function renderWidgetContent(widget) {
    const type = widget.type;
    const w = widget;
    const scale = SCALE;

    switch (type) {
      case 'clock': {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `<div class="widget-render type-clock" style="font-size:${w.fontSize * scale}px; color:${w.color};">${hh}:${mm}</div>`;
      }
      case 'text': {
        const dispText = w.content ? escapeHtml(w.content) : '<span style="opacity:0.6;">テキストを入力してください</span>';
        return `<div class="widget-render type-text" style="font-size:${w.fontSize * scale}px; color:${w.color};">${dispText}</div>`;
      }

      case 'study': {
        // ★ 教科別勉強タイマー（プレビュー）
        return `<div class="widget-render type-study" style="color:${w.color};">
          <div style="font-size:${12 * scale}px; margin-bottom:4px;">📚 代数</div>
          <div style="font-size:${w.fontSize * scale}px; font-weight:600; font-family:'JetBrains Mono',monospace;">00:00</div>
        </div>`;
      }

      case 'timer':
        return `<div class="widget-render type-timer" style="font-size:${w.fontSize * scale}px; color:${w.color};">${escapeHtml(w.content)}</div>`;

      case 'piechart': {
        const r = w.fontSize >= 16 ? 40 : 25; // サイズ大まか
        let grad = [];
        let cur = 0;
        let legendHTML = '<div style="display:flex; flex-direction:column; gap:2px;">';
        
        // プレビュー用にダミー値を設定
        const vals = [30, 20, 15, 10, 8, 7, 5, 2, 2, 1, 0];
        const sum = 100;

        vals.forEach((val, i) => {
          if (val === 0) return;
          const pct = (val / sum) * 100;
          grad.push(`${PASTEL_COLORS[i]} ${cur}% ${cur + pct}%`);
          cur += pct;
          if (i < 5) { // 凡例は上位5つくらいまで表示
            legendHTML += `<div style="font-size:${8 * scale}px;display:flex;align-items:center;gap:4px;">
              <span style="display:inline-block;width:${4 * scale}px;height:${4 * scale}px;background:${PASTEL_COLORS[i]};"></span>
              <span style="color:white;">${SUBJECTS[i].substring(0,3)}</span>
            </div>`;
          }
        });

        const pieHTML = `<div style="width:${r*2*scale}px; height:${r*2*scale}px; border-radius:50%; background: conic-gradient(${grad.join(',')});"></div>`;
        return `<div class="widget-render type-piechart" style="display:flex; gap:${8*scale}px; align-items:center;">
          ${pieHTML}
          ${legendHTML}</div>
        </div>`;
      }

      case 'schedule': {
        if (!w.content || w.content.trim() === '') {
          return `<div class="widget-render type-schedule" style="font-size:${w.fontSize * scale}px; color:${w.color};"><span style="opacity:0.6;">予定を書いてください</span></div>`;
        }

        const now = new Date();
        const nowMs = now.getTime();
        let nextMs = Infinity;
        let nextEvt = '';
        
        w.content.replace(/　/g, ' ').split('\n').forEach(line => {
          line = line.trim();
          if (!line) return;
          
          let parts = line.split(' ');
          let dateStr = "";
          let timeStr = "";
          let textStr = "";
          
          if (parts[0] && parts[0].includes('-')) {
             dateStr = parts[0];
             timeStr = parts[1] || "";
             textStr = parts.slice(2).join(' ');
          } else if (parts[0] && parts[0].includes(':')) {
             dateStr = getToday();
             timeStr = parts[0];
             textStr = parts.slice(1).join(' ');
          } else {
             textStr = line;
          }

          if (dateStr && timeStr && textStr) {
             let targetDate = new Date(`${dateStr}T${timeStr}:00`);
             if (!isNaN(targetDate.getTime())) {
               let targetMs = targetDate.getTime();
               if (targetMs > nowMs) {
                  if (targetMs < nextMs) {
                     nextMs = targetMs;
                     nextEvt = textStr;
                  }
               }
             }
          }
        });
        
        let dispText = "予定なし";
        if (nextMs !== Infinity) {
          const diffMs = nextMs - nowMs;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          if (diffHours >= 24) {
             const tDate = new Date(nextMs);
             dispText = `${tDate.getMonth()+1}月${tDate.getDate()}日 ${escapeHtml(nextEvt)}`;
          } else {
             const diffMins = Math.floor(diffMs / (1000 * 60));
             if (diffMins >= 60) {
               const h = Math.floor(diffMins / 60);
               dispText = escapeHtml(nextEvt) + "まであと" + h + "時間";
             } else {
               dispText = escapeHtml(nextEvt) + "まであと" + diffMins + "分";
             }
          }
        }
        
        return `<div class="widget-render type-schedule" style="font-size:${w.fontSize * scale}px; color:${w.color}; white-space:nowrap;">${dispText}</div>`;
      }

      case 'weather':
        return `<div class="widget-render type-text" style="font-size:${w.fontSize * scale}px; color:${w.color};">${escapeHtml(w.content)}</div>`;

      default:
        return `<div class="widget-render">${type}</div>`;
    }
  }

  function createWidgetElement(widget) {
    const el = document.createElement('div');
    el.className = 'screen-widget';
    el.id = `widget-${widget.id}`;
    el.dataset.widgetId = widget.id;
    // ★ 表示サイズに関わらず正しい位置になるよう % 指定に変更
    el.style.left = `${(widget.x / SCREEN_W) * 100}%`;
    el.style.top = `${(widget.y / SCREEN_H) * 100}%`;
    el.innerHTML = renderWidgetContent(widget) +
      `<div class="delete-btn" data-delete-id="${widget.id}">✕</div>` +
      `<div class="resize-handle" data-resize-id="${widget.id}"></div>`;
    return el;
  }

  function refreshWidget(widget) {
    const el = document.getElementById(`widget-${widget.id}`);
    if (!el) return;
    el.style.left = `${(widget.x / SCREEN_W) * 100}%`;
    el.style.top = `${(widget.y / SCREEN_H) * 100}%`;
    el.innerHTML = renderWidgetContent(widget) +
      `<div class="delete-btn" data-delete-id="${widget.id}">✕</div>` +
      `<div class="resize-handle" data-resize-id="${widget.id}"></div>`;
    if (selectedId === widget.id) el.classList.add('selected');
  }

  // =====================================================================
  // Add / Remove Widgets
  // =====================================================================

  function addWidget(type, x, y) {
    const defaults = { ...WIDGET_DEFAULTS[type] };
    const widget = {
      id: nextId++,
      type,
      x: x ?? defaults.x,
      y: y ?? defaults.y,
      fontSize: defaults.fontSize,
      color: defaults.color,
      content: defaults.content
    };
    widgets.push(widget);

    const el = createWidgetElement(widget);
    screenEl.appendChild(el);
    setupWidgetDrag(el, widget);
    updateEmptyState();
    selectWidget(widget.id);
    showToast(`${defaults.label} を追加しました`);
    return widget;
  }

  function removeWidget(id) {
    widgets = widgets.filter(w => w.id !== id);
    const el = document.getElementById(`widget-${id}`);
    if (el) el.remove();
    if (selectedId === id) {
      selectedId = null;
      propsPanel.classList.remove('visible');
    }
    updateEmptyState();
  }

  function updateEmptyState() {
    emptyState.style.display = widgets.length === 0 ? 'block' : 'none';
  }

  // =====================================================================
  // Selection & Properties
  // =====================================================================

  function selectWidget(id) {
    document.querySelectorAll('.screen-widget.selected').forEach(el => el.classList.remove('selected'));
    selectedId = id;
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;
    const el = document.getElementById(`widget-${id}`);
    if (el) el.classList.add('selected');
    showProperties(widget);
  }

  function deselectAll() {
    document.querySelectorAll('.screen-widget.selected').forEach(el => el.classList.remove('selected'));
    selectedId = null;
    propsPanel.classList.remove('visible');
    propsToggleBtn.classList.remove('panel-open');
  }

  function showProperties(widget) {
    propBadge.textContent = TYPE_LABELS[widget.type] || widget.type;
    let html = '';

    // Position
    html += `
      <div class="prop-group">
        <div class="prop-label">位置</div>
        <div class="prop-row">
          <div><input type="number" class="prop-input" id="prop-x" value="${widget.x}" min="0" max="${SCREEN_W}" placeholder="X"></div>
          <div><input type="number" class="prop-input" id="prop-y" value="${widget.y}" min="0" max="${SCREEN_H}" placeholder="Y"></div>
        </div>
      </div>`;

    // Font size
    html += `
      <div class="prop-group">
        <div class="prop-label">フォントサイズ</div>
        <input type="number" class="prop-input" id="prop-fontSize" value="${widget.fontSize}" min="6" max="48">
      </div>`;

    // Color
    const colorOptions = ['#FFFFFF', '#E0E0E0', '#67E8F9', '#34D399', '#FFB4B4', '#A78BFA', '#FB923C', '#F472B6', '#F87171', '#FFFFB4'];
    html += `
      <div class="prop-group">
        <div class="prop-label">文字色</div>
        <div class="prop-color-row">
          ${colorOptions.map(c => `<div class="prop-color-swatch ${widget.color === c ? 'active' : ''}" style="background:${c};" data-color="${c}"></div>`).join('')}
        </div>
      </div>`;

    // Content (for text, timer, schedule, weather)
    if (widget.type === 'schedule') {
      html += `
        <div class="prop-group">
          <div class="prop-label">予定</div>
          <div id="schedule-rows" style="display:flex; flex-direction:column; gap:6px;">`;
      
      const lines = widget.content.split('\n');
      lines.forEach((line) => {
        let dateStr = "";
        let timeStr = "";
        let textStr = "";
        line = line.trim();
        if (line) {
          const parts = line.split(' ');
          if (parts[0] && parts[0].includes('-')) {
             dateStr = parts[0];
             timeStr = parts[1] || "";
             textStr = parts.slice(2).join(' ');
          } else if (parts[0] && parts[0].includes(':')) {
             dateStr = getToday();
             timeStr = parts[0];
             textStr = parts.slice(1).join(' ');
          } else {
             textStr = line;
          }
        }

        if (timeStr && timeStr.length < 5 && timeStr.includes(':')) {
           const timeParts = timeStr.split(':');
           timeStr = timeParts[0].padStart(2, '0') + ':' + timeParts[1].padStart(2, '0');
        }

        html += `
            <div class="schedule-row" style="display:flex; gap:4px; align-items:center;">
              <input type="date" class="prop-input schedule-date-input" value="${dateStr}" style="width:auto; padding:6px; flex-shrink:0;">
              <input type="time" class="prop-input schedule-time-input" value="${timeStr}" style="width:auto; padding:6px; flex-shrink:0;">
              <input type="text" class="prop-input schedule-text-input" value="${escapeHtml(textStr)}" placeholder="予定名" style="flex:1; padding:6px; min-width:0;">
              <button class="btn btn-danger schedule-del-btn" style="padding:4px 8px; flex-shrink:0; font-size:12px;">✕</button>
            </div>`;
      });
      
      html += `
          </div>
          <button class="btn" id="schedule-add-btn" style="width:100%; margin-top:8px; justify-content:center; padding:6px;">＋ 予定を追加</button>
        </div>`;
    } else if (['text', 'timer', 'weather'].includes(widget.type)) {
      html += `
        <div class="prop-group">
          <div class="prop-label">内容</div>
          <input type="text" class="prop-input" id="prop-content" value="${escapeHtml(widget.content)}">
        </div>`;
    }

    // Delete
    html += `<button class="btn btn-danger" id="prop-delete" style="width:100%; margin-top:8px;">
      <span class="btn-icon">🗑️</span> このウィジェットを削除
    </button>`;

    propsContent.innerHTML = html;
    if (!propsHidden) {
      propsPanel.classList.add('visible');
      propsToggleBtn.classList.add('panel-open');
    }
    bindPropEvents(widget);
  }

  function bindPropEvents(widget) {
    const propX = document.getElementById('prop-x');
    const propY = document.getElementById('prop-y');
    const propFontSize = document.getElementById('prop-fontSize');
    const propContent = document.getElementById('prop-content');
    const propDelete = document.getElementById('prop-delete');

    if (propX) propX.addEventListener('input', () => {
      widget.x = clamp(parseInt(propX.value) || 0, 0, SCREEN_W);
      refreshWidget(widget);
    });
    if (propY) propY.addEventListener('input', () => {
      widget.y = clamp(parseInt(propY.value) || 0, 0, SCREEN_H);
      refreshWidget(widget);
    });
    if (propFontSize) propFontSize.addEventListener('input', () => {
      widget.fontSize = clamp(parseInt(propFontSize.value) || 8, 6, 48);
      refreshWidget(widget);
    });
    if (widget.type === 'schedule') {
      const updateScheduleContent = () => {
        const rows = document.querySelectorAll('.schedule-row');
        let newContent = [];
        rows.forEach(row => {
          const dateVal = row.querySelector('.schedule-date-input').value;
          const timeVal = row.querySelector('.schedule-time-input').value;
          const textVal = row.querySelector('.schedule-text-input').value.trim();
          if (dateVal || timeVal || textVal) {
            newContent.push(`${dateVal || getToday()} ${timeVal || '00:00'} ${textVal || '予定'}`);
          }
        });
        widget.content = newContent.join('\n');
        refreshWidget(widget);
      };

      const rowsContainer = document.getElementById('schedule-rows');
      
      if (rowsContainer) {
        rowsContainer.addEventListener('input', (e) => {
          if (e.target.classList.contains('schedule-date-input') || e.target.classList.contains('schedule-time-input') || e.target.classList.contains('schedule-text-input')) {
            updateScheduleContent();
          }
        });
        rowsContainer.addEventListener('click', (e) => {
          if (e.target.classList.contains('schedule-del-btn')) {
            e.target.closest('.schedule-row').remove();
            updateScheduleContent();
          }
        });
      }

      const addBtn = document.getElementById('schedule-add-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const newRow = document.createElement('div');
          newRow.className = 'schedule-row';
          newRow.style.cssText = 'display:flex; gap:4px; align-items:center;';
          newRow.innerHTML = `
            <input type="date" class="prop-input schedule-date-input" value="${getToday()}" style="width:auto; padding:6px; flex-shrink:0;">
            <input type="time" class="prop-input schedule-time-input" value="12:00" style="width:auto; padding:6px; flex-shrink:0;">
            <input type="text" class="prop-input schedule-text-input" value="" placeholder="予定名" style="flex:1; padding:6px; min-width:0;">
            <button class="btn btn-danger schedule-del-btn" style="padding:4px 8px; flex-shrink:0; font-size:12px;">✕</button>
          `;
          rowsContainer.appendChild(newRow);
          updateScheduleContent();
        });
      }
    } else if (propContent) {
      propContent.addEventListener('input', () => {
        widget.content = propContent.value;
        refreshWidget(widget);
      });
    }

    document.querySelectorAll('.prop-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        widget.color = swatch.dataset.color;
        document.querySelectorAll('.prop-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        refreshWidget(widget);
      });
    });

    if (propDelete) propDelete.addEventListener('click', () => {
      removeWidget(widget.id);
      showToast('ウィジェットを削除しました');
    });
  }

  // =====================================================================
  // Drag & Drop – Palette → Screen
  // =====================================================================

  (function initPaletteDrag() {
    const cards = document.querySelectorAll('.widget-card[draggable]');
    cards.forEach(card => {
      // 既存のPC用ドラッグ
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('widget-type', card.dataset.widgetType);
        e.dataTransfer.effectAllowed = 'copy';
      });

      // ★ スマホ用：タップしたら真ん中に追加！
      card.addEventListener('click', (e) => {
        const type = card.dataset.widgetType;
        // ちょっとずらして配置する（重ならないように）
        const offset = (widgets.length % 5) * 10;
        addWidget(type, 100 + offset, 40 + offset);
      });
    });

    screenEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    screenEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('widget-type');
      if (!type) return;

      const rect = screenEl.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / SCALE);
      const y = Math.round((e.clientY - rect.top) / SCALE);

      addWidget(type, clamp(x, 0, SCREEN_W - 20), clamp(y, 0, SCREEN_H - 10));
    });
  })();

  // =====================================================================
  // Drag – Move Widgets on Screen
  // =====================================================================

  function setupWidgetDrag(el, widget) {
    let dragging = false;
    let resizing = false;
    let offsetX = 0, offsetY = 0;
    let resizeStartX = 0, resizeStartFontSize = 0;

    const onPointerDown = (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const deleteId = parseInt(e.target.dataset.deleteId);
        removeWidget(deleteId);
        showToast('ウィジェットを削除しました');
        return;
      }

      // ★ リサイズハンドルを掘んだ場合
      if (e.target.classList.contains('resize-handle')) {
        resizing = true;
        resizeStartX = e.clientX;
        resizeStartFontSize = widget.fontSize;
        el.style.zIndex = 50;
        selectWidget(widget.id);
        e.preventDefault();
        return;
      }

      dragging = true;
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.style.zIndex = 50;
      selectWidget(widget.id);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      // ★ リサイズ中
      if (resizing) {
        e.preventDefault(); // ★ スクロール防止
        const deltaX = e.clientX - resizeStartX;
        const newSize = clamp(resizeStartFontSize + Math.round(deltaX / 8), 6, 48);
        widget.fontSize = newSize;
        refreshWidget(widget);
        // プロパティパネルもリアルタイム更新
        const propFontSize = document.getElementById('prop-fontSize');
        if (propFontSize) propFontSize.value = widget.fontSize;
        return;
      }

      if (!dragging) return;
      e.preventDefault(); // ★ スクロール防止
      const screenRect = screenEl.getBoundingClientRect();
      const currentScaleX = screenRect.width / SCREEN_W;
      const currentScaleY = screenRect.height / SCREEN_H;

      let newX = Math.round((e.clientX - screenRect.left - offsetX) / currentScaleX);
      let newY = Math.round((e.clientY - screenRect.top - offsetY) / currentScaleY);
      widget.x = clamp(newX, 0, SCREEN_W - 10);
      widget.y = clamp(newY, 0, SCREEN_H - 5);
      
      el.style.left = `${(widget.x / SCREEN_W) * 100}%`;
      el.style.top = `${(widget.y / SCREEN_H) * 100}%`;
      const propX = document.getElementById('prop-x');
      const propY = document.getElementById('prop-y');
      if (propX) propX.value = widget.x;
      if (propY) propY.value = widget.y;
    };

    const onPointerUp = () => {
      if (resizing) {
        resizing = false;
        el.style.zIndex = '';
        return;
      }
      if (!dragging) return;
      dragging = false;
      el.style.zIndex = '';
    };

    el.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  // =====================================================================
  // Screen click → deselect
  // =====================================================================

  screenEl.addEventListener('click', (e) => {
    if (e.target === screenEl || e.target === emptyState || e.target.parentElement === emptyState) {
      deselectAll();
    }
  });

  // =====================================================================
  // Header Buttons
  // =====================================================================

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (widgets.length === 0) return;
    if (confirm('すべてのウィジェットをリセットしますか？')) {
      [...widgets].forEach(w => removeWidget(w.id));
      showToast('リセットしました');
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    exportCode();
  });

  // ===== プロパティパネル トグルボタン =====
  propsToggleBtn.addEventListener('click', () => {
    if (propsPanel.classList.contains('visible')) {
      propsPanel.classList.remove('visible');
      propsToggleBtn.classList.remove('panel-open');
      propsHidden = true;
    } else {
      propsHidden = false;
      if (selectedId !== null) {
        const widget = widgets.find(w => w.id === selectedId);
        if (widget) {
          propsPanel.classList.add('visible');
          propsToggleBtn.classList.add('panel-open');
        }
      }
    }
  });

  // =====================================================================
  // ★★★ M5Stick 接続 & 即時送信 ★★★
  // =====================================================================

  // IPアドレスをlocalStorageに保存/復元
  const savedIP = localStorage.getItem('m5stick-ip');
  if (savedIP) {
    ipInput.value = savedIP;
    m5stickIP = savedIP;
  }

  // 接続テストボタン
  document.getElementById('btn-connect').addEventListener('click', async () => {
    m5stickIP = ipInput.value.trim();
    if (!m5stickIP) {
      showToast('IPアドレスを入力してください');
      return;
    }
    localStorage.setItem('m5stick-ip', m5stickIP);
    connectStatus.textContent = '接続中...';
    connectStatus.className = 'connect-status';

    try {
      const res = await fetch(`http://${m5stickIP}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      const data = await res.json();
      if (data.status === 'connected') {
        isConnected = true;
        connectStatus.textContent = `✅ 接続済み (${data.ip})`;
        connectStatus.className = 'connect-status connected';
        showToast('M5Stickに接続しました！');
      }
    } catch (err) {
      isConnected = false;
      connectStatus.textContent = '❌ 接続失敗 – IPを確認してください';
      connectStatus.className = 'connect-status error';
      showToast('接続に失敗しました');
    }
  });

  // ★ レイアウト送信ボタン（即時プッシュ！）
  document.getElementById('btn-send').addEventListener('click', async () => {
    m5stickIP = ipInput.value.trim();
    if (!m5stickIP) {
      showToast('IPアドレスを入力してください');
      return;
    }
    if (widgets.length === 0) {
      showToast('ウィジェットがありません');
      return;
    }

    // ウィジェット一覧をJSONに変換
    const layoutData = {
      widgets: widgets.map(w => ({
        type: w.type,
        x: w.x,
        y: w.y,
        fontSize: w.fontSize,
        color: colorToRGB565Hex(w.color),
        content: w.content
      }))
    };

    try {
      const res = await fetch(`http://${m5stickIP}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutData),
        signal: AbortSignal.timeout(5000)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        isConnected = true;
        connectStatus.textContent = `✅ 送信成功！ (${data.widgets}個のウィジェット)`;
        connectStatus.className = 'connect-status connected';
        showToast(`🚀 レイアウトをM5Stickに送信しました！（${data.widgets}個）`);
      }
    } catch (err) {
      connectStatus.textContent = '❌ 送信失敗 – 接続を確認してください';
      connectStatus.className = 'connect-status error';
      showToast('送信に失敗しました');
    }
  });

  // =====================================================================
  // コード生成
  // =====================================================================

  function exportCode() {
    if (widgets.length === 0) {
      showToast('ウィジェットがありません');
      return;
    }

    let code = '// ===== SmartGlass Customizer 自動生成コード =====\n';
    code += '// このコードを drawCustomLayout() として使ってください\n\n';
    code += 'void drawCustomLayout() {\n';
    code += '  canvas.fillSprite(BLACK);\n\n';

    widgets.forEach(w => {
      code += `  // --- ${TYPE_LABELS[w.type] || w.type} (ID:${w.id}) ---\n`;

      switch (w.type) {
        case 'clock':
          code += `  canvas.setFont(&fonts::Font0);\n`;
          code += `  canvas.setTextSize(3);\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y});\n`;
          code += `  { String t = getTimestamp().substring(11, 16); canvas.print(t); }\n\n`;
          break;
        case 'text':
          code += `  setJapaneseFont(${w.fontSize});\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)}, BLACK);\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y});\n`;
          code += `  if (String("${escapeCppString(w.content)}").length() == 0) {\n`;
          code += `    canvas.print("テキストを入力してください");\n`;
          code += `  } else {\n`;
          code += `    canvas.print("${escapeCppString(w.content)}");\n`;
          code += `  }\n\n`;
          break;
        case 'study':
          code += `  // 教科別勉強タイマー（Aボタン長押しで開始/停止）\n`;
          code += `  canvas.setFont(&fonts::lgfxJapanGothicP_16);\n`;
          code += `  canvas.setTextSize(1);\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y});\n`;
          code += `  canvas.print(subjects[subjectIndex]);\n`;
          code += `  { int m=studySeconds/60; int s=studySeconds%60; char b[10]; sprintf(b,"%02d:%02d",m,s);\n`;
          code += `    canvas.setFont(&fonts::Font0); canvas.setTextSize(3);\n`;
          code += `    canvas.setCursor(${w.x}, ${w.y + 30}); canvas.print(b); }\n\n`;
          break;
        case 'timer':
          code += `  canvas.setFont(&fonts::Font0);\n`;
          code += `  canvas.setTextSize(3);\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y});\n`;
          code += `  { int m=timerSeconds/60; int s=timerSeconds%60; char b[10]; sprintf(b,"%02d:%02d",m,s); canvas.print(b); }\n\n`;
          break;
        case 'piechart':
          code += `  { int r=${Math.max(10, w.fontSize*2)}; int px=${w.x} + r, py=${w.y} + r;\n`;
          code += `    int total = 0; for(int i=0;i<SUBJECT_COUNT;i++) total+=localSeconds[i];\n`;
          code += `    if (total == 0) { canvas.fillCircle(px, py, r, DARKGREY); }\n`;
          code += `    else { float startDeg = 0; int ly = ${w.y};\n`;
          code += `      for(int i=0;i<SUBJECT_COUNT;i++) {\n`;
          code += `        if(localSeconds[i]==0) continue;\n`;
          code += `        float deg = ((float)localSeconds[i]/total) * 360.0;\n`;
          code += `        canvas.fillArc(px, py, 0, r, startDeg, startDeg+deg, pastelColors[i]);\n`;
          code += `        // 凡例を描画 (右側)\n`;
          code += `        if (ly < ${w.y} + (r*2) - 5) {\n`;
          code += `          canvas.fillRect(px+r+8, ly, 6, 6, pastelColors[i]);\n`;
          code += `          canvas.setFont(&fonts::lgfxJapanGothicP_8); canvas.setTextSize(1); canvas.setTextColor(WHITE, BLACK);\n`;
          code += `          canvas.setCursor(px+r+16, ly-2); canvas.print(subjectsShort[i]);\n`;
          code += `          ly+=10;\n`;
          code += `        }\n`;
          code += `        startDeg += deg;\n`;
          code += `      }\n`;
          code += `    }\n`;
          code += `  }\n\n`;
          break;
        case 'schedule': {
          code += `  setJapaneseFont(${w.fontSize});\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)}, BLACK);\n`;
          code += `  {\n`;
          code += `    time_t nowT = time(nullptr);\n`;
          code += `    unsigned long nextUnix = -1; String nextE = "";\n`;
          code += `    String txt = "${escapeCppString(w.content)}"; txt.replace("　", " ");\n`;
          code += `    int start = 0;\n`;
          code += `    for (int c = 0; c <= (int)txt.length(); c++) {\n`;
          code += `      if (c == (int)txt.length() || txt[c] == '\\n') {\n`;
          code += `        String line = txt.substring(start, c); line.trim();\n`;
          code += `        if (line.length() > 0) {\n`;
          code += `          int firstSpace = line.indexOf(' ');\n`;
          code += `          if (firstSpace > 0) {\n`;
          code += `            String token1 = line.substring(0, firstSpace);\n`;
          code += `            String token2 = ""; String evtName = "";\n`;
          code += `            int secondSpace = line.indexOf(' ', firstSpace + 1);\n`;
          code += `            if (token1.indexOf('-') > 0 && secondSpace > 0) {\n`;
          code += `               token2 = line.substring(firstSpace + 1, secondSpace);\n`;
          code += `               evtName = line.substring(secondSpace + 1);\n`;
          code += `            } else if (token1.indexOf(':') > 0) {\n`;
          code += `               token2 = token1; token1 = getDate(); evtName = line.substring(firstSpace + 1);\n`;
          code += `            }\n`;
          code += `            if (token2.indexOf(':') > 0) {\n`;
          code += `               int yyyy = token1.substring(0, 4).toInt();\n`;
          code += `               int mon = token1.substring(5, 7).toInt();\n`;
          code += `               int dd = token1.substring(8, 10).toInt();\n`;
          code += `               int hh = token2.substring(0, 2).toInt();\n`;
          code += `               int mm = token2.substring(3, 5).toInt();\n`;
          code += `               struct tm evtTm; evtTm.tm_year = yyyy - 1900; evtTm.tm_mon = mon - 1;\n`;
          code += `               evtTm.tm_mday = dd; evtTm.tm_hour = hh; evtTm.tm_min = mm; evtTm.tm_sec = 0; evtTm.tm_isdst = -1;\n`;
          code += `               time_t evtTime = mktime(&evtTm);\n`;
          code += `               if (evtTime > nowT && (nextUnix == (unsigned long)-1 || (unsigned long)evtTime < nextUnix)) {\n`;
          code += `                   nextUnix = (unsigned long)evtTime; nextE = evtName; nextE.trim();\n`;
          code += `               }\n`;
          code += `            }\n`;
          code += `          }\n`;
          code += `        }\n`;
          code += `        start = c + 1;\n`;
          code += `      }\n`;
          code += `    }\n`;
          code += `    String dText = "予定を書いてください";\n`;
          code += `    if (txt.length() > 0) {\n`;
          code += `      if (nextUnix != (unsigned long)-1) {\n`;
          code += `        unsigned long diffSec = nextUnix - (unsigned long)nowT;\n`;
          code += `        if (diffSec >= 24 * 3600) {\n`;
          code += `          struct tm* nextTm = localtime((time_t*)&nextUnix);\n`;
          code += `          dText = String(nextTm->tm_mon + 1) + "月" + String(nextTm->tm_mday) + "日 " + nextE;\n`;
          code += `        } else {\n`;
          code += `          int dMin = diffSec / 60;\n`;
          code += `          if (dMin >= 60) { dText = nextE + "まであと" + String(dMin/60) + "時間"; }\n`;
          code += `          else { dText = nextE + "まであと" + String(dMin) + "分"; }\n`;
          code += `        }\n`;
          code += `      } else { dText = "予定なし"; }\n`;
          code += `    }\n`;
          code += `    canvas.setCursor(${w.x}, ${w.y}); canvas.print(dText);\n`;
          code += `  }\n\n`;
          break;
        }
        case 'weather':
          code += `  canvas.setFont(&fonts::Font0); canvas.setTextSize(2);\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y}); canvas.print("${escapeCppString(w.content)}");\n\n`;
          break;
      }
    });

    code += '  updateDisplay();\n}\n';

    navigator.clipboard.writeText(code).then(() => {
      showToast('✅ C++コードをクリップボードにコピーしました！');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80vw;height:60vh;z-index:999;font-family:monospace;font-size:12px;background:#111;color:#eee;padding:16px;border-radius:12px;border:1px solid #333;';
      document.body.appendChild(textarea);
      textarea.select();
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '閉じる ✕';
      closeBtn.style.cssText = 'position:fixed;top:calc(50% - 32vh);right:calc(50% - 40vw + 8px);z-index:1000;padding:8px 16px;background:#6c8cff;color:white;border:none;border-radius:8px;cursor:pointer;';
      closeBtn.onclick = () => { textarea.remove(); closeBtn.remove(); };
      document.body.appendChild(closeBtn);
    });
  }

  // =====================================================================
  // 時計自動更新
  // =====================================================================

  clockInterval = setInterval(() => {
    widgets.filter(w => w.type === 'clock').forEach(w => refreshWidget(w));
  }, 10000);

  // =====================================================================
  // Utility Functions
  // =====================================================================

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  function escapeCppString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function colorToRGB565Hex(cssColor) {
    const cvs = document.createElement('canvas');
    cvs.width = 1;
    cvs.height = 1;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const r5 = (r >> 3) & 0x1F;
    const g6 = (g >> 2) & 0x3F;
    const b5 = (b >> 3) & 0x1F;
    const rgb565 = (r5 << 11) | (g6 << 5) | b5;
    return rgb565.toString(16).toUpperCase().padStart(4, '0');
  }

})();
