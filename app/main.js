"use strict";

(_ => {
  const fs = require('fs');
  const path = require('path');
  const modulePath = `${__dirname}\\mainModule.js`;

  if(fs.existsSync(modulePath)) {
    const rootDir = path.join(__dirname, '../');
    const allModules = process.argv.splice(2);
    require(modulePath).WriteData(rootDir, allModules);
    return;
  }
  console.error(`main module does not exist`);
})();
