const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db').queryPool
const sql = require('mssql')

const app = express()

app.use(bodyParser.json())

// TODO: 和讲座信息匹配

app.post('/', async (req, res) => {
    let conn = await db.connect()
    let {cardnum, name} = req.body
    let ps = new sql.PreparedStatement(conn)
    try{
        ps.input('cardnum', sql.VarChar(9))
        ps.input('name', sql.NVarChar(50))
        await ps.prepare("SELECT cardnum, name, location, dateStr, timestamp FROM CardRecord WHERE cardnum=@cardnum AND name=@name GROUP BY cardnum, name, location, dateStr, timestamp")
        let rawResult = (await ps.execute({cardnum, name})).recordset
        res.send(rawResult.recordset)
    } catch(e) {
        console.log(e)
    } finally {
        ps.unprepare()
        conn.close()
    }
})

app.listen(3000, ()=>{console.log('服务已启动')})