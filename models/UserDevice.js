// models/UserDevice.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import UserModel from './UserModel.js';

const UserDevice = sequelize.define('UserDevice', {
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    device_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'user_devices',
    timestamps: true,
});

UserModel.hasMany(UserDevice, { foreignKey: 'user_id', as: 'devices' });
UserDevice.belongsTo(UserModel, { foreignKey: 'user_id' });

export default UserDevice;
