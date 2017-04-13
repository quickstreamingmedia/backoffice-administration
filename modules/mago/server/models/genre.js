"use strict";

module.exports = function(sequelize, DataTypes) {
    var Genre = sequelize.define('genre', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        description: {
            type: DataTypes.STRING(45),
            allowNull: false
        }
    }, {
        tableName: 'genre',
        associate: function(models) {
            if (models.channels){
                Genre.hasMany(models.channels, {foreignKey: 'genre_id'});
            }
        }
    });
    return Genre;
};
