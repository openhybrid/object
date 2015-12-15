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



var HybridObjectsUtilities = require(__dirname+'/HybridObjectsUtilities');
var templateModule = require(__dirname+'/templateModule');
var testModule = require(__dirname+'/templateModule');
var fs = require('fs');
var changeCase = require('change-case');
var debug = false;
var cheerio = require('cheerio');
var baseTemplate = null;
var realoadInterfaceTimeout = null;

var loadBaseTemplate = function() {
    var base = templateModule.loadTemplate("base");

    //get the objects
    var objectPath = __dirname + '/../objects';
    var tempFiles = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });
     var sidebarElems = "";

        if (typeof tempFiles[0] !== "undefined") {
            while (tempFiles[0][0] === ".") {
                tempFiles.splice(0, 1);
            }

        for (var i = 0; i < tempFiles.length; i++) {
            var notActiveClass = "";
             if (!fs.existsSync(objectPath + "/" + tempFiles[i] + "/target/target.xml")) {
               notActiveClass = "not-active";
            }

            sidebarElems += '<li class="'+notActiveClass+'"><a href="/info/'+tempFiles[i] + '"><span class="glyphicon glyphicon-wrench" aria-hidden="true"></span>'+tempFiles[i]+'</a></li>\n';
        }
    }

    var sidebarTemplate = templateModule.loadTemplate("sidebar", [{"sidebarList" : sidebarElems }]);

    var headerTemplate = templateModule.loadTemplate("header");
    $ = cheerio.load(base);
    $("#header-content").append(headerTemplate);
    baseTemplate = $('#sidebar-content').append(sidebarTemplate);
    console.log(__dirname);

    return $.html();
}

exports.printFolder = function (objectExp, dirnameO, debug, objectInterfaceFolder, objectLookup) {

    baseTemplate = loadBaseTemplate();
    clearInterval(realoadInterfaceTimeout);
    $ = cheerio.load(baseTemplate);

    var tempFiles = "";
    console.log(dirnameO);
    var objectPath = dirnameO + "/objects";
    var tempFiles = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });

    if (debug) {
        console.log("----------------------- objects");
        for (var keykey in objectExp) {
            console.log(keykey);
        }

        console.log("----------------------- objects");
        for (var keykey in objectExp) {
            console.log(keykey);
        }

        console.log("----------------------- object lookup");
        for (var keykey in objectLookup) {
            console.log(keykey + " = " + JSON.stringify(objectLookup[keykey]));
        }
        console.log("----------------------- end" + Math.random());
    }

 // remove hidden directories
    if (typeof tempFiles[0] !== "undefined") {
        while (tempFiles[0][0] === ".") {
            tempFiles.splice(0, 1);
        }

        for (var i = 0; i < tempFiles.length; i++) {

            var dataObject = [];

            dataObject.push({"name" : tempFiles[i] });
            dataObject.push({"objectInterfaceFolder" : objectInterfaceFolder});


            console.log("object name : " + tempFiles[i]);

            if (objectExp.hasOwnProperty(HybridObjectsUtilities.readObject(objectLookup, tempFiles[i])) &&
                fs.existsSync(objectPath + "/" + tempFiles[i] + "/target/target.xml")) {
              dataObject.push({"infoBtnDisabled" : ""});
            } else {
               dataObject.push({"infoBtnDisabled" : "disabled='disabled'"});
            }

            if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.dat") &&
                fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.xml") &&
                fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.jpg")) {
                dataObject.push({"targetButtonClass" : "btn-success"});

            } else {
                 dataObject.push({"targetButtonClass" : "btn-primary"});
            }

            if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/index.htm") ||
                fs.existsSync(objectPath + '/' + tempFiles[i] + "/index.html"))
            {

                if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.dat") &&
                    fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.xml") &&
                    fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.jpg"))
                {
                    dataObject.push({"interfaceBtnClass" : "btn-success"});
                }
                else {
                    dataObject.push({"interfaceBtnClass" : "btn-warning"});
                 }
            } else {
                dataObject.push({"interfaceBtnClass" : "btn-primary"});
            }

            var objectTemplate = templateModule.loadTemplate("home-object", dataObject);
           // objectTemplate = templateModule.updateTemplate(tempFiles[i],objectTemplate, dataObject, false);

            $("#main-content").append(objectTemplate);
            $("#main-content").addClass("transparent");

        }

    } // end if unedf

    var objectTemplate = templateModule.loadTemplate("home-object-add", dataObject);
    $("#main-content").append(objectTemplate);


    return $.html();
}


