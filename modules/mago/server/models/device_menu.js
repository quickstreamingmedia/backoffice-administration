"use strict";

module.exports = function(sequelize, DataTypes) {
    var deviceMenu = sequelize.define('device_menu', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        icon_url: {
            type: DataTypes.STRING(250),
            allowNull: false
        },
        appid: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        menu_code: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        position: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        locale: {
            type: DataTypes.STRING(16),
            allowNull: true
        },
        isavailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        tableName: 'device_menu',
        associate: function(models) {
        }
    });
    return deviceMenu;
};
