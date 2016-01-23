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
 * Modified by Carsten on 12/06/15.
 * Modified by Psomdecerff (PCS) on 12/21/15.
 *
 * Copyright (c) 2015 Valentin Heun
 *
 * All ascii characters above must be included in any redistribution.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*********************************************************************************************************************
 ******************************************** TODOS *******************************************************************
 **********************************************************************************************************************

 **

 * TODO - Only allow upload backups and not any other data....
 *
 *  something to remember: hexString = yourNumber.toString(16); and reverse the process with: yourNumber = parseInt(hexString, 16);
 *
 * TODO - check any collision with knownObjects -> Show collision with other object....
 * TODO - Check if Targets are double somehwere. And iff Target has more than one target in the file...
 *
 * TODO - Check the socket connections
 * TODO - stream of values for the user device
 * TODO - Plugin Structure  - check how good it works
 * TODO - check if objectlinks are pointing to values that actually exist. - (happens in browser at the moment)
 * TODO - Test self linking from internal to internal value (endless loop) - (happens in browser at the moment)
 *
 *
 * TODO - mark object functional only if:   if(thisId in objectExp && thisId.length>12)
 **

 **********************************************************************************************************************
 ******************************************** constant settings *******************************************************
 **********************************************************************************************************************/

var globalVariables = {
    developer: true, // show developer web GUI
    debug: true      // debug messages to console
};

// ports used to define the server behaviour
const serverPort = 8080;
const socketPort = serverPort;     // server and socket port are always identical
const beatPort = 52316;            // this is the port for UDP broadcasting so that the objects find each other.
const beatInterval = 3000;         // how often is the heartbeat sent
const socketUpdateInterval = 2000; // how often the system checks if the socket connections are still up and running.

//origins
const objectPath   = __dirname + "/objects";             // where all the objects are stored.
const modulePath   = __dirname + "/dataPointInterfaces"; // all the visual UI interfaces are stored here.
const internalPath = __dirname + "/hardwareInterfaces";  // all the visual UI interfaces are stored here.
const objectInterfaceFolder = "/";                       // the level on which the webservice is accessible

/**********************************************************************************************************************
 ******************************************** Requirements ************************************************************
 **********************************************************************************************************************/

var _ = require('lodash');
//var lj = require('longjohn');
var fs = require('fs');       // Filesystem library
var dgram = require('dgram'); // UDP Broadcasting library
var ip = require("ip");       // get the device IP address library
var bodyParser = require('body-parser');
var express = require('express');
var webServer = express();
var http = require('http').createServer(webServer).listen(serverPort, function () {
    if (globalVariables.debug) console.log('webserver + socket.io is listening on port: ' + serverPort);
});
var io = require('socket.io')(http);
var socket = require('socket.io-client');
var cors = require('cors');             // Library for HTTP Cross-Origin-Resource-Sharing
var formidable = require('formidable'); // Multiple file upload library
//var xml2js = require('xml2js');

// additional required code
var HybridObjectsUtilities   = require(__dirname + '/libraries/HybridObjectsUtilities');
var HybridObjectsWebFrontend = require(__dirname + '/libraries/HybridObjectsWebFrontend');
var HybridObjectsHardwareInterfaces = require(__dirname + '/libraries/HybridObjectsHardwareInterfaces');
var templateModule           = require(__dirname + '/libraries/templateModule');

// Set web frontend debug to inherit from global debug
HybridObjectsWebFrontend.debug = globalVariables.debug;

/**********************************************************************************************************************
 ******************************************** Constructors ************************************************************
 **********************************************************************************************************************/

/**
 * @desc Constructor for the the object
 **/

function ObjectExp() {
    this.objectId = null;
    this.name = "";
    this.ip = ip.address();
    this.version = "0.3.2";
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.visible = false;
    this.visibleText = false;
    this.visibleEditing = false;
    this.developer = false;
    this.matrix3dMemory = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // TODO use this to store UI interface for image later.
    this.objectLinks = {}; // Array of ObjectLink()
    this.objectValues = {}; // Array of ObjectValue()
}

/**
 * @desc Constructor for each link
 **/

function ObjectLink() {
    this.ObjectA = null;
    this.locationInA = 0;
    this.typeA = "";
    this.ObjectB = null;
    this.locationInB = 0;
    this.typeB = "";
    this.countLinkExistance = 0; // todo use this to test if link is still valid. If not able to send for some while, kill link.
}

/**
 * @desc Constructor for each object value
 **/

function ObjectValue() {
    this.name = "";
    this.value = null;
    this.mode = "f"; // this is for (f) floating point, (d) digital or (s) step and finally (m) media
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.plugin = "default";
    this.pluginParameter = null;
    this.type = "arduinoYun"; // todo "arduinoYun", "virtual", "edison", ... make sure to define yours in your internal_module file
}

/**
 * @desc Constructor for the socket.io web sockets
 **/

function ObjectSockets(socketPort, ip) {
    this.ip = ip;
    this.io = socket.connect('http://' + ip + ':' + socketPort, {
        'connect timeout': 5000,
        'reconnect': true,
        'reconnection delay': 500,
        'max reconnection attempts': 20,
        'auto connect': true,
        'transports': [
            'websocket'
            , 'flashsocket'
            , 'htmlfile'
            , 'xhr-multipart'
            , 'xhr-polling'
            , 'jsonp-polling']
    });
}

/**********************************************************************************************************************
 ******************************************** Initialisations *********************************************************
 **********************************************************************************************************************/

// Initializing the object tree
var objectExp = {};


var pluginModules = {};   // the pluginModule, that will hold all available plugins
var internalModules = {}; // the modules that will hold all internal connectors
var knownObjects = {};    // list of ids linked with ips of all objects found via udp heartbeats
var objectLookup = {};    // objectID lookup table
var socketArray = {};     // all socket connections that are kept alive

// counter for the socket connections
var sockets = {
    sockets: 0,
    connected: 0,
    notConnected: 0,
    socketsOld: 0,
    connectedOld: 0,
    notConnectedOld: 0
};

if (globalVariables.debug) console.log("got it started");

// get the directory names of all available plugins for the 3D-UI
var tempFiles = fs.readdirSync(modulePath).filter(function (file) {
    return fs.statSync(modulePath + '/' + file).isDirectory();
});
// remove hidden directories
while (tempFiles[0][0] === ".") {
    tempFiles.splice(0, 1);
}
// add all plugins to the pluginModules object.
for (var i = 0; i < tempFiles.length; i++) {
    pluginModules[tempFiles[i]] = require(__dirname + "/dataPointInterfaces/" + tempFiles[i] + "/index.js").render;
}


var modulesList = ['base',
    'documentation',
    'header',
    'home-object',
    'home-object-add',
    'interface',
    'interface-rowitem',
    'monitor',
    'sidebar',
    'target'];

