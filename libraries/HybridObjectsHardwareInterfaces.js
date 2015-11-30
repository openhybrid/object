var http = require('http');
var HybridObjectsUtilities = require(__dirname + '/HybridObjectsUtilities');
var _ = require('lodash');


function ObjectValue() {
    this.name = "";
    this.value = null;
    this.mode = "f"; // this is for (f) floating point, (d) digital or (s) step and finally (m) media
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.plugin = "default";
    this.pluginParameter = null;
    this.index = null;
    this.type = "arduinoYun"; // todo "arduinoYun", "virtual", "edison", ... make sure to define yours in your internal_module file
}

/*
 *
 *
 * EXPORTED FUNCTIONS
 *
 *
 */


exports.writeIOToServer = function (objName, ioName, value, mode, objectExp, objectLookup, globalVariables, pluginModules, callback) {
    if (globalVariables.debug) console.log("WriteIOToServer: " + objName + "  " + ioName + "  " + value + "  " + mode);
    var objKey2 = HybridObjectsUtilities.readObject(objectLookup, objName);
    var valueKey = ioName + objKey2;
    if (globalVariables.debug) console.log("ObjectKey: " + objKey2 + "   ValueKey: " + valueKey);

    if (objectExp.hasOwnProperty(objKey2)) {
        if (objectExp[objKey2].objectValues.hasOwnProperty(valueKey)) {
            objectExp[objKey2].objectValues[valueKey].value = value;
            objectExp[objKey2].objectValues[valueKey].mode = mode;
            if (globalVariables.debug) console.log("Calling objectEngine");
            callback(objKey2, valueKey, objectExp, pluginModules);
        }
    }
};


exports.clearIO = function (objectExp, objName, Odirname, amount, globalVariables) {
    // check links as well
    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, Odirname);
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

exports.addIO = function (objName, ioName, index, plugin, type, objectExp, globalVariables, Odirname) {
    HybridObjectsUtilities.createFolder(objName, Odirname, globalVariables.debug);

    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, Odirname);
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

exports.developerIO = function (developerValue, globalVariables) {
    if (!_.isUndefined(developerValue) && !_.isNull(developerValue) && _.isBoolean(developerValue)) {
        globalVariables.developer = developerValue;
    }
};