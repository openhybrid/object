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


exports.writeIOToServer = function (obj, pos, value, mode, objectExp, objectLookup, globalVariables, pluginModules, callback) {
    if (globalVariables.debug) console.log("WriteIOToServer: " + obj + "  " + pos + "  " + value + "  " + mode);
    var objKey2 = HybridObjectsUtilities.readObject(objectLookup, obj);
    var valueKey = pos + objKey2;
    console.log("ObjectKey: " + objKey2 + "   ValueKey: " + valueKey);

    if (objectExp.hasOwnProperty(objKey2)) {
        console.log("Object found");
        if (objectExp[objKey2].objectValues.hasOwnProperty(valueKey)) {
            console.log("Value found");
            objectExp[objKey2].objectValues[valueKey].value = value;
            objectExp[objKey2].objectValues[valueKey].mode = mode;
            console.log("Calling objectEngine");
            callback(objKey2, valueKey, objectExp, pluginModules);
        }
    }
};


exports.clearIO = function (objectExp, obj, Odirname, amount, globalVariables) {
    // check links as well
    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(obj, Odirname);
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

exports.addIO = function (obj, pos, index, plugin, type, objectExp, globalVariables, Odirname) {
    HybridObjectsUtilities.createFolder(obj, Odirname, globalVariables.debug);

    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(obj, Odirname);
    if (globalVariables.debug) console.log("philipsHue AddIO objectID: " + objectID);

    objID = pos + objectID;

    if (!_.isUndefined(objectID) && !_.isNull(objectID)) {

        if (objectID.length > 13) {

            /*  for (var key in objectExp[objectID].objectValues) {
                  if (arrayID === objectExp[objectID].objectValues[key].index) {
                      delete objectExp[objectID].objectValues[key];
                  }
              }*/

            if (globalVariables.debug) console.log("I will save: " + obj + " and: " + pos + " id: " + index);

            if (objectExp.hasOwnProperty(objectID)) {
                if (!objectExp[objectID].objectValues.hasOwnProperty(objID)) {
                    var thisObject = objectExp[objectID].objectValues[objID] = new ObjectValue();
                    thisObject.x = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.y = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.frameSizeX = 47;
                    thisObject.frameSizeY = 47;
                }


                // here you need to add the id of the object
                var thisObj = objectExp[objectID].objectValues[objID];
                thisObj.name = pos;
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