templateModule.loadAllModules(modulesList, function () {
    // start system
    //if (globalVariables.debug) console.log("Starting System: ");
    //loadHybridObjects();
    //startSystem();

});

if (globalVariables.debug) console.log("Starting System: ");
HybridObjectsHardwareInterfaces.setup(objectExp, objectLookup, globalVariables, __dirname, pluginModules, function (objKey2, valueKey, objectExp, pluginModules) {
    objectEngine(objKey2, valueKey, objectExp, pluginModules);
}, ObjectValue);

if (globalVariables.debug) console.log("HW interfaces setup");
loadHybridObjects();
if (globalVariables.debug) console.log("loadHybridObjects done");

startSystem();
if (globalVariables.debug) console.log("startSystem done");

// add all modules for internal communication

// get the directory names of all available plugins for the 3D-UI
var tempFilesInternal = fs.readdirSync(internalPath).filter(function (file) {
    return fs.statSync(internalPath + '/' + file).isDirectory();
});
// remove hidden directories
while (tempFilesInternal[0][0] === ".") {
    tempFilesInternal.splice(0, 1);
}
// add all plugins to the pluginModules object. Iterate backwards because splice works inplace
for (var i = tempFilesInternal.length - 1; i >= 0; i--) {
    //check if hardwareInterface is enabled, if it is, add it to the internalModules
    if (require(internalPath + "/" + tempFilesInternal[i] + "/index.js").enabled) {
        internalModules[tempFilesInternal[i]] = require(internalPath + "/" + tempFilesInternal[i] + "/index.js");
    } else {
        tempFilesInternal.splice(i, 1);
    }
}

if (globalVariables.debug) console.log("ready to start internal servers");

// starting the internal servers (receive)
for (var i = 0; i < tempFilesInternal.length; i++) {
    internalModules[tempFilesInternal[i]].receive();
}

if (globalVariables.debug) console.log("found " + tempFilesInternal.length + " internal server");
if (globalVariables.debug) console.log("starting internal Server.");


/**
 * Returns the file extension (portion after the last dot) of the given filename.
 * If a file name starts with a dot, returns an empty string.
 *
 * @author VisioN @ StackOverflow
 * @param {string} fileName - The name of the file, such as foo.zip
 * @return {string} The lowercase extension of the file, such has "zip"
 */
function getFileExtension(fileName) {
  return fileName.substr((~-fileName.lastIndexOf(".") >>> 0) + 2).toLowerCase();
}

/**
 * @desc Add objects from the objects folder to the system
 **/
function loadHybridObjects() {
    if (globalVariables.debug) console.log("Enter loadHybridObjects");
    // check for objects in the objects folder by reading the objects directory content.
    // get all directory names within the objects directory
    var tempFiles = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });

    // remove hidden directories
    try {
        while (tempFiles[0][0] === ".") {
            tempFiles.splice(0, 1);
        }
    } catch (e) {
        if (globalVariables.debug) console.log("no hidden files");
    }

    for (var i = 0; i < tempFiles.length; i++) {
        var tempFolderName = HybridObjectsUtilities.getObjectIdFromTarget(tempFiles[i], __dirname);
        if (globalVariables.debug) console.log("TempFolderName: " + tempFolderName);

        if (tempFolderName !== null) {
            // fill objectExp with objects named by the folders in objects
            objectExp[tempFolderName] = new ObjectExp();
            objectExp[tempFolderName].folder = tempFiles[i];

            // add object to object lookup table
            HybridObjectsUtilities.writeObject(objectLookup, tempFiles[i], tempFolderName);

            // try to read a saved previous state of the object
            try {
                objectExp[tempFolderName] = JSON.parse(fs.readFileSync(__dirname + "/objects/" + tempFiles[i] + "/object.json", "utf8"));
                objectExp[tempFolderName].ip = ip.address();

// adding the values to the arduino lookup table so that the serial connection can take place.
                // todo this is maybe obsolete.
                for (var tempkey in objectExp[tempFolderName].objectValues) {
                    ArduinoLookupTable.push({obj: tempFiles[i], pos: tempkey});
                }
// todo the sizes do not really save...


                // todo new Data points are never writen in to the file. So this full code produces no value
                // todo Instead keep the board clear=false forces to read the data points from the arduino every time.
                // todo this is not true the datapoints are writen in to the object. the sizes are wrong
                // if not uncommented the code does not connect to the arduino side.
                // data comes always from the arduino....
                // clear = true;

                if (globalVariables.debug) {
                    console.log("I found objects that I want to add");
                    console.log("---");
                    console.log(ArduinoLookupTable);
                    console.log("---");
                }

            } catch (e) {
                objectExp[tempFolderName].ip = ip.address();
                objectExp[tempFolderName].objectId = tempFolderName;
                if (globalVariables.debug) console.log("No saved data for: " + tempFolderName);
            }

        } else {
            if (globalVariables.debug) console.log(" object " + tempFiles[i] + " has no marker yet");
        }
    }

    for (var keyint in internalModules) {
        internalModules[keyint].init();
    }
}

/**********************************************************************************************************************
 ******************************************** Starting the System ******************************************************
 **********************************************************************************************************************/

/**
 * @desc starting the system
 **/

function startSystem() {

    // generating a udp heartbeat signal for every object that is hosted in this device
    for (var key in objectExp) {
        objectBeatSender(beatPort, key, objectExp[key].ip);
    }

    // receiving heartbeat messages and adding new objects to the knownObjects Array
    objectBeatServer();

    // serving the visual frontend with web content as well serving the REST API for add/remove links and changing
    // object sizes and positions
    objectWebServer();

    // receives all socket connections and processes the data
    socketServer();

    // receives all serial calls and processes the data


    // initializes the first sockets to be opened to other objects
    socketUpdater();
    // keeps sockets to other objects alive based on the links found in the local objects
    // removes socket connections to objects that are no longer linked.
    socketUpdaterInterval();

    // blink the LED at the arduino board

}


/**********************************************************************************************************************
 ******************************************** Stopping the System *****************************************************
 **********************************************************************************************************************/

function exit() {
    var mod;
    
    // shut down the internal servers (teardown)
    for (var i = 0; i < tempFilesInternal.length; i++) {
        mod = internalModules[tempFilesInternal[i]];
        if("shutdown" in mod) {
            mod.shutdown();
        }
    }
    
    process.exit();
}

process.on('SIGINT', exit);


/**********************************************************************************************************************
 ******************************************** Emitter/Client/Sender Objects *******************************************
 **********************************************************************************************************************/

/**
 * @desc Sends out a Heartbeat broadcast via UDP in the local network.
 * @param {Number} PORT The port where to start the Beat
 * @param {string} thisId The name of the Object
 * @param {string} thisIp The IP of the Object
 * @param {boolean} oneTimeOnly if true the beat will only be sent once.
 **/

