var http = require('http');
var HybridObjectsUtilities = require(__dirname + '/HybridObjectsUtilities');
var _ = require('lodash');


var objectExp;
var objectLookup;
var globalVariables;
var dirnameO;
var pluginModules;
var callback;
var ObjectValue;

/*
 *
 *
 * EXPORTED FUNCTIONS
 *
 *
 */

exports.writeIOToServer = function (objName, ioName, value, mode) {
    //if (globalVariables.debug) console.log("WriteIOToServer: " + objName + "  " + ioName + "  " + value + "  " + mode);
    var objKey2 = HybridObjectsUtilities.readObject(objectLookup, objName);
    var valueKey = ioName + objKey2;
    //if (globalVariables.debug) console.log("ObjectKey: " + objKey2 + "   ValueKey: " + valueKey);

    if (objectExp.hasOwnProperty(objKey2)) {
        if (objectExp[objKey2].objectValues.hasOwnProperty(valueKey)) {
            objectExp[objKey2].objectValues[valueKey].value = value;
            objectExp[objKey2].objectValues[valueKey].mode = mode;
            //if (globalVariables.debug) console.log("Calling objectEngine");
            callback(objKey2, valueKey, objectExp, pluginModules);
        }
    }
};


exports.clearIO = function (objName, amount) {
    // check links as well
    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, dirnameO);
    if (globalVariables.debug) console.log("ClearIO objectID: " + objectID);

    if (!_.isUndefined(objectID) && !_.isNull(objectID)) {

        if (objectID.length > 13) {
            if (globalVariables.debug) console.log("------del---");
            for (var key in objectExp[objectID].objectValues) {
                if (globalVariables.debug) console.log("key in: " + objectID + " " + key + " " + amount);
                var indexKey = objectExp[objectID].objectValues[key].index;
                if (indexKey >= amount) {
                    if (globalVariables.debug) console.log("del:" + objectID + " " + key + " " + amount);
                    delete objectExp[objectID].objectValues[key];
                }
                if (globalVariables.debug) console.log("index is: " + indexKey);
            }
        }
    }
    objectID = undefined;
    globalVariables.clear = true;

    if (globalVariables.debug) console.log("it's all cleared");
};


exports.addIO = function (objName, ioName, index, plugin, type) {
    HybridObjectsUtilities.createFolder(objName, dirnameO, globalVariables.debug);

    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, dirnameO);
    if (globalVariables.debug) console.log("philipsHue AddIO objectID: " + objectID);

    objID = ioName + objectID;

    if (!_.isUndefined(objectID) && !_.isNull(objectID)) {

        if (objectID.length > 13) {

            if (globalVariables.debug) console.log("I will save: " + objName + " and: " + ioName + " id: " + index);

            if (objectExp.hasOwnProperty(objectID)) {
                objectExp[objectID].name = objName;
                if (!objectExp[objectID].objectValues.hasOwnProperty(objID)) {
                    var thisObject = objectExp[objectID].objectValues[objID] = new ObjectValue();
                    thisObject.x = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.y = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.frameSizeX = 47;
                    thisObject.frameSizeY = 47;
                }


                // here you need to add the id of the object
                var thisObj = objectExp[objectID].objectValues[objID];
                thisObj.name = ioName;
                thisObj.plugin = plugin;
                // this clames the datapoint to be of type serial....
                thisObj.type = type;
                thisObj.index = index;
            }
        }
    }
    objectID = undefined;
};


exports.developerIO = function (developerValue) {
    if (!_.isUndefined(developerValue) && !_.isNull(developerValue) && _.isBoolean(developerValue)) {
        globalVariables.developer = developerValue;
    }
};

exports.getDebug = function () {
    return globalVariables.debug;
};

exports.getClear = function () {
    return globalVariables.clear;
};

exports.setDebug = function (debugValue) {
    if (!_.isUndefined(debugValue) && !_.isNull(debugValue) && _.isBoolean(debugValue)) {
        globalVariables.debug = debugValue;
    }
};

exports.setup = function (objExp, objLookup, glblVars, dir, plugins, cb, objValue) {
    objectExp = objExp;
    objectLookup = objLookup;
    globalVariables = glblVars;
    dirnameO = dir;
    pluginModules = plugins;
    callback = cb;
    ObjectValue = objValue;
};