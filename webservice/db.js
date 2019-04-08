const sql = require('mssql')
const secret = require('./secret.json')

let queryPool = new sql.ConnectionPool({
    server:secret.server,
    port:secret.port,
    user:secret.query.username,
    password:secret.query.password,
    database:'LECTURE'
})

let importPool = new sql.ConnectionPool({
    server:secret.server,
    port:secret.port,
    user:secret.import.username,
    password:secret.import.password,
    database:'LECTURE'
});

queryPool.on('error', err => {
    console.log(err)
})

importPool.on('error', err => {
    console.log(err)
})

module.exports = {queryPool, importPool}