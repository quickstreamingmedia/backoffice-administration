"use strict";

module.exports = function(sequelize, DataTypes) {
    var comboPackages = sequelize.define('combo_packages', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        package_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        combo_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        }
    }, {
        tableName: 'combo_packages',
        associate: function(models) {
            comboPackages.belongsTo(models.package, {foreignKey: 'package_id'});
            comboPackages.belongsTo(models.combo, {foreignKey: 'combo_id'});
        }
    });
    return comboPackages;
};
