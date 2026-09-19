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
            <div class="replay-item-time">${hour}</div>
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
    }
  };

  window.CadenceReplay = CadenceReplay;
})();