exports.uploadInfoText = function (parm, objectLookup, objectExp, knownObjects, io, serverSockets) {
    var objectName = HybridObjectsUtilities.readObject(objectLookup, parm); //parm + thisMacAddress;

    var infoCount = 0;

    var ArduinoINstance = 0;

    if(baseTemplate == null) baseTemplate = loadBaseTemplate();
    $ = cheerio.load(baseTemplate);
    clearInterval(realoadInterfaceTimeout);

    var dataMonitor = [];
    try {
        dataMonitor.push({"name" : parm });
        dataMonitor.push({"ip" : objectExp[objectName].ip });
        dataMonitor.push({"version" : objectExp[objectName].version });
        dataMonitor.push({"sockets" : serverSockets.sockets.toString() });
        dataMonitor.push({"socketsConnected" : serverSockets.connected.toString() });
        dataMonitor.push({"socketsNotConnected" : serverSockets.notConnected.toString() });
    } catch(e) {
        dataMonitor.push({"name" : parm });
        dataMonitor.push({"ip" : "Object not loaded" });
    }

    var monitorTemplate = templateModule.loadTemplate("monitor", dataMonitor);

    var sockets = null;

    io.sockets.on('connection', function (socket) {
        sockets = socket;
    });

    function GetAndSendData() {
        var d = new Date();
        
        if(typeof objectExp[objectName] === 'undefined' ||
           Object.getOwnPropertyNames(objectExp[objectName].objectValues).length == 0) {
            console.log("error loading the data");
        }
        else {
            var uploadInfoTexttempArray = objectExp[objectName].objectLinks;
            var uploadInfoTexttempArrayValue = objectExp[objectName].objectValues;
            
            // add the variables
           var infoCount = 0;
           var jsonVariables = [];
            for (subKey in uploadInfoTexttempArrayValue) {
                jsonVariables.push({
                    "index":infoCount,
                    "IOName" : uploadInfoTexttempArrayValue[subKey].name,
                    "value" : uploadInfoTexttempArrayValue[subKey].value
                });
                infoCount++;
            }
            //test
         /*   jsonVariables.push({
                "test": infoCount,
                 "value" : "test",
                "IOName" : d.getMilliseconds()
            });*/

            // add the links
            infoCount = 0;
            var jsonObjects = [];
            for (subKey in knownObjects) {
                jsonObjects.push({
                    "connected":subKey,
                    "number" : knownObjects[subKey]
                });
                infoCount++;
            }
            if (infoCount === 0) {
                jsonObjects.push({
                  "no":"no Object found"
                });
            }

            // add the links
            infoCount = 0;
            var jsonLinks = [];
            for (subKey in uploadInfoTexttempArray) {
                  jsonLinks.push({
                    "id": subKey,
                    "origin" : uploadInfoTexttempArray[subKey].ObjectA,
                    "locationO" : uploadInfoTexttempArray[subKey].locationInA.slice(0, (uploadInfoTexttempArray[subKey].ObjectA.length * -1)),
                    "destination" :  uploadInfoTexttempArray[subKey].ObjectB,
                    "locationD" : uploadInfoTexttempArray[subKey].locationInB.slice(0, (uploadInfoTexttempArray[subKey].ObjectA.length * -1))
                });
                infoCount++;
            }

            if (infoCount === 0) {
                  jsonLinks.push({
                    "id": "no link founds"
                });
            }

            var jsonUpdate = [{
                "variables" : jsonVariables,
                "links" : jsonLinks,
                "objects" : jsonObjects
            }];

            var updatedMonitor = templateModule.updateTemplate(parm, monitorTemplate,jsonUpdate, true );

            //send the JSOn to the 
            if(sockets) {
                sockets.emit("getSomeData",updatedMonitor);
            }
        }
    }

     realoadInterfaceTimeout = setInterval(GetAndSendData, 100);


    GetAndSendData();

    $("#main-content").append(monitorTemplate);
    return $.html();
}


exports.uploadTargetText = function (parm, objectLookup, objectExp) {

    if(baseTemplate == null) baseTemplate = loadBaseTemplate();
    $ = cheerio.load(baseTemplate);
    clearInterval(realoadInterfaceTimeout);

    var dataTarget = [];

    if(debug) console.log("target content");

    var objectName = "";

    if (objectExp.hasOwnProperty(HybridObjectsUtilities.readObject(objectLookup, parm))) {
        objectName = HybridObjectsUtilities.readObject(objectLookup, parm);
    } else {
        objectName = parm + HybridObjectsUtilities.uuidTime();
    }
    console.log(__dirname);

    dataTarget.push({"name" : parm });
    dataTarget.push({"objectName" : objectName});

    var targetTemplate = templateModule.loadTemplate("target", dataTarget);
    $("#main-content").append(targetTemplate);
    $("#main-content").addClass("big");

    return $.html();
}



