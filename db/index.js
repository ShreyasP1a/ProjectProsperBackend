const mongoose = require('mongoose')

mongoose
    //.connect('mongodb+srv://new_user72:projectprosper72@cluster0-ygcny.mongodb.net/test?retryWrites=true&w=majority',
    .connect('mongodb://127.0.0.1:27017/projectProsper', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
})
    .catch ((e) => {
    // eslint-disable-next-line no-console
    console.error('Connection error', e.message)
});

const db = mongoose.connection

module.exports = db