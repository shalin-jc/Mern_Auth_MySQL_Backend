import mysql from 'mysql2/promise'

const mySqlPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SHalin__279',
    database: 'authapp_db'
})

export default mySqlPool;