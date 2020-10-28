const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    title:{
        type:String,
        trim:true,
        required:[true, 'Please add a title for the review'],
        maxlength:100
    },
    text:{
        type:String,
        required:[true, 'Please add some text']
    },
    rating:{
        type:Number,
        min:1,
        max:10,
        required:[true, 'Please add a rating bewtween 1 and 10']
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    bootcamp:{
        type:mongoose.Schema.ObjectId,
        ref:'Bootcamp',
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    }
})

// Static method to get avg of rating
ReviewSchema.statics.getAverageRating = async function(bootcampId){
    console.log('Calculating avg cost...'.blue)

    const obj = await this.aggregate([
        {
            $match:{ bootcamp: bootcampId }
        },
        {
            $group:{
                _id:'$bootcamp',
                averageRating: { $avg:'$rating' }
            }
        }
    ])

    //console.log(obj)

    try{
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageRating:obj[0].averageRating
        })
    }catch(err){
        console.error(err)
    }
}

// Call getAverageRating after save
ReviewSchema.post('save', function(){
    this.constructor.getAverageRating(this.bootcamp)
})

// Call getAveragerating before remove
ReviewSchema.pre('remove', function(){
    this.constructor.getAverageRating(this.bootcamp)
    
})

//Prevent user from submitting more than one review per bootcamp
ReviewSchema.index({bootcamp:1, user:1}, {unique:true})
module.exports = mongoose.model('Review', ReviewSchema)