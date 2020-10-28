const express = require('express')
const { 
    getCourses, 
    getCourse, 
    addCourse,
    updateCourse ,
    deleteCourse} = require('../controllers/courses')
const router = express.Router({mergeParams:true})

const { protect, authorize } = require('../middleware/auth')

const Cource = require('../models/Course')
const advancedResults = require('../middleware/advanceResults')

router.route('/').get(advancedResults(Cource,{
    path:'bootcamp',
    select:'name description'  
}),getCourses).post(protect,authorize('publisher', 'admin'),addCourse)
router.route('/:id').get(getCourse).put(protect,authorize('publisher', 'admin'),updateCourse).delete(protect,authorize('publisher', 'admin'),deleteCourse)
module.exports = router

  