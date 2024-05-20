const { createReadStream } = require('fs')
const { Transform, Writable, pipeline } = require('stream')
const connectionDB = require("./connection");

const readableStream = createReadStream('data/users.csv')
const COLUMNS = ['name', 'zipcode', 'recent_date', 'job_descriptor', 'prefix_name']
const insertData = (items, callback) =>
  Promise
    .all(items.map(data => connectionDB.insertOne('users', COLUMNS, data)))
    .then(() => callback(null, items))

const getWriteDatabaseStream = (insertDataPromise) => new Writable({
  objectMode: true,
  write: function (chunk, _, callback) {
    const [__, ...items] = chunk
    insertDataPromise(items, callback)
  }
})
const getTransformDataStream = (formatData) => new Transform({
  objectMode: true,
  transform(chunk, _, callback) {
    this.data += chunk.toString()
    callback()
  },
  flush(callback) {
    this.data = formatData(this.data)
    callback(null, this.data)
  }
})
const formatToDatabase = (data) => data.toString()
  .split('\n')
  .map(item => item
    .split(',')
    .reduce((data, value, index) => {
      const column = COLUMNS[index]
      if(column && !!value) data[`$${column}`] = value
      return data
    }, {})
  )
  .filter(item => !!Object.getOwnPropertyNames(item).length)

const transformDataStream = getTransformDataStream(formatToDatabase)
const writeDatabaseStream = getWriteDatabaseStream(insertData)
transformDataStream
  .on('error', console.log)
  .on('close', () => console.log('Closed transformDataStream'))

writeDatabaseStream
  .on('error', console.log)
  .on('close', () => console.log('Closed writeDatabaseStream'))
readableStream
  .on('error', console.log)
  .once('close', () => console.log('Closed readableStream'))

readableStream
  .pipe(transformDataStream)
  .pipe(writeDatabaseStream)
