'use strict';
/**
 * Logging configuration
 */

var path = require('path')
, winstonConf = require('winston-config');

var winston = winstonConf.fromFileSync(path.join(__dirname, '../config/winston-config.json'));
var logger=winston.loggers.get("object");
logger.warn('everything allright logging conf');
module.exports=winston;
