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

function setup(objectExp, globalVariables, Odirname) {
    lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));
    
    for (var key in lights) {
        server.addIO(key, "switch", 0, "default", "philipsHue", objectExp, globalVariables, Odirname);
        server.addIO(key, "generatorOnOff", 1, "default", "philipsHue", objectExp, globalVariables, Odirname);
        server.clearIO(objectExp, key, Odirname, 2, globalVariables);
    }
    
}


function getSwitchState(light, callback, objectExp, objectLookup, globalVariables, pluginModules, callback2) {
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
            callback(light.id, "switch", state.on, "d", objectExp, objectLookup, globalVariables, pluginModules, callback2);
        });
    }

    http.request(options, callbackHttp).end();
}

function philipsHueServer(objectExp, objectLookup, globalVariables,dirnameO, pluginModules, callback) {  
    setup(objectExp, globalVariables, dirnameO);

    for (var key in lights) {
        setInterval(function (light) {
            getSwitchState(light, server.writeIOToServer, objectExp, objectLookup, globalVariables, pluginModules, callback);
        }, 1000 + _.random(-250, 250), lights[key]);
    }
    
}


exports.receive = function (objectExp, objectLookup, globalVariables, dirnameO, pluginModules, callback) {
    philipsHueServer(objectExp,objectLookup, globalVariables,dirnameO, pluginModules, callback);
};

exports.send = function (objectExp,obj, pos, value, mode) {
    
};

exports.init = function() {
};
