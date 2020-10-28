const Errorrespose = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Course = require('../models/Course');
const Bootcamps = require('../models/Bootcamps');

//@desc    Get All Courses
//@route   GET /api/v1/courses
//@route   GET /api/v1/bootcamps/:bootcampId/courses
//@access  Public
exports.getCourses = asyncHandler(async (req,res,next) => {
    // let query;

    if(req.params.bootcampId){
       const courses = await Course.find({bootcamp: req.params.bootcampId})
    
        return res.status(200).json({
            success:true,
            count:courses.length,
            data:courses
        })
    }else{
        res.status(200).json(res.advancedResults)
    }

    // const courses = await query

    //res.status(200).json()
})

//@desc    Get a single course
//@route   GET /api/v1/courses/:id
//@access  Public
exports.getCourse = asyncHandler(async (req,res,next) => {
    const course = await  Course.findById(req.params.id).populate({
        path:'bootcamp',
        select:'name description'
    })

    if(!course){
        return next(new Errorrespose(`No course with the id of ${req.params.id}`), 404)
    }

    res.status(200).json({
        success:true,
        //count: courses.length,
        data: course
    })
})

//@desc    Add a course
//@route   POST /api/v1/bootcamps/:bootcampId/courses
//@access  Private
exports.addCourse = asyncHandler(async (req,res,next) => {
    req.body.bootcamp = req.params.bootcampId//bootcampId is the id of ther bootcamp we are addding a course
    req.body.user = req.user.id

    const bootcamp = await  Bootcamps.findById(req.params.bootcampId)

    if(!bootcamp){
        return next(new Errorrespose(`No bootcamp with the id of ${req.params.id}`), 404)
    }

    //Make sure user id bootcamp owner
    //console.log(req)//this comes form the middleware
    if(bootcamp.user.toString() !== req.user.id && req.user.role!=="admin"){
        return next(new Errorrespose(`User ${req.user.id} is not authorize to add a course to bootcamp
        ${bootcamp._id} `, 401))
    }

    const course = await Course.create(req.body)
 
    res.status(200).json({
        success:true,
        //count: courses.length,
        data: course
    })
})

//@desc    Update course
//@route   PUT /api/v1/courses/:id
//@access  Private
exports.updateCourse = asyncHandler(async (req,res,next) => {
    
    let course = await  Course.findById(req.params.id)

    //req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id

    const bootcamp = await Bootcamps.findById(req.user.id)

    if(!course){
        return next(new Errorrespose(`No course with the id of ${req.params.id}`), 404)
    }

        //Make sure user course owner owner
    //console.log(req)//this comes form the middleware
    if(course.user.toString() !== req.user.id && req.user.role!=="admin"){
        return next(new Errorrespose(`User ${req.user.id} is not authorize to update a course to bootcamp ${course._id} `, 401))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    })
 
    res.status(200).json({
        success:true,
        //count: courses.length,
        data: course
    })
})

//@desc    Delete course
//@route   DELETE /api/v1/courses/:id
//@access  Private
exports.deleteCourse = asyncHandler(async (req,res,next) => {
    
    let course = await  Course.findById(req.params.id)

    if(!course){
        return next(new Errorrespose(`No course with the id of ${req.params.id}`), 404)
    }

    //Make sure user course owner owner
    //console.log(req)//this comes form the middleware
    if(course.user.toString() !== req.user.id && req.user.role!=="admin"){
        return next(new Errorrespose(`User ${req.user.id} is not authorize to delete a course to bootcamp ${course._id} `, 401))
    }

     await course.remove() 
 
    res.status(200).json({
        success:true,
        data: {}
    })
})