function objectBeatSender(PORT, thisId, thisIp, oneTimeOnly) {
    if (_.isUndefined(oneTimeOnly)) {
        oneTimeOnly = false;
    }

    var HOST = '255.255.255.255';

    // json string to be send
    var message = new Buffer(JSON.stringify({id: thisId, ip: thisIp}));

    if (globalVariables.debug) console.log("UDP broadcasting on port: " + PORT);
    if (globalVariables.debug) console.log("Sending beats... Content: " + JSON.stringify({id: thisId, ip: thisIp}));

    // creating the datagram
    var client = dgram.createSocket('udp4');
    client.bind(function () {
        client.setBroadcast(true);
        client.setTTL(2);
        client.setMulticastTTL(2);
    });

    if (!oneTimeOnly) {
        setInterval(function () {
            // send the beat#
            // if(thisId in objectLookup)

            //console.log(JSON.stringify(thisId));
            // console.log(JSON.stringify( objectExp));
            if (thisId in objectExp && thisId.length > 12) {
                //  if (globalVariables.debug) console.log("Sending beats... Content: " + JSON.stringify({id: thisId, ip: thisIp}));

                // this is an ugly hack to sync each object with being a developer object
                //objectExp[thisId].developer = globalVariables.developer;

                client.send(message, 0, message.length, PORT, HOST, function (err) {
                    if (err) {
                        console.log("error ");
                        throw err;
                    }
                    // client is not being closed, as the beat is send ongoing
                });
            }
        }, beatInterval + _.random(-250, 250));
    }
    else {
        // Single-shot, one-time heartbeat
        // delay the signal with timeout so that not all objects send the beat in the same time.
        setTimeout(function () {
            // send the beat
            if (thisId in objectExp) {
                client.send(message, 0, message.length, PORT, HOST, function (err) {
                    if (err) throw err;
                    // close the socket as the function is only called once.
                    client.close();
                });
            }
        }, _.random(1, 250));
    }
}

/**
 * @desc sends out an action json object via udp. Actions are used to cause actions in all objects and devices within the network.
 * @param {Object} action string of the action to be send to the system. this can be a jason object
 **/

function actionSender(action) {

    var HOST = '255.255.255.255';
    var message;

    message = new Buffer(JSON.stringify({action: action}));

    // creating the datagram
    var client = dgram.createSocket('udp4');
    client.bind(function () {
        client.setBroadcast(true);
        client.setTTL(64);
        client.setMulticastTTL(64);
    });
    // send the datagram
    client.send(message, 0, message.length, beatPort, HOST, function (err) {
        if (err) {
            throw err;
        }
        client.close();
    });
}


/**********************************************************************************************************************
 ******************************************** Server Objects **********************************************************
 **********************************************************************************************************************/


/**
 * @desc Receives a Heartbeat broadcast via UDP in the local network and updates the knownObjects Array in case of a
 * new object
 * @note if action "ping" is received, the object calls a heartbeat that is send one time.
 **/

function objectBeatServer() {

    // creating the udp server
    var udpServer = dgram.createSocket("udp4");
    udpServer.on("error", function (err) {
        console.log("server error:\n" + err);
        udpServer.close();
    });

    udpServer.on("message", function (msg) {
        var msgContent;
        // check if object ping
        // if (globalVariables.debug)  console.log("I found new Objects: " + msg);
        msgContent = JSON.parse(msg);
        if (msgContent.hasOwnProperty("id") && msgContent.hasOwnProperty("ip") && !(msgContent.id in objectExp) && !(msgContent.id in knownObjects)) {
            knownObjects[msgContent.id] = msgContent.ip;
            if (globalVariables.debug)  console.log("I found new Objects: " + JSON.stringify({
                    id: msgContent.id,
                    ip: msgContent.ip
                }));
            if (globalVariables.debug) console.log("knownObjectfound:" + knownObjects + "this message: ");
        }
        // check if action 'ping'
        if (msgContent.action === "ping") {
            if (globalVariables.debug)  console.log(msgContent.action);
            for (var key in objectExp) {
                objectBeatSender(beatPort, key, objectExp[key].ip, true);
            }
        }
    });

    udpServer.on("listening", function () {
        var address = udpServer.address();
        if (globalVariables.debug)  console.log("UDP listening on port: " + address.port);
    });

    // bind the udp server to the udp beatPort

    udpServer.bind(beatPort);
}

/**
 * @desc A static Server that serves the user, handles the links and
 * additional provides active modification for objectDefinition.
 **/

