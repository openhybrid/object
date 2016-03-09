'use strict';
/**
 * Logging configuration
 */

var path = require('path')
, winstonConf = require('winston-config');

//global variables, passed through from server.js
var globalVariables;



module.exports.setup = function (glblVars) {
    globalVariables = glblVars;
    var winston = winstonConf.fromFileSync(path.join(__dirname, 'winston-config' + (globalVariables.debug ? '-debug' : '') +'.json'));
    var logger=winston.loggers.get("object");
    logger.warn('everything allright logging conf');
    logger.debug('debug %s', globalVariables.debug)
    return winston;
};
