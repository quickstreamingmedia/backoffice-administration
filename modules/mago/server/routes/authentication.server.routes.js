'use strict';

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),


    authController = require(path.resolve('./modules/mago/server/controllers/authentication.controller'));



module.exports = function(app) {

    /* ===== Authentication ===== */
    app.route('/api/auth/login')
        //.all(policy.isAllowed)
        .post(authController.authenticate);

    app.route('/api/auth/tokenvalidate/:token')
        //.all(policy.isAllowed)
        .get(authController.renderPasswordForm);

    app.route('/api/auth/reset/:token')
        //.all(policy.isAllowed)
        .post(authController.resetPassword);

    app.route('/api/personal-details')
        .all(policy.isAllowed)
        .get(authController.get_personal_details)
        .put(authController.update_personal_details);

    app.route('/api/auth/forgot')
        .post(authController.forgot);

};