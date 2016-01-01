/**
 * Created by Carsten on 12/06/15.
 *
 * Copyright (c) 2015 Carsten Strunk
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 *  MPD Client
 *
 * This hardware interface can communicate with a mpd server
 *
 *
 * Example mpd status output:
 *    volume: 49
 *    repeat: 0
 *    random: 0
 *    single: 0
 *    consume: 0
 *    playlist: 14
 *    playlistlength: 1
 *    mixrampdb: 0.000000
 *    state: stop
 *    song: 0
 *    songid: 1
 *
 */
//Enable this hardware interface
exports.enabled = true;

if (exports.enabled) {
    var mpd = require('mpd');
    var _ = require('lodash');
    var server = require(__dirname + '/../../libraries/HybridObjectsHardwareInterfaces');


    var cmd = mpd.cmd;
    var client;


    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        server.developerOn();

        
        client = mpd.connect({
            port: 6600,
            host: '192.168.178.48'
        });

        //add IO points
        server.addIO("Radio", "volume", "default", "mpdClient");
        server.addIO("Radio", "status", "default", "mpdClient");
        server.clearIO("mpdClient");


        //Create listeners for mpd events

        //volume has changed
        client.on('system-mixer', function () {
            client.sendCommand(cmd("status", []), function (err, msg) {
                if (err) console.log("Error: " + err);
                else {
                    var status = mpd.parseKeyValueMessage(msg);
                    console.log("Volume: " + status.volume);
                    server.writeIOToServer("Radio", "volume", status.volume / 100, "f");
                }

            });

        });


        //playing status has changed
        client.on('system-player', function () {
            client.sendCommand(cmd("status", []), function (err, msg) {
                if (err) console.log("Error executing mpd command: " + err);
                else {
                    var status = mpd.parseKeyValueMessage(msg);
                    //console.log(msg);
                    if (status.state == "stop") {
                        server.writeIOToServer("Radio", "status", 0, "f");
                    } else if (status.state == "play") {
                        server.writeIOToServer("Radio", "status", 1, "f");
                    } else if (status.state == "pause") {
                        server.writeIOToServer("Radio", "playing", 0.5, "f");
                    }
                }

            });

        });

    }


    exports.receive = function () {
        setup();

    };

    exports.send = function (objName, ioName, value, mode, type) {
        console.log("Incoming: " + objName + " " + ioName + " " + value);
        if (objName == "Radio") {
            if (ioName == "volume") {
                client.sendCommand("setvol " + _.floor(value * 100), function (err, msg) {
                    if (err) console.log("Error executing mpd command: " + err);
                });
            } else if (ioName == "status") {
                if (value < 0.33) {
                    client.sendCommand(cmd("play", []));
                } else if (value < 0.66) {
                    client.sendCommand(cmd("pause", []));
                } else {
                    client.sendCommand(cmd("stop", []));
                }
            }

        }

    };

    exports.init = function () {
    };
}


