const express = require('express')

const UserCtrl = require('../controllers/user-ctrl')
const router = express.Router()

router.post('/createUser', UserCtrl.createUser)
router.get('/getTranslation', UserCtrl.getTranslation)
router.post('/getUsers', UserCtrl.getUsers)
router.post('/uploadFile', UserCtrl.uploadFile ) 


//For uploading files
router.post('/upload',UserCtrl.uploadFile)
router.post('/addLoan',UserCtrl.addLoan)
router.post('/session', UserCtrl.getUserBySession)
router.post('/login', UserCtrl.login)
router.post('/uploadEngTranslation', UserCtrl.uploadEngTranslation)
router.post('/uploadEspTranslation', UserCtrl.uploadEspTranslation)
router.post('/logout', UserCtrl.logout)
router.post('/createToken', UserCtrl.createToken)
router.post('/checkToken', UserCtrl.checkToken)
router.post('/resetPassword', UserCtrl.resetPassword)
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
