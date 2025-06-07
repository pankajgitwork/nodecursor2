// models/AdminModel.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AdminModel = sequelize.define('admins', {
  // id: auto‐added INT PK
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'admins',
  timestamps: true
});

export default AdminModel;
