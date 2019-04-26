const program = require('commander');
const fs = require('fs')
const iconv = require('iconv-lite');
const moment = require('moment')
const axios = require('axios')
const db = (require('../db')).importPool
const sql = require('mssql')
const cheerio = require('cheerio')
program
    .version('1.0.0')
    .option('-i --input <input>', '输入文件')
    .parse(process.argv);

let rawInput = fs.readFileSync(program.input)
rawInput = iconv.decode(rawInput, 'GB2312').toString();

$ = cheerio.load(rawInput)
let record = []
$('tr').each((rIndex, r) => {
    if(rIndex === 0) {
        // 跳过表头
        return
    }
    let row = []
    $(r).children('td').each((cIndex, c)=>{
        row.push($(c).text().trim())
    })
    let data = {
        innerCode: row[0],
        cardnum: row[1],
        name: row[2],
        sex: row[3],
        location: row[4],
        action: row[5],
        timestamp: +moment(row[6], 'YYYY-MM-DD HH:mm:ss')
    }
    record.push(data)
})

console.log(`文件包含${record.length}条记录`);

record = record.slice(0, record.length - 2);

(async () => {
        let conn = await db.connect()
        let ps = new sql.PreparedStatement(conn)
        try {
            //await ps.prepare("INSERT INTO LectureHistory (name, dateStr, timestamp) VALUES ('曹东江的自我修养','2019-04-05',0)")

            ps.input('cardnum', sql.VarChar(9))
            ps.input('location', sql.NVarChar(50))
            ps.input('name', sql.NVarChar(50))
            ps.input('dateStr', sql.NVarChar(50))
            ps.input('timestamp', sql.Numeric)

            await ps.prepare("INSERT INTO CardRecord (cardnum, location, name, dateStr, timestamp) VALUES (@cardnum, @location, @name, @dateStr, @timestamp)")
            let counter = 1
            for (let r of record) {
                process.stdout.write(` 共 ${record.length} 条记录 - 正在导入第 ${counter} 条记录 \r`)
                counter++
                await ps.execute({cardnum:r.cardnum, location:r.location, name:r.name, dateStr:moment(r.timestamp).format('YYYY-MM-DD'), timestamp:r.timestamp})
            }
            console.log('\n导入完成')
            await ps.unprepare()
        } catch (e) {
            console.log(e)
        } finally {
            conn.close()
        }
        
    })();

fs.rename(program.input, program.input+'.imported', ()=>{})






