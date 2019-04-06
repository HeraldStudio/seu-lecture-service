const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db').queryPool
const sql = require('mssql')
const moment = require('moment')

const app = express()
const lectureMap = {}
app.use(bodyParser.json())

// TODO: 和讲座信息匹配

app.post('/', async (req, res) => {
    let conn = await db.connect()
    let {cardnum, name} = req.body
    console.log (`[+] ${moment().format('YYYY-MM-DD HH:mm:ss')} 查询 ${cardnum} - ${name} `)
    let ps = new sql.PreparedStatement(conn)
    try{
        ps.input('cardnum', sql.VarChar(9))
        ps.input('name', sql.NVarChar(50))
        await ps.prepare("SELECT cardnum, name, location, dateStr FROM CardRecord WHERE cardnum=@cardnum AND name=@name GROUP BY cardnum, name, location, dateStr")
        let rawResult = (await ps.execute({cardnum, name})).recordset
        let result = []
        rawResult.forEach( r => {
            try{
                let lectureHistory = lectureMap[r.dateStr][r.location]
                r.lectureTitle = lectureHistory.name
                r.lectureUrl = lectureHistory.url
                result.push(r)
            } catch(e) {
                result.push(r)
            }
        })
        result.sort((a,b)=>{
            return (+moment(a.dateStr, 'YYYY-MM-DD'))-(+moment(b.dateStr, 'YYYY-MM-DD'))
        })
        res.send({result})
    } catch(e) {
        console.log(e)
    } finally {
        ps.unprepare()
        conn.close()
    }
});

// 启动脚本
(async() => {
    console.log('[+]小猴偷米人文讲座查询API启动中...')
    console.log('[+]正在加载讲座记录...')
    let conn = await db.connect()
    let ps = new sql.PreparedStatement(conn)
    await ps.prepare("SELECT * FROM LectureHistory")
    let result = (await ps.execute()).recordset
    ps.unprepare()
    conn.close()
    console.log(`[+]共加载 ${result.length} 条讲座记录`)
    result.forEach( k => {
        if(!lectureMap[k.dateStr]){
            lectureMap[k.dateStr] = {}
        }
        if(!lectureMap[k.dateStr][k.location]){
            lectureMap[k.dateStr][k.location] = {}
        }
        lectureMap[k.dateStr][k.location] = k
    })
    app.listen(3000, ()=>{console.log('[+]服务已启动')})
})();
