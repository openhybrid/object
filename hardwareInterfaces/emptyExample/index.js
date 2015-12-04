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




/**
 * @desc prototype for an interface input. The input is something like a server that waits for incoming data.
 * @param {object} objectExp is the object that holds all data about the object. - check structure in main program.
 * @param {object} objectLookup holds object names with their ids
 * @param {boolean} clear tells the system to hold until new data is written and then it continues again.
 * @param {boolean} developer is set to true means that the developer tools are accessible.
 * @param {string} directoryName is set to the root of the main program
 * @param {function} callback sends back the values that just has been changed and should be run with the engine.
 * @note you have to give the call back an object and possition like so: callback(objKey2, valueKey);
 * @note when adding a new object to objectExp. make sure that the object has the type of your folder name.
 * @note make sure that the name of the new object is added to objectLookup. The ID is the object name + uuidTime() from the HybridObjectsUtilities file.
 **/

exports.receive= function (){

    // todo simplify the API to "clear", "add", "write", "developer"

};

/**
 * @desc prototype for an interface output. The output is something like a sender that sends present data to an external source.
 * @param {object} objectExp is the object that holds all data about the object. - check structure in main program.
 * @param {string} object defines the object that the output should change.
 * @param {string} position defines the data point within the object
 * @param {number} value defines the actual value that is send to the object.
 **/

exports.send = function (objName, ioName, value, mode, type) {

};

/**
 * @desc prototype for an interface init. The init reinitialize the communication with the external source.
 * @note program the init so that it can be called anytime there is a change to the amount of objects.
 **/

exports.init= function(){

};

exports.enabled = false;