function objectWebServer() {

    // define the body parser
    webServer.use(bodyParser.urlencoded({
        extended: true
    }));
    webServer.use(bodyParser.json());
    // devine a couple of static directory routs
    webServer.use("/obj", express.static(__dirname + '/objects/'));

    if (globalVariables.developer === true) {
        webServer.use("/public", express.static(__dirname + '/libraries/webInterface/'));
        webServer.use(express.static(__dirname + '/libraries/webInterface/'));
    }

    // use the cors cross origin REST model
    webServer.use(cors());
    // allow requests from all origins with '*'. TODO make it dependent on the local network. this is important for security
    webServer.options('*', cors());

    // adding a new link to an object. *1 is the object *2 is the link id
    // ****************************************************************************************************************
    webServer.post('/object/*/link/*/', function (req, res) {

        //  if(globalVariables.debug) console.log("post 1");

        var updateStatus = "nothing happened";

        if (objectExp.hasOwnProperty(req.params[0])) {
            objectExp[req.params[0]].objectLinks[req.params[1]] = req.body;

            // call an action that asks all devices to reload their links, once the links are changed.
            actionSender(JSON.stringify({reloadLink: {id: req.params[0], ip: objectExp[req.params[0]].ip}}));
            updateStatus = "added";

            // check if there are new connections associated with the new link.
            socketUpdater();

            // write the object state to the permanent storage.
            HybridObjectsUtilities.writeObjectToFile(objectExp, req.params[0], __dirname);
            res.send(updateStatus);
        }
    });

    // changing the size and possition of an item. *1 is the object *2 is the datapoint id
    // ****************************************************************************************************************
    webServer.post('/object/*/size/*/', function (req, res) {
        // if(globalVariables.debug) console.log("post 2");
        var updateStatus = "nothing happened";
        var thisObject = req.params[0];
        var thisValue = req.params[1];

        // check that the numbers are valid numbers..
        if (typeof req.body.x === "number" && typeof req.body.y === "number" && typeof req.body.scale === "number") {

            // if the object is equal the datapoint id, the item is actually the object it self.
            if (thisObject === thisValue) {
                objectExp[thisObject].x = req.body.x;
                objectExp[thisObject].y = req.body.y;
                objectExp[thisObject].scale = req.body.scale;
            }
            else {
                objectExp[thisObject].objectValues[thisValue].x = req.body.x;
                objectExp[thisObject].objectValues[thisValue].y = req.body.y;
                objectExp[thisObject].objectValues[thisValue].scale = req.body.scale;
            }
            // console.log(req.body);
            // ask the devices to reload the objects
            actionSender(JSON.stringify({reloadObject: {id: thisObject, ip: objectExp[thisObject].ip}}));
            updateStatus = "added";

            // write the object state to the permanent storage.
            HybridObjectsUtilities.writeObjectToFile(objectExp, req.params[0], __dirname);
        }
        res.send(updateStatus);
    });

    // delete a link. *1 is the object *2 is the link id
    // ****************************************************************************************************************
    webServer.delete('/object/*/link/*/', function (req, res) {
        if (globalVariables.debug) console.log("delete 1");

        if (globalVariables.debug) console.log("i got a delete message");
        var thisLinkId = req.params[1];
        var fullEntry = objectExp[req.params[0]].objectLinks[thisLinkId];
        var destinationIp = knownObjects[fullEntry.ObjectB];

        delete objectExp[req.params[0]].objectLinks[thisLinkId];

        if (globalVariables.debug) console.log(objectExp[req.params[0]].objectLinks);
        actionSender(JSON.stringify({reloadLink: {id: req.params[0], ip: objectExp[req.params[0]].ip}}));
        HybridObjectsUtilities.writeObjectToFile(objectExp, req.params[0], __dirname);
        res.send("deleted: " + thisLinkId + " in object: " + req.params[0]);

        var checkIfIpIsUsed = false;
        var checkerKey, subCheckerKey;
        for (checkerKey in objectExp) {
            for (subCheckerKey in objectExp[checkerKey].objectLinks) {
                if (objectExp[checkerKey].objectLinks[subCheckerKey].ObjectB === fullEntry.ObjectB) {
                    checkIfIpIsUsed = true;
                }
            }
        }

        if (fullEntry.ObjectB !== fullEntry.ObjectA && !checkIfIpIsUsed) {
            // socketArray.splice(destinationIp, 1);
            delete socketArray[destinationIp];
        }
    });

    // request a link. *1 is the object *2 is the link id
    // ****************************************************************************************************************
    webServer.get('/object/*/link/:id', function (req, res) {
        // if(globalVariables.debug) console.log("get 1");
        res.send(objectExp[req.params[0]].objectLinks[req.params.id]);
    });

    // request all link. *1 is the object
    // ****************************************************************************************************************
    webServer.get('/object/*/link', function (req, res) {
        //  if(globalVariables.debug) console.log("get 2");
        res.send(objectExp[req.params[0]].objectLinks);
    });

    // request a zip-file with the object stored inside. *1 is the object
    // ****************************************************************************************************************
    webServer.get('/object/*/zipBackup/', function (req, res) {
        //  if(globalVariables.debug) console.log("get 3");
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': 'attachment; filename=HybridObjectBackup.zip'
        });

        var Archiver = require('archiver');

        var zip = Archiver('zip', false);
        zip.pipe(res);
        zip.directory(__dirname + "/objects/" + req.params[0], req.params[0] + "/");
        zip.finalize();
    });

    // Send the programming interface static web content
    // ****************************************************************************************************************
    webServer.get('/obj/dataPointInterfaces/*/*/', function (req, res) {   // watch out that you need to make a "/" behind request.
        res.sendFile(__dirname + "/dataPointInterfaces/" + req.params[0] + '/www/' + req.params[1]);
    });


    // general overview of all the hybrid objects - html response
    // ****************************************************************************************************************
    webServer.get('/object/*/html', function (req, res) {
        var msg = [];
        var hoVals, hoLinks, subKey;
        var objectName = req.params[0];
        var hybridObject = objectExp[objectName];

        msg.push("<html><head><meta http-equiv='refresh' content='3.3' /><title>", objectName, "</title></head>\n<body>\n");
        msg.push("<table border='0' cellpadding='10'>\n<tr>\n<td align='left' valign='top'>\n");
        msg.push("Values for ", objectName, ":<br>\n\n<table border='1'>\n<tr><td>ID</td><td>Value</td></tr>\n");

        if (!_.isUndefined(hybridObject)) {
            hoVals = hybridObject.objectValues;
            for (subKey in hoVals) {
                msg.push("<tr><td>", subKey, "</td><td>", hoVals[subKey].value, "</td></tr>\n");
            }
        }
        msg.push("</table>\n</td>\n<td align='left' valign='top'>\n\n");

        msg.push("Links:<br>\n\n<table border='1'>\n<tr><td>ID</td><td>ObjectA</td><td>locationInA</td><td>ObjectB</td><td>locationInB</td></tr>\n");
        
        if (!_.isUndefined(hybridObject)) {
            hoLinks = hybridObject.objectLinks;
            for (subKey in hoLinks) {
                msg.push("  <tr><td>", subKey, "</td><td>", hoLinks[subKey].ObjectA, "</td><td>", hoLinks[subKey].locationInA, "</td>");
                msg.push("<td>", hoLinks[subKey].ObjectB, "</td><td>", hoLinks[subKey].locationInB, "</td></tr>\n");
            }
        }

        msg.push("</table>\n</td></tr>\n</table>\n");

        msg.push("<table border='0' cellpadding='10'>\n<tr><td align='left' valign='top'>\n");
        msg.push("Interface:<br>\n\n<table border='1'>\n");
        
        for (subKey in hybridObject) {
            msg.push("  <tr><td>", subKey, "</td><td>", hybridObject[subKey], "</td></tr>\n");
        }
        msg.push("</table>\n</td>\n<td align='left' valign='top'>");


        msg.push("Known Objects:<br>\n\n<table border='1'>\n");
        for (subKey in knownObjects) {
            msg.push("  <tr><td>", subKey, "</td><td>", knownObjects[subKey], "</td></tr>\n");
        }
        msg.push("</table>\n</td><td align='left' valign='top'>");

        socketIndicator();

        msg.push("Socket Activity:<br>\n<table border='1'>\n");
        for (subKey in sockets) {
            if (subKey !== "socketsOld" && subKey !== "connectedOld" && subKey !== "notConnectedOld")
                msg.push("  <tr><td>", subKey, "</td><td>", sockets[subKey], "</td></tr>\n");
        }

        msg.push("</table>\n</td></tr>\n</table>\n");
        msg.push("</body></html>");

        res.send(msg.join(""));


    });

    // sends json object for a specific hybrid object. * is the object name
    // ****************************************************************************************************************
    webServer.get('/object/*/', function (req, res) {
        //  if(globalVariables.debug) console.log("get 7");
        res.json(objectExp[req.params[0]]);
    });

    webServer.get('/object/*/thisObject', function (req, res) {
        //  if(globalVariables.debug) console.log("get 8");
        res.json(objectExp[req.params[0]]);
    });

    // sends all json object values for a specific hybrid object. * is the object name
    // ****************************************************************************************************************
    webServer.get('/object/*/value', function (req, res) {
        //   if(globalVariables.debug) console.log("get 9");
        res.json(objectExp[req.params[0]].objectValues);
    });

    // sends a specific value for a specific hybrid object. * is the object name :id is the value name
    // ****************************************************************************************************************
    webServer.get('/object/*/value/:id', function (req, res) {
        //  if(globalVariables.debug) console.log("get 10");
        res.send({value: objectExp[req.params[0]].objectValues[req.params.id].value});
    });

    // sends a specific json object value for a specific hybrid object. * is the object name :id is the value name
    // ****************************************************************************************************************

    webServer.get('/object/*/value/full/:id', function (req, res) {
        //  if(globalVariables.debug) console.log("get 11");
        res.json(objectExp[req.params[0]].objectValues[req.params.id]);
    });

    // ****************************************************************************************************************
    // frontend interface
    // ****************************************************************************************************************


    if (globalVariables.developer === true) {

        // sends the info page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'info/:id', function (req, res) {
            // if(globalVariables.debug) console.log("get 12");
            res.send(HybridObjectsWebFrontend.uploadInfoText(req.params.id, objectLookup, objectExp, knownObjects, io, sockets));
        });

        // sends the content page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'content/:id', function (req, res) {
            // if(globalVariables.debug) console.log("get 13");
            res.send(HybridObjectsWebFrontend.uploadTargetContent(req.params.id, __dirname, objectInterfaceFolder));
        });

        // sends the target page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'target/:id', function (req, res) {
            //   if(globalVariables.debug) console.log("get 14");
            res.send(HybridObjectsWebFrontend.uploadTargetText(req.params.id, objectLookup, objectExp, globalVariables.debug));
            // res.sendFile(__dirname + '/'+ "index2.html");
        });

        webServer.get(objectInterfaceFolder + 'target/*/*/', function (req, res) {
            //  if(globalVariables.debug) console.log("get 15");
            res.sendFile(__dirname + '/' + req.params[0] + '/' + req.params[1]);
        });

        // sends the object folder?? //todo what is this for?
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder, function (req, res) {
            // if(globalVariables.debug) console.log("get 16");
            res.send(HybridObjectsWebFrontend.printFolder(objectExp, __dirname, globalVariables.debug, objectInterfaceFolder, objectLookup));
        });

        // ****************************************************************************************************************
        // post interfaces
        // ****************************************************************************************************************

        webServer.post(objectInterfaceFolder + "contentDelete/:id", function (req, res) {
            // if(globalVariables.debug) console.log("post 21");
            if (req.body.action === "delete") {
                var folderDel = __dirname + '/objects/' + req.body.folder;

                if (fs.lstatSync(folderDel).isDirectory()) {
                    var deleteFolderRecursive = function (folderDel) {
                        if (fs.existsSync(folderDel)) {
                            fs.readdirSync(folderDel).forEach(function (file, index) {
                                var curPath = folderDel + "/" + file;
                                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                                    deleteFolderRecursive(curPath);
                                } else { // delete file
                                    fs.unlinkSync(curPath);
                                }
                            });
                            fs.rmdirSync(folderDel);
                        }
                    };

                    deleteFolderRecursive(folderDel);
                }
                else {
                    fs.unlinkSync(folderDel);
                }

                res.send(HybridObjectsWebFrontend.uploadTargetContent(req.params.id, __dirname, objectInterfaceFolder));
            }

        });

