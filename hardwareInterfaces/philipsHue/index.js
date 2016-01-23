/**
 * Created by Carsten on 12/06/15.
 * Modified by Peter Som de Cerff (PCS) on 12/21/15
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
 * "url":"/api/newdeveloper/lights/1",  // base path of the light on the bridge, replace newdeveloper with a valid username (see http://www.developers.meethue.com/documentation/getting-started)
 * "id":"Light1",                       // the name of the HybridObject
 * "port":"80"                          // port the hue bridge is listening on (80 on all bridges by default)
 *                                     
 * }
 *
 * Some helpful resources on the Philips Hue API:
 * http://www.developers.meethue.com/documentation/getting-started
 * http://www.developers.meethue.com/documentation/lights-api
 * 
 * TODO: Add some more functionality, i.e. change color or whatever the philips Hue API offers
 */
//Enable this hardware interface
exports.enabled = true;

if (exports.enabled) {


    var fs = require('fs');
    var http = require('http');
    var _ = require('lodash');
    var server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces');


    var lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

    //function Light() {
    //    this.id;
    //    this.host;
    //    this.url;
    //    this.port;
    //}

    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        server.developerOn();
        //load the config file
        //lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

        if (server.getDebug()) console.log("setup philipsHue");
        for (var key in lights) {
            lights[key].switch = undefined;
            lights[key].bri = undefined;
            lights[key].hue = undefined;
            lights[key].sat = undefined;
        }
    }


    /**
         * @desc getLightState() communicates with the philipsHue bridge and checks the state of the light
     * @param {Object} light the light to check
     * @param {function} callback function to run when the response has arrived
     **/
    function getLightState(light, callback) {
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
                if (state.on != light.switch) {
                    light.switch = state.on;
                    if (state.on) {
                        callback(light.id, "switch", 1, "d");
                    } else {
                        callback(light.id, "switch", 0, "d");
                    }

                }

                if (state.hue != light.hue) {
                    light.hue = state.hue; // hue is a value between 0 and 65535
                    callback(light.id, "hue", state.hue / 65535, "f"); // map hue to [0,1]
                }

                if (state.bri != light.bri) {
                    light.bri = state.bri; // brightness is a value between 1 and 254
                    callback(light.id, "brightness", (state.bri - 1) / 253, "f");
                }

                if (state.sat != light.sat) {
                    light.sat = state.sat;
                    callback(light.id, "saturation", state.sat / 254, "f");
                }

            });
        }



        var req = http.request(options, callbackHttp);
        req.on('error', function (e) {
            console.log('GetLightState HTTP error: ' + e.message);
        });
        req.end();

    }


    /**
     * @desc writeSwitchState() turns the specified light on or off
         * @param {float} state turns the light on if > 0.5, turns it off otherwise
     **/
    function writeSwitchState(light, state) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };


        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeSwitchState HTTP error: ' + e.message);
        });

        if (state < 0.5) {
            req.write('{"on":false}');
        } else {
            req.write('{"on":true}');
        }



        req.end();

        //TODO check for success message from the bridge
    }


    /**
         * @desc writeBrightness() Sets the brightness of the specified light 
         * @param {float} bri is the brightness in the range [0,1]
     **/
    function writeBrightness(light, bri) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeBrightness HTTP error: ' + e.message);
        });

        req.write('{"bri":' + _.floor(bri * 253 + 1) + '}');

        req.end();
    }


    /**
     * @desc writeSaturation() sets the saturation for the specified light 
     * @param {float} sat is the saturatin in the range [0,1]
     **/
    function writeSaturation(light, sat) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeSaturation HTTP error: ' + e.message);
        });
        req.write('{"sat":' + _.floor(sat * 254) + '}');
        req.end();
    }


    /**
     * @desc writeHue() sets the hue for the specified light 
     * @param {integer} hue is the hue in the range [0,1]
     **/
    function writeHue(light, hue) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeHue HTTP error: ' + e.message);
        });
        req.write('{"hue":' + _.floor(hue * 65535) + '}');
        req.end();
    }

    /**
     * @desc philipsHueServer() The main function, runs the setup and then periodically checks whether the lights are on.
     **/
    function philipsHueServer() {
        console.log("philipsHue starting philipsHue");
        setup();


        if (server.getDebug()) console.log("philipsHue setup read by poll");
        //TODO poll more often in productive environment
        for (var key in lights) {
            setInterval(function (light) {
                getLightState(light, server.writeIOToServer);
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
            if (server.getDebug()) console.log("startGeneratorOnOff");
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
        if (lights.hasOwnProperty(objName)) {
            if (ioName == "switch") {
                writeSwitchState(lights[objName], value);
            } else if (ioName == "brightness") {
                writeBrightness(lights[objName], value);
            } else if (ioName == "saturation") {
                writeSaturation(lights[objName], value);
            } else if (ioName == "hue") {
                writeHue(lights[objName], value);
            }
        }
    };

    exports.init = function () {
        for (var key in lights) {
            server.addIO(key, "switch", "default", "philipsHue");
            server.addIO(key, "brightness", "default", "philipsHue");
            server.addIO(key, "hue", "default", "philipsHue");
            server.addIO(key, "saturation", "default", "philipsHue");
        }
        server.clearIO("philipsHue");
    };

}



