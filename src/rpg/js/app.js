// app.js — главный файл приложения

let character = null;
let taskManager = new TaskManager();
let stats = { totalCompleted: 0, totalXp: 0 };

// ===== INIT =====
function init() {
  taskManager.load();

  const saved = Character.load();
  if (saved) {
    character = saved;
    loadStats();
    showApp();
  } else {
    showSetup();
  }
}

function loadStats() {
  const s = Storage.load(Storage.KEYS.STATS);
  if (s) stats = s;
}

function saveStats() {
  Storage.save(Storage.KEYS.STATS, stats);
}

// ===== SETUP SCREEN =====
function showSetup() {
  document.getElementById('setupScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
}

function showApp() {
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  renderAll();
}

document.getElementById('setupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name   = document.getElementById('heroName').value.trim() || 'Герой';
  const avatar = document.querySelector('.avatar-opt.selected')?.dataset.avatar || '⚔️';
  character = new Character(name, avatar);
  character.save();
  showApp();
});

document.querySelectorAll('.avatar-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// ===== RENDER ALL =====
function renderAll() {
  renderCharacter();
  renderTasks();
  renderStats();
}

// ===== CHARACTER RENDER =====
function renderCharacter() {
  if (!character) return;
  document.getElementById('charAvatar').textContent  = character.avatar;
  document.getElementById('charName').textContent    = character.name;
  document.getElementById('charLevel').textContent   = character.level;
  document.getElementById('charXp').textContent      = character.xp;
  document.getElementById('charXpMax').textContent   = character.getXpToNextLevel();

  const pct = character.getXpPercent();
  const bar = document.getElementById('xpBar');
  bar.style.width = pct + '%';
  bar.setAttribute('aria-valuenow', pct);
}

// ===== TASK FORM =====
let selectedDiff = 'medium';

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDiff = btn.dataset.diff;
  });
});

document.getElementById('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const desc  = document.getElementById('taskDesc').value.trim();
  if (!title) { shake(document.getElementById('taskTitle')); return; }

  const task = new Task(title, desc, selectedDiff);
  taskManager.addTask(task);
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value  = '';
  renderTasks();
  showToast(`📋 Задача добавлена! Выполни её и получи +${task.xp} XP`);
});

// ===== RENDER TASKS =====
function renderTasks() {
  renderActiveList();
  renderCompletedList();
}

function renderActiveList() {
  const list = document.getElementById('activeList');
  const tasks = taskManager.getActive();

  if (tasks.length === 0) {
    list.innerHTML = '<p class="empty-msg">Нет активных задач. Добавь первый квест! ⚔️</p>';
    return;
  }

  list.innerHTML = tasks.map(t => taskCardHTML(t, false)).join('');
  attachTaskEvents(list, false);
}

function renderCompletedList() {
  const list = document.getElementById('completedList');
  const tasks = taskManager.getCompleted();
  const section = document.getElementById('completedSection');

  if (tasks.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  list.innerHTML = tasks.map(t => taskCardHTML(t, true)).join('');
  attachTaskEvents(list, true);
}

function taskCardHTML(task, done) {
  const d = DIFFICULTY[task.difficulty];
  return `
  <div class="task-card ${done ? 'done' : ''}" data-id="${task.id}">
    <div class="task-top">
      <label class="task-check">
        <input type="checkbox" class="chk" ${done ? 'checked' : ''} />
        <span class="chk-box"></span>
      </label>
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        ${done && task.completedAt ? `<div class="task-meta">✅ Выполнено: ${task.completedAt}</div>` : ''}
        ${!done ? `<div class="task-meta">📅 ${task.createdAt}</div>` : ''}
      </div>
      <div class="task-right">
        <span class="diff-badge" style="background:${d.color}22;color:${d.color};border-color:${d.color}44">
          ${d.icon} ${d.label}
        </span>
        <span class="xp-badge">+${task.xp} XP</span>
        <button class="del-btn" title="Удалить">🗑</button>
      </div>
    </div>
  </div>`;
}

function attachTaskEvents(container, done) {
  container.querySelectorAll('.chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.closest('.task-card').dataset.id;
      if (chk.checked) handleComplete(id);
      else             handleUncomplete(id);
    });
  });
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.task-card').dataset.id;
      const card = btn.closest('.task-card');
      card.classList.add('removing');
      setTimeout(() => {
        taskManager.removeTask(id);
        renderTasks();
      }, 300);
    });
  });
}

function handleComplete(id) {
  const task = taskManager.completeTask(id);
  if (!task) return;

  stats.totalCompleted++;
  stats.totalXp += task.xp;
  saveStats();

  const leveled = character.addExperience(task.xp);
  renderAll();
  showXpToast(task.xp, leveled);
  if (leveled) showLevelUp();
}

function handleUncomplete(id) {
  const task = taskManager.uncompleteTask(id);
  if (!task) return;

  stats.totalCompleted = Math.max(0, stats.totalCompleted - 1);
  stats.totalXp        = Math.max(0, stats.totalXp - task.xp);
  saveStats();

  // Subtract XP (clamp to 0, don't de-level for simplicity)
  character.xp = Math.max(0, character.xp - task.xp);
  character.save();
  renderAll();
  showToast(`↩️ Задача возвращена в список. −${task.xp} XP`);
}

// ===== STATS =====
function renderStats() {
  document.getElementById('statCompleted').textContent = stats.totalCompleted;
  document.getElementById('statXp').textContent        = stats.totalXp;
  document.getElementById('statCreated').textContent   = character?.createdAt || '—';
  document.getElementById('statLevel').textContent     = character?.level || 1;
}

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});

// ===== RESET =====
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('hidden');
});
document.getElementById('cancelReset').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.add('hidden');
});
document.getElementById('confirmReset').addEventListener('click', () => {
  Storage.clear();
  location.reload();
});

// ===== TOAST / NOTIFICATIONS =====
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

function showXpToast(xp, leveled) {
  showToast(`✨ +${xp} XP получено!${leveled ? ' 🎉 Новый уровень!' : ''}`);
}

function showLevelUp() {
  const overlay = document.getElementById('levelUpOverlay');
  document.getElementById('newLevelNum').textContent = character.level;
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
  // confetti burst
  spawnConfetti();
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.classList.add('hidden'), 500);
  }, 2800);
}

function spawnConfetti() {
  const colors = ['#fbbf24','#00e5ff','#a855f7','#22c55e','#f472b6'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*0.5}s;
      animation-duration:${0.8 + Math.random()*1}s;
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.getElementById('confettiWrap').appendChild(el);
  }
  setTimeout(() => document.getElementById('confettiWrap').innerHTML = '', 3000);
}

// ===== UTILS =====
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function shake(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

// ===== START =====
init();
