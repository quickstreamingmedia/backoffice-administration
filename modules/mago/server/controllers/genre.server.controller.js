'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')),
    DBModel = db.models.genre,
    refresh = require(path.resolve('./modules/mago/server/controllers/common.controller.js'));

/**
 * Create
 */
exports.create = function(req, res) {

    DBModel.create(req.body).then(function(result) {
        if (!result) {
            return res.status(400).send({message: 'fail create data'});
        } else {
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
  res.json(req.genre);
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.genre;

    updateData.updateAttributes(req.body).then(function(result) {
        return res.jsonp(result);
    }).catch(function(err) {
        res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
        return null;
    });
};

/**
 * Delete
 */
exports.delete = function(req, res) {
    var deleteData = req.genre;

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

        return null;

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

  var qwhere = {},
      final_where = {},
      query = req.query;

  if(query.q) {
    qwhere.$or = {};
    qwhere.$or.description = {};
    qwhere.$or.description.$like = '%'+query.q+'%';
  }



  //start building where
  final_where.where = qwhere;
  if(parseInt(query._start)) final_where.offset = parseInt(query._start);
  if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
  if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;

  final_where.include = [{model:db.models.channels,  required: true}]; 


  DBModel.findAndCountAll({
    attributes:['id','description'],
    include:[{
                model:db.models.channels, required:false,
                attributes:[[db.sequelize.fn('count',db.sequelize.col('channels.id')),'total']],
                nested: true
    }],
    group:['genre.id','genre.description']

  }).then(function(results) {
    if (!results) {
      res.status(404).send({
        message: 'No data found'
      });
      return null;
    } else {

      res.setHeader("X-Total-Count", results.count);      
      return res.json(results.rows);
    }
  }).catch(function(err) {
      return res.jsonp(err);
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
      res.status(404).send({
        message: 'No data with that identifier has been found'
      });
    } else {
      req.genre = result;
      next();
      return null;
    }
  }).catch(function(err) {
      next(err);
      return null;
  });

};
