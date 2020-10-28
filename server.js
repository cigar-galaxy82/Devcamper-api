const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const morgon = require('morgan')
const colors = require('colors')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')


//load env vars
dotenv.config({path:'./config/config.env'})


//Routes files
const bootcamp = require('./routes/bootcamp')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')



//Connect to database
connectDB()

const app = express()

//Body Parser
app.use(express.json())

//Cookie Parser
app.use(cookieParser())

const logger = (req,res,next) => {
    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`)
    next()
}

//Dev logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgon('dev'))
}

//File uploading 
app.use(fileUpload())

//Sanitize data
app.use(mongoSanitize())

//Set Security headers
app.use(helmet())

//Prevent XSS Attacks   
app.use(xss())

//Rate Limitting
const limiter = rateLimit({
    windowMs:10*60*1000,//10 mins
    max:100
})

app.use(limiter)

// Prevent http param pollution
app.use(hpp())

//Enable CORS
app.use(cors())

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

app.use(logger)

//Mount routers
app.use('/api/v1/bootcamps', bootcamp)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)




app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server =  app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold))

//Handle unhancled rejections promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    //Close server & exit process
    server.close(() => process.exit(1))
})