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
 * TODO - check any collision with knownObjects -> Show collision with other object....
 * TODO - Check if Targets are double somehwere. And iff Target has more than one target in the file...
 *
 * TODO - Check the socket connections
 * TODO - check if objectlinks are pointing to values that actually exist. - (happens in browser at the moment)
 * TODO - Test self linking from internal to internal value (endless loop) - (happens in browser at the moment)
 *
 **

 **********************************************************************************************************************
 ******************************************** constant settings *******************************************************
 **********************************************************************************************************************/

// These variables are used for global status, such as if the server sends debugging messages and if the developer
// user interfaces should be accesable

var globalVariables = {
    developer: true, // show developer web GUI
    debug: true      // debug messages to console
};

// ports used to define the server behaviour
/*
The server uses port 8080 to communicate with other servers and with the Reality Editor.
As such the Server reacts to http and web sockets on this port.

The beat port is used to send UDP broadcasting messages in  a local network. The Reality Editor and other Objects
pick up these messages to identify the object.

 */

const serverPort = 8080;
const socketPort = serverPort;     // server and socket port are always identical
const beatPort = 52316;            // this is the port for UDP broadcasting so that the objects find each other.
const beatInterval = 3000;         // how often is the heartbeat sent
const socketUpdateInterval = 2000; // how often the system checks if the socket connections are still up and running.
const version = "0.4.0";           // the version of this server


// All objects are stored in this folder:
const objectPath   = __dirname + "/objects";
// All visual UI representations for IO Points are stored in this folder:
const modulePath   = __dirname + "/dataPointInterfaces";
// All interfaces for different hardware such as Arduino Yun, PI, Philips Hue are stored in this folder.
const internalPath = __dirname + "/hardwareInterfaces";
// The web service level on wich objects are accessable. http://<IP>:8080 <objectInterfaceFolder> <object>
const objectInterfaceFolder = "/";

/**********************************************************************************************************************
 ******************************************** Requirements ************************************************************
 **********************************************************************************************************************/

var _ = require('lodash');    // JavaScript utility library
var fs = require('fs');       // Filesystem library
var dgram = require('dgram'); // UDP Broadcasting library
var ip = require("ip");       // get the device IP address library
var bodyParser = require('body-parser');  // body parsing middleware
var express = require('express'); // Web Sever library

// constrution for the werbserver using express combined with socket.io
var webServer = express();
var http = require('http').createServer(webServer).listen(serverPort, function () {
   debugConsole('webserver + socket.io is listening on port: ' + serverPort);
});
var io = require('socket.io')(http); // Websocket library
var socket = require('socket.io-client'); // websocket client source
var cors = require('cors');             // Library for HTTP Cross-Origin-Resource-Sharing
var formidable = require('formidable'); // Multiple file upload library
var cheerio = require('cheerio');

// additional files containing project code

// This file hosts all kinds of utilities programmed for the server
var HybridObjectsUtilities   = require(__dirname + '/libraries/HybridObjectsUtilities');
// The web frontend a developer is able to see when creating new user interfaces.
var HybridObjectsWebFrontend = require(__dirname + '/libraries/HybridObjectsWebFrontend');
// Definition for a simple API for hardware interfaces talking to the server.
// This is used for the interfaces defined in the hardwareInterfaces folder.
var HybridObjectsHardwareInterfaces = require(__dirname + '/libraries/HybridObjectsHardwareInterfaces');
// these templates are used to render the Web Frontend.
var templateModule           = require(__dirname + '/libraries/templateModule');

var util = require("util"); // node.js utility functionality
var events = require("events"); // node.js events used for the socket events.


// Set web frontend debug to inherit from global debug
HybridObjectsWebFrontend.debug = globalVariables.debug;

/**********************************************************************************************************************
 ******************************************** Constructors ************************************************************
 **********************************************************************************************************************/

/**
 * @desc This is the default constructor for the Hybrid Object.
 * It contains information about how to render the UI and how to process the internal data.
 **/

function ObjectExp() {
    // The ID for the object will be broadcasted along with the IP. It consists of the name with a 12 letter UUID added.
    this.objectId = null;
    // The name for the object used for interfaces.
    this.name = "";
    // The IP address for the object is relevant to point the Reality Editor to the right server.
    // It will be used for the UDP broadcasts.
    this.ip = ip.address();
    // The version number of the Object.
    this.version = version;
    // The (t)arget (C)eck(S)um is a sum of the checksum values for the target files.
    this.tcs = null;
    // Reality Editor: This is used to possition the UI element within its x axis in 3D Space. Relative to Marker origin.
    this.x = 0;
    // Reality Editor: This is used to possition the UI element within its y axis in 3D Space. Relative to Marker origin.
    this.y = 0;
    // Reality Editor: This is used to scale the UI element in 3D Space. Default scale is 1.
    this.scale = 1;
    // Used internally from the reality editor to indicate if an object should be rendered or not.
    this.visible = false;
    // Used internally from the reality editor to trigger the visibility of naming UI elements.
    this.visibleText = false;
    // Used internally from the reality editor to indicate the editing status.
    this.visibleEditing = false;
    // every object holds the developer mode variable. It indicates if an object is editable in the Reality Editor.
    this.developer = true;
    // Intended future use is to keep a memory of the last matrix transformation when interacted.
    // This data can be used for interacting with objects for when they are not visible.
    this.matrix3dMemory = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]; // TODO use this to store UI interface for image later.
    // Stores all the links that emerge from within the object. If a IOPoint has new data,
    // the server looks through the Links to find if the data has influence on other IOPoints or Objects.
    this.objectLinks = {};
    // Stores all IOPoints. These points are used to keep the state of an object and process its data.
    this.objectValues = {};
    // Stores all Checksums
    this.checksums = { dat:null, xml:null, jpg: null};
}

