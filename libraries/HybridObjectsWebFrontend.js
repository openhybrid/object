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
var fs = require('fs');
var changeCase = require('change-case');
var debug = false;



exports.printFolder = function (objectExp, dirnameO, debug, objectInterfaceFolder, objectLookup) {
    var resText = "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "<meta charset=='utf-8'>" +
        "<link rel='stylesheet' href='js/bootstrap.min.css'>" +
        '   <script src="js/dropzone.js"></script>\n' +
        '    <style>\n' +
        '        #total-progress {\n' +
        '            opacity: 0;\n' +
        '            transition: opacity 0.3s linear;\n' +
        '        }\n' +
        '    </style>\n' +
            // "<link rel='stylesheet' href='http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap-theme.min.css'>"+
        "</head>" +
        '<body style="height: 100%; weight: 100%; background-color: #ffffff;">' +//  background:repeating-linear-gradient(-45deg, #e4f6ff, #e4f6ff 5px, white 5px, white 10px);" >\n'+
        "<div class='container' style='width: 750px;height:100vh;'>" +

        "<div class='panel panel-primary'>" +
        "<div class='panel-heading'>" +
        "<h3 class='panel-title'><font size='6'>Hybrid Object - Administration</font></h3>" +
        "</div>" +


        "</div>" +
        "<ul class='list-group'>";


    var tempFiles = "";
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
            resText += "<li class='list-group-item'>" +
                "<div class='row'>" +
                "<div class='col-xs-4'>" +
                "<font size='5'>" + tempFiles[i] + "</font>" +
                "</div>" +
                "<div class='col-xs-8 text-right' style='' >";

            if (objectExp.hasOwnProperty(HybridObjectsUtilities.readObject(objectLookup, tempFiles[i])) && fs.existsSync(objectPath + "/" + tempFiles[i] + "/target/target.xml")) {
                resText +=
                    "<button  class='btn btn-info' onclick=\"window.location.href='/info/" + tempFiles[i] + "'\" > Info</button> ";
            } else {
                resText +=
                    "<button  class='btn btn-info' disabled='disabled'>Info</button> ";
            }


            resText += "<button  class='";
            if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.dat") && fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.xml") && fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.jpg")) {
                resText += "btn btn-success";
            } else {
                resText += "btn btn-primary";
            }


            resText += "' onclick=\"window.location.href='/target/" + tempFiles[i] + "'\">Add Target</button> " +
                "<button  class='";

            if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/index.htm") || fs.existsSync(objectPath + '/' + tempFiles[i] + "/index.html")) {

                if (fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.dat") && fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.xml")&& fs.existsSync(objectPath + '/' + tempFiles[i] + "/target/target.jpg")) {
                    resText += "btn btn-success";
                }
                else {
                    resText += "btn btn-warning";
                }
            } else {
                resText += "btn btn-primary";
            }

            resText += "' onclick=\"window.location.href='/content/" + tempFiles[i] + "'\">Add Interface</button> " +

                    // "</div>"+
                    // "<div class='col-xs-3'>"+

                    // " <div>" +
                ' <button  class="btn btn-default" onclick="window.location.href=\'/object/' + tempFiles[i] + '/zipBackup/\'"' + tempFiles[i] + '\'" > ' +

                'Download' +
                '</button> ' +
                " <form  style='display: inline; background-color: #bde9ba;' id='delete" + i + "' action='" + objectInterfaceFolder + "' method='post' style='margin: 0px; padding: 0px'>" +
                "<input type='hidden' name='folder' value='" + tempFiles[i] + "'>" +
                "<input type='hidden' name='action' value='delete'>" +
                " <input type='submit'  class='btn btn-danger' value='Delete' onclick=\"return confirm('Do you really want to delete the object " + tempFiles[i] + "?')\"> " +
                "</form>" +
                    //" </div>"+
                "</div>" +
                "</div></li>";


        }

    }

    resText +=
        "</ul><div class='row'>" +
        "<form id='newFolderForm' action='" + objectInterfaceFolder + "' method='post' style='display:inline'>" +
        "<div class='col-xs-5'>" +
        "<input type='text' class='form-control' name='folder' id='folder' />" +
        "<input type='hidden' name='action' value='new'>" +
        "</div>" +
        "<div class='col-xs-4' style='display: inline'>" +
        "<button  class='btn btn-warning'>Create New Hybrid Object</button> " +
        "</div>" +
        "</form>" +
        "<div class='col-xs-2' style='display: inline'>" +
        '        <span class="btn btn-default fileinput-button" id="targetButton">' +
        '            <span>' +

        'Upload Object' +

        '</span>' +
        '        </span>' +

        ' <br><br><span class="fileupload-process">' +
        '          <div id="total-progress" class="progress progress-striped active" role="progressbar" aria-valuemin="0"' +
        '               aria-valuemax="100" aria-valuenow="0">' +
        '              <div class="progress-bar progress-bar-success" style="width:100%;" data-dz-uploadprogress></div>' +
        '          </div>' +
        '        </span>' +
        "</div>" +


        '    <div class="table table-striped" class="files" id="previews" style="display: none">' +
        '        <div id="template" class="file-row">' +
        '        </div>' +
        '    </div>' +
        "</div>" +

            // "<span class='badge' style='background-color: #d58512;'>upload default files</span>"+


        '    <script>' +
        '        var previewNode = document.querySelector("#template");' +
        '        previewNode.id = "";' +
        '        var previewTemplate = previewNode.parentNode.innerHTML;' +
        '        previewNode.parentNode.removeChild(previewNode);' +
        '        var myDropzone = new Dropzone(document.body, {' +
        '            url: "/backup",' +
        '            autoProcessQueue: true,' +
        '            thumbnailWidth: 80,' +
        'headers: { "type": "objectUpload" },'+
        '            thumbnailHeight: 80,' +
        '            parallelUploads: 20,' +
        '            createImageThumbnails: false,' +
        '            previewTemplate: previewTemplate,' +
        '            autoQueue: true,' +
        '            previewsContainer: "#previews",' +
        '            clickable: ".fileinput-button"' +
        '        });' +
        '        myDropzone.on("addedfile", function (file) {' +
        '           ' +
        '           ' +
        '        });' +
        '        myDropzone.on("drop", function (file) {' +
        '           ' +
        '            myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));' +
        '        });' +
        '        ' +
        '        myDropzone.on("totaluploadprogress", function (progress) {' +
        '            document.querySelector("#total-progress").style.width = progress + "%";' +
        '        });' +
        '        myDropzone.on("sending", function (file) {' +
        '           ' +
        '            document.querySelector("#total-progress").style.opacity = "1";' +
        '           ' +
        '            ' +
        '        });' +
        '        ' +
        '        myDropzone.on("queuecomplete", function (progress) {' +
            //'        document.querySelector("#total-progress").style.opacity = "0";'+
            // '        document.getElementById("targetButton").className = "btn btn-success fileinput-button";'+
            //'location.reload();'+
        '    });' +


        '      myDropzone.on("success", function (file, responseText) {' +
        '   console.log(responseText );  if(responseText  === "done") {     document.querySelector("#total-progress").style.opacity = "0"; ' +
            // '        document.getElementById("targetButton").className = "btn btn-success fileinput-button";'+
        'location.reload();' +
        '}' +
        '    });' +
        '    </script>';

    resText += "</body></html>";
    return resText;

}




