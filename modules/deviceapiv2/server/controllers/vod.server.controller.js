'use strict';
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    models = db.models,
    winston = require(path.resolve('./config/lib/winston'));


//RETURNS LIST OF VOD PROGRAMS
/**
 * @api {post} /apiv2/vod/list /apiv2/vod/list
 * @apiVersion 0.2.0
 * @apiName GetVodList
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiDescription Returns video on demand assets/movies
 */
exports.list = function(req, res) {

    var clear_response = new response.OK();
    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];

    models.vod.findAll({
        attributes: ['id', 'title', 'pin_protected', 'duration', 'description', 'category_id', 'createdAt', 'rate', 'year', 'icon_url', 'image_url'],
        include: [
            {model: models.vod_stream, required: true, attributes: ['url', 'encryption']},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ],
        where: {pin_protected:{in: allowed_content}, isavailable: true}
    }).then(function (result) {
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};

            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        raw_obj.id = String(obj.id);
                        raw_obj.title = obj.title;
                        raw_obj.pin_protected = (obj.pin_protected === true) ? 1 : 0;
                        raw_obj.duration = obj.duration;
                        raw_obj.url = obj[k][j].url;
                        raw_obj.description = obj.description;
                        raw_obj.icon = req.app.locals.settings.assets_url+obj.icon_url;
                        raw_obj.largeimage = req.app.locals.settings.assets_url+obj.image_url;
                        raw_obj.categoryid = String(obj.category_id);
                        raw_obj.dataaded = obj.createdAt.getTime();
                        raw_obj.rate = String(obj.rate);
                        raw_obj.year = String(obj.year);
                        raw_obj.token = null;
                        raw_obj.TokenUrl = null;
                        raw_obj.encryption = obj[k][j].encryption;
                    });
                }
            });
            raw_result.push(raw_obj);
        });

        clear_response.response_object = raw_result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

//RETURNS FULL LIST OF CATEGORIES
/**
 * @api {post} /apiv2/vod/categories /apiv2/vod/categories
 * @apiVersion 0.2.0
 * @apiName GetVodCategories
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiDescription Returns full list of categories
 */
exports.categories = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    models.vod_category.findAll({
        attributes: [ 'id', 'name', 'password', 'sorting', [db.sequelize.fn("concat", req.app.locals.settings.assets_url, db.sequelize.col('icon_url')), 'IconUrl'],
            [db.sequelize.fn("concat", req.app.locals.settings.assets_url, db.sequelize.col('small_icon_url')), 'small_icon_url']],
        where: {password:{in: allowed_content}, isavailable: true}
    }).then(function (result) {
        //type conversation of id from int to string. Setting static values
        for(var i=0; i< result.length; i++){
            result[i].toJSON().id = String(result[i].toJSON().id);
            result[i].toJSON().password = "False";
            result[i].toJSON().pay = "False";
        }
        clear_response.response_object = result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });
};

//RETURNS ALL SUBTITLES FOR THE SELECTED PROGRAM
/**
 * @api {post} /apiv2/vod/subtitles /apiv2/vod/subtitles
 * @apiVersion 0.2.0
 * @apiName GetVodSubtitles
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiDescription Returns all subtitles list
 */
exports.subtitles = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    models.vod_subtitles.findAll({
        attributes: [ ['vod_id', 'vodid'], 'title', [db.sequelize.fn("concat", req.app.locals.settings.assets_url, db.sequelize.col('subtitle_url')), 'url'] ],
        include: [
            { model: models.vod, required: true, attributes: [], where: {pin_protected: {in: allowed_content}, isavailable: true},
                include: [
                    {model: models.vod_stream, required: true, attributes: []},
                    {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
                ]
            }
        ]
    }).then(function (result) {
        //type conversation of id from int to string
        for(var i=0; i< result.length; i++){
            result[i].toJSON().vodid = String(result[i].toJSON().vodid);
        }
        clear_response.response_object = result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });
};




//RETURNS CLICKS FOR THE SELECTED PROGRAM
/**
 * @api {post} /apiv2/vod/totalhits /apiv2/vod/totalhits
 * @apiVersion 0.2.0
 * @apiName GetVodItemHits
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiParam {Number} id_vod VOD item ID
 * @apiDescription Returns clicks/hits for selected vod item.
 */
