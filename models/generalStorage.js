const eng = require('../translationsBackend/engTranslation.js')
const esp = require('../translationsBackend/espTranslation.js')
const mongoose = require('mongoose')
const { Schema } = mongoose

const generalStorage= new Schema({
    engTranslation: {type:JSON, default: eng},
    espTranslation: {type:JSON, default: esp},
    terms: {type:String}
})


const Storage = mongoose.model('storage', generalStorage, 'storage')
module.exports = Storage; 