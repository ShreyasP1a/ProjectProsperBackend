const env =require('dotenv').config({ path: '../.env' })
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const db = require('./db')
const userRouter = require('./routes/user-router')
const cookieParser = require('cookie-parser')




const app = express()
const apiPort = 3001
app.use(cookieParser(process.env.COOKIE_SECRET));


app.use(bodyParser.urlencoded({ extended: true, limit:'50mb' }))
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
  app.use(bodyParser.json({limit: '50mb', extended: true}))


db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.use('/api', userRouter)

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))
