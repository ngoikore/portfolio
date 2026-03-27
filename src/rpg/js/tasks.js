// tasks.js — логика задач

const DIFFICULTY = {
  easy:   { label: 'Лёгкая',   xp: 10,  icon: '🌿', color: '#22c55e' },
  medium: { label: 'Средняя',  xp: 25,  icon: '⚡',  color: '#f59e0b' },
  hard:   { label: 'Сложная',  xp: 50,  icon: '🔥',  color: '#ef4444' },
  epic:   { label: 'Эпическая',xp: 100, icon: '💀',  color: '#a855f7' },
};

class Task {
  constructor(title, description = '', difficulty = 'medium') {
    this.id          = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.title       = title;
    this.description = description;
    this.difficulty  = difficulty;
    this.xp          = DIFFICULTY[difficulty].xp;
    this.completed   = false;
    this.createdAt   = new Date().toLocaleString('ru');
    this.completedAt = null;
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
  }

  addTask(task) {
    this.tasks.unshift(task);
    this.save();
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
  }

  completeTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    task.completed   = true;
    task.completedAt = new Date().toLocaleString('ru');
    this.save();
    return task;
  }

  uncompleteTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    task.completed   = false;
    task.completedAt = null;
    this.save();
    return task;
  }

  getActive()    { return this.tasks.filter(t => !t.completed); }
  getCompleted() { return this.tasks.filter(t =>  t.completed); }
  getTasks()     { return this.tasks; }

  save() {
    Storage.save(Storage.KEYS.TASKS, this.tasks);
  }

  load() {
    const data = Storage.load(Storage.KEYS.TASKS);
    if (data && Array.isArray(data)) this.tasks = data;
  }
}
