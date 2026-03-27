// character.js — логика персонажа

class Character {
  constructor(name = 'Герой', avatar = '⚔️') {
    this.name      = name;
    this.avatar    = avatar;
    this.level     = 1;
    this.xp        = 0;
    this.createdAt = new Date().toLocaleDateString('ru');
  }

  getXpToNextLevel() {
    return 100 * this.level;
  }

  getXpPercent() {
    return Math.min((this.xp / this.getXpToNextLevel()) * 100, 100);
  }

  addExperience(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.getXpToNextLevel()) {
      this.xp -= this.getXpToNextLevel();
      this.levelUp();
      leveled = true;
    }
    this.save();
    return leveled;
  }

  levelUp() {
    this.level++;
  }

  save() {
    Storage.save(Storage.KEYS.CHARACTER, {
      name:      this.name,
      avatar:    this.avatar,
      level:     this.level,
      xp:        this.xp,
      createdAt: this.createdAt,
    });
  }

  static load() {
    const data = Storage.load(Storage.KEYS.CHARACTER);
    if (!data) return null;
    const c = new Character(data.name, data.avatar);
    c.level     = data.level;
    c.xp        = data.xp;
    c.createdAt = data.createdAt;
    return c;
  }
}
