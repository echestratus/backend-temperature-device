const pg = require('pg');
const { Pool } = pg
require('dotenv').config();

const caCert = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
 
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  // ssl: {
  //   rejectUnauthorized: true, // Enable full verification
  //   ca: caCert
  // }
});

module.exports = {
    pool
}

