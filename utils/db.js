import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./user_data/database.db')

db.serialize(() => {
	db.run(`
    CREATE TABLE IF NOT EXISTS wallets (
      wallet TEXT,
      checker TEXT,
      data TEXT,
      PRIMARY KEY (wallet, checker)
    )
  `)
})

export async function getWalletFromDB(wallet, checker) {
	return new Promise((resolve, reject) => {
		db.get(`SELECT data FROM wallets WHERE wallet = ? AND checker = ?`, [wallet, checker], (err, row) => {
			if (err) {
				return reject(err)
			}
			resolve(row ? row.data : null)
		})
	})
}

export async function saveWalletToDB(wallet, checker, data) {
	db.run(`INSERT OR REPLACE INTO wallets (wallet, checker, data) VALUES (?, ?, ?)`, [wallet, checker, data], function (err) {
		if (err) {
			return console.log(err.message)
		}
	})
}

export async function getCountByChecker(checker) {
	return new Promise((resolve, reject) => {
		const query = `SELECT COUNT(*) AS count FROM wallets WHERE checker = ?`

		db.get(query, [checker], (err, row) => {
			if (err) {
				return reject(err)
			}
			resolve(row.count)
		})
	})
}

export async function cleanByChecker(checker) {
	return new Promise((resolve, reject) => {
		const query = `DELETE FROM wallets WHERE checker = ?`

		db.run(query, [checker], function (err) {
			if (err) {
				return reject(err)
			}
			resolve(this.changes)
		})
	})
}