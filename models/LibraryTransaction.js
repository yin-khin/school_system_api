const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LibraryTransaction = sequelize.define('LibraryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  return_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('issued', 'returned', 'overdue', 'lost'),
    defaultValue: 'issued'
  },
  fine_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  issued_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'library_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = LibraryTransaction;