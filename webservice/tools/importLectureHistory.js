const program = require('commander');
const fs = require('fs')
const iconv = require('iconv-lite');
const moment = require('moment')
const axios = require('axios')
const db = (require('../db')).importPool
const sql = require('mssql')
const xlsx = require('node-xlsx').default

program
    .version('1.0.0')
    .option('-i --input <input>', '输入文件')
    .parse(process.argv);

let result = xlsx.parse(fs.readFileSync(program.input))[0].data

console.log(`文件包含${result.length}条记录`);

(async () => {
        let conn = await db.connect()
        let ps = new sql.PreparedStatement(conn)
        try {
            //await ps.prepare("INSERT INTO LectureHistory (name, dateStr, timestamp) VALUES ('曹东江的自我修养','2019-04-05',0)")

            ps.input('name', sql.NVarChar)
            ps.input('location', sql.NVarChar(50))
            ps.input('dateStr', sql.NVarChar(50))
            ps.input('url', sql.NVarChar(50))

            await ps.prepare("INSERT INTO LectureHistory (name, dateStr, location, url) VALUES (@name, @dateStr, @location, @url)")
            let counter = 1
            for (let r of result) {
                if(r.length === 3 || r.length ===4){
                    process.stdout.write(` 共 ${result.length} 条记录 - 正在导入第 ${counter} 条记录 \r`)
                    counter++
                    await ps.execute({name:r[0], dateStr:r[1], location:r[2], url:(r.length === 4 ? r[3]:null)})
                } else {
                    console.log(r)
                }
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






