/**
 * Cadence Application Controller
 * Orchestrates the hourly ledger, date navigator, drawer interactions, and real-time metrics.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let activeDate = new Date();
  let currentOpenHour = null;
  const saveDebounceTimers = {};

  // DOM Elements
  const dateHeading = document.getElementById('dateHeading');
  const dateSub = document.getElementById('dateSub');
  const ledgerContainer = document.getElementById('ledgerContainer');
  const loggedMetric = document.getElementById('loggedMetric');
  const progressFill = document.getElementById('progressFill');

  // Drawer Elements
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const streamDrawer = document.getElementById('streamDrawer');
  const drawerHourTitle = document.getElementById('drawerHourTitle');
  const rawTextarea = document.getElementById('rawTextarea');
  const drawerWordCount = document.getElementById('drawerWordCount');
  const btnMic = document.getElementById('btnMic');
  const voiceBanner = document.getElementById('voiceBanner');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');

  // Replay Elements
  const btnEveningReplay = document.getElementById('btnEveningReplay');
  const btnCloseReplay = document.getElementById('btnCloseReplay');
  const btnToggleRecall = document.getElementById('btnToggleRecall');
  const btnExportMd = document.getElementById('btnExportMd');

  // Date Navigation Buttons
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnToday = document.getElementById('btnToday');

  // Hours array: 07:00 to 23:00
  const HOURS = [
    '07:00 – 08:00', '08:00 – 09:00', '09:00 – 10:00', '10:00 – 11:00',
    '11:00 – 12:00', '12:00 – 13:00', '13:00 – 14:00', '14:00 – 15:00',
    '15:00 – 16:00', '16:00 – 17:00', '17:00 – 18:00', '18:00 – 19:00',
    '19:00 – 20:00', '20:00 – 21:00', '21:00 – 22:00', '22:00 – 23:00',
    '23:00 – 24:00'
  ];

  /**
   * Helper: Format Date to YYYY-MM-DD
   */
  function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Format Editorial Long Date
   */
  function formatEditorialDate(d) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  /**
   * Checks if a given date is today
   */
  function isToday(d) {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  /**
   * Get current hour slot index
   */
  function getCurrentHourSlot() {
    const currentHour = new Date().getHours();
    const startStr = String(currentHour).padStart(2, '0') + ':00';
    return HOURS.find(h => h.startsWith(startStr));
  }

  /**
   * Render the entire day's hourly ledger
   */
  function renderDay() {
    const dateKey = formatDateKey(activeDate);
    const dayData = window.CadenceStorage.loadDay(dateKey);
    const hoursData = dayData.hours || {};

    // Update Masthead Date
    dateHeading.textContent = formatEditorialDate(activeDate);
    
    // Sub-header details
    const isTodayActive = isToday(activeDate);
    dateSub.textContent = isTodayActive 
      ? `Active Ledger • Week ${getWeekNumber(activeDate)} • Continuous Local Autosave`
      : `Historical Archive • ${dateKey} • Local Storage`;

    ledgerContainer.innerHTML = '';
    let loggedCount = 0;
    const currentHourSlot = isTodayActive ? getCurrentHourSlot() : null;

    HOURS.forEach(hour => {
      const entry = hoursData[hour] || { bullet: '', raw: '' };
      const hasBullet = entry.bullet && entry.bullet.trim().length > 0;
      const hasRaw = entry.raw && entry.raw.trim().length > 0;
      if (hasBullet || hasRaw) loggedCount++;

      const isCurrent = (hour === currentHourSlot);

      const row = document.createElement('div');
      row.className = `hour-row ${isCurrent ? 'is-current' : ''}`;
      row.id = `hour-row-${hour.replace(/[\s–:]/g, '_')}`;

      // Calculate raw word count
      const rawWords = hasRaw ? entry.raw.trim().split(/\s+/).length : 0;
      const drawerBtnText = hasRaw 
        ? `📝 Raw Stream (${rawWords} w)`
        : `+ Raw Stream / Voice`;

      row.innerHTML = `
        <div class="time-col">
          <div class="time-badge">${hour}</div>
          ${isCurrent ? `<span class="current-indicator">Current Hour</span>` : ''}
        </div>
        <div class="content-col">
          <textarea class="bullet-input" 
                    placeholder="• 1–2 key learnings, decisions, or deltas from this hour..."
                    rows="2">${escapeHTML(entry.bullet)}</textarea>
        </div>
        <div class="action-col">
          <button class="btn-drawer-toggle ${hasRaw ? 'has-content' : ''}" data-hour="${hour}">
            ${drawerBtnText}
          </button>
        </div>
      `;

      // Bullet Input Event Listeners
      const textarea = row.querySelector('.bullet-input');
      autoResizeTextarea(textarea);

      textarea.addEventListener('input', (e) => {
        autoResizeTextarea(e.target);
        handleBulletTyping(e.target);
        debounceSaveBullet(dateKey, hour, e.target.value);
        updateProgress();
      });

      // Handle Enter for clean bullet continuation
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          const before = value.substring(0, start);
          const after = value.substring(end);
          
          textarea.value = before + '\n• ' + after;
          textarea.selectionStart = textarea.selectionEnd = start + 3;
          autoResizeTextarea(textarea);
          textarea.dispatchEvent(new Event('input'));
        }
      });

      // Raw Stream Drawer Toggle
      const drawerBtn = row.querySelector('.btn-drawer-toggle');
      drawerBtn.addEventListener('click', () => {
        openDrawer(hour);
      });

      ledgerContainer.appendChild(row);
    });

    updateProgressMetrics(loggedCount, HOURS.length);
  }

  /**
   * Auto-prefix bullet if starting fresh
   */
  function handleBulletTyping(el) {
    if (el.value.length === 1 && el.value !== '•') {
      el.value = '• ' + el.value;
    }
  }

  /**
   * Dynamic height auto-resizer
   */
  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
  }

  /**
   * Debounced save for bullet summaries
   */
  function debounceSaveBullet(dateKey, hour, value) {
    const key = `bullet_${hour}`;
    clearTimeout(saveDebounceTimers[key]);
    saveDebounceTimers[key] = setTimeout(() => {
      window.CadenceStorage.saveHour(dateKey, hour, { bullet: value });
    }, 350);
  }

  /**
   * Debounced save for raw stream textarea
   */
  function debounceSaveRaw(dateKey, hour, value) {
    const key = `raw_${hour}`;
    clearTimeout(saveDebounceTimers[key]);
    saveDebounceTimers[key] = setTimeout(() => {
      window.CadenceStorage.saveHour(dateKey, hour, { raw: value });
      updateDrawerButtonState(hour, value);
    }, 350);
  }

  /**
   * Update drawer button visual state in the ledger
   */
  function updateDrawerButtonState(hour, rawText) {
    const dateKey = formatDateKey(activeDate);
    const dayData = window.CadenceStorage.loadDay(dateKey);
    const hasRaw = rawText && rawText.trim().length > 0;
    const words = hasRaw ? rawText.trim().split(/\s+/).length : 0;

    const row = document.getElementById(`hour-row-${hour.replace(/[\s–:]/g, '_')}`);
    if (row) {
      const btn = row.querySelector('.btn-drawer-toggle');
      if (btn) {
        btn.className = `btn-drawer-toggle ${hasRaw ? 'has-content' : ''}`;
        btn.textContent = hasRaw ? `📝 Raw Stream (${words} w)` : `+ Raw Stream / Voice`;
      }
    }
  }

  /**
   * Update header progress metric and fill bar
   */
  function updateProgressMetrics(logged, total) {
    loggedMetric.textContent = `${logged} of ${total} hours logged`;
    const pct = Math.round((logged / total) * 100);
    progressFill.style.width = `${pct}%`;
  }

  function updateProgress() {
    const dateKey = formatDateKey(activeDate);
    const dayData = window.CadenceStorage.loadDay(dateKey);
    const hoursData = dayData.hours || {};
    let logged = 0;
    HOURS.forEach(h => {
      const entry = hoursData[h];
      if ((entry?.bullet && entry.bullet.trim().length > 0) || (entry?.raw && entry.raw.trim().length > 0)) {
        logged++;
      }
    });
    updateProgressMetrics(logged, HOURS.length);
  }

  /**
   * Drawer Logic
   */
  function openDrawer(hour) {
    currentOpenHour = hour;
    const dateKey = formatDateKey(activeDate);
    const dayData = window.CadenceStorage.loadDay(dateKey);
    const entry = dayData.hours?.[hour] || { raw: '' };

    drawerHourTitle.textContent = `${hour}`;
    rawTextarea.value = entry.raw || '';
    updateWordCount(entry.raw || '');

    drawerBackdrop.classList.add('active');
    streamDrawer.classList.add('open');

    // Focus textarea after slide animation
    setTimeout(() => {
      rawTextarea.focus();
    }, 200);
  }

  function closeDrawer() {
    if (window.CadenceSpeech && window.CadenceSpeech.isListening) {
      window.CadenceSpeech.stop();
    }
    streamDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
    currentOpenHour = null;
  }

  function updateWordCount(text) {
    const trimmed = text.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
    const chars = text.length;
    drawerWordCount.innerHTML = `<strong>${words}</strong> words &bull; ${chars} characters`;
  }

  // Raw Textarea Input Listener
  rawTextarea.addEventListener('input', (e) => {
    updateWordCount(e.target.value);
    if (currentOpenHour) {
      const dateKey = formatDateKey(activeDate);
      debounceSaveRaw(dateKey, currentOpenHour, e.target.value);
    }
  });

  // Drawer Close Actions
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  // Speech Recognition integration
  if (window.CadenceSpeech) {
    window.CadenceSpeech.onStateChange = (isListening, error) => {
      if (isListening) {
        btnMic.classList.add('recording');
        btnMic.querySelector('.mic-label').textContent = 'Listening...';
        voiceBanner.classList.add('active');
      } else {
        btnMic.classList.remove('recording');
        btnMic.querySelector('.mic-label').textContent = 'Voice Dictation';
        voiceBanner.classList.remove('active');
      }
    };

    btnMic.addEventListener('click', () => {
      window.CadenceSpeech.toggle(rawTextarea);
    });
  }

  // Evening Replay Modal
  btnEveningReplay.addEventListener('click', () => {
    const dateKey = formatDateKey(activeDate);
    window.CadenceReplay.open(dateKey);
  });

  btnCloseReplay.addEventListener('click', () => {
    window.CadenceReplay.close();
  });

  btnToggleRecall.addEventListener('click', () => {
    window.CadenceReplay.toggleBlindMode(btnToggleRecall);
  });

  // Export Markdown
  btnExportMd.addEventListener('click', () => {
    const dateKey = formatDateKey(activeDate);
    window.CadenceStorage.exportDayMarkdown(dateKey);
  });

  // Date Navigation Handlers
  btnPrevDay.addEventListener('click', () => {
    activeDate.setDate(activeDate.getDate() - 1);
    renderDay();
  });

  btnNextDay.addEventListener('click', () => {
    activeDate.setDate(activeDate.getDate() + 1);
    renderDay();
  });

  btnToday.addEventListener('click', () => {
    activeDate = new Date();
    renderDay();
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc closes drawer or modal
    if (e.key === 'Escape') {
      closeDrawer();
      window.CadenceReplay.close();
    }
  });

  // Utility: Escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  // Utility: ISO Week number
  function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  // Initial Boot
  renderDay();
});
