const mongoose = require('mongoose')
const Loan=require('./loan-model').schema
const { Schema } = mongoose

let date = new Date(1970, 1, 1) 
const UserSchema = new Schema(
    {
        firstName: { type: String},
        lastName: { type: String},
        username: { type: String},
        password: { type: String},
        phoneNumber:{type:String},
        qualified:{type:Boolean, default:false},
        applicationSent:{type:Boolean, default:false},
        applicationDate:{type:Date, default:date},
        email:{type: String},
        address:{type:String},
        loan_information:{type:[Loan]},
        admin:{type:Boolean, default:false},
        application:{type:String, default:""},
        sessionid: {type: String, required: false},
        resetPassword: {
            token : {type: String},
            time : {type: Date}
        },
    },
    { timestamps: true }
)



const User = mongoose.model('users', UserSchema, 'Users')
module.exports = User

