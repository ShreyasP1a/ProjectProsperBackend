const express = require('express')

const UserCtrl = require('../controllers/user-ctrl')
const router = express.Router()



//---------general----------
router.get('/getTranslation', UserCtrl.getTranslation)
router.get('/session', UserCtrl.getUserBySession)
router.post('/createUser', UserCtrl.createUser)
router.post('/uploadFile', UserCtrl.uploadFile ) 
router.post('/addLoan',UserCtrl.addLoan)
router.post('/login', UserCtrl.login)
router.post('/logout', UserCtrl.logout)
router.post('/createToken', UserCtrl.createToken)
router.post('/checkToken', UserCtrl.checkToken)
router.post('/resetPassword', UserCtrl.resetPassword)

//--------admin functions---------
router.get('/getUsers', UserCtrl.getUsers)
router.post('/uploadEngTranslation', UserCtrl.uploadEngTranslation)
router.post('/uploadEspTranslation', UserCtrl.uploadEspTranslation)
router.post('/adminDelete', UserCtrl.adminDelete)
router.post('/overallReport',UserCtrl.downloadOverallReport)
router.post('/individReport',UserCtrl.downloadIndivdReport)
router.post('/uploadReport',UserCtrl.uploadReport)
router.post('/deleteLoan',UserCtrl.deleteLoan)
router.post('/clearUserLoan',UserCtrl.clearUserLoan)
router.post('/setQualified',UserCtrl.setQualified)
router.post('/makeAdmin',UserCtrl.makeAdmin)
router.post('/getApplicationLink',UserCtrl.getApplicationLink)


module.exports = router