exports.uploadInfoText = function (parm, objectLookup, objectExp, knownObjects, sockets) {
    var objectName = HybridObjectsUtilities.readObject(objectLookup, parm); //parm + thisMacAddress;


    var uploadInfoTexttempArray = objectExp[objectName].objectLinks;
    var uploadInfoTexttempArrayValue = objectExp[objectName].objectValues;
    var infoCount = 0;


    var ArduinoINstance = 0;

    // objectExp[objectName]

    for (subKey in objectExp) {
        if (subKey === objectName) {
            break;
        }
        ArduinoINstance++;
    }
    var text = '<html>\n' +
        '<head>\n' +
        '<head><meta http-equiv="refresh" content="0.3">\n' +
        '    <link rel="stylesheet" href="js/bootstrap.min.css">\n' +
        '    <link rel="stylesheet" href="js/bootstrap-theme.min.css">\n' +
        '</head>\n' +
        '<body style="height:100vh; width: 100%">\n' +
        '<div class="container" id="container" style="width: 750px;">\n' +
        '    <div class="panel panel-primary">\n' +
        '<div class="panel-heading">\n' +
        '<h3 class="panel-title"><font size="6">Hybrid Object - ' + parm + ' - Info&nbsp;&nbsp;&nbsp;&nbsp;<a href="../" style=" color: #ffffff; text-decoration: underline;">back</a></font></h3>\n' +
        '      </div>\n' +
        '</div>\n' +
        '<div id="actions" class="row">\n' +
        '    <div class="col-xs-6">\n' +
        '       <table class="table table-striped">\n' +
        '            <thead>\n' +
        '          <tr>\n' +
        '            <th class="info">Index</th>\n' +
        '            <th class="info">I/O Name</th>\n' +
        '            <th class="info">Value</th>\n' +
        '        </tr>\n' +
        '        </thead>\n' +
        '        <tbody>\n';

    infoCount = 0;
    for (subKey in uploadInfoTexttempArrayValue) {
        text += "<tr> <td>" + infoCount + "</td><td>" + uploadInfoTexttempArrayValue[subKey].name + "</td><td>" + uploadInfoTexttempArrayValue[subKey].value + "</td></tr>";
        infoCount++;
    }

    if (infoCount === 0) {
        text += "<tr> <td> - </td><td> - </td></tr>";
    }

    text +=
        '        </tbody>\n' +
        '    </table>\n' +
        '</div>\n' +
        '<div class="col-xs-6">\n' +
        '    <table class="table table-striped">\n' +
        '        <thead>\n' +
        '        <tr>\n' +
        '            <th class="info">General Info</th>\n' +
        '            <th class="info"></th>\n' +
        '        </tr>\n' +
        '        </thead>\n' +
        '        <tbody>\n' +
            /*     '<tr>\n'+
             '            <th scope="row">Arduino Instance</th>\n'+
             '            <td>'+ArduinoINstance+'</td>\n'+
             '        </tr>\n'+*/
        '        <tr>\n' +
        '            <th scope="row">ip</th>\n' +
        '            <td>' + objectExp[objectName].ip + '</td>\n' +
        '        </tr>\n' +
        '        <tr>\n' +
        '            <th scope="row">version</th>\n' +
        '            <td>' + objectExp[objectName].version + '</td>\n' +
        '        </tr>\n' +
        '        <tr>\n' +
        '            <th scope="row">sockets</th>\n' +
        '            <td>' + sockets.sockets + '</td>\n' +
        '        </tr>\n' +
        '        <tr>\n' +
        '            <th scope="row">connected</th>\n' +
        '            <td>' + sockets.connected + '</td>\n' +
        '        </tr>\n' +
        '        <tr>\n' +
        '            <th scope="row">notConnected</th>\n' +
        '            <td>' + sockets.notConnected + '</td>\n' +
        '        </tr>\n' +
        '        </tbody>\n' +
        '    </table>\n' +
        '    <table class="table table-striped">\n' +
        '        <thead>\n' +
        '        <tr>\n' +
        '            <th class="info">Known Objects</th>\n' +
        '            <th class="info"> </th>\n' +
        '        </tr>\n' +
        '        </thead>\n' +
        '        <tbody>\n';

    infoCount = 0;
    for (subKey in knownObjects) {
        text += '<tr><td>' + subKey + '</td><td>' + knownObjects[subKey] + '</td></tr>';
        infoCount++;
    }

    if (infoCount === 0) {
        text += "<tr> <td>no Object found</td><td> </td></tr>";
    }

    text +=
        '        </tbody>\n' +
        '    </table>\n' +
        '</div>\n' +
        ' </div>\n' +

        ' <div id="actions" class="row">\n' +
        '<div class="col-xs-6">\n' +

        '   </div>\n' +
        ' </div>\n' +

        ' <div id="actions" class="row">\n' +
        ' <div class="col-xs-12">\n' +
        '   <table class="table table-striped">\n' +
        '        <thead>\n' +
        '        <tr>\n' +
        '            <th class="info">Active Link ID</th>\n' +
        '            <th class="info">Origin</th>\n' +
        '            <th class="info">Location in O.</th>\n' +
        '            <th class="info">Destination</td>\n' +
        '            <th class="info">Location in D.</th>\n' +
        '        </tr>\n' +
        '        </thead>\n' +
        '        <tbody>\n';


    infoCount = 0;
    for (subKey in uploadInfoTexttempArray) {
        text += '<tr> <td><font size="2">' + subKey + '</font></td><td><font size="2">' + uploadInfoTexttempArray[subKey].ObjectA + '</font></td><td><font size="2">' + uploadInfoTexttempArray[subKey].locationInA.slice(0, (uploadInfoTexttempArray[subKey].ObjectA.length * -1)) + '</font></td><td><font size="2">' + uploadInfoTexttempArray[subKey].ObjectB + '</font></td><td><font size="2">' + uploadInfoTexttempArray[subKey].locationInB.slice(0, (uploadInfoTexttempArray[subKey].ObjectA.length * -1)) + '</font></td></tr>\n';
        infoCount++;
    }

    if (infoCount === 0) {
        text += "<tr> <td>no Link found</td><td>  </td><td>  </td><td>  </td><td>  </td></tr>";
    }

    text +=
        '        </tbody>\n' +
        '    </table>\n' +
        '</div>\n' +
        '</div>\n' +
        '</div>\n' +
        '</body>\n' +
        '</html>\n' +
        '';


    return text;


    // var tempFolderName = tempFiles[i] + macAddress.replace(/:/gi, '');

    // fill objectExp with objects named by the folders in objects
    // objectExp[tempFolderName] = new ObjectExp();
    // objectExp[tempFolderName].folder = tempFiles[i];
}