//*****************************************************************************************
        webServer.post(objectInterfaceFolder, function (req, res) {
            // if(globalVariables.debug) console.log("post 22");
            if (req.body.action === "new") {
                // console.log(req.body);
                if (req.body.folder !== "") {

                    HybridObjectsUtilities.createFolder(req.body.folder, __dirname, globalVariables.debug);

                }
                res.send(HybridObjectsWebFrontend.printFolder(objectExp, __dirname, globalVariables.debug, objectInterfaceFolder, objectLookup));
            }
            if (req.body.action === "delete") {
                var folderDel = __dirname + '/objects/' + req.body.folder;

                var deleteFolderRecursive = function (folderDel) {
                    if (fs.existsSync(folderDel)) {
                        fs.readdirSync(folderDel).forEach(function (file, index) {
                            var curPath = folderDel + "/" + file;
                            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                                deleteFolderRecursive(curPath);
                            } else { // delete file
                                fs.unlinkSync(curPath);
                            }
                        });
                        fs.rmdirSync(folderDel);
                    }
                };

                deleteFolderRecursive(folderDel);

                var tempFolderName2 = HybridObjectsUtilities.readObject(objectLookup, req.body.folder);// req.body.folder + thisMacAddress;

                if (tempFolderName2 !== null) {
                    if (tempFolderName2 in objectExp) {
                        if (globalVariables.debug)  console.log("ist noch da");
                    } else {
                        if (globalVariables.debug)  console.log("ist weg");
                    }
                    if (tempFolderName2 in knownObjects) {
                        if (globalVariables.debug) console.log("ist noch da");
                    } else {
                        if (globalVariables.debug) console.log("ist weg");
                    }

                    // remove object from tree
                    delete objectExp[tempFolderName2];
                    delete knownObjects[tempFolderName2];
                    delete objectLookup[req.body.folder];

                    if (tempFolderName2 in objectExp) {
                        if (globalVariables.debug)  console.log("ist noch da");
                    } else {
                        if (globalVariables.debug)  console.log("ist weg");
                    }
                    if (tempFolderName2 in knownObjects) {
                        if (globalVariables.debug)  console.log("ist noch da");
                    } else {
                        if (globalVariables.debug) console.log("ist weg");
                    }
                }

                if (globalVariables.debug) console.log("i deleted: " + tempFolderName2);

                res.send(HybridObjectsWebFrontend.printFolder(objectExp, __dirname, globalVariables.debug, objectInterfaceFolder, objectLookup));
            }

        });

        var tmpFolderFile = "";


        // this is all used just for the backup folder
        //*************************************************************************************
        webServer.post(objectInterfaceFolder + 'backup/',
            function (req, res) {
                // if(globalVariables.debug) console.log("post 23");

                if (globalVariables.debug)console.log("komm ich hier hin?");

                var form = new formidable.IncomingForm({
                    uploadDir: __dirname + '/objects',  // don't forget the __dirname here
                    keepExtensions: true
                });

                var filename = "";

                form.on('error', function (err) {
                    throw err;
                });

                form.on('fileBegin', function (name, file) {
                    filename = file.name;
                    //rename the incoming file to the file's name
                    file.path = form.uploadDir + "/" + file.name;
                });

                form.parse(req, function (err, fields, files) {
                    var old_path = files.file.path,
                        file_size = files.file.size;
                });

                form.on('end', function () {
                    var folderD = form.uploadDir;
                    if (globalVariables.debug) console.log("------------" + form.uploadDir + " " + filename);

                    if (getFileExtension(filename) === "zip") {

                        if (globalVariables.debug) console.log("I found a zip file");

                        try {
                            var DecompressZip = require('decompress-zip');
                            var unzipper = new DecompressZip(folderD + "/" + filename);

                            unzipper.on('error', function (err) {
                                if (globalVariables.debug)  console.log('Caught an error');
                            });

                            unzipper.on('extract', function (log) {
                                if (globalVariables.debug) console.log('Finished extracting');
                                console.log("have created a new object");
                                //createObjectFromTarget(filename.substr(0, filename.lastIndexOf('.')));
                                createObjectFromTarget(ObjectExp, objectExp, filename.substr(0, filename.lastIndexOf('.')), __dirname, objectLookup, internalModules, objectBeatSender, beatPort, globalVariables.debug);

//todo add object to the beatsender.

                                console.log("have created a new object");
                                fs.unlinkSync(folderD + "/" + filename);

                                res.status(200);
                                res.send("done");

                            });

                            unzipper.on('progress', function (fileIndex, fileCount) {
                                if (globalVariables.debug) console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
                            });

                            unzipper.extract({
                                path: folderD + "/",
                                filter: function (file) {
                                    return file.type !== "SymbolicLink";
                                }
                            });

                            if (globalVariables.debug) console.log("extracting: " + filename + "  " + folderD);

                        } catch (err) {
                            if (globalVariables.debug)  console.log("could not unzip file");
                        }
                    }
                });
            });


        // this for all the upload to content
        //***********************************************************************

        webServer.post(objectInterfaceFolder + 'content/:id',
            function (req, res) {

                console.log(req.params.id);

                // if(globalVariables.debug) console.log("post 24");
                if (globalVariables.debug) console.log(req.body);
                tmpFolderFile = req.params.id;
                if (globalVariables.debug) console.log("parameter is: " + req.params.id);
                if (req.body.action === "delete") {
                    var folderDel = __dirname + '/objects/' + req.body.folder;


                    if (fs.existsSync(folderDel)) {
                        if (fs.lstatSync(folderDel).isDirectory()) {
                            var deleteFolderRecursive = function (folderDel) {
                                if (fs.existsSync(folderDel)) {
                                    fs.readdirSync(folderDel).forEach(function (file, index) {
                                        var curPath = folderDel + "/" + file;
                                        if (fs.lstatSync(curPath).isDirectory()) { // recurse
                                            deleteFolderRecursive(curPath);
                                        } else { // delete file
                                            fs.unlinkSync(curPath);
                                        }
                                    });
                                    fs.rmdirSync(folderDel);
                                }
                            };

                            deleteFolderRecursive(folderDel);
                        }
                        else {
                            fs.unlinkSync(folderDel);
                        }
                    }

                    var tempFolderName2 = HybridObjectsUtilities.readObject(objectLookup, req.body.folder);//req.body.folder + thisMacAddress;
                    // remove object from tree
                    if (tempFolderName2 !== null) {
                        delete objectExp[tempFolderName2];
                        delete knownObjects[tempFolderName2];
                    }

                    if (globalVariables.debug) console.log("i deleted: " + tempFolderName2);

                    res.send(HybridObjectsWebFrontend.uploadTargetContent(req.params.id, __dirname, objectInterfaceFolder));
                }


                var form = new formidable.IncomingForm({
                    uploadDir: __dirname + '/objects/' + req.params.id,  // don't forget the __dirname here
                    keepExtensions: true
                });

                var filename = "";

                form.on('error', function (err) {
                    throw err;
                });

                form.on('fileBegin', function (name, file) {
                    filename = file.name;
                    //rename the incoming file to the file's name
                    if (req.headers.type === "targetUpload") {
                        file.path = form.uploadDir + "/" + file.name;
                    } else {
                        file.path = form.uploadDir + "/" + file.name;
                    }
                });

                form.parse(req, function (err, fields, files) {
                    var old_path = files.file.path,
                        file_size = files.file.size;
                    // new_path = path.join(__dirname, '/uploads/', files.file.name);
                });

                form.on('end', function () {
                    var folderD = form.uploadDir;
                    if (globalVariables.debug)  console.log("------------" + form.uploadDir + "/" + filename);

                    if (req.headers.type === "targetUpload") {
                        var fileExtension = getFileExtension(filename);
                        if (fileExtension === "jpg") {
                            if (!fs.existsSync(folderD + "/target/")) {
                                fs.mkdirSync(folderD + "/target/", 0766, function (err) {
                                    if (err) {
                                        console.log(err);
                                        res.send("ERROR! Can't make the directory! \n");    // echo the result back
                                    }
                                });
                            }

                            fs.renameSync(folderD + "/" + filename, folderD + "/target/target.jpg");


                            var objectName = req.params.id + HybridObjectsUtilities.uuidTime();

                            var documentcreate = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                                '<ARConfig xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
                                '   <Tracking>\n' +
                                '   <ImageTarget name="' + objectName + '" size="300.000000 300.000000" />\n' +
                                '   </Tracking>\n' +
                                '   </ARConfig>';

                            var xmlOutFile = folderD + "/target/target.xml";
                            if (!fs.existsSync(xmlOutFile)) {
                                fs.writeFile(xmlOutFile, documentcreate, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (globalVariables.debug) console.log("XML saved to " + xmlOutFile);
                                    }
                                });
                            }

                            res.status(200);
                            res.send("done");
                            //   fs.unlinkSync(folderD + "/" + filename);
                        }


                        else if (fileExtension === "zip") {

                            if (globalVariables.debug) console.log("I found a zip file");

                            try {
                                var DecompressZip = require('decompress-zip');
                                var unzipper = new DecompressZip(folderD + "/" + filename);

                                unzipper.on('error', function (err) {
                                    if (globalVariables.debug) console.log('Caught an error');
                                });

                                unzipper.on('extract', function (log) {
                                    var folderFile = fs.readdirSync(folderD + "/target");
                                    var folderFileType;

                                    for (var i = 0; i < folderFile.length; i++) {
                                        if (globalVariables.debug) console.log(folderFile[i]);
                                        folderFileType = folderFile[i].substr(folderFile[i].lastIndexOf('.') + 1);
                                        if (folderFileType === "xml" || folderFileType === "dat") {
                                            fs.renameSync(folderD + "/target/" + folderFile[i], folderD + "/target/target." + folderFileType);
                                        }
                                    }
                                    fs.unlinkSync(folderD + "/" + filename);

                                    // evnetually create the object.

                                    if (globalVariables.debug) console.log("creating object from target file " + tmpFolderFile);
                                    // createObjectFromTarget(tmpFolderFile);
                                    createObjectFromTarget(ObjectExp, objectExp, tmpFolderFile, __dirname, objectLookup, internalModules, objectBeatSender, beatPort, globalVariables.debug);

                                    //todo send init to internal modules
                                    console.log("have created a new object");

                                    for (var keyint in internalModules) {
                                        internalModules[keyint].init();
                                    }
                                    console.log("have initialized the modules");
                                    res.status(200);
                                    res.send("done");
                                });

                                unzipper.on('progress', function (fileIndex, fileCount) {
                                    if (globalVariables.debug) console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
                                });

                                unzipper.extract({
                                    path: folderD + "/target",
                                    filter: function (file) {
                                        return file.type !== "SymbolicLink";
                                    }
                                });
                            } catch (err) {
                                if (globalVariables.debug) console.log("could not unzip file");
                            }
                        } else {
                            res.status(200);
                            res.send("done");
                        }

                    } else {
                        res.status(200);
                        res.send("done");
                    }


                });
            });
    } else {
        webServer.get(objectInterfaceFolder, function (req, res) {
            //   if(globalVariables.debug) console.log("GET 21");
            res.send("Hybrid Objects<br>Developer functions are off");
        });
    }
}

