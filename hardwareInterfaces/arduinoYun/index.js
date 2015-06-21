/**
 * @preserve
 *
 *                                     .,,,;;,'''..
 *                                 .'','...     ..',,,.
 *                               .,,,,,,',,',;;:;,.  .,l,
 *                              .,',.     ...     ,;,   :l.
 *                             ':;.    .'.:do;;.    .c   ol;'.
 *      ';;'                   ;.;    ', .dkl';,    .c   :; .'.',::,,'''.
 *     ',,;;;,.                ; .,'     .'''.    .'.   .d;''.''''.
 *    .oxddl;::,,.             ',  .'''.   .... .'.   ,:;..
 *     .'cOX0OOkdoc.            .,'.   .. .....     'lc.
 *    .:;,,::co0XOko'              ....''..'.'''''''.
 *    .dxk0KKdc:cdOXKl............. .. ..,c....
 *     .',lxOOxl:'':xkl,',......'....    ,'.
 *          .';:oo:...                        .
 *               .cd,    ╔═╗┌─┐┬─┐┬  ┬┌─┐┬─┐   .
 *                 .l;   ╚═╗├┤ ├┬┘└┐┌┘├┤ ├┬┘   '
 *                   'l. ╚═╝└─┘┴└─ └┘ └─┘┴└─  '.
 *                    .o.                   ...
 *                     .''''','.;:''.........
 *                          .'  .l
 *                         .:.   l'
 *                        .:.    .l.
 *                       .x:      :k;,.
 *                       cxlc;    cdc,,;;.
 *                      'l :..   .c  ,
 *                      o.
 *                     .,
 *
 *             ╦ ╦┬ ┬┌┐ ┬─┐┬┌┬┐  ╔═╗┌┐  ┬┌─┐┌─┐┌┬┐┌─┐
 *             ╠═╣└┬┘├┴┐├┬┘│ ││  ║ ║├┴┐ │├┤ │   │ └─┐
 *             ╩ ╩ ┴ └─┘┴└─┴─┴┘  ╚═╝└─┘└┘└─┘└─┘ ┴ └─┘
 *
 * Created by Valentin on 10/22/14.
 *
 * Copyright (c) 2015 Valentin Heun
 *
 * All ascii characters above must be included in any redistribution.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


var fs = require('fs');
var HybridObjectsUtilities = require(__dirname+'/../../libraries/HybridObjectsUtilities');
ledBlinker();

const serialBautRate = 115200; // boutrate for connection to arudino
const serialSource = "/dev/ttyATH0"; // this is pointing to the arduino


/**
 * @desc Constructor for each object value
 **/

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
    this.type = "arduinoYun"; // todo "arduinoYun", "virtual", "edison"
}

// lookup table for fast serial communication
var ArduinoLookupTable = [];

//initialisation of the socket connection

var serialport = require("serialport");
var SerialP = serialport.SerialPort; // localize object constructor
var serialPort = new SerialP(serialSource, {
    parser: serialport.parsers.readline("\n"),
    baudrate: serialBautRate
}, false);

serialPort.on('error', function (err) {
});

