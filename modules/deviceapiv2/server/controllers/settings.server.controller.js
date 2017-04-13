'use strict'
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston')),
    dateFormat = require('dateformat'),
    moment = require('moment'),
    async = require('async'),
    http = require('http'),
    models = db.models;

var id = -1;
var upgradetype = 1;
var name = "";
var updatedate = "";
var description = "";
var location = "";
var activated = 0;

/**
 * @api {post} /apiv2/settings/settings /apiv2/settings/settings
 * @apiVersion 0.2.0
 * @apiName GetSettings
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiParam {String} activity {login or livetv or vod} Mandatory value.
 * @apiParam {Number} mainmenutimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} livetvtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} vodtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiDescription Get user settings, subscription, etc
 */

exports.settings = function(req, res) {

    var settings_response = new response.OK();

    var current_timestamp = Date.now(); //server timestamp in milliseconds
    var client_timestamp = req.auth_obj.timestamp; //request timestamp in milliseconds

    async.waterfall([
        //GETTING USER DATA
        function(callback) {
            models.login_data.findOne({
                attributes: ['id', 'player', 'pin', 'show_adult', 'timezone', 'auto_timezone', 'beta_user'], where: {username: req.auth_obj.username}
            }).then(function (login_data) {
                callback(null, login_data);
                return null;
            }).catch(function(error) {
                console.log(error);
            });
        },
        //CHECKING IF THE USER NEEDS TO REFRESH SERVER SIDE DATA
        function(login_data, callback) {
            if (req.body.activity === 'livetv') {
                //db value of last livetv refresh is bigger than client last refresh -> return true. Else return false

                if ((req.body.livetvtimestamp >= parseFloat(req.app.locals.settings.livetvlastchange)) && (req.body.livetvtimestamp >= parseFloat(req.thisuser.livetvlastchange))){
                    callback(null, login_data, false, req.body.livetvtimestamp);
                }
                else{
                    settings_response.timestamp = req.app.locals.settings.livetvlastchange;
                    callback(null, login_data, true, parseFloat(req.app.locals.settings.livetvlastchange));
                }
            }
            else if (req.body.activity === 'vod') {
                //db value of last vod refresh is bigger than client last refresh -> return true. Else return false

                if ((req.body.vodtimestamp >= parseFloat(req.app.locals.settings.vodlastchange)) && (req.body.vodtimestamp >= parseFloat(req.thisuser.vodlastchange))){
                    callback(null, login_data, false, req.body.vodtimestamp);
                }
                else {
                    callback(null, login_data, true, parseFloat(req.app.locals.settings.vodlastchange));
                }
            }
            else if(req.body.activity === 'login'){
                //db value of last main menu or livetv refresh is bigger than client last refresh -> return true. Else return false
                if (req.body.mainmenutimestamp >= parseFloat(req.app.locals.settings.menulastchange)){
                    callback(null, login_data, false, req.body.mainmenutimestamp);
                }
                else {
                    callback(null, login_data, true, parseFloat(req.app.locals.settings.menulastchange));
                }
            }
            else{
                //in case of unexpected activity value, return false
                callback(null, login_data, false, 0);
            }
        },
        //GETTING DAYS LEFT, DEPENDING ON THE ACTIVITY OF THE USER
        function(login_data, refresh, timestamp, callback){
            var activity = (req.body.activity === 'login') ? 'livetv' : req.body.activity; //login activity requires livetv days_left, other activity require their own days_left
            //sequelize currently does not support non-primary foreign keys, so the code must be broken into two queries
            models.app_group.findOne({
                attributes: ['app_group_id'], where: {app_id: req.auth_obj.appid}
            }).then(function (app_group) {
                models.subscription.findAll({
                    attributes: ['end_date'], where: {login_id: login_data.id}, limit: 1, order: [[ 'end_date', 'DESC' ]],
                    include: [{
                        model: models.package, required: true, attributes: ['id'], include: [
                            {model: models.package_type, required: true, attributes: ['id'], where:{app_group_id: app_group.app_group_id}, include: [
                                {model: models.activity, required: true, attributes: ['id'], where: {description: activity}}
                            ]}
                        ]}
                    ]
                }).then(function (enddate) {
                    var end_date = moment(enddate[0].end_date, "YYYY-M-DD HH:mm:ss");
                    var current_date = moment(new Date(), "YYYY-M-DD HH:mm:ss");
                    var seconds_left = end_date.diff(current_date, 'seconds');
                    var daysleft = Number((seconds_left / 86400).toFixed(0));
                    callback(null, login_data, daysleft, refresh, timestamp);
                    return null;
                }).catch(function(error) {
                    callback(null, login_data, 0, refresh, timestamp);
                    return null;
                });
                return null;
            }).catch(function(error) {
                console.log(error);
            });
        },
        function(login_data, daysleft, refresh, timestamp, callback) {
            var get_beta_app = (login_data.beta_user) ? 1 : 0;
            //FIND LATEST AVAILABLE UPGRADE FOR THIS APPID, WHOSE API AND APP VERSION REQUIREMENT IS FULLFILLED BY THE DEVICE, and status fits the user status
            models.app_management.findOne({
                attributes: ['id', 'title', 'description', 'url', 'isavailable', 'updatedAt'],
                limit: 1,
                where: {
                    beta_version: get_beta_app,
                    appid: req.auth_obj.appid,
                    upgrade_min_api : {lte: req.body.api_version}, //device api version must be greater / equal to min api version of the upgrade
                    upgrade_min_app_version: {lte: req.body.appversion}, //device app version must be greater / equal to min app version of the upgrade
                    app_version: {gt: req.body.appversion}, //device app version must be smaller than the app version of the upgrade
                    isavailable: 1
                },
                order: [[ 'updatedAt', 'DESC' ]] //last updated record
            }).then(function (result) {
                if(result){
                    id = result['id'];
                    name = result['title'];
                    updatedate = dateFormat(result['updatedAt'], "yyyy-mm-dd hh:MM:ss:000");
                    description = result['description'];
                    location = req.app.locals.settings.assets_url+''+result['url'];
                    activated = result['isavailable'];
                    callback(null, login_data, daysleft, refresh, timestamp, true);
                }
                else{
                    callback(null, login_data, daysleft, refresh, timestamp, false); //if there are no available upgrades, return false
                }
                return null;
            }).catch(function(error) {
                console.log(error);
                callback(null, login_data, daysleft, refresh, timestamp, false);
                return null;
            });
        },
        //get client offset from the ip_timezone service
        function(login_data, daysleft, refresh, timestamp, available_upgrade, callback) {

            var client_ip = (req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'].split(',').pop().replace('::ffff:', '').replace(' ', '') : req.ip.replace('::ffff:', '');
            var apiurl = req.app.locals.settings.ip_service_url+req.app.locals.settings.ip_service_key+'/'+client_ip;


            http.get(apiurl, function(resp){
                resp.on('data', function(ip_info){
                    callback(null, login_data, daysleft, refresh, timestamp, available_upgrade, JSON.parse(ip_info).gmtOffset);
                });
            }).on("error", function(e){
                console.log("Got error: " + e.message);
                callback(null, login_data, daysleft, refresh, timestamp, available_upgrade, 0); //return offset 0 to avoid errors
            });
        },
        //RETURNING CLIENT RESPONSE
        function(login_data, daysleft, refresh, timestamp, available_upgrade, offset) {
            //appoint calculated refresh to the right activity, false to others
            var mainmenurefresh = (req.body.activity === 'login') ? refresh : false;
            var vodrefresh = (req.body.activity === 'vod') ? refresh : false;
            var livetvrefresh = (req.body.activity === 'livetv') ? refresh : false;

            //return images based on appid
            var logo_url = (req.auth_obj.appid == 1) ?  req.app.locals.settings.box_logo_url :  req.app.locals.settings.mobile_logo_url;
            var background_url = (req.auth_obj.appid == 1) ?  req.app.locals.settings.box_background_url :  req.app.locals.settings.mobile_background_url;
            var vod_background_url = (req.auth_obj.appid == 1) ?  req.app.locals.settings.vod_background_url :  req.app.locals.settings.vod_background_url;

            //days_left message is empty if user still has subscription
            var days_left_message = (daysleft > 0) ? "" : "No subscription";

            settings_response.response_object = [{
                "logo_url": req.app.locals.settings.assets_url+""+logo_url,
                "background_url": req.app.locals.settings.assets_url+""+background_url,
                "vod_background_url": req.app.locals.settings.assets_url+""+vod_background_url,
                "livetvrefresh": livetvrefresh,
                "vodrefresh": vodrefresh,
                "mainmenurefresh": mainmenurefresh,
                "timestamp": timestamp,
                "daysleft": daysleft,
                "days_left_message": days_left_message,
                "company_url": req.app.locals.settings.company_url,
                "log_event_interval":  req.app.locals.settings.log_event_interval,
                "channel_log_time":  req.app.locals.settings.channel_log_time,
                "activity_timeout":  req.app.locals.settings.activity_timeout,
                "player": login_data.player,
                "pin": login_data.pin,
                "showadult": login_data.show_adult,
                "timezone": login_data.timezone,
                "auto_timezone": login_data.auto_timezone,
                "iptimezone": offset,
                "available_upgrade": available_upgrade
            }];

            res.send(settings_response);
        }
    ], function (err) {
        console.log(err);
        res.send(response.DATABASE_ERROR);
    });

};

//API GETS APPID, APP VERSION AND API VERSION OF THE DEVICE AND DECIDES IF THERE ARE ANY UPGRADES WHOSE REQUIREMENTS ARE FULLFILL BY THIS DEVICE
exports.upgrade = function(req, res) {
    var upgrade_response = new response.OK();
    if(id >= 0){
        upgrade_response.response_object = upgrade_response.response_object = [{
            "id": id,
            "upgradetype": upgradetype,
            "name": name,
            "updatedate": updatedate,
            "description": description,
            "location": location,
            "activated": activated
        }];
    }
    else{
        upgrade_response.extra_data = "No available upgrades";
    }
    res.send(upgrade_response);
};
