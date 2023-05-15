const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        maxLength:[30,"Cannot exceed 30 characters"],
        minLength:[4,"Cannot be less than 4 characters"]
    },
    email:{
        type:String,
        unique:[true,"Account with entered email already exists. Please login!"],
        validate:[validator.isEmail, "Please enter a valid Email"]
    },
    password:{
        type:String,
        minLength:[8,"Password should be atleast 8 characters"],
        select:false,
    },
    role:{
        type:String,
        default:"user", 
    },
    isVerified:{
        type:String,
        required:true,
        default:false
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next()
    }
    this.password = await bcrypt.hash(this.password,10)
})

// JWT Token
userSchema.methods.getJWTToken = function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE
    })
}

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compareSync(enteredPassword,this.password)
}

// Generating password reset token
userSchema.methods.getResetPasswordToken = function(){
    // generating token
    const resetToken = crypto.randomBytes(20).toString("hex")

    // hashing and adding to user schema
    this.resetPasswordToken = crypto.createHash("sha256")
                                    .update(resetToken)
                                    .digest("hex")

    this.resetPasswordExpire = Date.now() + 15 *60*1000
    return resetToken
}

module.exports = mongoose.model("User",userSchema)