function serialServer(serialPort, objectExp, objectLookup, ArduinoLookupTable, globalVariables, __dirname,pluginModules, callback) {
    if (globalVariables.debug)  console.log("opneserial");
    serialPort.open();
    serialPort.on("open", function () {

        if (globalVariables.debug) console.log('Serial port opened');
        var dataSwitch = 0;
        var pos = null;
        var objID = null;
        var obj = null;
        var object = null;
        var arrayID = null;
        var valueMode = "";
        var value = null;
        var thisName = "";
        var thisPlugin = "default";
        var amount = 0;
        //var okCounter = 0;

        serialPort.on('data', function (data) {
            switch (dataSwitch) {
                case 0:
                    if (data === "f") {
                        if (globalVariables.clear === true) {
                            valueMode = "f";
                            dataSwitch = 1;
                        }
                    }
                    else if (data === "d") {
                        if (globalVariables.clear === true) {
                            valueMode = "d";
                            dataSwitch = 1;
                        }
                    }
                    else if (data === "p") { // positive step value
                        if (globalVariables.clear === true) {
                            valueMode = "p";
                            dataSwitch = 1;
                        }
                    }
                    else if (data === "n") {// negative step value
                        if (globalVariables.clear === true) {
                            valueMode = "n";
                            dataSwitch = 1;
                        }
                    }
                    else if (data === "a") {
                        if (globalVariables.debug) console.log("add");
                        if (globalVariables.clear === false) {
                            dataSwitch = 20;
                        }
                        else {
                            dataSwitch = 0;
                        }
                    }
                    else if (data === "okbird") {
                        globalVariables.clear = false;
                        ArduinoLookupTable = [];

  						serialPort.write(" \n");
                        serialPort.write("okbird\n");

                        if (globalVariables.debug) console.log("ok as respond");
                        dataSwitch = 0;
                    }
                    else if (data === "def") {
                        if (globalVariables.debug)  console.log("developer");
                        dataSwitch = 40;
                    }
                    else if (data === "c") {
                        if (globalVariables.debug)  console.log("clear");
                        dataSwitch = 50;

                    }
                    break;
                case 1:
                  // console.log(valueMode);
                    arrayID = parseInt(data);
                    dataSwitch = 2;
                    break;
                case 2:
                    value = parseFloat(data);
                    // console.log(value);
                    if (typeof ArduinoLookupTable[arrayID] !== 'undefined') {
                        var objKey2 = HybridObjectsUtilities.readObject(objectLookup, ArduinoLookupTable[arrayID].obj);
                        var valueKey = ArduinoLookupTable[arrayID].pos;

                        if (objectExp.hasOwnProperty(objKey2)) {
                            if (objectExp[objKey2].objectValues.hasOwnProperty(valueKey)) {
                                objectExp[objKey2].objectValues[valueKey].value = value;
                                objectExp[objKey2].objectValues[valueKey].mode = valueMode;
                                   // console.log("valuemode = "+objectExp[objKey2].objectValues[valueKey].mode);
                                callback(objKey2, valueKey, objectExp, pluginModules);


                            }
                        }
                    }

                    dataSwitch = 0;
                    break;
                case 20:
                    object = data.split("\t");
                    dataSwitch = 21;
                    break;
                case 21:
                    arrayID = parseInt(data);
                    dataSwitch = 23;
                    break;
                case 23:
                    thisPlugin = data;
                    obj = object[1];
                    pos = object[0];

                    HybridObjectsUtilities.createFolder(obj, __dirname, globalVariables.debug);

                    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(obj,  __dirname);

                    objID = pos + objectID;

                    if (typeof objectID !== "undefined" && objectID != null) {

                        if (objectID.length > 13) {

                          /*  for (var key in objectExp[objectID].objectValues) {
                                if (arrayID === objectExp[objectID].objectValues[key].index) {
                                    delete objectExp[objectID].objectValues[key];
                                }
                            }*/

                            if (globalVariables.debug) console.log("I will save: " + obj + " and: " + pos + " id: " + arrayID);

                            if (objectExp.hasOwnProperty(objectID)) {

                                if (!objectExp[objectID].objectValues.hasOwnProperty(objID)) {
                                    var thisObject = objectExp[objectID].objectValues[objID] = new ObjectValue();
                                    thisObject.x = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                                    thisObject.y = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                                    thisObject.frameSizeX = 47;
                                    thisObject.frameSizeY = 47;
                                }

                                ArduinoLookupTable.push({obj: obj, pos: objID});

                                //todo check if this is written to file in the right way
                                // todo this adds no value just error possibility...
                                // writeObjectToFile(obj);

                                // here you need to add the id of the object
                                var thisObj = objectExp[objectID].objectValues[objID];
                                thisObj.name = pos;
                                thisObj.plugin = thisPlugin;
                                // this clames the datapoint to be of type serial....
                                thisObj.type = "arduinoYun";
                                thisObj.index = arrayID;
                            }
                        }
                    }
                    objectID = undefined;

                    var  plugin = "default"; // this might not be relevant

                    dataSwitch = 0;
                    break;
                case 40:
                    if (parseInt(data) === 1) {
                        globalVariables.developer = true;
                    }
                    else {
                        globalVariables.developer = false;
                    }
                    dataSwitch = 0;
                    break;
                case 50:
                    amount = parseInt(data);
//clear.log("clearforreal");
                  clearIO(objectExp, obj, __dirname, amount, globalVariables);

                    // check links as well
                   /* var objectID = HybridObjectsUtilities.getObjectIdFromTarget(obj,  __dirname);

                    if (typeof objectID !== "undefined" && objectID != null) {

                        if (objectID.length > 13) {

                            if (globalVariables.debug)  console.log(objectID + " " + key + " " + amount);

                            for (var key in objectExp[objectID].objectValues) {
                                if (objectExp[objectID].objectValues[key].index >= amount) {
                                    delete objectExp[objectID].objectValues[key];
                                }
                            }
                        }
                    }
                    objectID = undefined;

                    clear = true;
*/



                    dataSwitch = 0;
                    break;
            }

        });


        // this is for when the server is started...

        	serialPort.write(" \n");
        serialPort.write("okbird\n");

    });
    if (globalVariables.debug) console.log("no problem");
}



