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





    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        server.developerOn();

        var cmd = mpd.cmd;
        var client = mpd.connect({
            port: 6600,
            host: '192.168.178.48'
        });

        //add IO points
        server.addIO("MPD", "volume", "default", "mpd");
        server.addIO("MPD", "playing", "default", "mpd");
        server.addIO("MPD", "stopped", "default", "mpd");
        server.addIO("MPD", "paused", "default", "mpd");
        server.clearIO("mpd");


        //Create listeners for mpd events

        //volume has changed
        client.on('system-mixer', function () {
            client.sendCommand(cmd("status", []), function (err, msg) {
                if (err) console.log("Error: " + err)
                else {
                    var status = mpd.parseKeyValueMessage(msg);
                    console.log("Volume: " + status.volume);
                    server.writeIOToServer("MPD", "volume", status.volume / 100, "f");
                }

            });

        });


        //playing status has changed
        client.on('system-player', function () {
            client.sendCommand(cmd("status", []), function (err, msg) {
                if (err) console.log("Error: " + err)
                else {
                    var status = mpd.parseKeyValueMessage(msg);
                    //console.log(msg);
                    if (status.state == "stop") {
                        server.writeIOToServer("MPD", "playing", 0, "d");
                        server.writeIOToServer("MPD", "stopped", 1, "d");
                        server.writeIOToServer("MPD", "paused", 0, "d");
                    } else if (status.state == "play") {
                        server.writeIOToServer("MPD", "playing", 1, "d");
                        server.writeIOToServer("MPD", "stopped", 0, "d");
                        server.writeIOToServer("MPD", "paused", 0, "d");
                    } else if (status.state == "pause") {
                        server.writeIOToServer("MPD", "playing", 0, "d");
                        server.writeIOToServer("MPD", "stopped", 0, "d");
                        server.writeIOToServer("MPD", "paused", 1, "d");
                    }
                }

            });

        });

    }


    exports.receive = function () {
        setup();

    };

    exports.send = function (objName, ioName, value, mode, type) {

    };

    exports.init = function () {
    };
}


