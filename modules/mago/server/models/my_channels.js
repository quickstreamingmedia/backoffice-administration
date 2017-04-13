"use strict";

module.exports = function(sequelize, DataTypes) {
    var my_channels = sequelize.define('my_channels', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        login_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        channel_number: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(32),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        icon_url: {
            type: DataTypes.INTEGER(255),
            allowNull: false
        },
        stream_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        isavailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        tableName: 'my_channels',
            associate: function(models) {
        }

    });
    return my_channels;
};
