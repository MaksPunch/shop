const mysql = require('mysql2')
const connection = mysql.createPool({
  host: '192.168.25.23',
  port: '3306',
  user: 'Tarasov',
  password: '12345',
  database: 'Tarasov',
  multipleStatements: true
})

module.exports = connection; 