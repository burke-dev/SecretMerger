"use strict";

(_ => {
  const outputObj = _getOutputObj();
  _copyOutputToClipboard(outputObj);
})();

// updates the config values with the secrets values
function _getOutputObj(){
  const sectionData = _getSectionData();
  if(sectionData.config && sectionData.secrets){
    Object.keys(sectionData.secrets).forEach(key => {
      _recursiveObjectValueMerger(sectionData.config[key], sectionData.secrets[key])
    });
    console.log("config and secrets merged successfully.");
    return sectionData.config;
  }
  return false;
}

// if successful should copy the outputObj to the clipboard
function _copyOutputToClipboard(outputObj){
  if(outputObj){
    const outputObjAsString =  `${(JSON.stringify(outputObj, null, '\t'))}\r\n`;
    require('copy-paste').copy(outputObjAsString, _ => {
      console.log("Copied Output to clipboard!");
    });
  }
}

// gets the data from the respective file and formats them into the sectionData object
function _getSectionData(){
  const fs = require('fs');
  const sectionData = {};
  ["config", "secrets"].forEach(sectionName => {
    const path = `${__dirname}\\..\\rawData\\${sectionName}.json`;
    if (fs.existsSync(path)) {
      return (_ => {
        const pathFiles = fs.readFileSync(path, 'utf8');
        sectionData[sectionName] = JSON.parse(pathFiles);
        console.log(`${sectionName} data parsed successfully.`);
      })();
    }
    console.error(`unable to find data for ${sectionName}`);
    return null;
  });
  return sectionData;
};

// digs down into the config and secret objects to find the value to be added to the config
function _recursiveObjectValueMerger(config, secrets){
  config = config ?? {};
  secrets = secrets ?? {};
  if(Array.isArray(secrets)){
    return _addSecretsToConfigArray(config, secrets);
  }
  if(typeof secrets === 'object'){
    Object.keys(secrets).forEach(key => {
      config[key] = _recursiveObjectValueMerger(config[key], secrets[key]);
    });
    return config;
  }
  if(typeof secrets === 'string'){
    return secrets;
  }
}

// replaces the values including "**" and appends any extra secrets to the end of the array
function _addSecretsToConfigArray(config, secrets){
  let z = 0;
  let configArray = config.map(entry => entry.includes("**") ? secrets[z++] : entry);
  if(z < secrets.length){
    for(let i = z; i < secrets.length; i++){
      configArray.push(secrets[i]);
    }
  }
  return configArray;
}
