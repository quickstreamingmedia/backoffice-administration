'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    config = require(path.resolve('./config/config')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    nodemailer = require('nodemailer'),
    async = require('async'),
    crypto = require('crypto'),
    response = require(path.resolve("./config/responses.js")),
    db = require(path.resolve('./config/lib/sequelize')).models,
    login_data = db.login_data,
    devices = db.devices;


/**
 * Reset password GET from email token
 */
exports.validateResetToken = function(req, res) {
    login_data.find({
        where: {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }
    }).then(function(user) {
        if (!user) {
            console.log("WARNING");
            return res.send('<html><body style="background-color:">' +
                '<div style="font-size:20px;position:absolute;padding: 35px;margin-left:23%;margin-bottom: 20px;border: 2px solid transparent; border-radius:6px;color: #8a6d3b;background-color: #fcf8e3;border-color: #faebcc;">' +
                '<center><span>WARNING: </span>Please resent a new request for password change.</center></div></body></html>');
        }
        user.resetPasswordExpires = 0;
        user.save().then(function() {console.log('resetpasworexpir = 0')});

        devices.update(
            {
                device_active: false
            },
            {where: {
                login_data_id:user.id
            }}
        ).then(function() {

            console.log("device checkbox removed successfully !");
            res.send('<html><body style="background-color:">' +
                '<div style="font-size:20px;position:absolute;margin-left:28%;padding: 35px;margin-bottom: 20px;border: 2px solid transparent; border-radius:6px;color: #3c763d;background-color: #dff0d8;border-color: #d6e9c6;">' +
                '<center><span>SUCCESS: </span>Password changed successfully.</center></div></body></html>');

        }).error(function(err) {

            console.log("Project update failed !");
            res.send('<html><body style="background-color:">' +
                '<div style="font-size:20px;position:absolute;margin-left:32%;top:35%;left:35%;padding: 35px;margin-bottom: 20px;border: 2px solid transparent; border-radius:6px;color: #a94442;background-color: #f2dede;border-color: #ebccd1;">' +
                '<center><span>ERROR: </span>Error occurred.</center></div></body></html>');
        });
    });
};

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function(req, res, next) {

    var smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: req.app.locals.settings.email_username,
            pass: "password" //replace with company email password
        }
    };

    var smtpTransport = nodemailer.createTransport(smtpConfig);


    async.waterfall([
        // Generate random token
        function(done) {
            crypto.randomBytes(20, function(err, buffer) {
                var token = new Buffer().toString('hex');
                done(err, token);
            });
        },
        // Lookup user by username
        function(token, done) {
            if (req.body.username) {
                login_data.find({
                    where: {
                        username: req.body.username.toLowerCase()
                    },
                    include: [{model:db.customer_data, required:true}]
                }).then(function(user) {
                    if (!user) {
                        return res.status(400).send({
                            message: 'No account with that username has been found'
                        });
                    }  else {
                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                        user.save().then(function(saved) {
                            var err = (!saved) ? true : false;
                            done(err, token, saved);
                        });
                        return null;
                    }
                }).catch(function(err) {
                    return res.status(400).send({
                        message: 'Username field must not be blank'
                    });
                });
            } else {
                return res.status(400).send({
                    message: 'Username field must not be blank'
                });
            }
        },
        function(token, user, done) {
            res.render(path.resolve('modules/deviceapiv2/server/templates/reset-password-email'), {
                name: user.customer_datum.firstname + ' '+ user.customer_datum.lastname,
                appName: config.app.title,
                url: req.app.locals.originUrl + '/apiv2/password/reset/' + token
            }, function(err, emailHTML) {
                done(err, emailHTML, user);
            });
        },
        // If valid email, send reset email using service
        function(emailHTML, user, done) {
            var mailOptions = {
                to: user.customer_datum.email, //user.email,
                from: config.mailer.from,
                subject: 'Password Reset',
                html: emailHTML
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if (!err) {
                    console.log('no error sending email');
                    res.send(response.EMAIL_SENT);
                } else {
                    console.log(err);
                    return res.status(801).send(response.EMAIL_NOT_SENT);
                }
                done(err);
            });
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
    });
};
