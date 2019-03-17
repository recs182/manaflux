const { BrowserWindow } = require('electron').remote;
const rp = require('request-promise-native');

module.exports = {
  userConnected: function(e) {
    this.disabled = false;
  },
  userDisconnected: function(e) {
    this.disabled = true;
  },
  click: function(e) {
    this.disabled = true;

    const win = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 350, height: 570, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false });

    win.loadURL(`file://${__dirname}/../../../bugreports.html`);
    win.setMenu(null);

    win.once('ready-to-show', () => win.show());
    win.on('closed', () => this.disabled = false);

    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};

ipcRenderer.on('bug-report', (event, data) => {
  console.log('[Bug Report] Sending one..');

  try {
    const logsPath = LoggingHandler.end();
    LoggingHandler.start();

    let logs = '';
    require('fs').createReadStream(logsPath)
    .on('data', chunk => logs += chunk)
    .on('end', async () => {
      const d = await UI.indicator(await rp({
        method: 'POST',
        uri: 'https://manaflux-server.herokuapp.com/reports/v1',
        body: { ...data, summonerId: Mana.user.getSummonerId(), summonerName: Mana.user.getDisplayName(), gameVersion: Mana.gameClient.fullVersion, version: Mana.version, logs },
        json: true
      }), 'bug-report-sending-status');

      if (d.message && d.error) UI.error(d.message);
      else if (d.error) throw UI.error(Error(d.error));
      else if (d.statusCode === 200) UI.success(i18n.__('bug-report-sent'));
    });
  }
  catch(err) {
    UI.error(err);
  }
});
