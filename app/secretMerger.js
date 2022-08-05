"use strict";
const fs = require('fs');

(_ => {
  const sectionData = _getSectionData();
  const outputObj = _getOutputObj(sectionData);
  _writeToFile(outputObj);
})();

// gets the data from the respective file and formats them into the sectionData object
function _getSectionData(){
  const sectionData = {};
  ["config", "secrets"].forEach(sectionName => {
    const path = `${__dirname}\\..\\rawData\\${sectionName}.json`;
    if (fs.existsSync(path)) {
      return (_ => {
        const pathFiles = fs.readFileSync(path, 'utf8');
        sectionData[sectionName] = JSON.parse(pathFiles);
      })();
    }
    console.error(`unable to find data for ${sectionName}`);
    return null;
  });
  return sectionData;
};

// updates the config values with the secrets values then 
function _getOutputObj(sectionData){
  if(sectionData.config && sectionData.secrets){
    Object.keys(sectionData.secrets).forEach(key => {
      _recursiveObjectValueMerger(sectionData.config[key], sectionData.secrets[key])
    });
    return sectionData.config;
  }
  return null;
}

// digs down into the config and secret objects to find the value to be added to the config
function _recursiveObjectValueMerger(config, secret){
  config = config ?? {};
  secret = secret ?? {};
  if(Array.isArray(secret)){
    let z = 0;
    return config.map(entry => entry.includes("**") ? secret[z++] : entry);
  }
  if(typeof secret === 'object'){
    Object.keys(secret).forEach(key => {
      config[key] = _recursiveObjectValueMerger(config[key], secret[key]);
    });
    return config;
  }
  if(typeof secret === 'string'){
    return secret;
  }
}

function _writeToFile(outputObj){
  if(outputObj){
    const outputObjAsString =  `${(JSON.stringify(outputObj, null, '\t'))}\r\n`;
    fs.writeFile(`${__dirname}\\..\\output\\secretMerger-Output.json`, outputObjAsString, "utf8", err => {
      if(err) {
        return console.error(err);
      }
      console.log("Saved successfully!");
    });
  }
}