// relies on ip

//createObjectFromTarget(ObjectExp, objectExp, tmpFolderFile, __dirname, objectLookup, internalModules, objectBeatSender, beatPort, globalVariables.debug);

function createObjectFromTarget(ObjectExp, objectExp, folderVar, __dirname, objectLookup, internalModules, objectBeatSender, beatPort, debug) {
    console.log("I can start");

    var folder = __dirname + '/objects/' + folderVar + '/';
    if (globalVariables.debug) console.log(folder);

    if (fs.existsSync(folder)) {
        if (globalVariables.debug)  console.log("folder exists");
        var objectIDXML = HybridObjectsUtilities.getObjectIdFromTarget(folderVar, __dirname);
        if (globalVariables.debug) console.log("got ID: objectIDXML");
        if (!_.isUndefined(objectIDXML) && !_.isNull(objectIDXML)) {
            if (objectIDXML.length > 13) {

                objectExp[objectIDXML] = new ObjectExp();
                objectExp[objectIDXML].folder = folderVar;
                objectExp[objectIDXML].objectId = objectIDXML;

                if (globalVariables.debug) console.log("this should be the IP" + objectIDXML);

                try {
                    objectExp[objectIDXML] = JSON.parse(fs.readFileSync(__dirname + "/objects/" + folderVar + "/object.json", "utf8"));
                    objectExp[objectIDXML].ip = ip.address();
                    if (globalVariables.debug)  console.log("testing: " + objectExp[objectIDXML].ip);
                } catch (e) {
                    objectExp[objectIDXML].ip = ip.address();
                    if (globalVariables.debug) console.log("testing: " + objectExp[objectIDXML].ip);
                    if (globalVariables.debug) console.log("No saved data for: " + objectIDXML);
                }

                if (HybridObjectsUtilities.readObject(objectLookup, folderVar) !== objectIDXML) {
                    delete objectExp[HybridObjectsUtilities.readObject(objectLookup, folderVar)];
                }
                HybridObjectsUtilities.writeObject(objectLookup, folderVar, objectIDXML);
                // entering the obejct in to the lookup table

                // ask the object to reinitialize
                //serialPort.write("ok\n");
                // todo send init to internal
                for (var keyint in internalModules) {
                    internalModules[keyint].init();
                }

                if (globalVariables.debug) console.log("weiter im text " + objectIDXML);
                HybridObjectsUtilities.writeObjectToFile(objectExp, objectIDXML, __dirname);

                objectBeatSender(beatPort, objectIDXML, objectExp[objectIDXML].ip);
            }
        }
    }
}

