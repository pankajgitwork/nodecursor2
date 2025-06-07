// models/UserModel.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserModel = sequelize.define('users', {
  // id: auto‐added INT PK
  name: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password_raw: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,

  }
}, {
  tableName: 'users',
  timestamps: true
});

export default UserModel;
