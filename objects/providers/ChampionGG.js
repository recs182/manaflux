const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');

let styles = {
  p: 8000,
  d: 8100,
  s: 8200,
  r: 8400,
  i: 8300
};

/*
* There's been a glitch on Champion.GG where it shows two times the same rune...
*/
let fixes = {
  8000: 9103,
  8100: 8135,
  8200: 8299,
  8400: 8451,
  8300: 8347
};

class ChampionGGProvider {
  constructor() {
    this.base = 'http://champion.gg/';
    this.name = 'ChampionGG';
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(`${this.base}champion/${champion.key}${preferredPosition ? '/' + preferredPosition.toLowerCase() : ''}`);

    const res = await rp(`${this.base}champion/${champion.key}${preferredPosition ? '/' + preferredPosition.toLowerCase() : ''}`);
    const data = this._scrape(res, champion.key, gameMode);

    let positions = {};
    positions[data.position] = data;

    console.dir(positions);

    for (const position of data.availablePositions) {
      console.dir(position);
      console.log('ChampionGG - Downloading data for position ' + position.position);

      const d = await rp(position.link);
      positions[position.position] = this._scrape(d, champion.key, gameMode);
    }

    return positions;
  }

  async getSummonerSpells(champion, position, gameMode) {
    const { summonerspells } = await this.getData(champion, position, gameMode);
    return summonerspells;
  }

  async getItemSets(champion, position, gameMode) {
    const { itemsets } = await this.getData(champion, position, gameMode);
    return itemsets;
  }

  async getRunes(champion, position, gameMode) {
    const { runes } = await this.getData(champion, position, gameMode);
    return runes;
  }

  _scrape(html, champion, gameMode) {
    let $ = cheerio.load(html);

    let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];
    let slots = $("div[class^=Slot__LeftSide]");

    /*
    * Ensuring it's the good name for jQuery, in case of exceptions like FiddleSticks being named Fiddlesticks on the website...
    */
    champion = $('.champion-profile > h1').text();

    const position = $(`li[class^='selected-role'] > a[href^='/champion/']`).first().text().trim();
    let availablePositions = [];

    $(`li[class!='selected-role'] > a[href^='/champion/']`).each(function(index) {
      availablePositions.push({ position: $(this).first().text().trim().toUpperCase(), link: 'https://champion.gg' + $(this).attr('href') });
    });

    /*
    * Runes
    */

    $("img[src^='https://s3.amazonaws.com/solomid-cdn/league/runes_reforged/']", slots).each(function(index) {
      let page = Math.trunc(index / 8), rune = $(this).attr("src").substring(59);
      if (index % 8 === 0) {
        pages[page].name = $('.champion-profile h1').text() + " " + position + (page === 0 ? ' HW%' : ' MF');
        pages[page].primaryStyleId = styles[rune.substring(5, 6)];
      }
      else if (index % 8 === 5)
      pages[page].subStyleId = styles[rune.substring(5, 6)];
      else pages[page].selectedPerkIds.push(parseInt(rune.substring(0, 4)));
    });

    /*
    * Summoner Spells
    */

    let summonerspells = [];

    $('.summoner-wrapper > a > img').each(function(index) {
      const summoner = Mana.summonerspells[$(this).attr('src').slice(51, -4)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    /*
    * ItemSets
    */

    let itemset = new ItemSet(champion, position).setTitle(`CGG ${champion} - ${position}`);
    $('.build-wrapper').each(function(index) {
    	const type = $(this).parent().find('h2').eq(index % 2).text();
      let block = new Block().setName(type + ` (${$(this).find('div > strong').text().trim().slice(0, 6)} WR)`);

    	$(this).children('a').each(function(index) {
        block.addItem($(this).children().first().data('id'));
      });

      itemset.addBlock(block);
    });

    // Putting the starters before the build
    // itemset.swapBlock(2, 0).swapBlock(3, 1);

    /*
    * Workaround: fix duplicates
    */

    let i = pages.length;
    while (i--) {
      const page = pages[i];

      if (page.selectedPerkIds[0] === undefined && page.selectedPerkIds[1] === undefined) {
        pages.splice(i, 1);
        UI.error("Champion.GG - Impossible de récupérer les runes: STILL_GATHERING_DATA??");
      }
      else if (page.selectedPerkIds[0] === page.selectedPerkIds[1]) {
        page.selectedPerkIds.splice(1, 1);
        page.selectedPerkIds.splice(3, 0, fixes[page.primaryStyleId]);
        UI.error("Champion.GG - Tentative de réparation des runes: Duplication des keystones");
      }
    }

    return { runes: pages, summonerspells, itemsets: [itemset], availablePositions, position: position.toUpperCase() };
  }
}

module.exports = ChampionGGProvider;