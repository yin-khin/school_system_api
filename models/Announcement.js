const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  photo: {
    // TEXT (not STRING) so it can hold a base64 data URI. Storing image bytes
    // in Postgres keeps announcement photos persistent on Render instead of the
    // ephemeral local "uploads" disk which is wiped on restart/redeploy.
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('general', 'exam', 'holiday', 'event', 'notice', 'urgent'),
    defaultValue: 'general'
  },
  audience: {
    type: DataTypes.ENUM('all', 'students', 'teachers', 'parents', 'staff'),
    defaultValue: 'all'
  },
  published_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  published_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'published'
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
  tableName: 'announcements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Announcement;