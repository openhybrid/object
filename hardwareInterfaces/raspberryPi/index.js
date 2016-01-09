/**
 *
 * Created by Kevin Ortman on 12/15/14.
 *
 * Copyright (c) 2015 Kevin Ormtan
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Set to true to enable the hardware interface
 **/
exports.enabled = false;

if (exports.enabled) {
var fs = require('fs'),
    server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces'),
    GPIO = require('onoff').Gpio;

/*    
    Example item object in JSON format
    {
			"id": "button",
			"ioName": "digital",
			"pin": 17,
			"direction": "in",
			"edge": "both"
    }
*/

var items = {};

/**
 * @desc setup() runs once, adds and clears the IO points
 **/
function setup() {    
    server.developerOn();
    
    //load the config file
    var rawItems = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));
    
        rawItems.forEach(function (item) {
        var key = item.id + item.ioName; // unique item identifier
        
            if (items[key] !== undefined) {
                throw ("config.json contains two or more items with the id = '" + item.id + "' and ioName = '" + item.ioName + "'");
        }
        
        // if edge is not specified, fallback to the default (none)
            if (!("edge" in item)) {
            item.edge = "none"
        }
        
        item.GPIO = new GPIO(item.pin, item.direction, item.edge);
        
        // if this item produces input, wire it up to write results to the server
            if (item.direction === "in") {
            // watch the GPIO for state changes
                item.GPIO.watch(function (err, value) {
                writeGpioToServer(err, value, item, server.writeIOToServer);
            });
        }
        
            if (server.getDebug()) console.log("raspberryPi: adding item with the id = '" + item.id + "' and ioName = '" + item.ioName + "'");
        server.addIO(item.id, item.ioName, "default", "raspberryPi");
        
        items[key] = item;
    });
    
    server.clearIO("raspberryPi");
}

/**
 * @desc teardown() free up any open resources
 **/
function teardown() {
    for (var key in items) {
        if (items.hasOwnProperty(key)) {
            var item = items[key];
                if ("GPIO" in item) {
                    if (server.getDebug()) console.log("raspberryPi: removing item with the id = '" + item.id + "' and ioName = '" + item.ioName + "'");
                item.GPIO.unexport();
            }
        }
    }
}

function writeGpioToServer(err, value, item, callback) {
        if (err) {
        console.log("raspberryPi: ERROR receiving GPIO data from id = '" + item.id + "' and ioName = '" + item.ioName + "'");
        console.log(err)
    }
     
    // only send if we don't have an error and the value has changed
        else if (!("lastValue" in item) || item.lastValue !== value) {
        item.lastValue = value;
        callback(item.id, item.ioName, value, "d"); // mode: d for digital
    }
}

/**
 * @desc This function is called once by the server. Place calls to addIO(), clearIO(), developerOn(), developerOff(), writeIOToServer() here.
 *       Start the event loop of your hardware interface in here. Call clearIO() after you have added all the IO points with addIO() calls.
 **/
exports.receive = function () {
        if (server.getDebug()) console.log("raspberryPi: receive()");
    
    setup();
};

/**
 * @desc This function is called by the server whenever data for one of your HybridObject's IO points arrives. Parse the input and write the
 *       value to your hardware.
 * @param {string} objName Name of the HybridObject
 * @param {string} ioName Name of the IO point
 * @param {value} value The value
 * @param {string} mode Specifies the datatype of value
 * @param {type} type The type
 **/
exports.send = function (objName, ioName, value, mode, type) {
        var key = objName + ioName;
    
    try {
            if (items[key] === undefined) {
                if (server.getDebug()) console.log("raspberryPi: send() item not found: id = '" + objName + "' and ioName = '" + ioName + "'");
            return;
        }
        items[key].GPIO.write(value);
    }
        catch (err) {
            if (server.getDebug()) console.log("raspberryPi: GPIO.write() error: " + err);
    }
};

/**
 * @desc prototype for an interface init. The init reinitialize the communication with the external source.
 * @note program the init so that it can be called anytime there is a change to the amount of objects.
 **/
    exports.init = function () {
        if (server.getDebug()) console.log("raspberryPi: init()");
};

/**
 * @desc This function is called once by the server when the process is being torn down. 
 *       Clean up open file handles or resources and return quickly.
 **/
    exports.shutdown = function () {
        if (server.getDebug()) console.log("raspberryPi: shutdown()");
    
    teardown();
};

}