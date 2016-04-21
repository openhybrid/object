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
 * @desc prototype for a plugin. This prototype is called when a value should be changed.
 * It defines how this value should be transformed before sending it to the destination.
 * @param {object} objectID Origin object in which the related link is saved.
 * @param {string} linkPositionID the id of the link that is related to the call
 * @param {value} inputData the data that needs to be processed
 * @param {function} callback the function that is called for when the process is rendered.
 * @note the callback has the same structure then the initial prototype, however inputData has changed to outputData
 **/

var debug = false;
var xml2js = require('xml2js');
var fs = require('fs');

exports.writeObject = function (objectLookup, folder, id) {
    objectLookup[folder] = {id: id};
};

exports.readObject = function (objectLookup, folder) {
    if (objectLookup.hasOwnProperty(folder)) {
        return objectLookup[folder].id;
    } else {
        return null;
    }
};

exports.createFolder = function (folderVar, dirnameO, debug) {

    var folder = dirnameO + '/objects/' + folderVar + '/';
    if (debug) console.log("Creating folder: " + folder);

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, 0766, function (err) {
            if (err) {
                console.log(err);
                res.send("ERROR! Can't make the directory! \n"); // echo the result back
            }
        });

        try {
            //   fs.createReadStream(__dirname + "/objects/object.css").pipe(fs.createWriteStream(__dirname + "/objects/" + folderVar + "/object.css"));
          //  fs.createReadStream(dirnameO + "/libraries/objectDefaultFiles/object.js").pipe(fs.createWriteStream(dirnameO + "/objects/" + folderVar + "/object.js"));
            fs.createReadStream(dirnameO + "/libraries/objectDefaultFiles/index.html").pipe(fs.createWriteStream(dirnameO + "/objects/" + folderVar + "/index.html"));
            fs.createReadStream(dirnameO + "/libraries/objectDefaultFiles/bird.png").pipe(fs.createWriteStream(dirnameO + "/objects/" + folderVar + "/bird.png"));

        } catch (e) {
            if (debug) console.log("Could not copy source files", e);
        }

        //  writeObjectToFile(tempFolderName);
    }
};

/**
 * Generates a random number between the two inputs, inclusive.
 * @param {number} min - The minimum possible value.
 * @param {number} max - The maximum possible value.
 */
exports.randomIntInc = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Generates a 12-digit unique identifier string, much of which is based on the current time.
 */
exports.uuidTime = function () {
    var dateUuidTime = new Date();
    var abcUuidTime = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var stampUuidTime = parseInt(Math.floor((Math.random() * 199) + 1) + "" + dateUuidTime.getTime()).toString(36);
    while (stampUuidTime.length < 12) stampUuidTime = abcUuidTime.charAt(Math.floor(Math.random() * abcUuidTime.length)) + stampUuidTime;
    return stampUuidTime;
};

exports.getObjectIdFromTarget = function (folderName, dirnameO) {

    var xmlFile = dirnameO + '/objects/' + folderName + '/target/target.xml';

    if (fs.existsSync(xmlFile)) {
        var resultXML = "";
        xml2js.
            Parser().
            parseString(fs.readFileSync(xmlFile, "utf8"),
            function (err, result) {
                for (var first in result) {
                    resultXML = result[first].Tracking[0].ImageTarget[0].$.name;
                    break;
                }
            });

        return resultXML;
    } else {
        return null;
    }
};

/**
 * Saves the HybridObject as "object.json"
 *
 * @param {Object[]} objectExp - The array of objects
 * @param {string}   object    - The key used to look up the object in the objectExp array
 * @param {string}   dirnameO  - The base directory name in which an "objects" directory resides. 
 **/
exports.writeObjectToFile = function (objectExp, object, dirnameO) {
    var outputFilename = dirnameO + '/objects/' + objectExp[object].folder + '/object.json';
    fs.writeFile(outputFilename, JSON.stringify(objectExp[object]), function (err) {
        if (err) {
            console.log(err);
        } else {
            if (debug) console.log("JSON saved to " + outputFilename);
        }
    });
};


