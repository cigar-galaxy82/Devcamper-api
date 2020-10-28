const express = require('express')
const { 
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload } = require('../controllers/bootcamps')
const router = express.Router()

const { protect,authorize } = require('../middleware/auth')

const Bootcamp = require('../models/Bootcamps')

const advancedResults = require('../middleware/advanceResults')

//Include other resource routers
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')


//Re-route into other resourse routers
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)


router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)

router.route('/:id/photo').put(protect,authorize('publisher', 'admin'),bootcampPhotoUpload)

router
.route('/')
.get(advancedResults(Bootcamp, 'courses'),getBootcamps)
.post(protect,authorize('publisher', 'admin'),createBootcamp)
router.route('/:id').get(getBootcamp).put(protect,authorize('publisher', 'admin'),updateBootcamp).delete(protect,authorize('publisher', 'admin'),deleteBootcamp)


module.exports = router