exports.totalhits = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

     //if hits for a specific movie are requested
    if(req.body.id_vod != "all"){
        models.vod.findAll({
            attributes: [ ['id', 'id_vod'], ['clicks', 'hits'] ],
            where: {id: req.body.id_vod, pin_protected: {in: allowed_content}, isavailable: true},
            include: [
                {model: models.vod_stream, required: true, attributes: []},
                {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
            ]
        }).then(function (result) {
            if(req.body.id_vod === "all"){clear_response.response_object = result;}
            else{clear_response.response_object = result;}
            res.send(clear_response);
        }).catch(function(error) {
            console.log(error);
            res.send(response.DATABASE_ERROR);
        });
    }
    //return hits for each vod movie
    //TODO: consider pin protection and isavailable here?
    else{
        models.vod.findAll({
            attributes: [ ['id', 'id_vod'], ['clicks', 'hits'] ],
            where: {pin_protected: {in: allowed_content}, isavailable: true},
            include: [
                {model: models.vod_stream, required: true, attributes: []},
                {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
            ]
        }).then(function (result) {
            clear_response.response_object = result;
            res.send(clear_response);
        }).catch(function(error) {
            console.log(error);
            res.send(response.DATABASE_ERROR);
        });
    }

};

exports.mostwatched = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    //if hits for a specific movie are requested
    models.vod.findAll({
        attributes: ['id', 'clicks'],
        limit: 30,
        order: [[ 'clicks', 'DESC' ]],
        where: {pin_protected: {in: allowed_content}, isavailable: true},
        include: [
            {model: models.vod_stream, required: true, attributes: []},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ]
    }).then(function (result) {
        for(var i=0; i< result.length; i++){
            result[i].toJSON().id = String(result[i].toJSON().id);
        }
        clear_response.response_object = result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

exports.mostrated = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    //if most rated movies are requested
    models.vod.findAll({
        attributes: ['id', 'rate'],
        where: {pin_protected: {in: allowed_content}, isavailable: true},
        limit: 30,
        order: [[ 'rate', 'DESC' ]],
        include: [
            {model: models.vod_stream, required: true, attributes: []},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ]
    }).then(function (result) {
        var mostrated = [];
        for(var i=0; i< result.length; i++){
            var mostrated_object = {};
            mostrated_object.id = result[i].id;
            mostrated_object.rate = parseInt(result[i].rate);
            mostrated.push(mostrated_object);
        }
        clear_response.response_object = mostrated;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

exports.related = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    models.vod.findAll({
        attributes: ['id'],
        where: {pin_protected: {in: allowed_content}, isavailable: true},
        include: [
            {model: models.vod_stream, required: true, attributes: []},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ],
        limit: 5
    }).then(function (result) {
        for(var i=0; i< result.length; i++){
            result[i].toJSON().id = String(result[i].toJSON().id);
        }
        clear_response.response_object = result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

exports.suggestions = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    models.vod.findAll({
        attributes: ['id'],
        where: {pin_protected: {in: allowed_content}, isavailable: true},
        include: [
            {model: models.vod_stream, required: true, attributes: []},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ],
        limit: 10
    }).then(function (result) {
        clear_response.response_object = result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

exports.categoryfilms = function(req, res) {

    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
    var clear_response = new response.OK();

    models.vod.findAll({
        attributes: ['id'],
        where: {pin_protected: {in: allowed_content}, isavailable: true},
        include: [
            {model: models.vod_stream, required: true, attributes: []},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true, id: req.body.category_id}}
        ]
    }).then(function (result) {
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            console.log(obj.id)
            raw_obj.id = String(obj.id);
            raw_result.push(raw_obj);
        });
        clear_response.response_object = raw_result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};

exports.searchvod = function(req, res) {

    var clear_response = new response.OK();
    var allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];

    models.vod.findAll({
        attributes: ['id', 'title'],
        include: [
            {model: models.vod_stream, required: true, attributes: ['url', 'encryption']},
            {model: models.vod_category, required: true, attributes: [], where:{password:{in: allowed_content}, isavailable: true}}
        ],
        where: {pin_protected:{in: allowed_content}, isavailable: true, title: {like: '%'+req.body.search_string+'%'}}
    }).then(function (result) {
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        raw_obj.id = String(obj.id);
                        raw_obj.title = obj.title;
                    });
                }
            });
            raw_result.push(raw_obj);
        });
        clear_response.response_object = raw_result;
        res.send(clear_response);
    }).catch(function(error) {
        console.log(error);
        res.send(response.DATABASE_ERROR);
    });

};