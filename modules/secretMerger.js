"use strict";

exports.GetModuleData = function _getMergedSecretData(jsonData) {
  return _mergeData(jsonData.secretMerger);
};

function _mergeData(secretMerger){
  const configObj = secretMerger.config;
  const secrets = secretMerger.secrets;

  (_ => {
    const allKeys = Object.keys(secrets).concat(Object.keys(configObj));
    return [...new Set(allKeys)];
  })().forEach(key => {
    _recursiveObjectValueMerger(secrets[key], configObj[key])
  });
  return [JSON.stringify(configObj, null, '\t')].map((mergedSecret, i) => {
    return {
      "subModule": {
        "names": [`${i}`],  // this is used to set the name for the output file
        "value": `${mergedSecret}\r\n`,
        "specials": []
      }
    }
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
