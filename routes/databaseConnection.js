const mysql = require('mysql');

// localhost database ----------- 
function getConnection() {
    return mysql.createPool({
        connectionLimit: 10,
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'databasename',
        multipleStatements: true
		
    });
}

module.exports = getConnection();