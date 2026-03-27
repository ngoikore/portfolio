// storage.js — работа с localStorage

const Storage = {
  KEYS: {
    CHARACTER: 'rpg_character',
    TASKS:     'rpg_tasks',
    STATS:     'rpg_stats',
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage load error:', e);
      return null;
    }
  },

  clear() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },
};
