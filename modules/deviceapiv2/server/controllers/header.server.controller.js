'use strict';
var path = require('path'),
    response = require(path.resolve("./config/responses.js"));


//RETURNS http headers in json object format

exports.header = function(req, res) {
    var clear_response = new response.OK();
    clear_response.response_object = req.headers;
	clear_response.extra_data = "";
    res.send(clear_response);
};