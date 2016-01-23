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

// function for resizing the windows.
var objectExp = {};

window.addEventListener("message", function (msg) {
    parent.postMessage(JSON.stringify(
        {
            "pos": JSON.parse(msg.data).pos,
            "obj": JSON.parse(msg.data).obj,
            "height": document.body.scrollHeight,
            "width": document.body.scrollWidth
        }
        )
        // this needs to contain the final interface source
        , "*");
    objectExp.pos = JSON.parse(msg.data).pos;
    objectExp.obj = JSON.parse(msg.data).obj;

}, false);

// adding css styles nessasary for acurate 3D transformations.
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = 'body, html{ height: 100%; margin:0; padding:0;}';
document.getElementsByTagName('head')[0].appendChild(style);


function HybridObject() {
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