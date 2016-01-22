/**
 * Created by Carsten on 02/01/16.
 *
 * Copyright (c) 2015 Carsten Strunk
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 *  KODI Client
 *
 * This hardware interface can communicate with a KODI Media Centre using the JSON RPC API
 *
 * http://kodi.wiki/view/JSON-RPC_API/v6
 *
 */
//Enable this hardware interface
exports.enabled = false;

if (exports.enabled) {
	var winston = require('winston');
	var logger=winston.loggers.get("hardware");
	logger.info("Loading kodi");
	
    var fs = require('fs');
    var kodi = require('kodi-ws');
    var request = require('request');
    var _ = require('lodash');
    var server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces');

    var kodiServers;


    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        server.developerOn();

        kodiServers = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

        logger.info("KODI setup");

        for (var key in kodiServers) {
            var kodiServer = kodiServers[key];
            kodiServer.connection = null;

            kodi(kodiServer.host, kodiServer.port).then(function (connection) {
                kodiServer.connection = connection;
                kodiServer.connection.on('error', function (error) { logger.error("KODI error: " + error) });

                //Add Event Handlers
                kodiServer.connection.Application.OnVolumeChanged(function () {
                    var volume = kodiServer.connection.Application.GetProperties({ properties: ['volume'] });
                    volume.then(function (data) {
                        server.writeIOToServer(key, "volume", data.volume / 100, "f");
                    });

                });

                kodiServer.connection.Player.OnPause(function () {
                    server.writeIOToServer(key, "status", 0.5, "f");
                });

                //currentKodi = "http://" + kodiServer.host+":8080" +"/jsonrpc"
                var currkodiServer=kodiServer;
                kodiServer.connection.Player.OnPlay(function (msg) {
                	logger.debug("kodi msg : %s", JSON.stringify(msg));
                	logger.debug("kodi msg : %s", msg.data.player.playerid);
                    server.writeIOToServer(key, "status", 1, "f");
                    requestData = { "playerid" : msg.data.player.playerid,
                                "properties": [ "title", "artist", "albumartist",  "genre",
                                               "year", "rating", "album", "track",
                                               "duration", "comment", "lyrics",
                                               "playcount", "fanart", "director", "trailer",
                                               "tagline", "plot", "plotoutline",
                                               "originaltitle", "lastplayed", "writer",
                                               "studio", "mpaa", "cast", "country",
                                               "imdbnumber", "premiered", "productioncode",
                                               "runtime", "set", "showlink", "streamdetails", "top250",
                                               "votes", "firstaired", "season", "episode",
                                               "showtitle", "thumbnail", "file", "resume",
                                               "artistid", "albumid", "tvshowid", "setid" ]
                                }
                    currkodiServer.connection.Player.GetItem(requestData).then (function (playing) {
                    	logger.debug("playing : %s", JSON.stringify(playing));
                        if (playing.item) {
                        	server.writeIOToServer(key, "playing", playing.item, "m");
                        }
                    });
                });

                kodiServer.connection.Player.OnStop(function () {
                    server.writeIOToServer(key, "status", 0, "f");
                	server.writeIOToServer(key, "playing",{ 'title': ''}, "m");
                });

            });


            server.addIO(key, "volume", "default", "kodi");
            server.addIO(key, "status", "default", "kodi");
            server.addIO(key, "playing", "default", "kodi");
        }

        server.clearIO("kodi");
    }


    exports.receive = function () {
        setup();

    };

    exports.send = function (objName, ioName, value, mode, type) {
        if (kodiServers.hasOwnProperty(objName) && !_.isNull(kodiServers[objName].connection)) {
            if (ioName == "volume") {
                kodiServers[objName].connection.Application.SetVolume(_.floor(value * 100));
            } else if (ioName == "status") {
                //play, pause, stop all of the currently active players
                kodiServers[objName].connection.Player.GetActivePlayers().then(function (data) {
                    for (var i = 0; i < data.length; i++) {
                        if (value < 0.33) {
                            kodiServers[objName].connection.Player.Stop({ playerid: data[i].playerid });
                        } else if (value < 0.66) {
                            kodiServers[objName].connection.Player.PlayPause({ playerid: data[i].playerid, play:false });
                        } else {
                            kodiServers[objName].connection.Player.PlayPause({ playerid: data[i].playerid, play:true });
                        }
                    }

                });

            }
        }
    };

    exports.init = function () {
    };
}

