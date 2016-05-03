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

// Load socket.io.js synchronous so that it is available by the time the rest of the code is executed.
var xhr = new XMLHttpRequest();
xhr.open('GET', "/socket.io/socket.io.js", false);
xhr.send();

//Only add script if fetch was successful
if (xhr.status == 200) {
    var objIOScript = document.createElement('script');
    objIOScript.type = "text/javascript";
    objIOScript.text = xhr.responseText;
    document.getElementsByTagName('head')[0].appendChild(objIOScript);
} else {
    console.log("Error XMLHttpRequest HTTP status: " + xhr.status);
}
var objectVersion = "1.0";
var objectExp = {};
objectExp.modelViewMatrix = [];
objectExp.projectionMatrix = [];
objectExp.visibility = "visible";
var objectExpSendMatrix = false;
var objectExpSendFullScreen = false;
var objectExpHeight ="100%";
var objectExpWidth = "100%";

// function for resizing the windows.
window.addEventListener("message", function (MSG) {
    var msg = JSON.parse(MSG.data);

    if (typeof msg.pos !== "undefined") {

        if(objectExpSendFullScreen === false){
            objectExpHeight = document.body.scrollHeight;
            objectExpWidth = document.body.scrollWidth;
        }

        parent.postMessage(JSON.stringify(
            {
                "pos": msg.pos,
                "obj": msg.obj,
                "height": objectExpHeight,
                "width":objectExpWidth,
                "sendMatrix" : objectExpSendMatrix,
                "fullScreen" : objectExpSendFullScreen
            }
            )
            // this needs to contain the final interface source
            , "*");

        objectExp.pos = msg.pos;
        objectExp.obj = msg.obj;
    }

    if (typeof msg.modelViewMatrix !== "undefined") {
        objectExp.modelViewMatrix = msg.modelViewMatrix;
    }

    if (typeof msg.projectionMatrix !== "undefined") {
        objectExp.projectionMatrix = msg.projectionMatrix;
    }

    if (typeof msg.visibility !== "undefined") {
        objectExp.visibility = msg.visibility;
    }

}, false);

// adding css styles nessasary for acurate 3D transformations.
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = 'body, html{ height: 100%; margin:0; padding:0;}';
document.getElementsByTagName('head')[0].appendChild(style);


function HybridObject() {


    this.sendGlobalMessage = function(ohMSG) {
        if (typeof objectExp.pos !== "undefined") {
            var msgg = JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "ohGlobalMessage" : ohMSG
                });
            window.parent.postMessage(msgg
                , "*");
         }
    };

    this.addGlobalMessageListener = function (callback) {

        window.addEventListener("message", function (MSG) {
            var msg = JSON.parse(MSG.data);
            if (typeof msg.ohGlobalMessage !== "undefined") {
                callback(msg.ohGlobalMessage);
            }
        }, false);

    };

    // subscriptions
    this.subscribeToMatrix = function() {
        objectExpSendMatrix = true;
        if (typeof objectExp.pos !== "undefined") {

            if(objectExpSendFullScreen === false){
                objectExpHeight = document.body.scrollHeight;
                objectExpWidth = document.body.scrollWidth;
            }

            parent.postMessage(JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "height": objectExpHeight,
                    "width": objectExpWidth,
                    "sendMatrix": objectExpSendMatrix,
                    "fullScreen": objectExpSendFullScreen
                }), "*");
        }
    };

    this.setFullScreenOn = function() {
        objectExpSendFullScreen = true;
        console.log("fullscreen is loaded");
        if (typeof objectExp.pos !== "undefined") {

            objectExpHeight = "100%";
            objectExpWidth = "100%";

            parent.postMessage(JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "height": objectExpHeight,
                    "width": objectExpWidth,
                    "sendMatrix": objectExpSendMatrix,
                    "fullScreen": objectExpSendFullScreen
                }), "*");
        }
    };

    this.setFullScreenOff = function() {
        objectExpSendFullScreen = false;
        if (typeof objectExp.pos !== "undefined") {

             objectExpHeight = document.body.scrollHeight;
             objectExpWidth = document.body.scrollWidth;

            parent.postMessage(JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "height": objectExpHeight,
                    "width": objectExpWidth,
                    "sendMatrix": objectExpSendMatrix,
                    "fullScreen": objectExpSendFullScreen
                }), "*");
        }
    };

    this.getVisibility = function() {
        return objectExp.visibility;
    };

    this.addVisibilityListener = function (callback) {
        window.addEventListener("message", function (MSG) {
            var msg = JSON.parse(MSG.data);
            if (typeof msg.visibility !== "undefined") {
                callback(msg.visibility);
            }
        }, false);
    };
    
    this.getPossitionX = function() {
        if (typeof objectExp.modelViewMatrix[3][0] !== "undefined") {
            return objectExp.modelViewMatrix[3][0];
        } else return undefined;
    };

    this.getPossitionY = function() {
        if (typeof objectExp.modelViewMatrix[3][1] !== "undefined") {
            return objectExp.modelViewMatrix[3][1];
        } else return undefined;
    };

    this.getPossitionZ = function() {
        if (typeof objectExp.modelViewMatrix[3][2] !== "undefined") {
            return objectExp.modelViewMatrix[3][2];
        } else return undefined;
    };

    this.getProjectionMatrix = function() {
        if (typeof objectExp.projectionMatrix !== "undefined") {
            return objectExp.projectionMatrix;
        } else return undefined;
    };

    this.getModelViewMatrix = function() {
        if (typeof objectExp.modelViewMatrix !== "undefined") {
            return objectExp.modelViewMatrix;
        } else return undefined;
    };



    if (typeof io !== "undefined") {
        this.object = io.connect();

        this.write = function (IO, value, mode) {
            if (!mode) mode = 'f';
            this.object.emit('object', JSON.stringify({pos: IO, obj: objectExp.obj, value: value, mode: mode}));
        };

        this.readRequest = function (IO) {
            this.object.emit('/object/value', JSON.stringify({pos: IO, obj: objectExp.obj}));
        };

        this.read = function (IO, data) {
            if (data.pos === IO) {
                return data.value;
            } else {
                return undefined;
            }
        };
        console.log("socket.io is loaded");
    }
    else {
        this.object = {
            on: function (x, cb) {
            }
        };
        this.write = function (IO, value, mode) {
        };
        this.read = function (IO, data) {
            return undefined;
        };
        this.readRequest = function (IO) {
        };
        console.log("socket.io is not working. This is normal when you work offline.");
    }
}