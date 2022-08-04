"use strict";

const fs = require('fs');
let _rootDir;

exports.WriteData = function _writeDataMain(rootDir, allModules) {
  _rootDir = rootDir;
  const failedModules = _getAllJsonData(allModules).map(moduleData => {
    if(typeof moduleData === 'string'){
      return moduleData;
    }
    _writeAllModulesToOutputFile(moduleData);
    return null;
  }).filter(n => n).join(", ");
  if(failedModules.length){
    const hasMultiple = failedModules.includes(",") ? "Modules" : "Module";
    console.error(`${hasMultiple} failed to write -> ${failedModules}`);
  }
};

function _getAllJsonData(allModules){
  return allModules.map(module => {
    const modulePath = `${_rootDir}\\rawData\\${module}`;
    const master = `${modulePath}\\master.json`;
    if (fs.existsSync(master)) {
      const masterData = (_ => {
        const file = fs.readFileSync(master, 'utf8');
        return JSON.parse(file);
      })();
      const hasOutputTypes = masterData.hasOutputTypes ?? false;
      const specials = masterData.specials ?? [];
      return {
        [module]: {
          ..._getDataObject(modulePath, masterData.files, masterData.format),
          ..._getSpecials(modulePath, hasOutputTypes, specials)
        }
      };
    }
    return module;
  });
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
      return {
        "name": key,
        "subModules": (_ => values.map(value => value.subModule ?? null).filter(n => n))(),
        values,
        "format": moduleData[key].format
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

function _getDataObject(partPath, files, format){
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
    console.error(`"${fileName}" ${_valueNotString(value)}`);
    return;
  }
  fs.writeFile(`${_rootDir}\\output\\${fileName}`, value, "utf8", err => {
    if(err) {
      return console.error(err);
    }
    console.log(`${fileName} saved successfully!`);
  });
}

function _getName(entry){
  const formattedName = _formatName(entry);
  return formattedName.length ? `${formattedName}-` : 'unknown-';
}

function _formatName(value){
  if(typeof value !== 'string'){
    console.error(`_formatName() error -  ${_valueNotString(value)}`);
    return '';
  }
  return (typeof value === 'string' ? value : '')
    .replace(/\s(.)/g, a => a.toUpperCase())  // capitalize the first letter of each word
    .replace(/\s/g, '')                       // remove spaces
    .replace(/^(.)/, b => b.toLowerCase());   // set first letter to lower case
}

function _valueNotString(value){
  const valueType = Array.isArray(value) ? 'array' : typeof value;
  const valueIsFirstLetter = valueType.split('')[0];
  const prefix = ['a', 'e', 'i', 'o', 'u'].filter(n => n === valueIsFirstLetter).length ? 'an' : 'a';
  return `value is ${prefix} "${(valueType)}" type - but must by a string`;
}