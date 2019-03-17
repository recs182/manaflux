const { shell } = require('electron');
const fs = require('fs'), path = require('path');

module.exports = {
  click: function() {
    console.log(2, '[UI] Clearing logs');
    fs.readdir(remote.app.getPath('logs'), (err, files) => {
      if (err) throw err;

      LoggingHandler.end();
      for (const file of files) {
        fs.unlink(path.join(remote.app.getPath('logs'), file), err => {
          if (err) throw err;
        });
      }
      LoggingHandler.start();
      UI.temporaryStatus('settings-logs-cleared-files', files.length);
    });
  }
};
