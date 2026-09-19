/**
 * Cadence Evening Replay Engine
 * Powers the 3-minute pre-sleep memory consolidation modal and active recall testing.
 */
(function() {
  const CadenceReplay = {
    modalOverlay: null,
    listContainer: null,
    isBlindMode: false,

    init: function() {
      this.modalOverlay = document.getElementById('replayModal');
      this.listContainer = document.getElementById('replayList');
    },

    open: function(dateStr) {
      if (!this.modalOverlay) this.init();

      const day = window.CadenceStorage.loadDay(dateStr);
      const hours = day.hours || {};
      const sortedKeys = Object.keys(hours).sort();

      this.listContainer.innerHTML = '';
      let count = 0;

      sortedKeys.forEach(hour => {
        const item = hours[hour];
        if (item && item.bullet && item.bullet.trim().length > 0) {
          count++;
          const itemEl = document.createElement('div');
          itemEl.className = 'replay-item';
          itemEl.innerHTML = `
            <div class="replay-item-time">${this.getSlotLabel(hour)}</div>
            <div class="replay-item-text">${this.formatBullets(item.bullet)}</div>
          `;
          itemEl.addEventListener('click', () => {
            itemEl.classList.toggle('revealed');
          });
          this.listContainer.appendChild(itemEl);
        }
      });

      if (count === 0) {
        this.listContainer.innerHTML = `
          <div class="replay-empty">
            No distilled notes recorded for this date yet.<br>
            Write 1–2 bullet points in any hour to enable the evening consolidation review.
          </div>
        `;
      }

      this.modalOverlay.classList.add('active');
    },

    close: function() {
      if (this.modalOverlay) {
        this.modalOverlay.classList.remove('active');
      }
    },

    toggleBlindMode: function(btn) {
      this.isBlindMode = !this.isBlindMode;
      if (this.modalOverlay) {
        this.modalOverlay.classList.toggle('blind-mode', this.isBlindMode);
      }
      if (btn) {
        btn.classList.toggle('active', this.isBlindMode);
        btn.textContent = this.isBlindMode ? '👁️ Revealing Hidden Mode' : '🧠 Test Active Recall';
      }
    },

    formatBullets: function(text) {
      // Escape HTML and format line breaks
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML.replace(/\n/g, '<br>');
    },

    getSlotLabel: function(key) {
      const map = {
        '07:00 – 08:00': '7 – 8',
        '08:00 – 09:00': '8 – 9',
        '09:00 – 10:00': '9 – 10',
        '10:00 – 11:00': '10 – 11',
        '11:00 – 12:00': '11 – 12',
        '12:00 – 13:00': '12 – 1',
        '13:00 – 14:00': '1 – 2',
        '14:00 – 15:00': '2 – 3',
        '15:00 – 16:00': '3 – 4',
        '16:00 – 17:00': '4 – 5',
        '17:00 – 18:00': '5 – 6',
        '18:00 – 19:00': '6 – 7',
        '19:00 – 20:00': '7 – 8',
        '20:00 – 21:00': '8 – 9',
        '21:00 – 22:00': '9 – 10',
        '22:00 – 23:00': '10 – 11',
        '23:00 – 24:00': '11 – 12'
      };
      return map[key] || key;
    }
  };

  window.CadenceReplay = CadenceReplay;
})();
