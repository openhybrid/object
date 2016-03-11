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
objectExp.matrixCSS = [];
objectExp.acl = [];
var objectExpSendMatrixCSS= false;
var objectExpSendAcl = false;

function update() {
    // overwrite this function with your code to update synchronized with the 3D transforms
}

// function for resizing the windows.
window.addEventListener("message", function (MSG) {
    var msg = JSON.parse(MSG.data);

    if (typeof msg.matrixCSS !== "undefined") {
        objectExp.matrixCSS = msg.matrixCSS;
    }

    if (typeof msg.acl !== "undefined") {
        objectExp.acl = msg.acl;
    }

    if (typeof msg.pos !== "undefined") {
        parent.postMessage(JSON.stringify(
            {
                "pos": msg.pos,
                "obj": msg.obj,
                "height": document.body.scrollHeight,
                "width": document.body.scrollWidth,
                "sendMatrixCSS" : objectExpSendMatrixCSS,
                "sendAcl" : objectExpSendAcl
            }
            )
            // this needs to contain the final interface source
            , "*");

        objectExp.pos = msg.pos;
        objectExp.obj = msg.obj;
    }else {
        update();
    }
}, false);

// adding css styles nessasary for acurate 3D transformations.
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = 'body, html{ height: 100%; margin:0; padding:0;}';
document.getElementsByTagName('head')[0].appendChild(style);


function HybridObject() {

    // subscriptions
    this.subscribeToMatrixCSS = function() {
        objectExpSendMatrixCSS= true;
        if (typeof objectExp.pos !== "undefined") {
            parent.postMessage(JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "height": document.body.scrollHeight,
                    "width": document.body.scrollWidth,
                    "sendMatrixCSS": objectExpSendMatrixCSS
                }), "*");
        }
    };

    this.subscribeToAcceleration = function() {
        objectExpSendAcl = true;
        if (typeof objectExp.pos !== "undefined") {
            parent.postMessage(JSON.stringify(
                {
                    "pos": objectExp.pos,
                    "obj": objectExp.obj,
                    "height": document.body.scrollHeight,
                    "width": document.body.scrollWidth,
                    "sendAcl": objectExpSendAcl
                }), "*");
        }
    };


    this.getPossitionX = function() {
        if (typeof objectExp.matrixCSS[12] !== "undefined") {
            return objectExp.matrixCSS[12];
        } else return undefined;
    };

    this.getPossitionY = function() {
        if (typeof objectExp.matrixCSS[13] !== "undefined") {
            return objectExp.matrixCSS[13];
        } else return undefined;
    };

    this.getPossitionZ = function() {
        if (typeof objectExp.matrixCSS[14] !== "undefined") {
            return objectExp.matrixCSS[14];
        } else return undefined;
    };

    this.getAccelerationX = function() {
        if (typeof objectExp.acl[0] !== "undefined") {
            return objectExp.acl[0] ;
        } else return undefined;
    };

    this.getAccelerationY = function() {
        if (typeof objectExp.acl[1] !== "undefined") {
            return objectExp.acl[1] ;
        } else return undefined;
    };

    this.getAccelerationZ = function() {
        if (typeof objectExp.acl[2] !== "undefined") {
            return objectExp.acl[2] ;
        } else return undefined;
    };

    this.getOrientationX = function() {
        if (typeof objectExp.acl[3] !== "undefined") {
            return objectExp.acl[3] ;
        } else return undefined;
    };

    this.getOrientationY = function() {
        if (typeof objectExp.acl[4] !== "undefined") {
            return objectExp.acl[4] ;
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