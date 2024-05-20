const fs = require('fs')
const sqlite3 = require('sqlite3')

const existsDb = fs.existsSync('data/users.db')
const db = new sqlite3.Database('data/users.db')
if(!existsDb) {
  db.run(`CREATE TABLE users (
    name varchar(255),
    zipcode varchar(25),
    recent_date  datetime,
    job_descriptor varchar(100),
    prefix_name varchar(10)
  );`)
}

//SQLITE
const insertOne = (tableName, fields, data) => {
  const query = `INSERT INTO ${tableName} (${fields.join(',')})
    VALUES (${fields.map(name => `$${name}`).join(',')});
  `
  return new Promise((resolve, reject) => db.run(query, data, (err, result) => {
      if(err) return reject(err)
      console.log(`Inserted: ${Object.values(data)[0]}`)
      resolve()
    }))
}
module.exports = {
  insertOne
}