/**
 * @desc Check for incoming MSG from other objects or the User. Make changes to the objectValues if changes occur.
 **/

function socketServer() {
    io.on('connection', function (socket) {

        socket.on('object', function (msg) {
            var msgContent = JSON.parse(msg);
            var objSend;
            if ((msgContent.obj in objectExp) && typeof msgContent.value !== "undefined") {
                var objID = msgContent.pos + msgContent.obj;
                if (objID in objectExp[msgContent.obj].objectValues) {
                    objectExp[msgContent.obj].objectValues[objID].value = msgContent.value;

                    objSend = objectExp[msgContent.obj].objectValues[objID];
                    objSend.value = msgContent.value;

                    if (internalModules.hasOwnProperty(objSend.type)) {
                        internalModules[objSend.type].send(objectExp[msgContent.obj].name, objectExp[msgContent.obj].objectValues[objID].name, msgContent.value, msgContent.mode, msgContent.type);
                    }

                    objectEngine(msgContent.obj, msgContent.pos + msgContent.obj, objectExp, pluginModules);

                } else {
                    for (var thisKey in objectExp[msgContent.obj].objectValues) {
                        if (msgContent.pos === objectExp[msgContent.obj].objectValues[thisKey].name) {
                            objSend = objectExp[msgContent.obj].objectValues[objID];
                            objSend.value = msgContent.value;

                            if (internalModules.hasOwnProperty(objSend.type)) {
                                internalModules[objSend.type].send(objectExp[msgContent.obj].name, objectExp[msgContent.obj].objectValues[objID].name, msgContent.value, msgContent.mode, msgContent.type);
                            }

                            //serialSender(serialPort, objectExp, msgContent.obj, msgContent.pos + msgContent.obj, msgContent.value);
                            objectEngine(msgContent.obj, msgContent.pos + msgContent.obj, objectExp, pluginModules);
                        }
                    }
                }
            }
        });

        socket.on('/object/value', function (msg) {
            var msgContent = JSON.parse(msg);
            if (msgContent.pos) {

                var msgToSend = "";
                if (objectExp.hasOwnProperty(msgContent.obj)) {
                    if (objectExp[msgContent.obj].objectValues.hasOwnProperty(msgContent.pos + msgContent.obj)) {

                        msgToSend = JSON.stringify({
                            obj: msgContent.obj,
                            pos: msgContent.pos,
                            value: objectExp[msgContent.obj].objectValues[msgContent.pos + msgContent.obj].value
                        });
                        socket.emit('object', msgToSend);
                    }
                }

            } else {
                var valueArray = {};

                for (var thiskkey in objectExp[msgContent.obj].objectValues) {
                    valueArray[objectExp[msgContent.obj].objectValues[thiskkey].name] = objectExp[msgContent.obj].objectValues[thiskkey];
                }

                var msgToSend2 = JSON.stringify({obj: msgContent.obj, value: valueArray});
                socket.emit('object', msgToSend2);
            }
            // if (globalVariables.debug) console.log("got it");
        });

        socket.on('/object/value/full', function (msg) {
            var msgContent = JSON.parse(msg);
            var msgToSend = JSON.stringify({
                obj: msgContent.obj,
                pos: msgContent.pos,
                value: objectExp[msgContent.obj].objectValues[msgContent.pos + msgContent.obj]
            });
            socket.emit('object', msgToSend);
        });
    });
    if (globalVariables.debug) console.log('socket.io started');
}

