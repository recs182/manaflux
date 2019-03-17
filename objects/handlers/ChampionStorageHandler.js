const fs = require('fs'), path = require('path');
class ChampionSelectHandler {
  constructor() {
    this.path = path.join(require('electron').remote.app.getPath('userData'), '\\ChampionData');
    this._cache = {};
  }

  async load() {
    await Mana.utils.fs.ensure(this.path);
  }

  async get(championId) {
    if (this._cache[championId]) return this._cache[championId];

    try {
      const x = await Mana.utils.fs.readFile(path.join(this.path, championId + '.json'));
      return this._cache[championId] = JSON.parse(x);
    }
    catch(err) {
      if (err.code !== 'ENOENT') console.error(err);
      return null;
    }
  }

  set(championId, x) {
    this._cache[championId] = x;
  }

  async remove(championId) {
    return Mana.utils.fs.delete(path.join(this.path, championId + '.json'));
  }

  async update(championId, cb) {
    this._cache[championId] = await cb(this._cache[championId] || await this.get(championId));
  }

  async save() {
    return await Promise.all(Object.entries(this._cache).filter(x => typeof x[1] === 'object' && x[1].roles).map(x => Mana.utils.fs.writeFile(path.join(this.path, x[0] + '.json'), JSON.stringify(x[1]))));
  }

  async clear() {
    const dir = await Mana.utils.fs.readdir(this.path);
    return await Promise.all(dir.map(x => Mana.utils.fs.delete(path.join(this.path, x))));
  }
}

module.exports = ChampionSelectHandler;
