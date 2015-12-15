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

var _ = require('lodash'),
    fs = require('fs'),
    server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces'),
    GPIO = require('onoff').Gpio;

/*    
    led = new GPIO(16, 'out'),
    button = new GPIO(17, 'in', 'both');
    
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
    items = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));
    
    items.forEach(function(item) {
        
        // if edge is not specified, fallback to the default (none)
        if(!("edge" in item)) { 
            item.edge = "none"
        }
        
        item.GPIO = new GPIO(item.pin, item.direction, item.edge);
        
        // if this item produces input, wire it up to write results to the server
        if(item.direction === "in") {
            item.GPIO.watch(function(err, value) {
                writeGpioToServer(err, value, item, server.writeIOToServer);
            });
        }
        
        server.addIO(item.id, item.ioName, "default", "raspberryPi");
    });
    
    server.clearIO("raspberryPi");
}

/**
 * @desc teardown() free up any open resources
 **/
function teardown() {
    items.forEach(function(item) {
        if("GPIO" in item) { 
            item.GPIO.unexport();
        }
    });  
    
    process.exit();
}

function writeGpioToServer(err, value, item, callback) {
    if(err) {
        if(server.getDebug()) console.log("ERROR receiving data from " + item.id + "\n   " + err);
    }
     
    // only send if we don't have an error and the value has changed
    else if(item.lastValue !== value) {
        console.log("Data received " + item.id + item.ioName + " value = " + value);
        
        item.lastValue = value;
        // in this case, the mode "b" stands for bit.  
        // the value will be 0 or 1  
        callback(item.id, item.ioName, value, "b");
    }
}

/**
 * @desc This function is called once by the server. Place calls to addIO(), clearIO(), developerOn(), developerOff(), writeIOToServer() here.
 *       Start the event loop of your hardware interface in here. Call clearIO() after you have added all the IO points with addIO() calls.
 **/

exports.receive = function (){
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
    items.forEach(function(item) {
        if(item.id === objName && item.ioName === ioName) { 
            item.GPIO.write(value);
        }
    });      
};

/**
 * @desc prototype for an interface init. The init reinitialize the communication with the external source.
 * @note program the init so that it can be called anytime there is a change to the amount of objects.
 **/

exports.init = function(){

};


process.on('SIGINT', teardown);

/**
 * Set to true to enable the hardware interface
 **/
exports.enabled = true;