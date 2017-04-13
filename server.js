'use strict';

/**
 * Module dependencies.
 */

process.env.NODE_ENV = 'development';

//development
process.env.NODE_HOST = 'http://my_domain'; //replace my_domain with the your domain

var app = require('./config/lib/app');

var server = app.start();


