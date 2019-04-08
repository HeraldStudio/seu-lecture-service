const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db').queryPool
const sql = require('mssql')
const moment = require('moment')
const uuid = require('node-uuid')
const svgCaptcha = require('svg-captcha');
const secret = require('./secret.json')

const app = express()
const lectureMap = {}
const captchaPool = {}
app.use(bodyParser.json())


// TODO: 和讲座信息匹配

app.post('/query', async (req, res) => {
    
    let {cardnum, name, token, captcha, service, accessKey} = req.body
    let origin = 'lecture.myseu.cn - 网页查询'

    if(token){
        if(!captchaPool[token]){
            res.send({err:'验证码过期'})
            return
        }
        if(captchaPool[token] && captchaPool[token].toUpperCase() !== captcha.toUpperCase()){
            res.send({err:'验证码错误'})
            return
        }
        captchaPool[token] = undefined
    } else {
        if(service && accessKey && secret.challenges[service] &&secret.challenges[service].accessKey === accessKey){
            origin = `通过 - ${service} - 查询`
        } else {
            res.send({err:'授权不正确'})
            return
        }
    }
    let conn = await db.connect()
    console.log (`[+] ${moment().format('YYYY-MM-DD HH:mm:ss')} ${origin} ${cardnum} - ${name} `)
    let ps = new sql.PreparedStatement(conn)
    try{
        ps.input('cardnum', sql.VarChar(9))
        ps.input('name', sql.NVarChar(50))
        await ps.prepare("SELECT cardnum, name, location, dateStr, timestamp FROM CardRecord WHERE cardnum=@cardnum AND name=@name GROUP BY cardnum, name, location, dateStr, timestamp ORDER BY timestamp")
        let rawResult = (await ps.execute({cardnum, name})).recordset
        let result1 = []
        // result1 中是按照10分钟去重的记录
        rawResult.forEach( r => {
            if(result1.length === 0){
                result1.push(r)
            } else {
                if(r.timestamp - result1[result1.length - 1].timestamp > 10 * 60 * 100) {
                    result1.push(r)
                }
            }
        })
        let result2 = {}
        result1.forEach ( r => {
            if(!result2[r.dateStr]) {
                result2[r.dateStr] = {}
            }
            if(!result2[r.dateStr][r.location]){
                result2[r.dateStr][r.location] = []
            }
            if(lectureMap[r.dateStr] && lectureMap[r.dateStr][r.location]) {
                // 如果存在当日当地讲座具体记录
                if(result2[r.dateStr][r.location].length < lectureMap[r.dateStr]
                [r.location].length){
                    // 并且当日当地的讲座记录多于当前查询人当日当地的打卡记录
                    let index = result2[r.dateStr][r.location].length
                    let history = lectureMap[r.dateStr][r.location][index]
                    r.lectureTitle = history.name
                    r.lectureUrl = history.url
                    result2[r.dateStr][r.location].push(r)
                }
            } else {
                // 没有当日记录则只记录一次有效记录
                if(result2[r.dateStr][r.location].length === 0){
                    result2[r.dateStr][r.location].push(r)
                }
            }
        })
        // 收集所有有效记录
        let result = []
        Object.keys(result2).forEach( dateStr => {
            Object.keys(result2[dateStr]).forEach( location => {
                result = result.concat(result2[dateStr][location])
            })
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

app.get('/captcha', async(req, res) => {
    let captcha = svgCaptcha.create();
    let token = uuid.v4()
    captchaPool[token] = captcha.text;
    res.send({token, captcha:captcha.data});
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
            lectureMap[k.dateStr][k.location] = []
        }
        lectureMap[k.dateStr][k.location].push(k)
    })
    app.listen(3000, ()=>{console.log('[+]服务已启动')})
})();
