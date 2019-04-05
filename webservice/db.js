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



(async ()=>{
    let conn = await importPool.connect()
    let ps = new sql.PreparedStatement(conn)
    try{
    //await ps.prepare("INSERT INTO LectureHistory (name, dateStr, timestamp) VALUES ('曹东江的自我修养','2019-04-05',0)")
    await ps.prepare("SELECT * FROM LectureHistory")
    let res = await ps.execute()
    await ps.unprepare()
    console.log(res)
    } catch(e) {
        console.log(e)
    }
    conn.close()
})();



module.exports = {queryPool, importPool}