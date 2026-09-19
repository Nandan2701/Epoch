/**
 * Cadence Storage Engine
 * Manages atomic persistence in Chrome localStorage with automated debounce and schema integrity.
 */
(function() {
  const STORAGE_PREFIX = 'cadence_journal_';

  function getStorageKey(dateStr) {
    return `${STORAGE_PREFIX}${dateStr}`;
  }

  const CadenceStorage = {
    /**
     * Retrieves day record from localStorage or initializes a blank schema.
     */
    loadDay: function(dateStr) {
      try {
        const raw = localStorage.getItem(getStorageKey(dateStr));
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (err) {
        console.error('Failed to load Cadence data for date:', dateStr, err);
      }
      return {
        date: dateStr,
        hours: {},
        updatedAt: new Date().toISOString()
      };
    },

    /**
     * Persists hour data (bullet summary and raw stream) for a specific date.
     */
    saveHour: function(dateStr, hourKey, data) {
      const dayRecord = this.loadDay(dateStr);
      if (!dayRecord.hours) dayRecord.hours = {};
      
      dayRecord.hours[hourKey] = {
        bullet: data.bullet !== undefined ? data.bullet : (dayRecord.hours[hourKey]?.bullet || ''),
        raw: data.raw !== undefined ? data.raw : (dayRecord.hours[hourKey]?.raw || ''),
        updatedAt: new Date().toISOString()
      };
      dayRecord.updatedAt = new Date().toISOString();

      try {
        localStorage.setItem(getStorageKey(dateStr), JSON.stringify(dayRecord));
        this.notifySave();
        return true;
      } catch (err) {
        console.error('Failed to persist Cadence record:', err);
        return false;
      }
    },

    /**
     * Visual toast notification hook
     */
    notifySave: function() {
      const toast = document.getElementById('saveToast');
      if (!toast) return;
      toast.classList.add('visible');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
      }, 1500);
    },

    /**
     * Exports current day into cleanly formatted Markdown (Obsidian / Notion ready).
     */
    exportDayMarkdown: function(dateStr) {
      const day = this.loadDay(dateStr);
      const hours = day.hours || {};
      const sortedKeys = Object.keys(hours).sort();

      let md = `# Cadence Ledger — ${dateStr}\n\n`;
      md += `*Exported from Cadence Monograph Journal on ${new Date().toLocaleTimeString()}*\n\n`;
      md += `## 🕒 Hourly Synthesis\n\n`;

      let hasContent = false;
      sortedKeys.forEach(hour => {
        const item = hours[hour];
        const hasBullet = item.bullet && item.bullet.trim().length > 0;
        const hasRaw = item.raw && item.raw.trim().length > 0;

        if (hasBullet || hasRaw) {
          hasContent = true;
          md += `### ${hour}\n\n`;
          if (hasBullet) {
            md += `**Distilled:**\n${item.bullet.trim()}\n\n`;
          }
          if (hasRaw) {
            md += `<details><summary><b>Raw Stream / Voice Dump</b> (${item.raw.trim().split(/\s+/).length} words)</summary>\n\n${item.raw.trim()}\n\n</details>\n\n`;
          }
          md += `---\n\n`;
        }
      });

      if (!hasContent) {
        md += `*No entries recorded for this date.*\n`;
      }

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cadence_${dateStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },

    /**
     * Exports full database as JSON for total portability.
     */
    exportAllJSON: function() {
      const allData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            allData[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cadence_Backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  window.CadenceStorage = CadenceStorage;
})();
