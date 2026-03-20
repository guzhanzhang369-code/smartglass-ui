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
      content: 'Hello!'
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
      content: '05:00'
    },
    bargraph: {
      label: '棒グラフ',
      x: 2, y: 1,
      fontSize: 9,
      color: '#FFFFFF',
      content: ''
    },
    schedule: {
      label: '計画表',
      x: 10, y: 10,
      fontSize: 11,
      color: '#E0E0E0',
      content: '1限 数学\n2限 英語\n3限 理科'
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
    timer: '⏱️ タイマー', bargraph: '📊 棒グラフ',
    schedule: '📅 計画表', weather: '🌤️ 天気'
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
      case 'text':
        return `<div class="widget-render type-text" style="font-size:${w.fontSize * scale}px; color:${w.color};">${escapeHtml(w.content)}</div>`;

      case 'study': {
        // ★ 教科別勉強タイマー（プレビュー）
        return `<div class="widget-render type-study" style="color:${w.color};">
          <div style="font-size:${12 * scale}px; margin-bottom:4px;">📚 代数</div>
          <div style="font-size:${w.fontSize * scale}px; font-weight:600; font-family:'JetBrains Mono',monospace;">00:00</div>
        </div>`;
      }

      case 'timer':
        return `<div class="widget-render type-timer" style="font-size:${w.fontSize * scale}px; color:${w.color};">${escapeHtml(w.content)}</div>`;

      case 'bargraph': {
        let html = '<div class="widget-render type-bargraph">';
        SUBJECTS.forEach((subj, i) => {
          const val = Math.floor(Math.random() * 60) + 5;
          html += `<div class="bar-item">
            <span class="bar-label" style="font-size:${Math.max(7, w.fontSize - 1) * scale}px;">${subj}</span>
            <div class="bar-fill" style="width:${val}px; background:${PASTEL_COLORS[i]};"></div>
          </div>`;
        });
        html += '</div>';
        return html;
      }

      case 'schedule': {
        const lines = w.content.split('\n').map(l => escapeHtml(l)).join('<br>');
        return `<div class="widget-render type-schedule" style="font-size:${w.fontSize * scale}px; color:${w.color}; line-height:1.7;">${lines}</div>`;
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
    el.style.left = `${widget.x * SCALE}px`;
    el.style.top = `${widget.y * SCALE}px`;
    el.innerHTML = renderWidgetContent(widget) +
      `<div class="delete-btn" data-delete-id="${widget.id}">✕</div>` +
      `<div class="resize-handle" data-resize-id="${widget.id}"></div>`;
    return el;
  }

  function refreshWidget(widget) {
    const el = document.getElementById(`widget-${widget.id}`);
    if (!el) return;
    el.style.left = `${widget.x * SCALE}px`;
    el.style.top = `${widget.y * SCALE}px`;
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
    if (['text', 'timer', 'schedule', 'weather'].includes(widget.type)) {
      const isMultiline = widget.type === 'schedule';
      html += `
        <div class="prop-group">
          <div class="prop-label">内容</div>
          ${isMultiline
            ? `<textarea class="prop-input" id="prop-content" rows="4" style="resize:vertical;">${escapeHtml(widget.content)}</textarea>`
            : `<input type="text" class="prop-input" id="prop-content" value="${escapeHtml(widget.content)}">`}
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
    if (propContent) propContent.addEventListener('input', () => {
      widget.content = propContent.value;
      refreshWidget(widget);
    });

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
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('widget-type', card.dataset.widgetType);
        e.dataTransfer.effectAllowed = 'copy';
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
      const screenRect = screenEl.getBoundingClientRect();
      let newX = Math.round((e.clientX - screenRect.left - offsetX) / SCALE);
      let newY = Math.round((e.clientY - screenRect.top - offsetY) / SCALE);
      widget.x = clamp(newX, 0, SCREEN_W - 10);
      widget.y = clamp(newY, 0, SCREEN_H - 5);
      el.style.left = `${widget.x * SCALE}px`;
      el.style.top = `${widget.y * SCALE}px`;
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
          code += `  canvas.setFont(&fonts::lgfxJapanGothicP_8);\n`;
          code += `  canvas.setTextSize(${Math.max(1, Math.round(w.fontSize / 8))});\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          code += `  canvas.setCursor(${w.x}, ${w.y});\n`;
          code += `  canvas.print("${escapeCppString(w.content)}");\n\n`;
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
        case 'bargraph':
          code += `  { int bx=${w.x},by=${w.y}; int mx=0;\n`;
          code += `    for(int i=0;i<SUBJECT_COUNT;i++) if(localSeconds[i]>mx)mx=localSeconds[i];\n`;
          code += `    if(mx==0)mx=1;\n`;
          code += `    for(int i=0;i<SUBJECT_COUNT;i++){\n`;
          code += `      canvas.setFont(&fonts::lgfxJapanGothicP_8); canvas.setTextSize(1); canvas.setTextColor(WHITE);\n`;
          code += `      canvas.setCursor(bx,by); canvas.print(subjects[i]);\n`;
          code += `      int w=(int)(((float)localSeconds[i]/(float)mx)*70.0);\n`;
          code += `      if(w>70)w=70; if(localSeconds[i]>0&&w==0)w=1;\n`;
          code += `      canvas.fillRect(bx+55,by+2,w,4,pastelColors[i]); by+=12;\n`;
          code += `  }}\n\n`;
          break;
        case 'schedule': {
          const lines = w.content.split('\n');
          code += `  canvas.setFont(&fonts::lgfxJapanGothicP_8); canvas.setTextSize(1);\n`;
          code += `  canvas.setTextColor(0x${colorToRGB565Hex(w.color)});\n`;
          lines.forEach((line, i) => {
            code += `  canvas.setCursor(${w.x}, ${w.y + i * 14}); canvas.print("${escapeCppString(line)}");\n`;
          });
          code += '\n';
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
