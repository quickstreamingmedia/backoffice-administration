'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    dateFormat = require('dateformat'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    fileHandler = require(path.resolve('./modules/mago/server/controllers/common.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.settings,
    refresh = require(path.resolve('./modules/mago/server/controllers/common.controller.js')),
    vod_ts,menu_ts,live_ts,url_fields=[];

/**
 * Create
 */
exports.create = function(req, res) {
    //the paths of the current uploaded files
    var prev_val=[req.body.mobile_logo_url,req.body.mobile_background_url,
        req.body.box_logo_url,req.body.box_background_url,req.body.vod_background_url];
    //the path where the current uploaded files will be copied
    var target_paths=fileHandler.create_path(prev_val,"image");

    req.body.mobile_logo_url=target_paths[0];req.body.mobile_background_url=target_paths[1];req.body.box_logo_url=target_paths[2];
    req.body.box_background_url=target_paths[3];req.body.vod_background_url=target_paths[4];

    req.body.menulastchange = Date.now(); //add refresh value for main menu
    DBModel.create(req.body).then(function(result) {
        if (!result) {
            return res.status(400).send({message: 'fail create data'});
        } else {
            fileHandler.update_file(prev_val,target_paths,url_fields,false);//copy the files from the temporary folder to the right folder on update
            return res.jsonp(result);
        }
    }).catch(function(err) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * Show current
 */


exports.read = function(req, res) {
    res.json(req.settings);
};

/**
 * Update
 */

exports.update = function(req, res) {

    var updateData = req.settings;
    console.log('req.token = ', req.token);

    if(req.body.updatelivetvtimestamp)
        req.body.livetvlastchange = Date.now()
    else
        delete req.body.livetvlastchange;

    if(req.body.updatemenulastchange)
        req.body.menulastchange = Date.now()
    else
        delete req.body.menulastchange;

    if(req.body.updatevodtimestamp)
        req.body.vodlastchange = Date.now()
    else
        delete req.body.vodlastchange

    logHandler.add_log(req.token.uid, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(req.body));

    updateData.updateAttributes(req.body).then(function(result) {
        delete req.app.locals.settings; req.app.locals.settings = result; //refresh company settings in app memory
        return res.json(result);
    }).catch(function(err) {
        console.log(err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};



/**
 * Delete
 */
exports.delete = function(req, res) {
    var deleteData = req.settings;
    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            result.destroy().then(function() {
                return res.json(result);
            }).catch(function(err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            });
        } else {
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
    }).catch(function(err) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * List
 */
exports.list = function(req, res) {
    DBModel.findAll({
        offset: 5,
        limit: 20,
        include: []
    }).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.json(results);
        }
    }).catch(function(err) {
        res.jsonp(err);
    });
};

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    DBModel.find({
        where: {
            id: id
        },
        include: []
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.settings = result;
            req.app.locals.settings = result; //update settings on app when changed from UI
            next();
            return null;
        }
    }).catch(function(err) {
        return next(err);
    });

};
