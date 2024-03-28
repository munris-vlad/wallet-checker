import path from "path"
import sqlite3 from "sqlite3"
import moment from "moment"

const syncWalletsToDb = false
const syncCheckDataToDb = true

const lastCheckTimeName = 'last_check_time'
function formatColumnName(columnName) {
    // 将空格替换为下划线
    let formattedName = columnName.replace(/ /g, '_');
    // 将所有字符转换为小写
    formattedName = formattedName.toLowerCase();
    return formattedName;
}

const txDateColumns = ['first_tx', 'last_tx','First tx', 'Last tx','First TX', 'Last TX']
function formatDate(data) {
    txDateColumns.forEach(column => {
        if(data[column] && data[column] !== '-'){
            data[column] = moment.utc(data[column]).format("DD.MM.YY")
        }
    })
    return data
}

export function syncDbWallets(lines, filePath) {
    if(!syncWalletsToDb) return lines;
    // filePath='./addresses/linea.txt'
    const network = path.parse(filePath).name
    let walletsDb = global.walletsDb;
    if(!walletsDb){
        walletsDb = new sqlite3.Database('./db/wallets.db')
        global.walletsDb = walletsDb
    }
    const createTableQuery = `CREATE TABLE IF NOT EXISTS addresses (
                network TEXT,
                address TEXT
            )`
    walletsDb.run(createTableQuery, (err) => {
        if(!err){
            const checkRecordQuery = `SELECT * FROM addresses WHERE network = ?`
            walletsDb.get(checkRecordQuery, [network], (err, row) => {
                if (err) {
                    console.error('Error querying addresses table:', err.message)
                    return;
                }
                if (!row) {
                    // insert all lines into the table
                    lines.forEach(line => {
                        walletsDb.run(`INSERT INTO addresses (network, address) VALUES (?, ?)`, [network, line])
                    });
                }
            })
        }
    })
   return lines;
}


export async function syncDbChecker(network, columns, jsonData) {
    if(!syncCheckDataToDb) return

    let checkDataDb = global.checkDataDb
    if(!global.checkDataDb){
        checkDataDb = new sqlite3.Database('./db/checkData.db')
        global.checkDataDb = checkDataDb
    }
    // format column name
    const columnsOrigin  = [...columns]
    // check lastCheckTime column
    const lastCheckTimeColumnExists = columns.some(column => column.name === lastCheckTimeName)
    if (!lastCheckTimeColumnExists) {
        columnsOrigin.push({ name: lastCheckTimeName})
    }
    columns  = [...columnsOrigin]
    columns = columns.map(column => {
        const formattedName = formatColumnName(column.name)
        return {name: formattedName}
    })

    // check table exists
    const createTableQuery = `CREATE TABLE IF NOT EXISTS "${network}" (${columns.map(column => `"${column.name}" TEXT`).join(', ')})`
    checkDataDb.run(createTableQuery, (err) => {
        if(err){
            console.error('Error creating table:', err)
        }else{
            // check records
            jsonData.forEach(data => {
                const wallet  = data["wallet"]
                if(wallet === "total") return
                data[lastCheckTimeName] = new Date().toISOString();
                formatDate(data)
                const checkRecordQuery = `SELECT * FROM "${network}" WHERE "wallet" = ?`
                checkDataDb.get(checkRecordQuery, [wallet], (err, row) => {
                    if (err) {
                        console.error('Error checking record:', err)
                        return
                    }
                    if (row) {
                        // Record exists, update it
                        const updateRecordQuery = `UPDATE "${network}" SET ${columns.map(column => `"${column.name}" = ?`).join(', ')} WHERE "wallet" = ?`
                        const values = columnsOrigin.map(column => data[column.name])
                        checkDataDb.run(updateRecordQuery, values, err => {
                            if (err) {
                                console.error('Error updating record:', err)
                            }
                        });
                    } else {
                        // Record doesn't exist, insert it
                        const insertRecordQuery = `INSERT INTO "${network}" (${columns.map(column => `"${column.name}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
                        const values = columnsOrigin.map(column => data[column.name])
                        checkDataDb.run(insertRecordQuery, values, err => {
                            if (err) {
                                console.error('Error inserting record:'+values, err)
                            }
                        });
                    }
                });
            });
        }
    });
}
