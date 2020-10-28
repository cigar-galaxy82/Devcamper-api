const Errorrespose = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const User = require('../models/user')
const ErrorResponse = require('../utils/errorResponse')
const  sendEmail  = require('../utils/sendEmail')
const crypto = require('crypto')
const colors = require('colors')
//@desc    Register user
//@route   POST /api/v1/register
//@access  Public 
exports.register = asyncHandler(async(req,res,next) => {
    const { name,email,password,role } = req.body

    //Create user
    const user = await User.create({
        name,
        email,
        role,
        password
    })

    sendTokenResponse(user,200, res)

    res.status(200).json({success:true, token})
})

//@desc    Login user
//@route   POST /api/v1/login
//@access  Public 
exports.login = asyncHandler(async(req,res,next) => {
    const {email,password} = req.body

    //Validate email and password
    if(!email || !password){
        return next(new Errorrespose('Please provide an email and password', 400))
    }

    //Check for user
    const user = await User.findOne({email}).select('+password')
    console.log(user)
    if(!user){
        return next(new Errorrespose('Invalid Credentials', 401))
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password)

    if(!isMatch){
        return next(new Errorrespose('Invalid Credentials', 401))
    }

    sendTokenResponse(user,200, res)
})

//@desc    log user out / clear cookie
//@route   GET /api/v1/auth/logout
//@access  Private
exports.logout = asyncHandler(async(req,res,next) => {

    res.cookie('token', 'none', {
        expires:new Date(Date.now() + 10 * 1000),
        httpOnly:true
    })

    res.status(200).json({
        success: true,
        data:{}
    })
})


//@desc     Get current logged user
//@route   POST /api/v1/auth/me
//@access  Private
exports.getMe = asyncHandler(async(req,res,next) => {
     
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        data:user
    })
})

//@desc    Update user details
//@route   PUT /api/v1/auth/updatedetails
//@access  Private
exports.updateDetails = asyncHandler(async(req,res,next) => {

    const fieldsToUpdate = {
        name: req.body.name,
        email:req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new : true,
        runValidators:true
    })

    res.status(200).json({
        success: true,
        data:user
    })
})

//@desc    Update password 
//@route   POST /api/v1/auth/me
//@access  Private
exports.updatePassword = asyncHandler(async(req,res,next) => {
    const user = await User.findById(req.user.id).select('+password')

    //Check current password
    if(!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse('Password is incorrect', 401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user,200,res)
})

//@desc    Forgot password
//@route   POST /api/v1/auth/forgotpassword
//@access  Public
exports.forgotPassword = asyncHandler(async(req,res,next) => {
    const user = await User.findOne({email:req.body.email})

    if(!user){
        return next(new ErrorResponse('There is no user with that email', 404))
    }

    //Get reset token
    const resetToken = user.getResetPasswordToken()
    //console.log(resetToken)
    await user.save({ validateBeforeSave: false })

    //Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`

    const message = `You are receiving this email because you (or someone else) has
    requested the reset of a password.Please make a PUT request to: \n\n ${resetUrl}`
    console.log(user)
    try{
        await sendEmail({
            email:user.email,
            subject:'Password reset token',
            message
        })

        res.status(200).json({
            success:true, data:'Email Send'
        })
    }catch(err){
        console.log(err)
        user.resetPasswordToken = undefined,
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave:false })

        return next(new ErrorResponse('Email could not be send',500))
    }

    res.status(200).json({
        success: true,
        data:user
    })
})

//@desc    Reset password
//@route   PUT /api/v1/auth/resetpassword/:resettoken
//@access  Public
exports.resetPassword = asyncHandler(async(req,res,next) => {
    //Get hashed token
    //const resetToken = req.params.resetToken.toString('hex')
    //console.log(req.params.resetToken.blue)
    const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')
    
    //console.log("! " + resetPasswordToken)

    //resetPasswordToken:String,
    //resetPasswordExpire:Date,

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{ $gt:Date.now() }
    })
    console.log("!" + user)
    if(!user){
        return next(new ErrorResponse('Invalid token', 400))
    }

    //Set new Password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user,200, res)
})


//Get token from model,create cookie and send response
const sendTokenResponse = (user,statusCode, res) => {
    //Create token
    const token = user.getSignedjwtToken()

    const options = {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly:true
    }   

    if(process.env.NODE_ENC === 'production'){
        options.secure = true
    }

    res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
        success:true,
        token
    })
}