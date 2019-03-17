const fs = require('fs'), path = require('path');
const { ItemSet, Block } = require('../ItemSet');

class ItemSetHandler {

  static parse(key, obj, ...metadata) {
    if (obj instanceof ItemSet) return obj;

    let set = new ItemSet(key, ...metadata);
    set._data = obj._data || obj;

    for (let i = 0; i < set._data.blocks.length; i++) {
      if (!set._data.blocks[i].items) continue;

      let items = {};
      for (let j = 0; j < set._data.blocks[i].items.length; j++)
        items[set._data.blocks[i].items[j].id] = set._data.blocks[i].items[j].count;

      set._data.blocks[i] = new Block(items, set._data.blocks[i].recMath).setType({ i18n: set._data.blocks[i]._type.i18n, arguments: set._data.blocks[i]._type.arguments });
    }

    return set;
  }

  static async getItemSets() {
    const CHAMPIONS_PATH = path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\`);

    await Mana.utils.fs.ensure(path.join(Mana.getStore().get('league-client-path'), `\\Config\\`));
    await Mana.utils.fs.ensure(CHAMPIONS_PATH);

    const dir = await Mana.utils.fs.readdir(CHAMPIONS_PATH);

    if (dir.length === 0) return [];

    const values = await Promise.all(dir.map(key => this.getItemSetsByChampionKey(key)));
    let res = [];

    for (let x of values)
      res = res.concat(x);

    return res;
  }

  static async getItemSetsByChampionKey(key) {
    const CHAMPION_PATH = path.join(Mana.getStore().get('league-client-path') + `\\Config\\Champions\\${key}\\Recommended`)

    await Mana.utils.fs.ensure(path.join(Mana.getStore().get('league-client-path') + `\\Config\\Champions\\${key}`));
    await Mana.utils.fs.ensure(CHAMPION_PATH);

    const dir = await Mana.utils.fs.readdir(CHAMPION_PATH);
    if (dir.length === 0) return [];

    let arr = [];
    for (let file of dir)
      if (file.startsWith('MFLUX_')) arr.push(path.join(CHAMPION_PATH, file));

    return arr;
  }

  static async deleteItemSets(list) {
    for (let path of list) {
      try {
        await Mana.utils.fs.delete(path);
      }
      catch(err) {
        console.log('[ItemSetHandler] An error occured while deleted file', path);
        console.error(err);
      }
    }
  }
}

module.exports = ItemSetHandler;
