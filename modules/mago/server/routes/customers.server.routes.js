'use strict';

var passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    customerData = require(path.resolve('./modules/mago/server/controllers/customer_data.server.controller'));


module.exports = function(app) {
    /* ===== customer data ===== */
    app.route('/api/customerdata')
        .all(policy.isAllowed)
        .get(customerData.list)
        .post(customerData.create);

    app.route('/api/customerdata/:customerDataId')
        .all(policy.isAllowed)
        .get(customerData.read)
        .put(customerData.update)
        .delete(customerData.delete);

    app.param('customerDataId', customerData.dataByID);
};
