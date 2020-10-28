const path = require('path')
const Errorrespose = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Bootcamp = require('../models/Bootcamps')
const geocoder = require('../utils/geocoder')
const user = require('../models/user')


//@desc    Get All bootcamsps
//@route   GET /api/v1/bootcamps
//@access  Public 
exports.getBootcamps = asyncHandler(async(req,res,next) => {
    
        res.status(200).json(res.advancedResults)
})


//@desc    Get single bootcamsps
//@route   GET /api/v1/bootcamps/:id
//@access  Public
exports.getBootcamp = asyncHandler(async(req,res,next) => {
    
        const bootcamp = await Bootcamp.findById(req.params.id)

        if(!bootcamp){
           return next(new Errorrespose(`Bootcamp not found with id of ${req.params.id}`, 404))
        }

        res.status(200).json({
            success:true,
            data:bootcamp
        })
})


//@desc    Create new bootcamsps
//@route   POST /api/v1/bootcamps
//@access  Private
exports.createBootcamp = asyncHandler(async(req,res,next) => {
    //Add user to req.body
    req.body.user = req.user.id

    //Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({user:req.user.id})

    //If user is not an admin, they can only add one bootcamp
    if(publishedBootcamp && req.user.role !== 'admin'){
        return next(new Errorrespose(`Ths user with ID ${req.user.id} has already published a bootcamp `, 400))
    }

        const bootcamp = await Bootcamp.create(req.body)

        res.status(201).json({
            success:true,
            data:bootcamp
        })
})

//@desc    Update bootcamsps
//@route   PUT /api/v1/bootcamps/:id
//@access  Private
exports.updateBootcamp = asyncHandler(async(req,res,next) => {
        let bootcamp = await Bootcamp.findById(req.params.id)
     
        if(!bootcamp) {
            return next(new Errorrespose(`Bootcamp not found with id of ${req.params.id}`, 404))
        }

        //Make sure user id bootcamp owner
        //console.log(req)//this comes form the middleware
        if(bootcamp.user.toString() !== req.user.id && req.user.role!=="admin"){
            return next(new Errorrespose(`User ${req.params.id} is not authorize to update this bootcamp`, 404))
        }

        bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body,{
            new:true,
            runValidators:true
        })
     
        res.status(200).json({
            success:true,
            data:bootcamp
        })
})


//@desc    Delete bootcamsps
//@route   POST /api/v1/bootcamps/:id
//@access  Private
exports.deleteBootcamp = asyncHandler(async(req,res,next) => {
        const bootcamp = await Bootcamp.findById(req.params.id)
     
        if(!bootcamp) {
            console.log('oudsfiugbdsiub')
            return next(new Errorrespose(`Bootcamp not found with id of ${req.params.id}`, 404))
        }

        //Make sure user id bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role!=="admin"){
            return next(new Errorrespose(`User ${req.params.id} is not authorize to delete this bootcamp`, 404))
        }
     
        res.status(200).json({
            success:true,
            data:{}
        })
        bootcamp.remove()

})


//@desc    Get Bootcamps wintin a radius
//@route   POST /api/v1/bootcamps/radius/:zipcode/:distance
//@access  Private
exports.getBootcampsInRadius = asyncHandler(async(req,res,next) => {
    const { zipcode, distance } = req.params

    //Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude

    //Calc radius using radius
    //Divide dist by radius of Earth
    //Earth radius = 3,963 mi / 6378 km
    const radius = distance / 3963//to convert entered number in 

    const bootcamps = await Bootcamp.find({
        location: {$geoWithin: { $centerSphere: [ [ lng, lat], radius] }}//this is provided by mongoDB to search according to the distance
    })

    res.status(200).json({
        success:true,
        count:bootcamps.length,
        data:bootcamps
    })
})

//@desc    Upload Photos for bootcamsps
//@route   POST /api/v1/bootcamps/:id/photo
//@access  Private
exports.bootcampPhotoUpload = asyncHandler(async(req,res,next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
 
    if(!bootcamp) {
        return next(new Errorrespose(`Bootcamp not found with id of ${req.params.id}`, 404))
    }

    //Make sure user id bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role!=="admin"){
    return next(new Errorrespose(`User ${req.params.id} is not authorize to delete this bootcamp`, 404))
    }

    if(!req.files){
        return next(new Errorrespose('Please upload a file', 400))
    }

    console.log(req.files)

    const file = req.files.file

    //Make sure the image is a photo
    if(!file.mimetype.startsWith('image')){
        return next(new Errorrespose('Please upload an image file', 400))
    }

    // Check filesize
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new Errorrespose(`Please upload an image less than 
        ${process.env.MAX_FILE_UPLOAD}`, 400))
    }

    //Create custom filename
    file.name = `photo_${bootcamp.id}${path.parse(file.name).ext}`

    console.log(`${process.env.FILE_UPLOAD_PATH}/${file.name}`)

    //This is used to save the photo to the folder we have created 
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err =>{
        if(err){
            return next(new Errorrespose(`Problem with file upload`,500))
        }
    })

    await Bootcamp.findByIdAndUpdate(req.params.id,{photo:file.name})

    res.status(200).json({
        success:true,
        data:file.name
    })

    //console.log(file.name)
})