exports.uploadTargetText = function (parm, objectLookup, objectExp) {
    if(debug) console.log("target content");
    var objectName = "";
    if (objectExp.hasOwnProperty(HybridObjectsUtilities.readObject(objectLookup, parm))) {

        objectName = HybridObjectsUtilities.readObject(objectLookup, parm);
    } else {
        objectName = parm + HybridObjectsUtilities.uuidTime();
    }

    var text = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '   <meta charset="utf-8">\n' +
        '   <link rel="stylesheet" href="js/bootstrap.min.css">\n' +
        '   <link rel="stylesheet" href="js/bootstrap-theme.min.css">\n' +
        '   <script src="js/dropzone.js"></script>\n' +
        '    <style>\n' +
        '        #total-progress {\n' +
        '            opacity: 0;\n' +
        '            transition: opacity 0.3s linear;\n' +
        '        }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body style="height:100vh; weight: 100%; background-color: #ffffff;  background:repeating-linear-gradient(-45deg, #e4f6ff, #e4f6ff 5px, white 5px, white 10px);" >\n' +
        '<div class="container" id="container" style="width: 750px;">\n' +
        '    <div class="panel panel-primary">\n' +
        '        <div class="panel-heading">\n' +
        '            <h3 class="panel-title"><font size="6">Hybrid Object - ' + parm + ' - Target&nbsp;&nbsp;&nbsp;&nbsp;<a href="../" style=" color: #ffffff; text-decoration: underline;">back</a></font></h3>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '    <div id="actions" class="row">\n' +
        '        <div class="col-xs-7">\n' +
            '  <b>1. Upload your target source image (jpg only, < 0.5 MB)</b><br>' +
        '            2. Login to the Vuforia Target Manager.<br>' +
        '            3. Create a new or open a Device Databases.<br>' +
        '            4. Create a target for your Object and name it exactly:<br><b>&nbsp;&nbsp;&nbsp;&nbsp;' + objectName + '</b><br>' +
        '            5. Make sure that only this one Target is Activated.<br>' +
        '            6. Download the database and then upload it here:<br>' +
        '            (You can just drag and drop the files anywhere in the striped area)' +
        '        </div>' +
        '        <div class="col-xs-5">' +
        '            ' +
        '            <button class="btn btn-info" id="copy-button" data-clipboard-text="' + objectName + '"' +
        '                    title="Click to copy me.">Copy Object Name to Clipboard' +
        '            </button>' +
        '    <script src="js/ZeroClipboard.js"></script>' +
        '    <script>' +
        '    var client = new ZeroClipboard( document.getElementById("copy-button") );' +
        '</script>' +
        '            <br><br><span class="fileupload-process">' +
        '          <div id="total-progress" class="progress progress-striped active" role="progressbar" aria-valuemin="0"' +
        '               aria-valuemax="100" aria-valuenow="0">' +
        '              <div class="progress-bar progress-bar-success" style="width:100%;" data-dz-uploadprogress></div>' +
        '          </div>' +
        '        </span>' +
        '        <span class="btn btn-primary fileinput-button" id="targetButton">' +
        '            <span>&nbsp;Upload Target zip and jpg Files&nbsp;</span>' +
        '        </span>' +
        '        </div>' +
        '    </div>' +
        '    <div class="table table-striped" class="files" id="previews" style="visibility: hidden">' +
        '        <div id="template" class="file-row">' +
        '        </div>' +
        '    </div>' +
        '    <script>' +
        '        var previewNode = document.querySelector("#template");' +
        '        previewNode.id = "";' +
        '        var previewTemplate = previewNode.parentNode.innerHTML;' +
        '        previewNode.parentNode.removeChild(previewNode);' +
        '        var myDropzone = new Dropzone(document.body, {' +
        '            url: "/content/' + parm + '",' +
        '            autoProcessQueue: true,' +
        '            thumbnailWidth: 80,' +
        '            thumbnailHeight: 80,' +
        'headers: { "type": "targetUpload" },'+
        '            parallelUploads: 20,' +
        '            createImageThumbnails: false,' +
        '            previewTemplate: previewTemplate,' +
        '            autoQueue: true,' +
        '            previewsContainer: "#previews",' +
        '            clickable: ".fileinput-button"' +
        '        });' +
        '        myDropzone.on("addedfile", function (file) {' +
        '           ' +
        '           ' +
        '        });' +
        '        myDropzone.on("drop", function (file) {' +
        '           ' +
        '            myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));' +
        '        });' +
        '        ' +
        '        myDropzone.on("totaluploadprogress", function (progress) {' +
        '            document.querySelector("#total-progress").style.width = progress + "%";' +
        '        });' +
        '        myDropzone.on("sending", function (file) {' +
        '           ' +
        '            document.querySelector("#total-progress").style.opacity = "1";' +
        '           ' +
        '            ' +
        '        });' +
        '        ' +
        '        myDropzone.on("queuecomplete", function (progress) {' +

        '    });' +

        '       myDropzone.on("success", function (file, responseText) {' +
        '   if(responseText  === "done") {      document.querySelector("#total-progress").style.opacity = "0"; ' +
        '        document.getElementById("targetButton").className = "btn btn-success fileinput-button";' +
            // 'location.reload();' +
        '}' +
        '    });' +
        '    </script>' +
        '</div>' +
        '<iframe src="https://developer.vuforia.com/targetmanager/project/checkDeviceProjectsCreated?dataRequestedForUserId=" width="100%" height="1000px" style="left: 15px; position:absolute; width: calc(100% - 30px); background-color: #ffffff; " frameborder="0"></iframe>' +
        '</body>' +
        '</html>' +


        '';

    return text;

}