/**********************************************************************************************************************
 ******************************************** Engine ******************************************************************
 **********************************************************************************************************************/

/**
 * @desc Take the id of a value in objectValue and look through all links, if this id is used.
 * All links that use the id will fire up the engine to process the link.
 **/

// dependencies afterPluginProcessing

function objectEngine(obj, pos, objectExp, pluginModules) {
    // console.log("engine started");
    var key;
    for (key in objectExp[obj].objectLinks) {
        if (objectExp[obj].objectLinks[key].locationInA === pos) {
            var endlessLoop = false;

            if (pos === objectExp[obj].objectLinks[key].locationInB && objectExp[obj].objectLinks[key].ObjectA === objectExp[obj].objectLinks[key].ObjectB) {
                endlessLoop = true;
            }

            if (!endlessLoop) {
                // preparation for later when values can be from different types.

                //var thisPlugin = objectExp[obj].objectValues[pos].plugin;
                // var thisData = objectExp[obj].objectValues[pos].value;

                var thisData = objectExp[obj].objectValues[pos];

                if ((thisData.plugin in pluginModules)) {
                    pluginModules[thisData.plugin](obj, key, thisData.value, thisData.mode, function (obj, linkPos, processedValue, mode) {
                        afterPluginProcessing(obj, linkPos, processedValue, mode);
                        // console.log("from the enginehouse a bit later: " + mode);
                    });
                }


            }
        }
    }
}

/**
 * @desc This has to be the callback for the processed plugin. The plugin should give back a processed object.
 * @param {Object} processedValue Any kind of object simple or complex
 * @param {String} IDinLinkArray Id to search for in the Link Array.
 **/

function afterPluginProcessing(obj, linkPos, processedValue, mode) {
    var link = objectExp[obj].objectLinks[linkPos];

    if (!(link.ObjectB in objectExp)) {
        // check if object is in the same object
        socketSender(obj, linkPos, processedValue, mode);
    }
    else {

        var objSend = objectExp[link.ObjectB].objectValues[link.locationInB];
        objSend.value = processedValue;

        // console.log("from the afterrun: " + mode);


        if (internalModules.hasOwnProperty(objSend.type)) {
            internalModules[objSend.type].send(objectExp[link.ObjectB].name, objSend.name, objSend.value, objSend.mode, objSend.type);
            //internalModules[objSend.type].send(objectExp, link.ObjectB, link.locationInB, processedValue, mode);
        }


        objectEngine(link.ObjectB, link.locationInB, objectExp, pluginModules);


        // console.log("from the second engine run: " + mode);


        // serialSender(serialPort, objectExp, link.ObjectB, link.locationInB, processedValue);
    }

}

/**
 * @desc Sends processedValue to the responding Object using the data saved in the LinkArray located by IDinLinkArray
 **/

function socketSender(obj, linkPos, processedValue, mode) {
    var link = objectExp[obj].objectLinks[linkPos];
    var temp = link.locationInB.slice(0, link.ObjectB.length * -1);
    var msg = JSON.stringify({ obj: link.ObjectB, pos: temp, value: processedValue, mode: mode });
    if (!(link.ObjectB in objectExp)) {
        try {
            var objIp = knownObjects[link.ObjectB];
            var presentObjectConnection = socketArray[objIp].io;
            if (presentObjectConnection.connected) {
                presentObjectConnection.emit("object", msg);
            }
        }
        catch (e) {
            if (globalVariables.debug)  console.log("can not emit from link ID:" + linkPos + "and object: " + obj);
        }
    }
}


/**********************************************************************************************************************
 ******************************************** Socket Utilities Section ************************************************
 **********************************************************************************************************************/


/**
 * @desc  Watches the connections to all objects that have stored links within the object.
 * If an object is disconnected, the object tries to reconnect on a regular basis.
 **/

function socketUpdater() {
    // console.log(knownObjects);
    // delete unconnected connections
    var sockKey, objKey, posKey;

    for (sockKey in  socketArray) {
        var socketIsUsed = false;

        // check if the link is used somewhere. if it is not used delete it.
        for (objKey in objectExp) {
            for (posKey in objectExp[objKey].objectLinks) {
                var thisIp = knownObjects[objectExp[objKey].objectLinks[posKey].ObjectB];

                if (thisIp === sockKey) {
                    socketIsUsed = true;
                }
            }
        }
        if (!socketArray[sockKey].io.connected || !socketIsUsed) {
            // delete socketArray[sockKey];
        }
    }
    for (objKey in objectExp) {
        for (posKey in objectExp[objKey].objectLinks) {
            var link = objectExp[objKey].objectLinks[posKey];

            if (!(link.ObjectB in objectExp) && (link.ObjectB in knownObjects)) {


                var ip = knownObjects[link.ObjectB];
//console.log("this ip: "+ip);
                if (!(ip in socketArray)) {
                    // console.log("shoudl not show up -----------");
                    socketArray[ip] = new ObjectSockets(socketPort, ip);
                }
            }
        }
    }

    socketIndicator();

    var sockKey3, objKey2;
    if (sockets.socketsOld !== sockets.sockets || sockets.notConnectedOld !== sockets.notConnected || sockets.connectedOld !== sockets.connected) {
        for (sockKey3 in socketArray) {
            if (!socketArray[sockKey3].io.connected) {
                for (objKey2 in knownObjects) {
                    if (knownObjects[objKey2] === sockKey3) {
                        if (globalVariables.debug)  console.log("Looking for: " + objKey2 + " with the ip: " + sockKey3);
                    }
                }
            }
        }

        if (globalVariables.debug)  console.log(sockets.sockets + " connections; " + sockets.connected + " connected and " + sockets.notConnected + " not connected");

    }
    sockets.socketsOld = sockets.sockets;
    sockets.connectedOld = sockets.connected;
    sockets.notConnectedOld = sockets.notConnected;
}


/**
 * Updates the global saved sockets data
 */
function socketIndicator() {
    sockets.sockets = 0;
    sockets.connected = 0;
    sockets.notConnected = 0;

    for (var sockKey2 in socketArray) {
        if (socketArray[sockKey2].io.connected) {
            sockets.connected++;
        } else {
            sockets.notConnected++;
        }
        sockets.sockets++;
    }
}

/**
 * @desc
 * @param
 * @param
 * @return
 **/

function socketUpdaterInterval() {
    setInterval(function () {
        socketUpdater();
    }, socketUpdateInterval);
}