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
var _  = require('lodash');
var serialport = require("serialport");
var server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces');

const serialBaudRate = 9600; // baud rate for connection to arudino
const serialSource = "/dev/ttyACM0"; // this is pointing to the arduino
const GREEN_LED = "/sys/class/leds/led0/brightness";

function PiIndex() {
    this.objName;
    this.ioName;
    this.index;
}

var PiLookup = {};


ledBlinker();



//initialisation of the socket connection
var SerialP = serialport.SerialPort; // localize object constructor
var serialPort = new SerialP(serialSource, {
    parser: serialport.parsers.readline("\n"),
    baudrate: serialBaudRate
}, false);

serialPort.on('error', function (err) {
    console.error("Serial port error", err);
});

function serialServer(serialPort) {
    if (server.getDebug())  console.log("openserial");
    serialPort.open();
    serialPort.on("open", function () {

        if (server.getDebug()) console.log('Serial port opened');
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
                            valueMode = "f";
                            dataSwitch = 1;
                    }
                    else if (data === "d") {
                            valueMode = "d";
                            dataSwitch = 1;
                    }
                    else if (data === "p") { // positive step value
                            valueMode = "p";
                            dataSwitch = 1;
                    }
                    else if (data === "n") {// negative step value
                            valueMode = "n";
                            dataSwitch = 1;
                    }
                    else if (data === "a") {
                        dataSwitch = 20;
                    }
                    else if (data === "okbird") {

  						serialPort.write(" \n");
  						serialPort.write("okbird\n");
                        if (server.getDebug()) console.log("ok as respond");
                        dataSwitch = 0;
                    }
                    else if (data === "def") {
                        if (server.getDebug()) console.log("developer");
                        dataSwitch = 40;
                    }
                    else if (data === "c") {
                        if (server.getDebug()) console.log("clear");
                        dataSwitch = 50;

                    }
					else {
						if (server.getDebug()) console.log("Unknown data : " + data);
					}
                    break;
                case 1:
                    arrayID = parseInt(data, 10);
                    dataSwitch = 2;
                    break;
                case 2:
                    value = parseFloat(data);

                    server.writeIOToServer(obj, pos, value, valueMode);
                

                    dataSwitch = 0;
                    break;
                case 20:
                    object = data.split("\t");
                    dataSwitch = 21;
                    break;
                case 21:
                    arrayID = parseInt(data, 10);
                    dataSwitch = 23;
                    break;
                case 23:
                    thisPlugin = data;
                    obj = object[1];
                    pos = object[0];

                    if (server.getDebug()) console.log("Add Raspberry Pi");

                    PiLookup[obj + pos] = new PiIndex();
                    PiLookup[obj + pos].objName = obj;
                    PiLookup[obj + pos].ioName = pos;
                    PiLookup[obj + pos].index = arrayID;

                    server.addIO(obj, pos, thisPlugin, "raspberryPi");
                    
                    dataSwitch = 0;
                    break;
                case 40:
                    if (parseInt(data, 10) === 1) {
                        server.developerOn();
                    } 
                    dataSwitch = 0;
                    break;
                case 50:
                    amount = parseInt(data, 10);
                    var ioPoints = [];
                    for (key in PiLookup) {
                        if (PiLookup[key].objName == obj) {
                            ioPoints.push(PiLookup[key].ioName);
                        }
                    }
                    server.clearIO("raspberryPi");
                    dataSwitch = 0;
                    break;
					
				default:
					if (server.getDebug()) console.log("Unknown data switch : " + dataSwitch);
					break;
            }

        });

        // this is for when the server is started...
        serialPort.write(" \n");
        serialPort.write("okbird\n");

    });
    if (server.getDebug()) console.log("no problem");
}


function serialSender(serialPort, objName, ioName, value, mode, type) {

    if (type === "raspberryPi") {
        var index = PiLookup[objName + ioName];
        var piModes = [ "f", "d", "p", "n" ];
        if (_.includes(piModes, mode)) {
            serialPort.write(mode + "\n");
         }
         serialPort.write(index + "\n");
         serialPort.write(value + "\n");
    }
}


exports.receive = function () {
    serialServer(serialPort);
};

exports.send = function (objName, ioName, value, mode, type) {
    serialSender(serialPort, objName, ioName, value, mode, type);
};

exports.init = function() {
	serialPort.write(" \n");
    serialPort.write("okbird\n");
};

exports.enabled = false;

function noop_cb() {}

function blinkLed() {
    var onTime = 300;

    // Turn on the LED
    fs.writeFile(GREEN_LED, 255, noop_cb);

    // Schedule turning it off
    setTimeout(function() {
      fs.writeFile(GREEN_LED, 0, noop_cb);
    }, onTime);
}

/**
 * Every 4 seconds, flash the LED for 300ms.
 * @desc blinking the LED of the Arduino in a defined interval. This indicates if the code is still running.
 **/
function ledBlinker() {
    fs.writeFile(GREEN_LED, 0, noop_cb);
    setInterval(blinkLed, 4000);
}