"use strict";

module.exports = function(sequelize, DataTypes) {
    var programSchedule = sequelize.define('program_schedule', {
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
            program_id: {
                type: DataTypes.INTEGER(11),
                allowNull: false
            }
        }, {
            tableName: 'program_schedule',
            associate: function(models) {
                if(models.login_data){
                    programSchedule.belongsTo(models.login_data, {foreignKey: 'login_id'});
                }
                if(models.epg_data){
                    programSchedule.belongsTo(models.epg_data, {foreignKey: 'program_id'});
                }
            }
        }

    );
    return programSchedule;
};
