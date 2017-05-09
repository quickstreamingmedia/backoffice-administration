
module.exports = {
  name: process.env.DB_NAME || "heroku_f614ee89348daac",
  host: process.env.DB_HOST || "us-cdbr-east.cleardb.com/heroku_db?reconnect=true",
  port: process.env.DB_PORT || 3306, // replace with your database port, 3306 is for mysql, 5432 for postgres
  username: process.env.DB_USERNAME || "bd4713586d4b7a",
  password: process.env.DB_PASSWORD || "ec8d0508",
  dialect: process.env.DB_DIALECT || 'mysql', //mysql, postgres, sqlite3,...
  storage: "./db.development.sqlite",
  enableSequelizeLog: process.env.DB_LOG || true,
  ssl: process.env.DB_SSL || false,
  sync: process.env.DB_SYNC || true //Synchronizing any model changes with database
}
