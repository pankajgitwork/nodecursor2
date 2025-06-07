// models/LinkModel.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import UserModel from './UserModel.js';

const LinkModel=sequelize.define('links', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: UserModel,
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiry_from: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiry_to: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'links',
  timestamps: true
});

// 1:1 association
UserModel.hasOne(LinkModel, {
  foreignKey: 'user_id',
  as: 'link',
  onDelete: 'CASCADE'
});
LinkModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
  as: 'user'
});

export default LinkModel;