/**
 * @desc The Link constructor is used every time a new link is stored in the objectLinks object.
 * The link does not need to keep its own ID since it is created with the link ID as Obejct name.
 **/

function ObjectLink() {
    // The origin object from where the link is sending data from
    this.ObjectA = null;
    // The origin IOPoint from where the link is taking its data from
    this.locationInA = 0;
    // Defines the type of the link origin. Currently this function is not in use.
    this.typeA = "";
    // The destination object to where the origin object is sending data to.
    // At this point the destination object accepts all incoming data and routs the data according to the link data sent.
    this.ObjectB = null;
    // The destination IOPoint to where the link is sending data from the origin object.
    // ObjectB and locationInB will be send with each data package.
    this.locationInB = 0;
    // Defines the type of the link destination. Currently this function is not in use.
    this.typeB = "";
    // Will be used to test if a link is still able to find its destination.
    // It needs to be discussed what to do if a link is not able to find the destination and for what time span.
    this.countLinkExistance = 0; // todo use this to test if link is still valid. If not able to send for some while, kill link.
}

/**
 * @desc Constructor used to define every IO Point generated in the Object. It does not need to contain its own ID
 * since the object is created within the objectValues with the ID as object name.
 **/

function ObjectValue() {
    // the name of each link. It is used in the Reality Editor to show the IO name.
    this.name = "";
    // this is storing the actual value representing the actual state of a IO Point
    this.value = null;
    // Defines the kind of data send. At this point we have 3 active data modes and one future possibility.
    // (f) defines floating point values between 0 and 1. This is the default value.
    // (d) defines a digital value exactly 0 or 1.
    // (+) defines a positive step with a floating point value for compatibility.
    // (-) defines a negative step with a floating point value for compatibility.
    // (m) defines a future possible data value for mime type media
    this.mode = "f";
    // Reality Editor: This is used to possition the UI element within its x axis in 3D Space. Relative to Marker origin.
    this.x = 0;
    // Reality Editor: This is used to possition the UI element within its y axis in 3D Space. Relative to Marker origin.
    this.y = 0;
    // Reality Editor: This is used to scale the UI element in 3D Space. Default scale is 1.
    this.scale = 1;
    // defines the dataPointInterface that is used to process data of this type. It also defines the visual representation
    // in the Reality Editor. Such data points interfaces can be found in the dataPointInterface folder.
    this.plugin = "default";
    // this is an optional parameter object for the plugin. As this parameter is stored with the object on disk. It can be used
    // as non fluctuating storage.
    this.pluginParameter = null;
    // defines the origin Hardware interface of the IO Point. For example if this is arduinoYun the Server associates
    // this IO Point with the Arduino Yun hardware interface.
    this.type = "arduinoYun"; // todo "arduinoYun", "virtual", "edison", ... make sure to define yours in your internal_module file
}

/**
 * @desc This Constructor is used when a new socket connection is generated.
 **/

