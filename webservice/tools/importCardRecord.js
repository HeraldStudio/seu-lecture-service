const program = require('commander');
const fs = require('fs')
const iconv = require('iconv-lite');
const moment = require('moment')
const axios = require('axios')
const db = (require('../db')).importPool
const sql = require('mssql')
program
    .version('1.0.0')
    .option('-i --input <input>', '输入文件')
    .parse(process.argv);

let rawInput = fs.readFileSync(program.input)
rawInput = iconv.decode(rawInput, 'GB2312').toString();

let result = rawInput.split(/<\/tr><tr>/)
result = result.slice(1)

let record = []

result.forEach(line => {
    let match = /<td>([0-9]+)<\/td><td class="text">([0-9]{9})\s+<\/td><td>(.+)\s+<\/td><td>(男|女|未知)<\/td><td>(.*?)<\/td><td>(.+?)<\/td><td>(.+?)<\/td>/g.exec(line)
    if (match) {
        let data = {
            innerCode: match[1],
            cardnum: match[2],
            name: match[3].trim(),
            sex: match[4],
            location: match[5].trim(),
            action: match[6],
            timestamp: +moment(match[7], 'YYYY-MM-DD HH:mm:ss')
        }
        record.push(data)
    } else {
        console.log(line)
    }
})

console.log(`文件包含${result.length}条记录，匹配${result.length}条记录`);

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

fs.rename(program.input, program.input+'.imported', ()=>{console.log('文件已重命名')})






