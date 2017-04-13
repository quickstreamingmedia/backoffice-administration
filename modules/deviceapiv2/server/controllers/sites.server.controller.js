'use strict';
var path = require('path'),
		db = require(path.resolve('./config/lib/sequelize')).models,
		crypto = require('crypto'),
		async = require('async'),
		nodemailer = require('nodemailer'),
		response = require(path.resolve("./config/responses.js")),
		authentication = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller.js')),
		subscription = db.subscription,
		login_data = db.login_data,
		customer_data = db.customer_data;


exports.createaccount = function(req,res) {

	var smtpConfig = {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // use SSL
		auth: {
			user: req.app.locals.settings.email_username, 
			pass: req.app.locals.settings.email_password
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
		// check if username exists
		function(token,done) {
			login_data.findOne({
				where: {username: req.body.username.toLowerCase()}
			}).then(function (login_record) {
				if (login_record) {
					var myUserRes = response.REGISTRATION_ERROR;
					myUserRes.extra_data ='Username already exists';
					res.send(myUserRes);
					done(null, 1);
					return null;
				}
				else{
					done(null, token);
					return null;
				}
			}).catch(function (err) {
				console.log(err);
			});
		},
		// check if email exists
		function(token, done) {
			customer_data.findOne({
				where: {email: req.body.email.toLowerCase()}
			}).then(function (customer_record) {
				if (customer_record) {
					var myEmailRes=response.REGISTRATION_ERROR;
					myEmailRes.extra_data='Email already exists';
					console.log('Registration Error email');
					console.log(myEmailRes);
					res.send(myEmailRes);
					done(null, 1);
					return null;
				}
				else{
					done(null, token);
					return null;
				}
			}).catch(function (err) {
				console.log(err);
			});
		},
		function(token, done) {
			if(token !== 1){
				var salt = authentication.makesalt();
				var password = authentication.encryptPassword(req.body.password, salt);

				customer_data.create({
					firstname:	req.body.firstname,
					lastname:	req.body.lastname,
					email:		req.body.email,
					telephone:	req.body.telephone
				}).then(function(new_customer){
					login_data.create({
						customer_id:			new_customer.id,
						username:				req.body.username,
						salt:                   salt,
						password:				password,
						channel_stream_source: 	1,
						vod_stream_source:		1,
						pin:					1234,
						show_adult:				0,
						auto_timezone:			1,
						player:					'default',
						activity_timeout:		900,
						get_messages:			0,
						force_upgrade:			0,
						account_lock:			0,
						resetPasswordToken:		token,
						resetPasswordExpires:   Date.now() + 3600000 // 1 hour
					}).then(function(new_login){
						done(null,token, new_customer);
						return null;
					}).catch(function(err){
						console.log(err);
					});
					return null;
				}).catch(function (err) {
					console.log(err);
				});
			}
			else{
				console.log("Not going to insert any data");
			}
		},
		function(token, new_customer, done) {
			console.log('enter email template');
			res.render(path.resolve('modules/deviceapiv2/server/templates/new-account'), {
				name: new_customer.firstname + ' ' + new_customer.lastname,
				appName: req.app.locals.title, //TODO: handle this field
				url: req.app.locals.originUrl + '/apiv2/sites/confirm-account/' + token

			}, function(err, emailHTML) {
				if(err) console.log(err);
				done(err, emailHTML, new_customer.email);
			});
		},
		function(emailHTML, email, done) {
			console.log('enter send email process'+email);
			var mailOptions = {
				to: email,
				from: 'NOREPLY_EMAIL', //replace with automatic reply email address
				subject: 'account confirmation email',
				html: emailHTML
			};

			smtpTransport.sendMail(mailOptions, function(err) {
				var myEmail;
				if (!err) {
					myEmail=response.EMAIL_SENT;
					console.log('Email sent');
					console.log(myEmail);
					res.send(myEmail);

				} else {
					console.log(err);
					myEmail=response.EMAIL_NOT_SENT;
					console.log('Email not sent');
					console.log(myEmail);
					res.send(myEmail);
				}
				done(err);
			});
		}
	],function(err) {
		if (err) {
			return err;
		}
	});
};

exports.confirmNewAccountToken = function(req, res) {
	login_data.find({
		where: {
			resetPasswordToken: req.params.token,
			resetPasswordExpires: {
				$gt: Date.now()
			}
		}
	}).then(function(user) {
		if (!user) {
			return res.send('invalid');
		}
		user.resetPasswordExpires = 0;
		user.account_lock = 0;
		user.save().then(function (result) {
			console.log('resetpasworexpir = 0');
			insertpackage(result.id, 92, '2016-10-24 00:00:00', '2020-10-24 00:00:00', result.username, 'registration');
			insertpackage(result.id, 93, '2016-10-24 00:00:00', '2020-10-24 00:00:00', result.username, 'registration');
			insertpackage(result.id, 2, '2016-10-24 00:00:00', '2020-10-24 00:00:00', result.username, 'registration');
			res.send('Account confirmed, you can now login');
		});
	});

	function insertpackage(id, comboid, startdate, enddate, customer, user){
		subscription.create({
			login_id: id,
			package_id: comboid,
			start_date: startdate,
			end_date: enddate,
			customer_username: customer,
			user_username: user
		}).then(function(results) {
			console.log(results)
		}).catch(function(error) {
			console.log(error)
		});
	}

};
