const { Sequelize } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from the correct location
dotenv.config({ path: path.join(__dirname, "../.env") });

const requiredDatabaseConfig = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"];
const missingDatabaseConfig = requiredDatabaseConfig.filter(
  (key) => !process.env[key],
);
if (missingDatabaseConfig.length > 0) {
  throw new Error(
    `Missing database configuration: ${missingDatabaseConfig.join(", ")}`,
  );
}

const sslConfig =
  process.env.DB_SSL === "true"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions: sslConfig,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = { sequelize };
