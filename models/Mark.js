const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mark = sequelize.define('Mark', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  exam_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  marks_obtained: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  total_marks: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  grade: {
    type: DataTypes.STRING
  },
  remark: {
    type: DataTypes.STRING
  },
  entered_by: {
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
  tableName: 'marks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['exam_id', 'student_id', 'subject_id']
    }
  ]
});

module.exports = Mark;