function ObjectSockets(socketPort, ip) {
    // keeps the own IP of an object
    this.ip = ip;
    // defines where to connect to
    this.io = socket.connect('http://' + ip + ':' + socketPort, {
        // defines the timeout for a connection between objects and the reality editor.
        'connect timeout': 5000,
        // try to reconnect
        'reconnect': true,
        // time between re-connections
        'reconnection delay': 500,
        // the amount of reconnection attempts. Once the connection failed, the server kicks in and tries to reconnect
        // infinitely. This behaviour can be changed once discussed what the best model would be.
        // At this point the invinit reconnection attempt keeps the system optimal running at all time.
        'max reconnection attempts': 20,
        // automatically connect a new conneciton.
        'auto connect': true,
        // fallbacks connection models for socket.io
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
 ******************************************** Variables and Objects ***************************************************
 **********************************************************************************************************************/


// This variable will hold the entire tree of all objects and their sub objects.
var objectExp = {};


var dataPointModules = {};   // Will hold all available data point interfaces
var hardwareInterfaceModules = {}; // Will hold all available hardware interfaces.
// A list of all objects known and their IPs in the network. The objects are found via the udp heart beat.
// If a new link is linking to another objects, this knownObjects list is used to establish the connection.
// This list is also used to keep track of the actual IP of an object. If the IP of an object in a network changes,
// It has no influance on the connectivity, as it is referenced by the object UUID through the entire time.
var knownObjects = {};
// A lookup table used to process faster through the objects.
var objectLookup = {};
// This list holds all the socket connections that are kept alive. Socket connections are kept alive if a link is
// associated with this object. Once there is no more link the socket connection is deleted.
var socketArray = {};     // all socket connections that are kept alive

// counter for the socket connections
// this counter is used for the Web Developer Interface to reflect the state of the server socket connections.
var sockets = {
    sockets: 0, // amount of created socket connections
    connected: 0, // amount of connected socket connections
    notConnected: 0, // not connected
    socketsOld: 0,  // used internally to react only on updates
    connectedOld: 0, // used internally to react only on updates
    notConnectedOld: 0 // used internally to react only on updates
};


/**********************************************************************************************************************
 ******************************************** Initialisations *********************************************************
 **********************************************************************************************************************/


debugConsole("Starting the Server");

// get a list with the names for all IO-Points, based on the folder names in the dataPointInterfaces folder folder.
// Each folder represents on IO-Point.
var DataPointFolderList = fs.readdirSync(modulePath).filter(function (file) {
    return fs.statSync(modulePath + '/' + file).isDirectory();
});

// Remove eventually hidden files from the Hybrid Object list.
while (DataPointFolderList[0][0] === ".") {
    DataPointFolderList.splice(0, 1);
}

// Create a objects list with all IO-Points code.
for (var i = 0; i < DataPointFolderList.length; i++) {
    dataPointModules[DataPointFolderList[i]] = require(modulePath + '/' + DataPointFolderList[i] + "/index.js").render;
}

// A list that represents possible modules for the developer web interface
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

// loads all the modules for the web frontend
templateModule.loadAllModules(modulesList, function(){});

debugConsole("Initialize System: ");
debugConsole("Loading Hardware interfaces");
// set all the initial states for the Hardware Interfaces in order to run with the Server.
HybridObjectsHardwareInterfaces.setup(objectExp, objectLookup, globalVariables, __dirname, dataPointModules, function (objKey2, valueKey, objectExp, dataPointModules) {
    objectEngine(objKey2, valueKey, objectExp, dataPointModules);
}, ObjectValue);
debugConsole("Done");

debugConsole("Loading Hybrid Objects");
// This function will load all the Hybrid Objects
loadHybridObjects();
debugConsole("Done");

// This function will start the entire system
debugConsole("Starting the System");
startSystem();
debugConsole("started");


// get the directory names of all available plugins for the 3D-UI
var hardwareInterfacesFolderList = fs.readdirSync(internalPath).filter(function (file) {
    return fs.statSync(internalPath + '/' + file).isDirectory();
});
// remove hidden directories
while (hardwareInterfacesFolderList[0][0] === ".") {
    hardwareInterfacesFolderList.splice(0, 1);
}

// add all plugins to the dataPointModules object. Iterate backwards because splice works inplace
for (var i = hardwareInterfacesFolderList.length - 1; i >= 0; i--) {
    //check if hardwareInterface is enabled, if it is, add it to the hardwareInterfaceModules
    if (require(internalPath + "/" + hardwareInterfacesFolderList[i] + "/index.js").enabled) {
        hardwareInterfaceModules[hardwareInterfacesFolderList[i]] = require(internalPath + "/" + hardwareInterfacesFolderList[i] + "/index.js");
    } else {
        hardwareInterfacesFolderList.splice(i, 1);
    }
}

debugConsole("ready to start internal servers");

// starting the internal servers (receive)
for (var i = 0; i < hardwareInterfacesFolderList.length; i++) {
    hardwareInterfaceModules[hardwareInterfacesFolderList[i]].init();
    hardwareInterfaceModules[hardwareInterfacesFolderList[i]].receive();
}

debugConsole("found " + hardwareInterfacesFolderList.length + " internal server");
debugConsole("starting internal Server.");


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
   debugConsole("Enter loadHybridObjects");
    // check for objects in the objects folder by reading the objects directory content.
    // get all directory names within the objects directory
    var HybridObjectFolderList = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });

    // remove hidden directories
    try {
        while (HybridObjectFolderList[0][0] === ".") {
            HybridObjectFolderList.splice(0, 1);
        }
    } catch (e) {
       debugConsole("no hidden files");
    }

    for (var i = 0; i < HybridObjectFolderList.length; i++) {
        var tempFolderName = HybridObjectsUtilities.getObjectIdFromTarget(HybridObjectFolderList[i], __dirname);
       debugConsole("TempFolderName: " + tempFolderName);

        if (tempFolderName !== null) {
            // fill objectExp with objects named by the folders in objects
            objectExp[tempFolderName] = new ObjectExp();
            objectExp[tempFolderName].folder = HybridObjectFolderList[i];

            // add object to object lookup table
            HybridObjectsUtilities.writeObject(objectLookup, HybridObjectFolderList[i], tempFolderName);

            // try to read a saved previous state of the object
            try {
                objectExp[tempFolderName] = JSON.parse(fs.readFileSync(__dirname + "/objects/" + HybridObjectFolderList[i] + "/object.json", "utf8"));
                objectExp[tempFolderName].ip = ip.address();

                // adding the values to the arduino lookup table so that the serial connection can take place.
                // todo this is maybe obsolete.
                for (var tempkey in objectExp[tempFolderName].objectValues) {
                    ArduinoLookupTable.push({ obj: HybridObjectFolderList[i], pos: tempkey });
                }
                // todo the sizes do not really save...


                // todo new Data points are never writen in to the file. So this full code produces no value
                // todo Instead keep the board clear=false forces to read the data points from the arduino every time.
                // todo this is not true the datapoints are writen in to the object. the sizes are wrong
                // if not uncommented the code does not connect to the arduino side.
                // data comes always from the arduino....
                // clear = true;

                    debugConsole("I found objects that I want to add");
                    debugConsole("---");
                    debugConsole(ArduinoLookupTable);
                    debugConsole("---");

            } catch (e) {
                objectExp[tempFolderName].ip = ip.address();
                objectExp[tempFolderName].objectId = tempFolderName;
               debugConsole("No saved data for: " + tempFolderName);
            }

        } else {
           debugConsole(" object " + HybridObjectFolderList[i] + " has no marker yet");
        }
    }

    for (var keyint in hardwareInterfaceModules) {
        hardwareInterfaceModules[keyint].init();
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
    OHSocketServer();

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
    for (var i = 0; i < hardwareInterfacesFolderList.length; i++) {
        mod = hardwareInterfaceModules[hardwareInterfacesFolderList[i]];
        if ("shutdown" in mod) {
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
 * @param {string} thisVersion The version of the Object
 * @param {string} thisTcs The target checksum of the Object.
 * @param {boolean} oneTimeOnly if true the beat will only be sent once.
 **/

function objectBeatSender(PORT, thisId, thisIp, oneTimeOnly) {
    if (_.isUndefined(oneTimeOnly)) {
        oneTimeOnly = false;
    }

    var HOST = '255.255.255.255';

    debugConsole("creating beat for object: " + thisId);
    objectExp[thisId].version = version;
    var thisVersionNumber  = parseInt(objectExp[thisId].version.replace(/\./g, ""));

   // ObjectExp
    debugConsole("with version number: " + thisVersionNumber);

    // json string to be send

   debugConsole("UDP broadcasting on port: " + PORT);
   debugConsole("Sending beats... Content: " + JSON.stringify({ id: thisId, ip: thisIp,  vn:thisVersionNumber, tcs: objectExp[thisId].tcs}));

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

            //debugConsole(JSON.stringify(thisId));
            // debugConsole(JSON.stringify( objectExp));
            if (thisId in objectExp && thisId.length > 12) {
               // debugConsole("Sending beats... Content: " + JSON.stringify({ id: thisId, ip: thisIp, vn:thisVersionNumber, tcs: objectExp[thisId].tcs}));

                // this is an ugly hack to sync each object with being a developer object
                //objectExp[thisId].developer = globalVariables.developer;

                var message = new Buffer(JSON.stringify({ id: thisId, ip: thisIp, vn:thisVersionNumber, tcs: objectExp[thisId].tcs}));

                client.send(message, 0, message.length, PORT, HOST, function (err) {
                    if (err) {
                        debugConsole("error ");
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

                var message = new Buffer(JSON.stringify({ id: thisId, ip: thisIp, vn:thisVersionNumber, tcs: objectExp[thisId].tcs}));

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

    message = new Buffer(JSON.stringify({ action: action }));

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
        debugConsole("server error:\n" + err);
        udpServer.close();
    });

    udpServer.on("message", function (msg) {
        var msgContent;
        // check if object ping
        // if (globalVariables.debug)  debugConsole("I found new Objects: " + msg);
        msgContent = JSON.parse(msg);
        if (msgContent.hasOwnProperty("id") && msgContent.hasOwnProperty("ip") && !(msgContent.id in objectExp) && !(msgContent.id in knownObjects)) {
            knownObjects[msgContent.id] = msgContent.ip;
           debugConsole("I found new Objects: " + JSON.stringify({
                id: msgContent.id,
                ip: msgContent.ip
            }));
        }
        // check if action 'ping'
        if (msgContent.action === "ping") {
           debugConsole(msgContent.action);
            for (var key in objectExp) {
                objectBeatSender(beatPort, key, objectExp[key].ip, true);
            }
        }
    });

    udpServer.on("listening", function () {
        var address = udpServer.address();
       debugConsole("UDP listening on port: " + address.port);
    });

    // bind the udp server to the udp beatPort

    udpServer.bind(beatPort);
}

/**
 * @desc A static Server that serves the user, handles the links and
 * additional provides active modification for objectDefinition.
 **/

function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch(ex) {
        return false;
    }
}


function objectWebServer() {

    // define the body parser
    webServer.use(bodyParser.urlencoded({
        extended: true
    }));
    webServer.use(bodyParser.json());
    // devine a couple of static directory routs


    webServer.use('/objectDefaultFiles', express.static(__dirname + '/libraries/objectDefaultFiles/'));

    webServer.use("/obj",function(req,res,next){

        var urlArray = req.originalUrl.split("/");

        console.log(urlArray);
      if((req.method === "GET" && urlArray[2] !=="dataPointInterfaces")  &&  (req.url.slice(-1) === "/" || urlArray[3] ==="index.html"  || urlArray[3] ==="index.htm")) {



          var fileName = __dirname + "/objects" + req.url;

          if(urlArray[3] !=="index.html"  && urlArray[3] !=="index.htm") {

              if (existsSync(fileName + "index.html")) {
                  fileName = fileName + "index.html";
              } else {
                  fileName = fileName + "index.htm";
              }
          }
                      var html = fs.readFileSync(fileName, 'utf8');
                      var loadedHtml = cheerio.load(html);
                      var scriptNode = '<script src="../../objectDefaultFiles/object.js"></script>';
                      loadedHtml('head').prepend(scriptNode);
                      res.send(loadedHtml.html());

      }
       else
        next();
    }, express.static(__dirname + '/objects/'));

    //webServer.get("/obj/objectDefaultFiles/*", express.static(__dirname + '/libraries/objectDefaultFiles/' + req.params[0]));

    //   webServer.use("/obj", express.static(__dirname + '/objects/'));

  //  webServer.use("/objectDefaultFiles", express.static(__dirname + '/libraries/objectDefaultFiles/'));

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

        //  debugConsole("post 1");

        var updateStatus = "nothing happened";

        if (objectExp.hasOwnProperty(req.params[0])) {
            objectExp[req.params[0]].objectLinks[req.params[1]] = req.body;

            // call an action that asks all devices to reload their links, once the links are changed.
            actionSender(JSON.stringify({ reloadLink: { id: req.params[0], ip: objectExp[req.params[0]].ip } }));
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
        // debugConsole("post 2");
        var updateStatus = "nothing happened";
        var thisObject = req.params[0];
        var thisValue = req.params[1];

        var tempObject = {};
        if (thisObject === thisValue) {
            tempObject = objectExp[thisObject];
        } else {
            tempObject= objectExp[thisObject].objectValues[thisValue];
        }



        // check that the numbers are valid numbers..
        if (typeof req.body.x === "number" && typeof req.body.y === "number" && typeof req.body.scale === "number") {

            // if the object is equal the datapoint id, the item is actually the object it self.

                tempObject.x = req.body.x;
                tempObject.y = req.body.y;
                tempObject.scale = req.body.scale;
            // debugConsole(req.body);
            // ask the devices to reload the objects
        }


        if(typeof req.body.matrix === "object" ){

                tempObject.matrix = req.body.matrix;
        }

        if ((typeof req.body.x === "number" && typeof req.body.y === "number" && typeof req.body.scale === "number") || (typeof req.body.matrix === "object" )) {
            HybridObjectsUtilities.writeObjectToFile(objectExp, req.params[0], __dirname);

            actionSender(JSON.stringify({ reloadObject: { id: thisObject, ip: objectExp[thisObject].ip } }));
            updateStatus = "added object";
        }

        res.send(updateStatus);
    });

    // delete a link. *1 is the object *2 is the link id
    // ****************************************************************************************************************
    webServer.delete('/object/*/link/*/', function (req, res) {
       debugConsole("delete 1");

       debugConsole("i got a delete message");
        var thisLinkId = req.params[1];
        var fullEntry = objectExp[req.params[0]].objectLinks[thisLinkId];
        var destinationIp = knownObjects[fullEntry.ObjectB];

        delete objectExp[req.params[0]].objectLinks[thisLinkId];

       debugConsole(objectExp[req.params[0]].objectLinks);
        actionSender(JSON.stringify({ reloadLink: { id: req.params[0], ip: objectExp[req.params[0]].ip } }));
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
        // debugConsole("get 1");
        res.send(objectExp[req.params[0]].objectLinks[req.params.id]);
    });

    // request all link. *1 is the object
    // ****************************************************************************************************************
    webServer.get('/object/*/link', function (req, res) {
        //  debugConsole("get 2");
        res.send(objectExp[req.params[0]].objectLinks);
    });

    // request a zip-file with the object stored inside. *1 is the object
    // ****************************************************************************************************************
    webServer.get('/object/*/zipBackup/', function (req, res) {
        //  debugConsole("get 3");
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

    webServer.get('/dataPointInterfaces/*/*/', function (req, res) {   // watch out that you need to make a "/" behind request.
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
        //  debugConsole("get 7");
        res.json(objectExp[req.params[0]]);
    });

    webServer.get('/object/*/thisObject', function (req, res) {
        //  debugConsole("get 8");
        res.json(objectExp[req.params[0]]);
    });

    // sends all json object values for a specific hybrid object. * is the object name
    // ****************************************************************************************************************
    webServer.get('/object/*/value', function (req, res) {
        //   debugConsole("get 9");
        res.json(objectExp[req.params[0]].objectValues);
    });

    // sends a specific value for a specific hybrid object. * is the object name :id is the value name
    // ****************************************************************************************************************
    webServer.get('/object/*/value/:id', function (req, res) {
        //  debugConsole("get 10");
        res.send({ value: objectExp[req.params[0]].objectValues[req.params.id].value });
    });

    // sends a specific json object value for a specific hybrid object. * is the object name :id is the value name
    // ****************************************************************************************************************

    webServer.get('/object/*/value/full/:id', function (req, res) {
        //  debugConsole("get 11");
        res.json(objectExp[req.params[0]].objectValues[req.params.id]);
    });

    // ****************************************************************************************************************
    // frontend interface
    // ****************************************************************************************************************


    if (globalVariables.developer === true) {

        // sends the info page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'info/:id', function (req, res) {
            // debugConsole("get 12");
            res.send(HybridObjectsWebFrontend.uploadInfoText(req.params.id, objectLookup, objectExp, knownObjects, io, sockets));
        });

        // sends the content page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'content/:id', function (req, res) {
            // debugConsole("get 13");
            res.send(HybridObjectsWebFrontend.uploadTargetContent(req.params.id, __dirname, objectInterfaceFolder));
        });

        // sends the target page for the object :id
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder + 'target/:id', function (req, res) {
            //   debugConsole("get 14");
            res.send(HybridObjectsWebFrontend.uploadTargetText(req.params.id, objectLookup, objectExp, globalVariables.debug));
            // res.sendFile(__dirname + '/'+ "index2.html");
        });

        webServer.get(objectInterfaceFolder + 'target/*/*/', function (req, res) {
            //  debugConsole("get 15");
            res.sendFile(__dirname + '/' + req.params[0] + '/' + req.params[1]);
        });

        // sends the object folder?? //todo what is this for?
        // ****************************************************************************************************************
        webServer.get(objectInterfaceFolder, function (req, res) {
            // debugConsole("get 16");
            res.send(HybridObjectsWebFrontend.printFolder(objectExp, __dirname, globalVariables.debug, objectInterfaceFolder, objectLookup));
        });

        // ****************************************************************************************************************
        // post interfaces
        // ****************************************************************************************************************

        webServer.post(objectInterfaceFolder + "contentDelete/:id", function (req, res) {
            // debugConsole("post 21");
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
            // debugConsole("post 22");
            if (req.body.action === "new") {
                // debugConsole(req.body);
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
                       debugConsole("ist noch da");
                    } else {
                       debugConsole("ist weg");
                    }
                    if (tempFolderName2 in knownObjects) {
                       debugConsole("ist noch da");
                    } else {
                       debugConsole("ist weg");
                    }

                    // remove object from tree
                    delete objectExp[tempFolderName2];
                    delete knownObjects[tempFolderName2];
                    delete objectLookup[req.body.folder];

                    if (tempFolderName2 in objectExp) {
                       debugConsole("ist noch da");
                    } else {
                       debugConsole("ist weg");
                    }
                    if (tempFolderName2 in knownObjects) {
                       debugConsole("ist noch da");
                    } else {
                       debugConsole("ist weg");
                    }
                }

               debugConsole("i deleted: " + tempFolderName2);

                res.send(HybridObjectsWebFrontend.printFolder(objectExp, __dirname, globalVariables.debug, objectInterfaceFolder, objectLookup));
            }

        });

        var tmpFolderFile = "";


        // this is all used just for the backup folder
        //*************************************************************************************
        webServer.post(objectInterfaceFolder + 'backup/',
            function (req, res) {
                // debugConsole("post 23");

               debugConsole("komm ich hier hin?");

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
                   debugConsole("------------" + form.uploadDir + " " + filename);

                    if (getFileExtension(filename) === "zip") {

                       debugConsole("I found a zip file");

                        try {
                            var DecompressZip = require('decompress-zip');
                            var unzipper = new DecompressZip(folderD + "/" + filename);

                            unzipper.on('error', function (err) {
                               debugConsole('Caught an error');
                            });

                            unzipper.on('extract', function (log) {
                               debugConsole('Finished extracting');
                                debugConsole("have created a new object");
                                //createObjectFromTarget(filename.substr(0, filename.lastIndexOf('.')));
                                createObjectFromTarget(ObjectExp, objectExp, filename.substr(0, filename.lastIndexOf('.')), __dirname, objectLookup, hardwareInterfaceModules, objectBeatSender, beatPort, globalVariables.debug);

                                //todo add object to the beatsender.

                                debugConsole("have created a new object");
                                fs.unlinkSync(folderD + "/" + filename);

                                res.status(200);
                                res.send("done");

                            });

                            unzipper.on('progress', function (fileIndex, fileCount) {
                               debugConsole('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
                            });

                            unzipper.extract({
                                path: folderD + "/",
                                filter: function (file) {
                                    return file.type !== "SymbolicLink";
                                }
                            });

                           debugConsole("extracting: " + filename + "  " + folderD);

                        } catch (err) {
                           debugConsole("could not unzip file");
                        }
                    }
                });
            });


        // this for all the upload to content
        //***********************************************************************

        webServer.post(objectInterfaceFolder + 'content/:id',
            function (req, res) {

                debugConsole("object is: " + req.params.id);

                tmpFolderFile = req.params.id;

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

                   debugConsole("i deleted: " + tempFolderName2);

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
                   debugConsole("------------" + form.uploadDir + "/" + filename);

                    if (req.headers.type === "targetUpload") {
                        var fileExtension = getFileExtension(filename);
                        var thisObjectId = HybridObjectsUtilities.readObject(objectLookup, req.params.id);
                        var thisObject =  objectExp[thisObjectId];

                        if(typeof thisObject.checksums === "undefined"){
                            thisObject.checksums = {};
                        }


                        if (fileExtension === "jpg") {
                            if (!fs.existsSync(folderD + "/target/")) {
                                fs.mkdirSync(folderD + "/target/", 0766, function (err) {
                                    if (err) {
                                        debugConsole(err);
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
                                        debugConsole(err);
                                    } else {
                                       debugConsole("XML saved to " + xmlOutFile);
                                    }
                                });
                            }

                            thisObject.checksums.jpg = HybridObjectsUtilities.crc16(fs.readFileSync(folderD + "/target/target.jpg"));
                            thisObject.checksums.xml = HybridObjectsUtilities.crc16(fs.readFileSync(folderD + "/target/target.xml"));

                            if (thisObject.checksums.jpg !== null && thisObject.checksums.xml !== null ) {
                                if (fs.existsSync(folderD + "/target/target.dat" && thisObject.checksums.dat !== null)) {
                                    thisObject.tcs = HybridObjectsUtilities.itob62(thisObject.checksums.jpg + thisObject.checksums.xml + thisObject.checksums.dat);
                                } else {
                                    thisObject.tcs = HybridObjectsUtilities.itob62(thisObject.checksums.jpg + thisObject.checksums.xml);
                                }
                            }

                            HybridObjectsUtilities.writeObjectToFile(objectExp, thisObjectId, __dirname);
                            debugConsole("created Checksum: "+ thisObject.tcs);

                            res.status(200);
                            res.send("done");
                            //   fs.unlinkSync(folderD + "/" + filename);
                        }


                        else if (fileExtension === "zip") {

                           debugConsole("I found a zip file");

                            try {
                                var DecompressZip = require('decompress-zip');
                                var unzipper = new DecompressZip(folderD + "/" + filename);

                                unzipper.on('error', function (err) {
                                   debugConsole('Caught an error');
                                });

                                unzipper.on('extract', function (log) {
                                    var folderFile = fs.readdirSync(folderD + "/target");
                                    var folderFileType;

                                    for (var i = 0; i < folderFile.length; i++) {
                                       debugConsole(folderFile[i]);
                                        folderFileType = folderFile[i].substr(folderFile[i].lastIndexOf('.') + 1);
                                        if (folderFileType === "xml" || folderFileType === "dat") {
                                            fs.renameSync(folderD + "/target/" + folderFile[i], folderD + "/target/target." + folderFileType);
                                        }
                                    }
                                    fs.unlinkSync(folderD + "/" + filename);

                                    // evnetually create the object.


                                    if (fs.existsSync(folderD + "/target/target.dat") && fs.existsSync(folderD + "/target/target.xml")) {

                                        debugConsole("creating object from target file " + tmpFolderFile);
                                        // createObjectFromTarget(tmpFolderFile);
                                        createObjectFromTarget(ObjectExp, objectExp, tmpFolderFile, __dirname, objectLookup, hardwareInterfaceModules, objectBeatSender, beatPort, globalVariables.debug);

                                        //todo send init to internal modules
                                        debugConsole("have created a new object");

                                        for (var keyint in hardwareInterfaceModules) {
                                            hardwareInterfaceModules[keyint].init();
                                        }
                                        debugConsole("have initialized the modules");


                                        var thisObject =  objectExp[HybridObjectsUtilities.readObject(objectLookup, req.params.id)];

                                        thisObject.checksums.dat = HybridObjectsUtilities.crc16(fs.readFileSync(folderD + "/target/target.dat"));
                                        thisObject.checksums.xml = HybridObjectsUtilities.crc16(fs.readFileSync(folderD + "/target/target.xml"));

                                        if (thisObject.checksums.dat !== null && thisObject.checksums.xml !== null ) {
                                            if (fs.existsSync(folderD + "/target/target.jp" && thisObject.checksums.jpg !== null)) {
                                                thisObject.tcs = HybridObjectsUtilities.itob62(thisObject.checksums.jpg + thisObject.checksums.xml + thisObject.checksums.dat);
                                            } else {
                                                thisObject.tcs = HybridObjectsUtilities.itob62(thisObject.checksums.xml+thisObject.checksums.jpg);
                                            }
                                        }

                                        HybridObjectsUtilities.writeObjectToFile(objectExp, thisObjectId, __dirname);
                                        debugConsole("created Checksum: "+ thisObject.tcs);

                                    }

                                    res.status(200);
                                    res.send("done");
                                });

                                unzipper.on('progress', function (fileIndex, fileCount) {
                                   debugConsole('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
                                });

                                unzipper.extract({
                                    path: folderD + "/target",
                                    filter: function (file) {
                                        return file.type !== "SymbolicLink";
                                    }
                                });
                            } catch (err) {
                               debugConsole("could not unzip file");
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
            //   debugConsole("GET 21");
            res.send("Hybrid Objects<br>Developer functions are off");
        });
    }
}

// relies on ip

//createObjectFromTarget(ObjectExp, objectExp, tmpFolderFile, __dirname, objectLookup, hardwareInterfaceModules, objectBeatSender, beatPort, globalVariables.debug);

function createObjectFromTarget(ObjectExp, objectExp, folderVar, __dirname, objectLookup, hardwareInterfaceModules, objectBeatSender, beatPort, debug) {
    debugConsole("I can start");

    var folder = __dirname + '/objects/' + folderVar + '/';
   debugConsole(folder);

    if (fs.existsSync(folder)) {
       debugConsole("folder exists");
        var objectIDXML = HybridObjectsUtilities.getObjectIdFromTarget(folderVar, __dirname);
       debugConsole("got ID: objectIDXML");
        if (!_.isUndefined(objectIDXML) && !_.isNull(objectIDXML)) {
            if (objectIDXML.length > 13) {

                objectExp[objectIDXML] = new ObjectExp();
                objectExp[objectIDXML].folder = folderVar;
                objectExp[objectIDXML].objectId = objectIDXML;

               debugConsole("this should be the IP" + objectIDXML);

                try {
                    objectExp[objectIDXML] = JSON.parse(fs.readFileSync(__dirname + "/objects/" + folderVar + "/object.json", "utf8"));
                    objectExp[objectIDXML].ip = ip.address();
                   debugConsole("testing: " + objectExp[objectIDXML].ip);
                } catch (e) {
                    objectExp[objectIDXML].ip = ip.address();
                   debugConsole("testing: " + objectExp[objectIDXML].ip);
                   debugConsole("No saved data for: " + objectIDXML);
                }

                if (HybridObjectsUtilities.readObject(objectLookup, folderVar) !== objectIDXML) {
                    delete objectExp[HybridObjectsUtilities.readObject(objectLookup, folderVar)];
                }
                HybridObjectsUtilities.writeObject(objectLookup, folderVar, objectIDXML);
                // entering the obejct in to the lookup table

                // ask the object to reinitialize
                //serialPort.write("ok\n");
                // todo send init to internal
                for (var keyint in hardwareInterfaceModules) {
                    hardwareInterfaceModules[keyint].init();
                }

               debugConsole("weiter im text " + objectIDXML);
                HybridObjectsUtilities.writeObjectToFile(objectExp, objectIDXML, __dirname);

                objectBeatSender(beatPort, objectIDXML, objectExp[objectIDXML].ip);
            }
        }
    }
}

/**
 * @desc Check for incoming MSG from other objects or the User. Make changes to the objectValues if changes occur.
 **/

function OHSocketServer(params) {
    events.EventEmitter.call(this)
    osSocketServer=this;
    io.on('connection', function (socket) {
       debugConsole("New ws connection");
    	socket.objList=[]; // Initialize Object List intered by the socket
        socket.on('object', function (msg) {
           debugConsole("socketServer incoming: " + msg);
            var msgContent = JSON.parse(msg);
            var objSend;
            if (socket.objList.indexOf(msgContent.obj) ===-1) // Add objet to interested list
            	socket.objList.push(msgContent.obj);
            if ((msgContent.obj in objectExp) && typeof msgContent.value !== "undefined") {
                var objID = msgContent.pos + msgContent.obj;

                // if msgContent.pos is the name of the IO point
                if (objID in objectExp[msgContent.obj].objectValues) {
                    objectExp[msgContent.obj].objectValues[objID].value = msgContent.value;

                    objSend = objectExp[msgContent.obj].objectValues[objID];
                    objSend.value = msgContent.value;

                    if (hardwareInterfaceModules.hasOwnProperty(objSend.type)) {
                        hardwareInterfaceModules[objSend.type].send(objectExp[msgContent.obj].name, objectExp[msgContent.obj].objectValues[objID].name, msgContent.value, msgContent.mode, msgContent.type);
                    }

                    objectEngine(msgContent.obj, msgContent.pos + msgContent.obj, objectExp, dataPointModules);

                    // if msgContent.pos is the ID of the IO point
                } else if (msgContent.pos in objectExp[msgContent.obj].objectValues) {

                    objectExp[msgContent.obj].objectValues[msgContent.pos].value = msgContent.value;
                    objSend = objectExp[msgContent.obj].objectValues[msgContent.pos];
                    objSend.value = msgContent.value;

                    if (hardwareInterfaceModules.hasOwnProperty(objSend.type)) {
                        hardwareInterfaceModules[objSend.type].send(objectExp[msgContent.obj].name, objectExp[msgContent.obj].objectValues[msgContent.pos].name, msgContent.value, msgContent.mode, msgContent.type);
                    }

                    objectEngine(msgContent.obj, msgContent.pos, objectExp, dataPointModules);

                }
            }
        });

        socket.on('/object/value', function (msg) {
        	//loghttp.debug ("value object msg %s", msg);
            var msgContent = JSON.parse(msg);
        	//loghttp.debug("  before socketlist=%s", socket.objList);
            if (socket.objList.indexOf(msgContent.obj) ===-1) // Add objet to interested list
            	socket.objList.push(msgContent.obj);
        	//loghttp.debug("  after socketlist=%s", socket.objList);

            if (msgContent.pos) {
                if (objectExp.hasOwnProperty(msgContent.obj)) {
                	osSocketServer.notifySingleOHUpdate(socket, msgContent.obj, msgContent.pos);
                }
            	/*
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
              */
            } else {
                var valueArray = {};

                for (var thiskkey in objectExp[msgContent.obj].objectValues) {
                    valueArray[objectExp[msgContent.obj].objectValues[thiskkey].name] = objectExp[msgContent.obj].objectValues[thiskkey];
                }

                var msgToSend2 = JSON.stringify({ obj: msgContent.obj, value: valueArray });
                socket.emit('object', msgToSend2);
            }
            //debugConsole("got it");
        });

        socket.on('/object/value/full', function (msg) {
            var msgContent = JSON.parse(msg);
           debugConsole("full object msg %s", msgContent);
            if (socket.objList.indexOf(msgContent.obj) ===-1) // Add objet to interested list
            	socket.objList.push(msgContent.obj);

            var msgToSend = JSON.stringify({
                obj: msgContent.obj,
                pos: msgContent.pos,
                value: objectExp[msgContent.obj].objectValues[msgContent.pos + msgContent.obj]
            });
            socket.emit('object', msgToSend);
        });
        socket.on('disconnect', function () {
           debugConsole("WS disconnected %s", socket.objList);
          //  OHSocketServer.emit("socketdisconnected", socket.objList);
        });

    });
    this.io = io;
   debugConsole('socket.io started');
}

util.inherits(OHSocketServer, events.EventEmitter);
var __method = OHSocketServer.prototype;

/**
 * notify change for one client
 * @param socket
 * @param obj
 * @param pos
 * @returns
 */
__method.notifySingleOHUpdate = function(socket, obj, pos) {
	loghttp.debug("==> notifyOHUpdate receive (%s,%s)", obj, pos)
	if (objectExp[obj].objectValues.hasOwnProperty(pos+obj)) {
		var msgToSend = JSON.stringify({
			obj: obj,
			pos: pos,
			value: objectExp[obj].objectValues[pos+obj].value
		});
	    socket.emit('object', msgToSend);
	}
};

/**
 * notify change for all client interrested by obj
 * @param socket
 * @param obj
 * @param pos
 * @returns
 */
__method.notifyAllOHUpdate = function(objKey, valueKey) {
	for (var socnum of Object.keys(this.io.sockets.sockets)) {
		var soc=this.io.sockets.sockets[socnum];
		if (soc.objList!= undefined && soc.objList.indexOf(objKey)!==-1 ) {
			this.notifySingleOHUpdate(soc, objKey, valueKey)
		}
	}
};

/**********************************************************************************************************************
 ******************************************** Engine ******************************************************************
 **********************************************************************************************************************/

/**
 * @desc Take the id of a value in objectValue and look through all links, if this id is used.
 * All links that use the id will fire up the engine to process the link.
 **/

// dependencies afterPluginProcessing

function objectEngine(obj, pos, objectExp, dataPointModules) {
    // debugConsole("engine started");
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

                if ((thisData.plugin in dataPointModules)) {
                    dataPointModules[thisData.plugin](obj, key, thisData.value, thisData.mode, function (obj, linkPos, processedValue, mode) {
                        afterPluginProcessing(obj, linkPos, processedValue, mode);
                        // debugConsole("from the enginehouse a bit later: " + mode);
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

        // debugConsole("from the afterrun: " + mode);


        if (hardwareInterfaceModules.hasOwnProperty(objSend.type)) {
            hardwareInterfaceModules[objSend.type].send(objectExp[link.ObjectB].name, objSend.name, objSend.value, objSend.mode, objSend.type);
            //hardwareInterfaceModules[objSend.type].send(objectExp, link.ObjectB, link.locationInB, processedValue, mode);
        }


        objectEngine(link.ObjectB, link.locationInB, objectExp, dataPointModules);


        // debugConsole("from the second engine run: " + mode);


        // serialSender(serialPort, objectExp, link.ObjectB, link.locationInB, processedValue);
    }

}

/**
 * @desc Sends processedValue to the responding Object using the data saved in the LinkArray located by IDinLinkArray
 **/

function socketSender(obj, linkPos, processedValue, mode) {
    var link = objectExp[obj].objectLinks[linkPos];
    var msg = JSON.stringify({obj: link.ObjectB, pos: link.locationInB, value: processedValue, mode: mode});
    if (!(link.ObjectB in objectExp)) {
        try {
            var objIp = knownObjects[link.ObjectB];
            var presentObjectConnection = socketArray[objIp].io;
            if (presentObjectConnection.connected) {
                presentObjectConnection.emit("object", msg);
            }
        }
        catch (e) {
           debugConsole("can not emit from link ID:" + linkPos + "and object: " + obj);
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
    // debugConsole(knownObjects);
    // delete unconnected connections
    var sockKey, objKey, posKey;

    for (sockKey in socketArray) {
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
                //debugConsole("this ip: "+ip);
                if (!(ip in socketArray)) {
                    // debugConsole("shoudl not show up -----------");
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
                       debugConsole("Looking for: " + objKey2 + " with the ip: " + sockKey3);
                    }
                }
            }
        }

       debugConsole(sockets.sockets + " connections; " + sockets.connected + " connected and " + sockets.notConnected + " not connected");

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


function debugConsole(msg){
    if(globalVariables.debug) console.log(msg);
}