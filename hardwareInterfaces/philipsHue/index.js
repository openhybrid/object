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

/*
 *
 *
 *
 *  PHILIPS HUE CONNECTOR
 *
 *
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

function setup() {
    lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));
    server.enableDeveloperMode();
    
    for (var key in lights) {
        server.addIO(key, "switch", "default", "philipsHue");
        server.addIO(key, "generatorOnOff", "default", "philipsHue");
        server.clearIO("philipsHue");
        startGeneratorOnOff(lights[key]);
    }
    
}


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
            state = JSON.parse(str).state;
            callback(light.id, "switch", state.on, "b");
        });
    }

    http.request(options, callbackHttp).end();
}

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

function philipsHueServer() {  
    setup();

    for (var key in lights) {
        setInterval(function (light) {
            getSwitchState(light, server.writeIOToServer);
        }, 1000 + _.random(-250, 250), lights[key]);
    }
    
}

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
    console.log("Incoming: " + objName + "  " + ioName + "  " + value + "  " + mode);
    if (lights.hasOwnProperty(objName)) {
        if (ioName == "switch" && _.isBoolean(value)) {
            writeSwitchState(lights[objName], value);
        }
    }
};

exports.init = function() {
};

exports.enabled = true;
