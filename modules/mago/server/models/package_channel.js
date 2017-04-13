"use strict";

module.exports = function(sequelize, DataTypes) {
    var packagesChannels = sequelize.define('packages_channels', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        channel_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        package_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        }
    }, {
        tableName: 'packages_channels',
        associate: function(models) {
            packagesChannels.belongsTo(models.channels, {foreignKey: 'channel_id'});
            packagesChannels.belongsTo(models.package, {foreignKey: 'package_id'})
        }
    });
    return packagesChannels;
};
