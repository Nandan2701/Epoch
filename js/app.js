/**
 * Epoch Application Controller
 * High-craftsmanship hourly ledger, Google Calendar date picker, and buttery-smooth typing engine.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let activeDate = new Date();
  let calendarViewDate = new Date();
  let currentOpenSlot = null;
  const saveDebounceTimers = {};

  // DOM Elements
  const dateHeading = document.getElementById('dateHeading');
  const ledgerContainer = document.getElementById('ledgerContainer');

  // Calendar Elements
  const btnCalendarToggle = document.getElementById('btnCalendarToggle');
  const calendarToggleLabel = document.getElementById('calendarToggleLabel');
  const calendarPopover = document.getElementById('calendarPopover');
  const calMonthYear = document.getElementById('calMonthYear');
  const calPrevMonth = document.getElementById('calPrevMonth');
  const calNextMonth = document.getElementById('calNextMonth');
  const calGrid = document.getElementById('calGrid');
  const calJumpToday = document.getElementById('calJumpToday');

  // Date Nav Arrows
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');

  // Drawer Elements
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const streamDrawer = document.getElementById('streamDrawer');
  const drawerHourTitle = document.getElementById('drawerHourTitle');
  const rawTextarea = document.getElementById('rawTextarea');
  const drawerCaret = document.getElementById('drawerCaret');
  const drawerWordCount = document.getElementById('drawerWordCount');
  const btnMic = document.getElementById('btnMic');
  const voiceBanner = document.getElementById('voiceBanner');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');

  // Replay Elements
  const btnEveningReplay = document.getElementById('btnEveningReplay');
  const btnCloseReplay = document.getElementById('btnCloseReplay');
  const btnToggleRecall = document.getElementById('btnToggleRecall');
  const btnExportMd = document.getElementById('btnExportMd');

  // Offscreen canvas for microsecond-precise character measurements (Docs Silk Engine)
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');

  // Offscreen mirror element for computing soft-wrapped line positions in multiline textareas
  const caretMirror = document.createElement('div');
  caretMirror.style.position = 'absolute';
  caretMirror.style.top = '-9999px';
  caretMirror.style.left = '-9999px';
  caretMirror.style.visibility = 'hidden';
  caretMirror.style.whiteSpace = 'pre-wrap';
  caretMirror.style.wordWrap = 'break-word';
  caretMirror.style.overflowWrap = 'break-word';
  caretMirror.style.pointerEvents = 'none';
  document.body.appendChild(caretMirror);

  /* ==========================================================================
     Google Docs Silk Smooth Caret Engine (Gliding Cursor & Fluid Backspace)
     ========================================================================== */
  function bindSmoothCaret(input, caret) {
    if (!input || !caret) return;
    let typingTimer = null;

    function getCaretPosition() {
      const style = window.getComputedStyle(input);
      const cursorPos = input.selectionStart || 0;
      const textBefore = input.value.slice(0, cursorPos);

      caretMirror.style.width = `${input.clientWidth}px`;
      caretMirror.style.fontFamily = style.fontFamily;
      caretMirror.style.fontSize = style.fontSize;
      caretMirror.style.fontWeight = style.fontWeight;
      caretMirror.style.letterSpacing = style.letterSpacing;
      caretMirror.style.lineHeight = style.lineHeight;
      caretMirror.style.paddingLeft = style.paddingLeft;
      caretMirror.style.paddingRight = style.paddingRight;
      caretMirror.style.paddingTop = style.paddingTop;
      caretMirror.style.paddingBottom = style.paddingBottom;
      caretMirror.style.borderLeftWidth = style.borderLeftWidth;
      caretMirror.style.borderRightWidth = style.borderRightWidth;
      caretMirror.style.boxSizing = style.boxSizing;

      caretMirror.textContent = textBefore;
      const marker = document.createElement('span');
      marker.textContent = '\u200B';
      caretMirror.appendChild(marker);

      const fontSize = parseFloat(style.fontSize) || 15;
      const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.75);
      const verticalOffset = Math.max(0, Math.round((lineHeight - 19) / 2));

      const left = marker.offsetLeft;
      const top = marker.offsetTop + verticalOffset - input.scrollTop;
      return { left, top };
    }

    function updateCaretPosition() {
      if (document.activeElement !== input) return;

      const pos = getCaretPosition();
      caret.style.left = `${pos.left}px`;
      caret.style.top = `${pos.top}px`;

      // Caret stays solid during active typing/backspacing, pulses when paused
      caret.classList.add('visible', 'typing');
      caret.classList.remove('blinking');

      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        caret.classList.remove('typing');
        caret.classList.add('blinking');
      }, 450);
    }

    input.addEventListener('focus', () => {
      caret.classList.add('visible');
      updateCaretPosition();
    });

    input.addEventListener('blur', () => {
      caret.classList.remove('visible', 'typing', 'blinking');
      clearTimeout(typingTimer);
    });

    input.addEventListener('input', () => {
      updateCaretPosition();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key.startsWith('Arrow') || e.key === 'Enter') {
        requestAnimationFrame(updateCaretPosition);
      }
    });

    input.addEventListener('click', updateCaretPosition);
    input.addEventListener('keyup', updateCaretPosition);
    input.addEventListener('scroll', () => {
      const pos = getCaretPosition();
      caret.style.left = `${pos.left}px`;
      caret.style.top = `${pos.top}px`;
    }, { passive: true });

    // Expose updater on element for programmatic sync
    input._updateSmoothCaret = updateCaretPosition;
  }

  // 24 Hourly Slots (Clean format starting from 0 – 1 through night 11 – 12)
  const TIME_SLOTS = [
    { key: '00:00 – 01:00', label: '0 – 1', hour: 0 },
    { key: '01:00 – 02:00', label: '1 – 2', hour: 1 },
    { key: '02:00 – 03:00', label: '2 – 3', hour: 2 },
    { key: '03:00 – 04:00', label: '3 – 4', hour: 3 },
    { key: '04:00 – 05:00', label: '4 – 5', hour: 4 },
    { key: '05:00 – 06:00', label: '5 – 6', hour: 5 },
    { key: '06:00 – 07:00', label: '6 – 7', hour: 6 },
    { key: '07:00 – 08:00', label: '7 – 8', hour: 7 },
    { key: '08:00 – 09:00', label: '8 – 9', hour: 8 },
    { key: '09:00 – 10:00', label: '9 – 10', hour: 9 },
    { key: '10:00 – 11:00', label: '10 – 11', hour: 10 },
    { key: '11:00 – 12:00', label: '11 – 12', hour: 11 },
    { key: '12:00 – 13:00', label: '12 – 1', hour: 12 },
    { key: '13:00 – 14:00', label: '1 – 2', hour: 13 },
    { key: '14:00 – 15:00', label: '2 – 3', hour: 14 },
    { key: '15:00 – 16:00', label: '3 – 4', hour: 15 },
    { key: '16:00 – 17:00', label: '4 – 5', hour: 16 },
    { key: '17:00 – 18:00', label: '5 – 6', hour: 17 },
    { key: '18:00 – 19:00', label: '6 – 7', hour: 18 },
    { key: '19:00 – 20:00', label: '7 – 8', hour: 19 },
    { key: '20:00 – 21:00', label: '8 – 9', hour: 20 },
    { key: '21:00 – 22:00', label: '9 – 10', hour: 21 },
    { key: '22:00 – 23:00', label: '10 – 11', hour: 22 },
    { key: '23:00 – 24:00', label: '11 – 12', hour: 23 }
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
   * Check if two dates represent the same day
   */
  function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
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

    // Update Date Pill Label
    if (isToday(activeDate)) {
      calendarToggleLabel.textContent = 'Today';
      btnCalendarToggle.classList.remove('active');
    } else {
      const monthShort = activeDate.toLocaleDateString('en-US', { month: 'short' });
      calendarToggleLabel.textContent = `${monthShort} ${activeDate.getDate()}`;
      btnCalendarToggle.classList.add('active');
    }

    ledgerContainer.innerHTML = '';
    const currentRealHour = new Date().getHours();
    const isCurrentDay = isToday(activeDate);

    TIME_SLOTS.forEach(slot => {
      const entry = hoursData[slot.key] || { bullet: '', raw: '' };
      const hasBullet = entry.bullet && entry.bullet.trim().length > 0;
      const hasRaw = entry.raw && entry.raw.trim().length > 0;

      const isCurrent = isCurrentDay && (slot.hour === currentRealHour);

      const row = document.createElement('div');
      row.className = `hour-row ${isCurrent ? 'is-current' : ''}`;
      row.id = `hour-row-${slot.key.replace(/[\s–:]/g, '_')}`;

      // Calculate raw word count
      const rawWords = hasRaw ? entry.raw.trim().split(/\s+/).length : 0;
      const drawerBtnText = hasRaw 
        ? `📝 Raw Stream (${rawWords} w)`
        : `+ Raw Stream / Voice`;

      row.innerHTML = `
        <div class="time-col">
          ${isCurrent ? `<span class="current-dot" title="Current Hour"></span>` : ''}
          <div class="time-badge">${slot.label}</div>
        </div>
        <div class="content-col">
          <div class="smooth-input-wrap">
            <textarea class="bullet-input" 
                      placeholder="• "
                      rows="1">${escapeHTML(entry.bullet)}</textarea>
            <span class="smooth-caret"></span>
          </div>
        </div>
        <div class="action-col">
          <button class="btn-drawer-toggle ${hasRaw ? 'has-content' : ''}" data-key="${slot.key}">
            ${drawerBtnText}
          </button>
        </div>
      `;

      // Smooth Typing & Bullet Management
      const textarea = row.querySelector('.bullet-input');
      const caret = row.querySelector('.smooth-caret');
      autoResizeTextarea(textarea);
      bindSmoothCaret(textarea, caret);

      // On focus: if empty, start with bullet
      textarea.addEventListener('focus', () => {
        if (!textarea.value || textarea.value.trim().length === 0) {
          textarea.value = '• ';
          autoResizeTextarea(textarea);
        }
      });

      // On blur: if only bullet left, clear it
      textarea.addEventListener('blur', () => {
        if (textarea.value.trim() === '•') {
          textarea.value = '';
          autoResizeTextarea(textarea);
          debounceSaveBullet(dateKey, slot.key, '');
        }
      });

      // Keydown Handling for buttery smooth typing
      textarea.addEventListener('keydown', (e) => {
        // Enter key handling
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const val = textarea.value;
          
          // Check if current line is an empty bullet
          const lines = val.substring(0, start).split('\n');
          const currentLine = lines[lines.length - 1];

          if (currentLine.trim() === '•') {
            // Exit bullet list if pressing enter on empty bullet
            const beforeLine = val.substring(0, start - currentLine.length);
            const after = val.substring(end);
            textarea.value = beforeLine + after;
            textarea.selectionStart = textarea.selectionEnd = beforeLine.length;
          } else {
            // Create next smooth bullet
            const before = val.substring(0, start);
            const after = val.substring(end);
            textarea.value = before + '\n• ' + after;
            textarea.selectionStart = textarea.selectionEnd = start + 3;
          }

          autoResizeTextarea(textarea);
          textarea.dispatchEvent(new Event('input'));
          return;
        }

        // Backspace handling to avoid trapped bullets
        if (e.key === 'Backspace') {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          if (start === end) {
            const val = textarea.value;
            // If deleting right after a bullet '• '
            if (val.substring(start - 2, start) === '• ') {
              e.preventDefault();
              textarea.value = val.substring(0, start - 2) + val.substring(start);
              textarea.selectionStart = textarea.selectionEnd = start - 2;
              autoResizeTextarea(textarea);
              textarea.dispatchEvent(new Event('input'));
            }
          }
        }
      });

      textarea.addEventListener('input', (e) => {
        // Ensure starting bullet if user typed fresh
        const val = e.target.value;
        if (val.length === 1 && val !== '•') {
          e.target.value = '• ' + val;
          e.target.selectionStart = e.target.selectionEnd = 3;
          e.target._updateSmoothCaret?.();
        }

        autoResizeTextarea(e.target);
        debounceSaveBullet(dateKey, slot.key, e.target.value);
      });

      // Handle paste of multiline bullets
      textarea.addEventListener('paste', () => {
        setTimeout(() => autoResizeTextarea(textarea), 0);
      });

      // Drawer Toggle
      const drawerBtn = row.querySelector('.btn-drawer-toggle');
      drawerBtn.addEventListener('click', () => {
        openDrawer(slot);
      });

      ledgerContainer.appendChild(row);
    });

    // Recompute accurate rendered heights for all textareas now that all rows are attached to the active DOM
    requestAnimationFrame(() => {
      ledgerContainer.querySelectorAll('.bullet-input').forEach(ta => {
        autoResizeTextarea(ta);
      });
    });
  }

  /**
   * Dynamic height auto-resizer with zero lag - expands infinitely for any number of bullet points
   */
  function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    const computedHeight = Math.max(44, el.scrollHeight + 4);
    el.style.height = `${computedHeight}px`;
    if (el._updateSmoothCaret) {
      el._updateSmoothCaret();
    }
  }

  /**
   * Debounced save for bullet summaries
   */
  function debounceSaveBullet(dateKey, slotKey, value) {
    const key = `bullet_${slotKey}`;
    clearTimeout(saveDebounceTimers[key]);
    saveDebounceTimers[key] = setTimeout(() => {
      window.CadenceStorage.saveHour(dateKey, slotKey, { bullet: value });
    }, 350);
  }

  /**
   * Debounced save for raw stream textarea
   */
  function debounceSaveRaw(dateKey, slotKey, value) {
    const key = `raw_${slotKey}`;
    clearTimeout(saveDebounceTimers[key]);
    saveDebounceTimers[key] = setTimeout(() => {
      window.CadenceStorage.saveHour(dateKey, slotKey, { raw: value });
      updateDrawerButtonState(slotKey, value);
    }, 350);
  }

  /**
   * Update drawer button visual state in the ledger
   */
  function updateDrawerButtonState(slotKey, rawText) {
    const hasRaw = rawText && rawText.trim().length > 0;
    const words = hasRaw ? rawText.trim().split(/\s+/).length : 0;

    const row = document.getElementById(`hour-row-${slotKey.replace(/[\s–:]/g, '_')}`);
    if (row) {
      const btn = row.querySelector('.btn-drawer-toggle');
      if (btn) {
        btn.className = `btn-drawer-toggle ${hasRaw ? 'has-content' : ''}`;
        btn.textContent = hasRaw ? `📝 Raw Stream (${words} w)` : `+ Raw Stream / Voice`;
      }
    }
  }

  /**
   * Drawer Logic
   */
  function openDrawer(slot) {
    currentOpenSlot = slot;
    const dateKey = formatDateKey(activeDate);
    const dayData = window.CadenceStorage.loadDay(dateKey);
    const entry = dayData.hours?.[slot.key] || { raw: '' };

    drawerHourTitle.textContent = `${slot.label}`;
    rawTextarea.value = entry.raw || '';
    updateWordCount(entry.raw || '');

    drawerBackdrop.classList.add('active');
    streamDrawer.classList.add('open');

    setTimeout(() => {
      rawTextarea.focus();
      rawTextarea._updateSmoothCaret?.();
    }, 200);
  }

  function closeDrawer() {
    if (window.CadenceSpeech && window.CadenceSpeech.isListening) {
      window.CadenceSpeech.stop();
    }
    streamDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
    currentOpenSlot = null;
  }

  function updateWordCount(text) {
    const trimmed = text.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
    const chars = text.length;
    drawerWordCount.innerHTML = `<strong>${words}</strong> words &bull; ${chars} characters`;
  }

  // Bind Docs Silk Smooth Caret to Raw Textarea Drawer
  bindSmoothCaret(rawTextarea, drawerCaret);

  // Raw Textarea Input Listener
  rawTextarea.addEventListener('input', (e) => {
    updateWordCount(e.target.value);
    if (currentOpenSlot) {
      const dateKey = formatDateKey(activeDate);
      debounceSaveRaw(dateKey, currentOpenSlot.key, e.target.value);
    }
  });

  // Drawer Close Actions
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  // Speech Recognition integration
  if (window.CadenceSpeech) {
    window.CadenceSpeech.onStateChange = (isListening) => {
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

  // ==========================================================================
  // GOOGLE CALENDAR POPOVER LOGIC
  // ==========================================================================
  function renderCalendar() {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    // Set Month Year title (e.g. September 2026)
    calMonthYear.textContent = calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    calGrid.innerHTML = '';

    // First day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const el = document.createElement('div');
      el.className = 'cal-day cal-day-other';
      el.textContent = dayNum;
      calGrid.appendChild(el);
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(year, month, day);
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = day;

      if (isToday(thisDate)) {
        el.classList.add('cal-day-today');
      }
      if (isSameDay(thisDate, activeDate)) {
        el.classList.add('cal-day-selected');
      }

      el.addEventListener('click', () => {
        activeDate = new Date(year, month, day);
        calendarViewDate = new Date(activeDate);
        closeCalendarPopover();
        renderDay();
      });

      calGrid.appendChild(el);
    }

    // 3. Next month leading days to complete full weeks (up to 35 or 42)
    const totalRendered = firstDayIndex + daysInMonth;
    const remainingSlots = (totalRendered <= 35) ? (35 - totalRendered) : (42 - totalRendered);

    for (let day = 1; day <= remainingSlots; day++) {
      const el = document.createElement('div');
      el.className = 'cal-day cal-day-other';
      el.textContent = day;
      calGrid.appendChild(el);
    }
  }

  function toggleCalendarPopover() {
    const isOpen = calendarPopover.classList.contains('open');
    if (isOpen) {
      closeCalendarPopover();
    } else {
      openCalendarPopover();
    }
  }

  function openCalendarPopover() {
    calendarViewDate = new Date(activeDate);
    renderCalendar();
    calendarPopover.classList.add('open');
  }

  function closeCalendarPopover() {
    calendarPopover.classList.remove('open');
  }

  // Calendar Event Listeners
  btnCalendarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCalendarPopover();
  });

  dateHeading.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCalendarPopover();
  });

  calPrevMonth.addEventListener('click', (e) => {
    e.stopPropagation();
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    renderCalendar();
  });

  calNextMonth.addEventListener('click', (e) => {
    e.stopPropagation();
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    renderCalendar();
  });

  calJumpToday.addEventListener('click', (e) => {
    e.stopPropagation();
    activeDate = new Date();
    calendarViewDate = new Date(activeDate);
    closeCalendarPopover();
    renderDay();
  });

  // Close calendar popover on outside click
  document.addEventListener('click', (e) => {
    if (!calendarPopover.contains(e.target) && 
        !btnCalendarToggle.contains(e.target) && 
        !dateHeading.contains(e.target)) {
      closeCalendarPopover();
    }
  });

  // Date Navigation Arrows
  btnPrevDay.addEventListener('click', () => {
    activeDate.setDate(activeDate.getDate() - 1);
    calendarViewDate = new Date(activeDate);
    renderDay();
  });

  btnNextDay.addEventListener('click', () => {
    activeDate.setDate(activeDate.getDate() + 1);
    calendarViewDate = new Date(activeDate);
    renderDay();
  });

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

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeCalendarPopover();
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

  // Maintain accurate dynamic heights across font loading and viewport changes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ledgerContainer.querySelectorAll('.bullet-input').forEach(ta => {
        autoResizeTextarea(ta);
      });
    });
  }

  window.addEventListener('resize', () => {
    ledgerContainer.querySelectorAll('.bullet-input').forEach(ta => {
      autoResizeTextarea(ta);
    });
  });

  // Initial Boot
  renderDay();
});
