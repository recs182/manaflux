module.exports = {
  fs: {
    access: path => {
      return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.F_OK | fs.constants.W_OK, err => {
          if (err && err.code === 'ENOENT') resolve(false);
          else if (err) reject(err);
          else resolve(true);
        });
      });
    },
    readFile: path => {
      return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) return reject(err);
          resolve(JSON.parse(data));
        });
      });
    },
    readdir: path => {
      return new Promise((resolve, reject) => {
        fs.readdir(path, (err, dir) => {
          if (err) return reject(err);
          resolve(dir);
        });
      });
    },
    writeFile: (filePath, data) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, err => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    ensure: path => {
      return new Promise((resolve, reject) => {
        fs.mkdir(path, err => {
          if (err && err.code === 'EEXIST') resolve();
          else if (err) reject(err);
          else resolve();
        })
      });
    },
    delete: path => {
      return new Promise((resolve, reject) => {
        fs.unlink(path, err => {
          if (!err) return resolve(true);

          if (err.code === 'ENOENT') resolve(false);
          else reject(err);
        });
      });
    }
  }
}
