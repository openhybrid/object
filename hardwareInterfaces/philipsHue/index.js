/**
 * Created by Carsten on 12/06/15.
 *
 * Copyright (c) 2015 Carsten Strunk
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 *  PHILIPS HUE CONNECTOR
 *
 * This hardware interface can communicate with philips Hue lights. The config.json file specifies the connection information
 * for the lamps in your setup. A light in this config file has the following attributes:
 * {
 * "host":"localhost",                  // ip or hostname of the philips Hue bridge
 * "url":"/api/newdeveloper/lights/1",  // base path of the light on the bridge
 * "id":"Light1",                       // the name of the HybridObject
 * "port":"8000"                        // port the hue bridge is listening on
 * }
 *
 * TODO: Add some more functionality, i.e. change color or whatever the philips Hue API offers
 */
var fs = require('fs');
var http = require('http');
var _ = require('lodash');
var server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces');


var lights = {};

function Light() {
    this.id;
    this.host;
    this.url;
    this.port;
}

/**
 * @desc setup() runs once, adds and clears the IO points
 **/
function setup() {
    //load the config file
    lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));
    
    for (var key in lights) {
        server.addIO(key, "switch", "default", "philipsHue");
        server.addIO(key, "generatorOnOff", "default", "philipsHue");
        server.clearIO("philipsHue");
        startGeneratorOnOff(lights[key]);
    }  
}


/**
 * @desc getSwitchState() communicates with the philipsHue bridge and checks if the light is turned on or off
 * @param {Object} light the light to check
 * @param {function} callback function to run when the response has arrived
 **/
function getSwitchState(light, callback) {
    var state;
    var options = {
        host: light.host,
        path: light.url,
        port: light.port,
        method: 'GET',
    };

    callbackHttp = function (response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            //TODO add some error handling
            state = JSON.parse(str).state;
            //TODO only call callback if state has changed 
            callback(light.id, "switch", state.on, "b");
        });
    }

    http.request(options, callbackHttp).end();
}


/**
 * @desc writeSwitchState() turns the specified light on or off
 * @param {boolean} state turns the light on if true, turns the light off if false
 **/
function writeSwitchState(light, state) {
    var options = {
        host: light.host,
        path: light.url + "/state",
        port: light.port,
        method: 'PUT',
    };

    var req = http.request(options, function () { });
    req.write('{"on":' + state + '}');
    req.end();
}


/**
 * @desc philipsHueServer() The main function, runs the setup and then periodically checks whether the lights are on.
 **/
function philipsHueServer() {  
    setup();

    //TODO poll more often in productive environment
    for (var key in lights) {
        setInterval(function (light) {
            getSwitchState(light, server.writeIOToServer);
        }, 1000 + _.random(-250, 250), lights[key]);
    }
    
}

/**
 * @desc startGeneratorOnOff() starts a generator which periodically changes the values of the "generatorOnOff" IO point from true to false and vice versa
 * @param {Object} light the light to which the specifed IO point belongs
 **/
function startGeneratorOnOff(light) {
    var state = false;
    setInterval(function (l) {
        server.writeIOToServer(l.id, "generatorOnOff", state, "b");
        if (state) {
            state = false;
        } else {
            state = true;
        }
    }, 5000 + _.random(-250, 250), light);
}


exports.receive = function () {
    philipsHueServer();
};

exports.send = function (objName, ioName, value, mode, type) {
    //Write incoming data to the specified light
    console.log("Incoming: " + objName + "  " + ioName + "  " + value + "  " + mode);
    if (lights.hasOwnProperty(objName)) {
        if (ioName == "switch" && _.isBoolean(value)) {
            writeSwitchState(lights[objName], value);
        }
    }
};

exports.init = function() {
};

//Enable this hardware interface
exports.enabled = true;
