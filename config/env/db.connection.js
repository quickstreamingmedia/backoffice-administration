
module.exports = {
  name: process.env.DB_NAME || "DB_NAME",
  host: process.env.DB_HOST || "DB_HOST",
  port: process.env.DB_PORT || 3306, // replace with your database port, 3306 is for mysql, 5432 for postgres
  username: process.env.DB_USERNAME || "DB_USERNAME",
  password: process.env.DB_PASSWORD || "DB_PASSWORD",
  dialect: process.env.DB_DIALECT || 'DB_DIALECT', //mysql, postgres, sqlite3,...
  storage: "./db.development.sqlite",
  enableSequelizeLog: process.env.DB_LOG || true,
  ssl: process.env.DB_SSL || false,
  sync: process.env.DB_SYNC || true //Synchronizing any model changes with database
}