exports.uploadTargetContent = function (parm, dirname0, objectInterfaceFolder) {

    if(baseTemplate == null) baseTemplate = loadBaseTemplate();
    $ = cheerio.load(baseTemplate);
    clearInterval(realoadInterfaceTimeout);

    var dataInterface = [];
    dataInterface.push({"name" : parm});
    var rowItems = "";

    //object variables
    var objectPath = dirname0 + "/objects/";
    var objectPath2 = dirname0 + "/objects/" + parm;
    var tempFiles = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });

    var fileList;
    var walk = function (dir) {
        var results = [];
        var list = fs.readdirSync(dir);
        list.forEach(function (file) {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) results = results.concat(walk(file));
            else results.push(file)
        });
        return results
    };

    var listeliste = walk(objectPath2);
    var  folderOld = "";
    var text ="0";

    for (var i = 0; i < listeliste.length; i++) {

        var content = listeliste[i].replace(objectPath2 + '/', '').split("/");
        var dataRowItem = [];
        var rowClass = "",
        fileName= content[0],
        iconType = "glyphicon-file",
        formAction= "",
        linkClass = "",
        deleteFunction= "",
        formId= "",
        filePath= "/";

        if (content[1] !== undefined) {
            if (content[0] !== folderOld) { // if it's a folder
               // console.log("---" + content[0]);
                filePath = parm + '/' + content[0];
                formId = "2delete" + i + content[0] ;
                formAction = objectInterfaceFolder + "content/" + parm ;
                dataRowItem.push({"iconType" : "glyphicon-folder-open"});
                dataRowItem.push({"fileName" : fileName});
                dataRowItem.push({"formAction" : formAction});
                dataRowItem.push({"formId" : formId});
                dataRowItem.push({"filePath" : filePath});
                dataRowItem.push({"rowClass" : "folder not-active"});
                dataRowItem.push({"linkClass" : linkClass});

                rowItems += templateModule.loadTemplate("interface-rowitem", dataRowItem);
                dataRowItem = [];
            }

            if (content[1][0] !== "." && content[1][0] !== "_") { // if it's target and co
                var fileTypeF = changeCase.lowerCase(content[1].split(".")[1]);

                if (content[1] === "target.dat" || content[1] === "target.xml" || content[1] === "target.jpg") {
                   // text += 'class="success"';
                     dataRowItem.push({"rowClass" : "required target-padding"});

                }

                if (fileTypeF === "jpg" || fileTypeF === "png" || fileTypeF === "gif" || fileTypeF === "jpeg") {
                  iconType = 'glyphicon-picture';

                } else {
                   iconType = 'glyphicon-file';
                }

                fileName = content[1];
                filePath =  parm + '/' + content[0] + '/' + content[1];
            }

            folderOld = content[0];

        } else {
            if (content[0][0] !== "." && content[0][0] !== "_") {
                var fileTypeF2 = changeCase.lowerCase(content[0].split(".")[1]);//.toLowerCase();

                if (fileTypeF2 === "html" || fileTypeF2 === "htm") {
                  dataRowItem.push({"rowClass" : "active"});
                } else if (content[0] === "object.json" || content[0] === "object.css" || content[0] === "object.js") {
                  dataRowItem.push({"rowClass" : "active"});
                }

                if (fileTypeF2 === "jpg" || fileTypeF2 === "png" || fileTypeF2 === "gif" || fileTypeF2 === "jpeg") {
                  iconType = 'glyphicon-picture';
                } else {
                  iconType = 'glyphicon-file';
                }

                text += '" aria-hidden="true"></span>&nbsp;&nbsp;<a href = "/obj/' + parm + '/' + content[0] + '">' + content[0] + '</a></font></td><td>';

                filePath = parm + '/' + content[0];
                formId = "1delete" + i + content[0] ;
                formAction = objectInterfaceFolder + "content/" + parm ; //we can recompose that

                if (content[0] === "index.html" || content[0] === "object.json" || content[0] === "object.css" || content[0] === "object.js") {
                    linkClass = "not-active";
                } 

            }
        }

        dataRowItem.push({"rowClass" : rowClass});
        dataRowItem.push({"iconType" : iconType});
        dataRowItem.push({"fileName" : fileName});
        dataRowItem.push({"formAction" : formAction});
        dataRowItem.push({"formId" : formId});
        dataRowItem.push({"filePath" : filePath});
        dataRowItem.push({"linkClass" : linkClass});

        rowItems += templateModule.loadTemplate("interface-rowitem", dataRowItem);
    }

    dataInterface.push({"rowItems" : rowItems});
    var interfaceTemplate = templateModule.loadTemplate("interface", dataInterface);
    $("#main-content").append(interfaceTemplate);

    return $.html();
}