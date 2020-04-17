const mongoose = require('mongoose')

const { Schema } = mongoose

const LoanSchema= new Schema({
    date:Date,
    payment:Number,
    principal:Number,
    balance:Number,
    selfInterest_pmt:Number,
    selfInterest_accr:Number,
});


const Loan = mongoose.model('loan', LoanSchema, 'Users')
module.exports = Loan;