"use strict";

const fs = require('fs');
const path = require('path');
const _rootDir = path.join(__dirname, '../');

(_ => {
  // failed modules return the name for console
  const moduleData = _getAllJsonData();
  const module = _mergeData(moduleData);
  _writeToFile(module);
})();

// formats data into an array
function _getAllJsonData(){
  let dataObject = {};
  [ "config", "secrets" ].forEach(sectionName => {
    const path = `${_rootDir}\\rawData\\${sectionName}.json`;
    if (fs.existsSync(path)) {
      dataObject[sectionName] = {};
      const pathJson = (_ => {
        const pathFiles = fs.readFileSync(path, 'utf8');
        return JSON.parse(pathFiles);
      })();
      Object.keys(pathJson).forEach(key => {
        dataObject[sectionName][key] = pathJson[key];
      });
    }
  });
  return dataObject;
}

function _mergeData(moduleData){
  const configObj = moduleData.config;
  const secrets = moduleData.secrets;

  (_ => {
    const allKeys = Object.keys(secrets).concat(Object.keys(configObj));
    return [...new Set(allKeys)];
  })().forEach(key => {
    _recursiveObjectValueMerger(secrets[key], configObj[key])
  });
  return `${(JSON.stringify(configObj, null, '\t'))}\r\n`;
}

function _writeToFile(module){
  fs.writeFile(`${_rootDir}\\output\\secretMerger-Output.json`, module, "utf8", err => {
    if(err) {
      return console.error(err);
    }
    console.log("Saved successfully!");
  });
}

function _recursiveObjectValueMerger(secret, data){
  data = data ?? {};
  secret = secret ?? {};
  if(Array.isArray(secret)){
    secret.forEach(entry => {
      data.push(entry);
    });
    return data.filter(entry => !entry.includes("**"));
  }
  if(typeof secret === 'object'){
    Object.keys(secret).forEach(key => {
      data[key] = _recursiveObjectValueMerger(secret[key], data[key] ?? secret[key]);
    });
    return data;
  }
  if(typeof secret === 'string'){
    return secret && secret.length ? secret : data;
  }
}

function _valueNotString(value){
  const valueType = Array.isArray(value) ? 'array' : typeof value;
  const valueIsFirstLetter = valueType.split('')[0];
  const prefix = ['a', 'e', 'i', 'o', 'u'].filter(n => n === valueIsFirstLetter).length ? 'an' : 'a';
  return `value is ${prefix} "${(valueType)}" type - but must by a string`;
}
