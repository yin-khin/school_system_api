const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SiteSetting = sequelize.define(
  "SiteSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    school_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    motto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    intro: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    years_of_excellence: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hero_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "site_settings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = SiteSetting;