function serialSender(serialPort, objectExp, obj, linkPos, processedValue, mode) {


  //  console.log(obj+ " "+ linkPos + " " +processedValue + " " + mode);
    if(objectExp.hasOwnProperty(obj))
        if(objectExp[obj].objectValues.hasOwnProperty(linkPos)){

    var objTemp = objectExp[obj].objectValues[linkPos];

  //  console.log("send: "+mode);

    if (objTemp.type === "arduinoYun") {
        if(mode == "f")  serialPort.write("f\n");
        else if(mode == "d")  serialPort.write("d\n");
        else if(mode == "p")  serialPort.write("p\n");
        else if(mode == "n")  serialPort.write("n\n");
        serialPort.write(objTemp.index + "\n");
        serialPort.write(processedValue + "\n");
       //  console.log("processed "+processedValue);
    }}
}


function clearIO (objectExp, obj, Odirname, amount ,globalVariables) {
    // check links as well
    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(obj,  Odirname);

    if (typeof objectID !== "undefined" && objectID != null) {

        if (objectID.length > 13) {

            if (globalVariables.debug)  console.log("------del---");


            for (var key in objectExp[objectID].objectValues) {
                if (globalVariables.debug)  console.log("key in: " +objectID + " " + key + " " + amount);
                var indexKey = objectExp[objectID].objectValues[key].index;
                if (indexKey >= amount) {
                    if (globalVariables.debug)  console.log("del:" + objectID + " " + key + " " + amount);
                    delete objectExp[objectID].objectValues[key];
                }
                if (globalVariables.debug)  console.log("index is: " + indexKey);
            }
        }
    }
    objectID = undefined;

    globalVariables.clear = true;

    if (globalVariables.debug)   if(globalVariables.clear) {console.log("its all cleared");};
}

// todo simplify API with clean calls for communicating with the object
function addIO () {
// this has to be filled with content
}

function writeIO () {
// this has to be filled with content
}

function developerIO () {
// this has to be filled with content
}



exports.receive= function (objectExp, objectLookup,globalVariables, dirnameO, pluginModules, callback){
    serialServer(serialPort, objectExp, objectLookup, ArduinoLookupTable, globalVariables, dirnameO,pluginModules, callback);
};

exports.send= function(objectExp,obj, pos, value, mode){
    serialSender(serialPort, objectExp, obj, pos, value, mode)
};

exports.init= function(){
		        	serialPort.write(" \n");
        serialPort.write("okbird\n");

   };



/**
 * @desc blinking the LED of the Arduino in a defined interval. This indicates if the code is still running.
 **/

function ledBlinker() {
    fs.writeFile("/sys/devices/platform/leds-gpio/leds/ds:green:usb/brightness", 0, "utf8", function () {
    });
    setInterval(function () {
        fs.writeFile("/sys/devices/platform/leds-gpio/leds/ds:green:usb/brightness", 1, "utf8", function () {
        });
        setTimeout(function () {
            fs.writeFile("/sys/devices/platform/leds-gpio/leds/ds:green:usb/brightness", 0, "utf8", function () {
            });
        }, 300);
        ledBlink = false;
    }, 4000);
}

var ledBlink = false;