exports.uploadTargetContent = function (parm, dirname0, objectInterfaceFolder) {
    if(debug) console.log("interface content");
    var text =

        '';

    var objectPath = dirname0 + "/objects/";

    var objectPath2 = dirname0 + "/objects/" + parm;

   var tempFiles = fs.readdirSync(objectPath).filter(function (file) {
        return fs.statSync(objectPath + '/' + file).isDirectory();
    });


    var fileList;
    // List all files in a directory in Node.js recursively in a synchronous fashion
    /*  var walkSync = function(dir, filelist) {
     var fs = fs || require('fs'),
     files = fs.readdirSync(dir);
     filelist = filelist || [];
     files.forEach(function(file) {
     if (fs.statSync(dir + '/' + file).isDirectory()) {
     filelist = walkSync(dir +'/'+ file + '/', filelist);
     folderDepth++;
     filelist.push("<");
     filelist.push(file);
     }
     else {
     if(file[0] !== "." )
     filelist.push(file);
     }
     }
     );
     if(folderDepth !==0){
     filelist.push(">");}

     return filelist;
     };*/

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

    //  var folderContent = walkSync(objectPath,fileList);
    var folderSpace = "";


    var folderOrigin = "/obj/";

    var llist;

    folderOld = "";

    text +=
        '<html>\n' +
        '<head>\n' +
        '<head>\n' +
        '    <link rel="stylesheet" href="js/bootstrap.min.css">\n' +
        '    <link rel="stylesheet" href="js/bootstrap-theme.min.css">\n' +
        '   <script src="js/dropzone.js"></script>\n' +
        '    <style>\n' +
        '        #total-progress {\n' +
        '            opacity: 0;\n' +
        '            transition: opacity 0.3s linear;\n' +
        '        }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body style="height: 100%; width: 100%">\n' +
        '<div class="container" id="container" style="width: 750px;">\n' +
        '    <div class="panel panel-primary">\n' +
        '<div class="panel-heading">\n' +
        '<h3 class="panel-title"><font size="6">Hybrid Object - ' + parm + ' - File&nbsp;&nbsp;&nbsp;&nbsp;<a href="../" style=" color: #ffffff; text-decoration: underline;">back</a></font></h3>\n' +
        '      </div>\n' +
        '</div>\n' +
        '<div id="actions" class="row">\n' +
        ' <div class="col-xs-7">\n' +
        '   <table class="table table-hover">\n' +
        '        <thead>\n' +
        '        <tr>\n' +
        '            <th class="info">Object Folder</th>\n' +
        '            <th class="info"></th>\n' +
        '        </tr>\n' +
        '        </thead>\n' +
        '        <tbody>\n';


    for (var i = 0; i < listeliste.length; i++) {

        var content = listeliste[i].replace(objectPath2 + '/', '').split("/");

        if (content[1] !== undefined) {
            if (content[0] !== folderOld) {

                // console.log("---" + content[0]);

                text += '<tr><td><font size="2"><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>&nbsp;&nbsp;' + content[0] + '</font></td><td>';

                var dateiTobeRemoved = parm + '/' + content[0];
                text += "<form id='2delete" + i + content[0] + "' action='" + objectInterfaceFolder + "content/" + parm + "' method='post' style='margin: 0px; padding: 0px'>" +
                    "<input type='hidden' name='folder' value='" + dateiTobeRemoved + "'>" +
                    "<input type='hidden' name='action' value='delete'>";

                text += '<a href="#" onclick="parentNode.submit();"><span class="badge" style="background-color: #d43f3a;">delete</span></a></form></td></tr>';

            }
            // console.log("-"+content[0]);
            //  console.log(content[0]+" / "+content[1]);

            if (content[1][0] !== "." && content[1][0] !== "_") {
                if (debug)console.log(content[1]);
                var fileTypeF = changeCase.lowerCase(content[1].split(".")[1]);

                text += '<tr ';
                if (content[1] === "target.dat" || content[1] === "target.xml" || content[1] === "target.jpg") {
                    text += 'class="success"';
                }


                text += '><td><font size="2">';
                text += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                text += '<span class="';

                if (fileTypeF === "jpg" || fileTypeF === "png" || fileTypeF === "gif" || fileTypeF === "jpeg") {
                    text += 'glyphicon glyphicon-picture';
                } else {
                    text += 'glyphicon glyphicon-file';
                }


                text += ' aria-hidden="true"></span>&nbsp;&nbsp;<a href = "/obj/' + parm + '/' + content[0] + '/' + content[1] + '">' + content[1] + '</a></font></td><td>';

                var dateiTobeRemoved = parm + '/' + content[0] + '/' + content[1];
                text += "<form id='1delete" + i + content[1] + "' action='" + objectInterfaceFolder + "content/" + parm + "' method='post' style='margin: 0px; padding: 0px'>" +
                    "<input type='hidden' name='folder' value='" + dateiTobeRemoved + "'>" +
                    "<input type='hidden' name='action' value='delete'>";
                if (debug) console.log(dateiTobeRemoved);
                text += '<a href="#"  onclick="parentNode.submit();"><span class="badge" style="background-color: #d43f3a;">delete</span></a></form></td></tr>';
            }


            folderOld = content[0];
        } else {
            if (content[0][0] !== "." && content[0][0] !== "_") {
                var fileTypeF2 = changeCase.lowerCase(content[0].split(".")[1]);//.toLowerCase();
                text += '<tr ';
                if (fileTypeF2 === "html" || fileTypeF2 === "htm") {
                    text += 'class="success"';
                } else if (content[0] === "object.json" || content[0] === "object.css" || content[0] === "object.js") {
                    text += 'class="active"';
                }


                text += '><td><font size="2">';
                text += '<span class="';
                if (fileTypeF2 === "jpg" || fileTypeF2 === "png" || fileTypeF2 === "gif" || fileTypeF2 === "jpeg") {
                    text += 'glyphicon glyphicon-picture';
                } else {
                    text += 'glyphicon glyphicon-file';
                }


                text += '" aria-hidden="true"></span>&nbsp;&nbsp;<a href = "/obj/' + parm + '/' + content[0] + '">' + content[0] + '</a></font></td><td>';

                var dateiTobeRemoved = parm + '/' + content[0];
                text += "<form id='1delete" + i + content[0] + "' action='" + objectInterfaceFolder + "content/" + parm + "' method='post' style='margin: 0px; padding: 0px'>" +
                    "<input type='hidden' name='folder' value='" + dateiTobeRemoved + "'>" +
                    "<input type='hidden' name='action' value='delete'>";


                if (content[0] === "object.json" || content[0] === "object.css" || content[0] === "object.js") {
                    text += '<span class="badge">delete</span></form></td></tr>';

                } else {
                    text += '<a href="#"  onclick="parentNode.submit();"><span class="badge" style="background-color: #d43f3a;">delete</span></a></form></td></tr>';
                }
            }
         
        }

    }

    text +=

        '' +
        '</div>' +
        '        </tbody>\n' +
        '    </table>\n' +
        '</div> <div class="col-xs-5">\n' +
        'Drag and Drop your interface files anywhere on this window. Make sure that <b>index.html</b> is your startpoint.' +
        ' You can drop all your files at the same time.<br><br>' +
        '<b>object.json</b> holds all relevant information about your object.' +
        ' You need to include <b>object.css</b> and <b>object.js</b> at the beginning of your interface index.html page.<br>' +

        ' <br><br><span class="fileupload-process">' +
        '          <div id="total-progress" class="progress progress-striped active" role="progressbar" aria-valuemin="0"' +
        '               aria-valuemax="100" aria-valuenow="0">' +
        '              <div class="progress-bar progress-bar-success" style="width:100%;" data-dz-uploadprogress></div>' +
        '          </div>' +
        '        </span>' +
        '        <span class="btn ';
    if (debug)console.log(objectPath + parm + "/target/target.dat");
    if (fs.existsSync(objectPath + parm + "/index.htm") || fs.existsSync(objectPath + '/' + parm + "/index.html")) {
        if (fs.existsSync(objectPath + parm + "/target/target.dat") && fs.existsSync(objectPath + '/' + parm + "/target/target.xml") && fs.existsSync(objectPath + '/' + parm + "/target/target.jpg")) {
            text += "btn-success";
        }
        else {
            text += "btn-warning";
        }
    } else {
        text += "btn-primary";
    }
    ;


    text += ' fileinput-button" id="targetButton">' +
        '            <span>' +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
        "Add Interface Files" +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
        '               </span>' +
        '        </span>' +

        '   <div class="table table-striped" class="files" id="previews" style="visibility: hidden">' +
        '        <div id="template" class="file-row">' +
        '        </div>' +
        '    </div>' +
        '    <script>' +
        '        var previewNode = document.querySelector("#template");' +
        '        previewNode.id = "";' +
        '        var previewTemplate = previewNode.parentNode.innerHTML;' +
        '        previewNode.parentNode.removeChild(previewNode);' +
        '        var myDropzone = new Dropzone(document.body, {' +
        '            url: "/content/' + parm + '",' +
        '            autoProcessQueue: true,' +
        '            thumbnailWidth: 80,' +
        '            thumbnailHeight: 80,' +
        '            parallelUploads: 20,' +
        'headers: { "type": "contentUpload" },'+
        '            createImageThumbnails: false,' +
        '            previewTemplate: previewTemplate,' +
        '            autoQueue: true,' +
        '            previewsContainer: "#previews",' +
        '            clickable: ".fileinput-button"' +
        '        });' +
        '        myDropzone.on("addedfile", function (file) {' +
        '           ' +
        '           ' +
        '        });' +
        '        myDropzone.on("drop", function (file) {' +
        '           ' +
        '            myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));' +
        '        });' +
        '        ' +
        '        myDropzone.on("totaluploadprogress", function (progress) {' +
        '            document.querySelector("#total-progress").style.width = progress + "%";' +
        '        });' +
        '        myDropzone.on("sending", function (file) {' +
        '           ' +
        '            document.querySelector("#total-progress").style.opacity = "1";' +
        '           ' +
        '            ' +
        '        });' +
        '        ' +
        '        myDropzone.on("queuecomplete", function (progress) {' +
        '        document.querySelector("#total-progress").style.opacity = "0";' +
        '    });' +


        '       myDropzone.on("success", function (file, responseText) {' +
        '      if(responseText  === "done") {   document.querySelector("#total-progress").style.opacity = "0"; ' +
        'location.reload();}' +
        '    });' +


        '    </script>' +
        '</body>\n' +
        '</html>\n';

    return text;

}