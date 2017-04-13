'use strict';

/**
 * Module dependencies.
 */

//production
process.env.NODE_ENV = 'production';
process.env.NODE_HOST = 'https://my_domain';  //replace my_domain with the your domain

var app = require('./config/lib/app');

var server = app.start();


