"use strict";

const fs = require('fs');
let _rootDir;

exports.WriteData = function _writeDataMain(rootDir, allModules) {
  _rootDir = rootDir;
  let failedModules = [];
  _getAllJsonData(allModules).forEach(moduleData => {
    if(typeof moduleData === 'string'){
      failedModules.push(moduleData);
      return;
    }
    _writeAllModulesToOutputFile(moduleData);
  });
  if(failedModules.length){
    const hasMultiple = failedModules.length > 1 ? "Modules" : "Module";
    console.error(`${hasMultiple} failed to write -> ${failedModules.join(", ")}`);
  }
};

function _getAllJsonData(allModules){
  const dataObjs = allModules.map(module => {
    const modulePath = `${_rootDir}\\data\\${module}`;
    const master = `${modulePath}\\master.json`;
    if (fs.existsSync(master)) {
      const masterData = (_ => {
        const file = fs.readFileSync(master, 'utf8');
        return JSON.parse(file);
      })();
      const subModules = (masterData.subModules ?? []).map((subModule) => typeof subModule === 'string' ? subModule.toLowerCase() : subModule);
      const specials = masterData.specials ?? [];
      const hasOutputTypes = masterData.hasOutputTypes ?? false;
      return {
        [module]: {
          subModules,
          ..._getSpecials(modulePath, hasOutputTypes, specials),
          ..._getDataArrays(modulePath, masterData.files, masterData.format)
        }
      };
    }
    return module;
  });
  return dataObjs;
}

function _getSpecials(modulePath, hasOutputTypes, specials){
  if(hasOutputTypes){
    const outputData = (_ => {
      const data = fs.readFileSync(`${modulePath}\\outputTypes.json`, 'utf8');
      return JSON.parse(data);
    })();
    const outputTypes = { "name": "outputTypes" };
    Object.keys(outputData).forEach(key => { outputTypes[key] = outputData[key] });

    specials.push(outputTypes);
  }
  return { specials };
}

function _getAllModules(moduleData){
  return Object.keys(moduleData).map(key => {
    const values = _getModuleValues(moduleData, key).filter(n => n);
    if (values.length){
      const subModules = (_ => values.map(value => value.subModule ?? null).filter(n => n))();
      return {
        "name": key,
        subModules,
        values,
        format: moduleData[key].format
      }
    }
    return null;
  }).filter(n => n);
}

function _getModuleValues(moduleData, key){
  const modulePath = `${_rootDir}\\modules\\${key}.js`;
  if (fs.existsSync(modulePath)) {
    return require(modulePath).GetModuleData(moduleData);
  }
  console.error(`module does not exist - ${key}`);
  return [];
}

function _getDataArrays(partPath, files, format){
  let dataObject = {};
  files.forEach(sectionData => {
    const path = `${partPath}\\${sectionData}.json`;
    if (fs.existsSync(path)) {
      dataObject[sectionData] = {};
      dataObject.format = dataObject.format ?? format ?? null;
      const pathJson = (_ => {
        const pathFiles = fs.readFileSync(path, 'utf8');
        return JSON.parse(pathFiles);
      })();
      Object.keys(pathJson).forEach(key => {
        dataObject[sectionData][key] = pathJson[key];
      });
    }
  });
  return dataObject;
}

function _writeAllModulesToOutputFile(moduleData){
  _getAllModules(moduleData).forEach(module => {
    if(module.format !== null){
      _writeSubModuleToFile(module);
      return;
    }
    console.error(`module has no format -> ${module.name}`)
  });
}

function _writeSubModuleToFile(module){
  _stringifyGsFormatValues(module);
  const moduleName = _getName(module.name);
  module.subModules.forEach(subModule => {
    const fileName = (_ => {
      const subName = subModule.names.map(name => _getName(name)).join('');
      const format = module.format !== 'gs' ? module.format : 'js';
      return `${moduleName}${subName}Output.${format}`;
    })();
    _writeToFile(fileName, subModule.value);
  });
}

function _writeToFile(fileName, value){
  if(typeof value !== 'string'){
    _writeFileError(fileName, value);
    return;
  }
  fs.writeFile(`${_rootDir}\\output\\${fileName}`, value, "utf8", err => {
    if(err) {
      return console.error(err);
    }
    console.log(`${fileName} saved successfully!`);
  });
}

function _writeFileError(fileName, value){
    const valueType = Array.isArray(value) ? 'array' : typeof value;
    const valueIsFirstLetter = valueType.split('')[0];
    const prefix = ['a', 'e', 'i', 'o', 'u'].filter(n => n === valueIsFirstLetter).length ? 'an' : 'a';
    console.error(`"${fileName}" value is ${prefix} "${(valueType)}" type - but must by a string`);
}

function _getName(entry){
  const entryName = typeof entry === 'string' ? _getCamelCase(entry) : _getName(entry.name ?? '');
  return entryName.length ? `${entryName}-` : 'unknown-';
}

function _getCamelCase(str){
  if(typeof str !== 'string'){
    console.error(`_getCamelCase() error - str must be typeof string not -> ${(typeof str)} - ${str}`);
    return '';
  }
  return str
    .replace(/\s(.)/g, a => a.toUpperCase())  // capitalize the first letter of each word
    .replace(/\s/g, '')                       // remove spaces
    .replace(/^(.)/, b => b.toLowerCase());   // set first letter to lower case
}

function _stringifyGsFormatValues(module){
  if(module.format === 'gs'){
    // Google Sheets graphs work on a strict set of rows and columns
    // This is used to keep each "valueRow" on the same line after formatting
    const newSubModules = [];
    module.subModules.forEach(subModule => {
      subModule.specials.length
        ? subModule.value.forEach((specialRows, i) => _stringifyValues(newSubModules, [subModule.name, subModule.specials[i]], specialRows))
        : _stringifyValues(newSubModules, [subModule.name], subModule.value);
    });
    module.subModules = newSubModules;
  }
}

function _stringifyValues(newSubModules, names, rawValue){
  const formattedValues = rawValue.map(rawRows => {
    const formattedRows = rawRows.map(rawRow => `"${rawRow}"`).join(',');
    return `[${formattedRows}]`
  });
  const value = JSON.stringify(formattedValues, null, '\t')
    .replace(/\"\[/gi,"[")    // replace  -> "[   -> [
    .replace(/\\/gi,"")       // replace  -> \    -> empty string
    .replace(/\]\"/gi,"]");   // replace  -> ]"   -> ]
  newSubModules.push({ names, value });
}
