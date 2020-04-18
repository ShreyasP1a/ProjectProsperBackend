const aws = require('aws-sdk');

const awsConfig = require('aws-config');

//models
const User = require('../models/user-model')
const Loan = require('../models/loan-model')
const Storage = require('../models/generalStorage')

//used for session
const uniqid = require('uniqid')
const ExcelJs = require('exceljs')
const multer = require('multer')


//used for token
const crypto = require('crypto')

//used for encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;

//used for mailing password
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

let config = awsConfig({
    region: 'us-east-1',

    accessKeyId: process.env.accessKeyId,

    secretAccessKey: process.env.secretAccessKey
});


var s3 = new aws.S3(config)


//used for format check
const username = new RegExp(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
const password = new RegExp(/^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$/);
const phone = new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im);
const name = new RegExp(/[.*+?^${}()|[\]\\<>~#%&:\/\s]/);

const uploadFile = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (user) {
            var buff = Buffer.from(req.body.data);
            let key = user.firstName + "_" + user.lastName + '.zip'
            let configuration =
            {
                ACL: 'public-read',
                Bucket: 'projectprosper',
                Key: key,
                Body: buff
            };
            s3.upload(configuration, (error, data) => {
                if (error) {
                    console.log(error)
                    return res.status(400).json({
                        success: false,
                        error: 'Files not stored',
                    })
                }
                user.application = key;
                user.applicationSent = true;
                user.applicationDate = new Date();
                user.save().then(() => {
                    return res.status(200).json({
                        success: true,
                        error: 'Application Files Stored Succesfully ',
                    })
                }).catch((err) => {
                    return res.status(400).json({
                        success: false,
                        error: 'User not stored',
                    })
                })

            })
        }
    }).catch((error) => { console.log(error) })

}

const getApplicationLink = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, Admin) => {

        if (!Admin)
            return res.status(404).json({ success: false, error: 'Found no user with sessionid' })

        if (Admin.admin) {

            await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, async (err, user) => {
                const myBucket = 'projectprosper';
                const url = s3.getSignedUrl('getObject', {
                    Bucket: myBucket,
                    Key: user.application,
                    Expires: 10
                })

                return res.status(200).json({ success: true, data: url })

            })

        }

        else {
            return res.status(404).json({ success: false, error: 'User is not an admin get Application link' })
        }



    }).catch((err) => {
        return res.status(404).json({ success: false, error: 'Failed to verify admin' })
    })
}


const uploadEngTranslation = async (req, res) => {

    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, User) => {
        if (!User)
            return res.status(404).json({ success: false, error: 'Found no user with sessionid' })

        if (User.admin) {
            let storage = multer.memoryStorage()
            let upload = multer({ storage: storage }).single('file');


            //Await the upload to finish
            await upload(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(500).json(err)
                }
                else if (err) {
                    return res.status(500).json(err)
                }

                let str = req.file.buffer.toString('utf-8')
                let engJSON = JSON.parse(str)

                await Storage.findOne({}, (err, stored) => {
                    if (err) {
                        return res.status(400).json({ success: false, error: err })
                    }

                    let createdNew = false;
                    //if storage doesn't exist create it.
                    if (!stored) {
                        stored = new Storage()
                        createdNew = true;
                    }

                    stored.engTranslation = engJSON;

                    if (!stored) {
                        return res.status(400).json({ success: false, error: err })
                    }

                    stored.save().then(() => {
                        if (createdNew)
                            return res.status(201).json({ success: true, message: 'Created Storage and stored new Eng translation!', })
                        else
                            return res.status(201).json({ success: true, message: 'Updated new Eng Translation!', })
                    }).catch((error) => {
                        if (createdNew)
                            return res.status(400).json({ error, message: 'Storage didn\'t exist and failed to create', })
                        else
                            return res.status(400).json({ error, message: 'Storage existed but failed to update', })
                    });


                }).catch((err) => console.log(err))

            })
        }

        else {
            return res.status(404).json({ success: false, error: 'User is not an admin can not delete' })
        }

    }).catch((err) => {
        return res.status(404).json({ success: false, error: 'Failed to verify admin' })
    })
}

const uploadEspTranslation = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, User) => {
        if (!User)
            return res.status(404).json({ success: false, error: 'Found no user with sessionid' })

        if (User.admin) {
            let storage = multer.memoryStorage()
            let upload = multer({ storage: storage }).single('file');


            //Await the upload to finish
            await upload(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(500).json(err)
                }
                else if (err) {
                    return res.status(500).json(err)
                }

                let str = req.file.buffer.toString('utf-8')
                let espJSON = JSON.parse(str)

                await Storage.findOne({}, (err, stored) => {
                    if (err) {
                        return res.status(400).json({ success: false, error: err })
                    }

                    let createdNew = false;
                    //if storage doesn't exist create it.
                    if (!stored) {
                        stored = new Storage()
                        createdNew = true;
                    }

                    stored.espTranslation = espJSON;

                    if (!stored) {
                        return res.status(400).json({ success: false, error: err })
                    }

                    stored.save().then(() => {
                        if (createdNew)
                            return res.status(201).json({ success: true, message: 'Created Storage and stored new Spanish translation!', })
                        else
                            return res.status(201).json({ success: true, message: 'Updated new Spanish Translation!', })
                    }).catch((error) => {
                        if (createdNew)
                            return res.status(400).json({ error, message: 'Storage didn\'t exist and failed to create', })
                        else
                            return res.status(400).json({ error, message: 'Storage existed but failed to update', })
                    });

                }).catch((err) => console.log(err))

            })
        }

        else {
            return res.status(404).json({ success: false, error: 'User is not an admin can not delete' })
        }

    }).catch((err) => {
        return res.status(404).json({ success: false, error: 'Failed to verify admin' })
    })
}

const getTranslation = async (req, res) => {
    await Storage.findOne({}, async (err, trans) => {
        if (err) {
            return res.status(400).json({ err, message: 'Database error occured', })
        }

        if (!trans) {
            return res.status(400).json({ err, message: 'No data exists', })
        }

        return res.status(201).json({ eng: trans.engTranslation, esp: trans.espTranslation })

    }).catch((err) => {
        return res.status(404).json({ success: false, error: 'Failed to get site data' })
    })
}

const createUser = async (req, res) => {
    const body = req.body

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a User',
        })
    }

    //check username format
    if (name.test(req.body.firstName)) {
        return res.status(400).json({
            success: false,
            error: 'First name not formatted correctly ',
        })
    }

    //check username format
    if (name.test(req.body.lastName)) {
        return res.status(400).json({
            success: false,
            error: 'Last name not formatted correctly ',
        })
    }

    //check username format
    if (!(username.test(req.body.username))) {
        return res.status(400).json({
            success: false,
            error: 'Username not formatted correctly ',
        })
    }

    //check username format
    if (!(username.test(req.body.email))) {
        return res.status(400).json({
            success: false,
            error: 'Email not formatted correctly ',
        })
    }

    //check password format
    if (!password.test(req.body.password)) {
        return res.status(400).json({
            success: false,
            error: 'Password not formatted correctly ',
        })
    }

    //check phone format
    if (!phone.test(req.body.phoneNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Phone number not formatted correctly ',
        })
    }

    //look for user
    await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, (err, users) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }

        //if user does not exist
        if (!users) {
            let newUserObj = {
                "firstName": body.username, 
                "lastName":body.lastName, 
                "email":body.phoneNumber, 
                "phoneNumber": body.phoneNumber, 
                "username": body.username, 
                "password": body.password, 
                "admin": false
            }
            const user = new User(newUserObj)

            if (!user) {
                return res.status(400).json({ success: false, error: err })
            }

            bcrypt.genSalt(saltRounds, function (err, salt) {
                if (err) return err;

                // hash the password along with our new salt
                bcrypt.hash(user.password, salt, function (err, hash) {
                    if (err) return err;

                    // override the cleartext password with the hashed one
                    user.password = hash;
                    //next();

                    user.save().then(() => {
                        return res.status(201).json({ success: true, id: user._id, message: 'User created!', })
                    }).catch((error) => {
                        return res.status(400).json({
                            error,
                            message: 'User not created!',
                        })
                    })
                });
            });

        }
        else
            return res.status(400).json({ success: false, data: "User already exists", code: 1 })
    }).catch((err) => console.log(err))
}



const adminDelete = async (req, res) => {
    //find the user curently using function by sessionid
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, admin) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!admin) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }

        if (admin.admin) {
            await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, async (err, user) => {

                let key = getKey(user.application);
                let params = { Bucket: 'projectprosper', Key: key };

                s3.deleteObject(params, (err, data) => {
                    if (err) {
                        console.log(err)
                        return res.status(404).json({ success: false, error: 'Failed to delete from S3' })
                    }

                    return res.status(200).json({ success: true, error: 'Deleted Application from S3' })

                }).catch((err) => console.log(err))
            });
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin can not delete' })
        }
    }).catch((error) => {
        console.log(error)
        return res.status(404).json({ success: false, error: 'Failed to fetch from Database' })
    })

}



const getUsers = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {

            await User.find({}, req.body.wanted, (err, users) => {

                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }
                if (!users.length) {
                    return res
                        .status(404)
                        .json({ success: false, error: `User not found` })
                }
                return res.status(200).json({ success: true, data: users })
            }).catch((err) => console.log(err))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => {
        console.log(err)
        return res.status(404).json({ success: false, error: 'Failed to search database' })
    })
}

const login = async (req, res) => {
    await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.data.username }] }, (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: `Username or password is incorrect`, code: 1 })
        }

        //check password
        bcrypt.compare(req.body.data.password, user.password, function (err, result) {
            //if match
            if (result) {
                //make session
                user.sessionid = uniqid();
                user.save().then(() => {
                    res.cookie('Sessionid', user.sessionid, { maxAge: 86400000, httpOnly: true, signed: true });
                    return res.status(200).json({ success: true });
                })
                    .catch((error) => {
                        console.log("---------------------------------error---------------------------")
                        console.log(error)
                        return res.status(404).json({
                            error,
                            message: 'User not updated!',
                        })
                    });
            }
            else
                return res.status(400).json({ success: false, data: "Username or password is incorrect", code: 1 });
        });
    }).catch((err) => console.log(err))
}

const getUserBySession = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, "qualified admin applicationSent username loan_information", (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }

        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found', errorMessage: "User is not logged", typeOfError: "USERNOTLOGIN" })
        }
        else
            return res.status(200).json({ success: true, user })
    }).catch((err) => console.log(err))
}

const logout = async (req, res) => {
    await User.updateOne({ sessionid: { $exists: true }, sessionid: req.signedCookies.Sessionid }, { $unset: { 'sessionid': { sessionid: req.signedCookies.Sessionid } } }, function (err, model) {
        if (err) {
            console.log(err);
            return res.send(err);
        }
        else {
            return res.status(200).json({ success: true, data: "session deleted", model });
        }
    }).catch((err) => console.log(err))
}

const createToken = async (req, res) => {
    await User.findOne({ $and: [{ email: { $exists: true } }, { email: req.body.email }] }, (err, user) => {

        if (err) {
            return res.status(400).json({ success: false, error: err })
        }

        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        else {

            let token = crypto.randomBytes(32).toString('hex');//creating the token to be sent to the forgot password form (react)
            let link = "http://localhost:3000/resetPassword/" + token;
            let date = new Date();

            user.resetPassword.token = token;
            user.resetPassword.time = date;

            user.save().then(() => {
                let mailoptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Reset Password',
                    text: "Someone has requested a password change for your account on ProjectProsper. If you requested this then click the link below, otherwise ignore this email.\n" + link,
                }

                transporter.sendMail(mailoptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        return res.status(400).json({ success: false, data: link, token: token, message: 'Error not sent' });
                    }
                    else {
                        console.log('sent', info);
                        return res.status(201).json({ success: true, data: link, token: token, message: 'Token created!', })
                    }
                });
            }).catch((error) => {
                return res.status(400).json({
                    error,
                    message: 'User not created!',
                })
            })
        }
    }).catch((err) => console.log(err))
}

const checkToken = async (req, res) => {
    await User.findOne({ $and: [{ 'resetPassword.token': { $exists: true } }, { 'resetPassword.token': req.body.token }] }, (err, user) => {

        if (err) {
            return res.status(400).json({ success: false, error: err })
        }

        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        else {
            if (req.body.token === user.resetPassword.token) {
                let diff = Math.abs(new Date() - user.resetPassword.time);
                if (diff < 700000)
                    return res.status(200).json({ success: true, data: 'token valid' })
                else
                    return res.status(400).json({ success: false, data: 'token timed out' })
            }
            else {
                return res
                    .status(404)
                    .json({ success: false, error: 'token does not match' })
            }

        }
    }).catch((err) => console.log(err))
}

const resetPassword = async (req, res) => {

    await User.findOne({ $and: [{ 'resetPassword.token': { $exists: true } }, { 'resetPassword.token': req.body.token }] }, function (err, user) {
        if (!password.test(req.body.password)) {
            return res.status(400).json({
                success: false,
                error: 'Password not formatted correctly ',
            })
        }

        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: `User not found` })
        }
        else {
            bcrypt.genSalt(saltRounds, function (err, salt) {
                if (err) return err;

                // hash the password along with our new salt
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    if (err) return err;

                    // override the cleartext password with the hashed one
                    user.password = hash;
                    delete user.sessionid;
                    user.save().then(() => {
                        User.updateOne({ username: user.username }, { $unset: { 'resetPassword.token': "", sessionid: "" } }, function (err, model) {
                            if (err) {
                                console.log(err);
                                return res.send(err);
                            }
                            return res.status(201).json({ success: true, message: 'Password updated', })
                        }).catch((err) => console.log(err))
                    }).catch((error) => {
                        return res.status(400).json({
                            error,
                            message: 'Password not updated',
                        })
                    })
                });
            });
        }
    }).catch((err) => console.log(err))
}


const downloadIndivdReport = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {


            await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, async (err, user) => {
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }
                if (!user) {
                    return res
                        .status(404)
                        .json({ success: false, error: `User does not exist` })
                }

                const workbook = new ExcelJs.Workbook();
                const sheet = workbook.addWorksheet("Individual Report");
                sheet.columns = [
                    { key: 'date', width: 22 },
                    { key: 'payment', width: 15, style: { numFmt: '$#,##0.00' } },
                    { key: 'principal', width: 15, style: { numFmt: '$#,##0.00' } },
                    { key: 'balance', width: 30, style: { numFmt: '$#,##0.00' } },
                    { key: 'selfInterest_pmt', width: 20, style: { numFmt: '$#,##0.00' } },
                    { key: 'selfInterest_accr', width: 20, style: { numFmt: '$#,##0.00' } },
                ]
                const userDate = user.loan_information[0].date;
                sheet.getCell('A1').value = "Borrower: " + user.firstName + " " + user.lastName;
                sheet.getCell('A2').value = "Loan Date: " + (userDate.getUTCMonth() + 1) + "/" + userDate.getUTCDate() + "/" + userDate.getUTCFullYear();
                sheet.getCell('A3').value = "Loan Amount: $" + user.loan_information[0].balance;

                sheet.addRow({});
                sheet.addRow({
                    date: 'Date of Payment',
                    payment: 'Total Payment',
                    principal: 'Loan Principal',
                    balance: 'Loan Principal Remaining Balance',
                    selfInterest_pmt: 'Self-Interest Payment',
                    selfInterest_accr: 'Self-Interest Accrued',
                })
                user.loan_information.forEach(loan => {

                    sheet.addRow({
                        date: loan.date,
                        payment: loan.payment,
                        principal: loan.principal,
                        balance: loan.balance,
                        selfInterest_pmt: loan.selfInterest_pmt,
                        selfInterest_accr: loan.selfInterest_accr
                    })

                });


                workbook.xlsx.writeBuffer().then(buff => {
                    res.send(buff)
                }).catch(e => console.log(e))

            }).catch((err) => console.log(err))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))


}


const downloadOverallReport = async (req, res) => {



    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            await User.find({}, async (err, users) => {
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }
                if (!users.length) {
                    return res
                        .status(404)
                        .json({ success: false, error: `Users` })
                }

                const dateBegin = new Date(req.body.dateBegin)
                const dateEnd = new Date(req.body.dateEnd)
                let totalPrincipal = 0
                let totalSelfInt = 0

                const workbook = new ExcelJs.Workbook();
                const sheet = workbook.addWorksheet("Overall Report");

                let startDate = new Date(req.body.dateBegin);
                let endDate = new Date(req.body.dateEnd);
                let dateBeginFormat = (startDate.getUTCMonth() + 1) + "/" + (startDate.getUTCDate()) + "/" + startDate.getUTCFullYear();

                let dateEndFormat = (endDate.getUTCMonth() + 1) + "/" + (endDate.getUTCDate()) + "/" + endDate.getUTCFullYear();
                sheet.columns = [
                    { key: 'name', width: 20 },
                    { key: 'date', width: 15 },
                    { key: 'payment', width: 15, style: { numFmt: '$#,##0.00' } },
                    { key: 'principal', width: 15, style: { numFmt: '$#,##0.00' } },
                    { key: 'balance', width: 15, style: { numFmt: '$#,##0.00' } },
                    { key: 'selfInterest_pmt', width: 20, style: { numFmt: '$#,##0.00' } },
                ]

                sheet.getCell('A1').value = "Borrower Report " + dateBeginFormat + " to " + dateEndFormat;
                sheet.addRow({})//Empty row

                sheet.addRow({

                    name: 'Borrower',
                    date: 'Date of Payment',
                    payment: 'Total Payment',
                    principal: 'Principal',
                    balance: 'Loan Balance',
                    selfInterest_pmt: 'Self-Interest Payment',

                })

                await users.forEach(user => {
                    user.loan_information.forEach(loan => {
                        //If it is between the specified dates
                        if (loan.date <= dateEnd && loan.date >= dateBegin) {
                            sheet.addRow({
                                name: user.firstName + " " + user.lastName,
                                date: loan.date,
                                payment: loan.payment,
                                principal: loan.principal,
                                balance: loan.balance,
                                selfInterest_pmt: loan.selfInterest_pmt,
                            })
                            totalPrincipal = totalPrincipal + loan.principal
                            totalSelfInt = totalSelfInt + loan.selfInterest_pmt
                        }
                    })
                });


                sheet.addRow({})
                sheet.addRow({

                    name: '',
                    date: '',
                    payment: 'Summation:',
                    principal: totalPrincipal,
                    balance: 'Summation:',
                    selfInterest_pmt: totalSelfInt,

                })

                workbook.xlsx.writeBuffer().then(buff => {
                    res.send(buff)
                }).catch(e => console.log(e))

            }).catch((err) => console.log("error"))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))

}


const uploadReport = async (req, res) => {

    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            let storage = multer.memoryStorage()
            let upload = multer({ storage: storage }).single('file');

            const workbook = new ExcelJs.Workbook();

            //Await the upload to finish
            await upload(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(500).json(err)
                } else if (err) {
                    return res.status(500).json(err)
                }
                //Await to read in the file completely
                await workbook.xlsx.load(req.file.buffer).then(async function () {

                    const sheet = workbook.getWorksheet(1);//Change Sheet number to the one working on
                    //Get the values of all the rows except the first one, find the user with that and add onto what previous loans they had

                    for (let i = 2; i < (sheet.rowCount + 1); i++) {

                        let row = sheet.getRow(i);
                        if (!row.values[1]) {
                            continue
                        }


                        let self_interest;
                        let usr;
                        if (row.values[2] instanceof Object) {
                            usr = row.values[2].text
                        }
                        else {
                            usr = row.values[2]
                        }
                        await User.findOne({ username: usr }, async (err, user) => {
                            if (err) {

                                return res.status(400).json({ success: false, error: err })
                            }
                            if (!user) {

                                return res
                                    .status(404)
                                    .json({ success: false, error: `User doesn't exist` })
                            }
                            let dateFound = false
                            let uploadDate = new Date(row.values[3])
                            let maxSelfIntBalance = 0.1 * user.loan_information[0].balance
                            let userSavings = user.loan_information[user.loan_information.length - 1].selfInterest_accr

                            await user.loan_information.forEach((loan, index) => {
                                if (loan.date.getTime() === uploadDate.getTime()) {
                                    loan.payment = row.values[4]
                                    loan.principal = row.values[5]
                                    dateFound = true
                                }
                            })

                            if (!dateFound) {

                                //10% of payment is bigger then the 10% of the principal
                                if (maxSelfIntBalance >= userSavings + (row.values[4] - row.values[5]) && (row.values[4] - row.values[5]) >= 0) {
                                    self_interest = row.values[4] - row.values[5]
                                }
                                else if ((row.values[4] - row.values[5]) >= 0) {
                                    if (maxSelfIntBalance - userSavings < 0) {
                                        self_interest = 0
                                    }
                                    else {
                                        self_interest = maxSelfIntBalance - userSavings
                                    }
                                }
                                else {
                                    self_interest = 0;
                                }
                                //Creates new loan object
                                const loan_data = new Loan({
                                    date: row.values[3],
                                    payment: row.values[4],
                                    principal: row.values[5],
                                    balance: user.loan_information[user.loan_information.length - 1].balance - row.values[4],
                                    selfInterest_pmt: self_interest,
                                    selfInterest_accr: user.loan_information[user.loan_information.length - 1].selfInterest_accr + self_interest,
                                })
                                //Pushes it to the back
                                user.loan_information.push(loan_data);
                            }
                            else {
                                await updateUserLoanInfo(user)
                            }
                            await user
                                .save({ j: true })
                                .then(() => {
                                    return res.status(200).send({ sucess: true, data: "User is updated" });

                                })
                                .catch((error) => {
                                    return res.status(404).json({
                                        error,
                                        message: 'User not saved!',
                                    })
                                })

                        })
                        await insertLoanSort(user, loan_data)

                    }
                    await updateUserLoanInfo(user)

                    await user.save({ j: true })

                })


            })
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))

}


const makeAdmin = async (req, res) => {
    let str = req.body.token
    if (str === process.env.S3SECRET) {
        await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, (err, user) => {

            if (err) {
                return res.status(400).json({ success: false, error: err })
            }

            if (!user) {
                return res
                    .status(404)
                    .json({ success: false, error: 'User not found' })
            }
            else {
                user.admin = true;
                user.save().then(() => {
                    return res.status(200).json({ success: true });
                })
                    .catch((error) => {
                        console.log(error)
                        return res.status(404).json({
                            error,
                            message: 'User not updated!',
                        })
                    });
            }

        }).catch((err) => console.log(err))
    }
    else {
        return res.status(404).json({
            message: 'Request Error',
            success: false
        })
    }
}

const addLoan = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            await User.findOne({ username: req.body.username }, async (err, user) => {
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }
                if (!user) {
                    return res
                        .status(404)
                        .json({ success: false, error: `Users don't exist` })
                }

                let loan_data

                let self_interest
                let dateFound = false
                let uploadDate = new Date(req.body.date)
                console.log(uploadDate)
                let maxSelfIntBalance = 0.1 * user.loan_information[0].balance
                let userSavings = user.loan_information[user.loan_information.length - 1].selfInterest_accr

                await user.loan_information.forEach((loan, index) => {
                    if (loan.date.getTime() === uploadDate.getTime()) {
                        console.log("Date Matches\n")
                        loan.payment = req.body.payment
                        loan.principal = req.body.principal
                        dateFound = true
                    }
                })

                if (!dateFound) {
                    if (maxSelfIntBalance >= userSavings + (req.body.payment - req.body.principal) && (req.body.payment - req.body.principal) >= 0) {
                        self_interest = req.body.payment - req.body.principal
                    }
                    else if ((req.body.payment - req.body.principal) >= 0) {
                        if (maxSelfIntBalance - userSavings < 0) {
                            self_interest = 0
                        }
                        else {
                            self_interest = maxSelfIntBalance - userSavings
                        }
                    }
                    else {
                        self_interest = 0;
                    }

                    if (!user.loan_information.length) {
                        //Creates new loan object
                        loan_data = new Loan({
                            date: uploadDate,
                            payment: req.body.payment,
                            principal: req.body.principal,
                            balance: 1500 - req.body.payment,
                            selfInterest_pmt: self_interest,
                            selfInterest_accr: self_interest,
                        })

                    }
                    else {
                        //Creates new loan object
                        loan_data = new Loan({
                            date: uploadDate,
                            payment: req.body.payment,
                            principal: req.body.principal,
                            balance: user.loan_information[user.loan_information.length - 1].balance - req.body.payment,
                            selfInterest_pmt: self_interest,
                            selfInterest_accr: user.loan_information[user.loan_information.length - 1].selfInterest_accr + self_interest,
                        })

                    }
                    await insertLoanSort(user, loan_data)
                }

                await updateUserLoanInfo(user)


                await user
                    .save({ j: true })
                    .then(() => {
                        console.log("User Saved")
                    })
                    .catch((error) => {
                        return res.status(404).json({
                            error,
                            message: 'User not saved!',
                        })
                    })


                return res.status(200).json({ success: true })

            }).catch((err) => console.log(err))

        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))

}

const deleteLoan = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            await User.findOne({ username: req.body.username }, async (err, user) => {
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }

                if (!user) {
                    return res
                        .status(404)
                        .json({ success: false, error: 'User not found' })
                }
                else {
                    let datejson = new Date(req.body.date)
                    let dateFound = false
                    for (let i = 0; i < user.loan_information.length; i++) {
                        if (user.loan_information[i].date.getTime() === datejson.getTime()) {
                            console.log("Date found:", datejson)
                            user.loan_information.splice(i, 1);
                            dateFound = true
                        }
                    }

                    if (dateFound) {
                        await updateUserLoanInfo(user);
                    }
                    else {
                        return res.status(200).json({ success: false, data: "loan date not found" });
                    }
                    await user.save().then(() => {
                        return res.status(200).json({ success: true, data: "loan deleted" });
                    }).catch((error) => {
                        console.log(error)
                        return res.status(404).json({
                            error,
                            message: 'loan not deleted!',
                        })
                    });

                }
            }).catch((err) => console.log(err))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))
}

const clearUserLoan = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            await User.updateOne({ username: req.body.username }, { $unset: { 'loan_information': { loan_information: "" } } }, function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                else {
                    return res.status(200).json({ success: true, data: "loan information deleted", model });
                }
            }).catch((err) => console.log(err))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))
}

//Set the users qualified field to true

const getKey = (link) => {
    let zip = link.split("/")
    return zip[zip.length - 1]
}
const setQualified = async (req, res) => {
    await User.findOne({ $and: [{ sessionid: { $exists: true } }, { sessionid: req.signedCookies.Sessionid }] }, async (err, user) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' })
        }
        //check to see if this user is an admin
        if (user.admin) {
            await User.findOne({ $and: [{ username: { $exists: true } }, { username: req.body.username }] }, async (err, user) => {
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }

                if (!user) {
                    return res
                        .status(404)
                        .json({ success: false, error: 'User not found' })
                }
                let key = getKey(user.application);

                let params = { Bucket: 'projectprosper', Key: key };

                await s3.deleteObject(params, (err, data) => {
                    if (err) {
                        return res
                            .status(404)
                            .json({ success: false, error: 'Failed to delete from S3' })
                    }
                    else {
                        user.qualified = true;
                        let today = new Date()
                        //Formats the date
                        let currDate = (today.getUTCMonth() + 1) + '/' + today.getUTCDate() + '/' + today.getUTCFullYear();
                        //Creates new loan object
                        const loan_data = new Loan({
                            date: currDate,
                            payment: 0,
                            principal: 0,
                            balance: req.body.balance,
                            selfInterest_pmt: 0,
                            selfInterest_accr: 0,
                        })


                        //Pushes it to the back
                        user.loan_information.push(loan_data);
                        user.application = ""
                        user.save().then(() => {
                            return res.status(200).json({ success: true, data: "User is now qualified" });
                        }).catch((error) => {
                            console.log(error)
                            return res.status(404).json({
                                error,
                                message: 'User not qualified!',
                            })
                        });


                    }
                });

            }).catch((err) => console.log(err))
        }
        else {
            return res.status(404).json({ success: false, error: 'User is not an admin' })
        }
    }).catch((err) => console.log(err))
}

function updateUserLoanInfo(user) {

    let maxSelfIntBalance = 0.1 * user.loan_information[0].balance
    let self_interest
    //Loop through the loan payments of the user
    for (let i = 1; i < user.loan_information.length; i++) {
        //Get curr and prev loan
        let currLoan = user.loan_information[i]
        let prevLoan = user.loan_information[i - 1]
        //The balance is update based on the prev loan and curr loan payment
        currLoan.balance = prevLoan.balance - currLoan.principal
        //If the 10% max of the initial loan is still bigger than the savings and payment of the user then we add it to the self interest payment
        if (maxSelfIntBalance >= prevLoan.selfInterest_accr + (currLoan.payment - currLoan.principal) && (currLoan.payment - currLoan.principal) >= 0) {
            self_interest = currLoan.payment - currLoan.principal
        }
        //otherwise if it is still bigger but goes over the 10%
        else if ((currLoan.payment - currLoan.principal) >= 0) {
            if (maxSelfIntBalance - prevLoan.selfInterest_accr <= 0) {
                self_interest = 0
            }
            else {
                self_interest = maxSelfIntBalance - prevLoan.selfInterest_accr
            }
        }
        currLoan.selfInterest_pmt = self_interest
        currLoan.selfInterest_accr = prevLoan.selfInterest_accr + self_interest
    }

    return true;
}

//Sorting the dates
function insertLoanSort(user, userLoan) {

    if (!userLoan) {
        console.log("Undefined User Loan")
        return false;
    }
    if (!user.loan_information.length) {
        console.log("User does not have any loan information")
        user.loan_information.push(userLoan)
        return false;
    }

    for (let i = 0; i < user.loan_information.length; i++) {
        //Get next loan
        let nextLoan = user.loan_information[i + 1]
        if (i + 1 === user.loan_information.length) {
            user.loan_information.push(userLoan)
            break
        }
        else if (userLoan.date.getTime() < nextLoan.date.getTime()) {
            user.loan_information.splice(i + 1, 0, userLoan);
            break
        }
    }

    return true;
}

module.exports = {
    createUser,
    uploadEngTranslation,
    uploadEspTranslation,
    getTranslation,
    getUsers,
    getUserBySession,
    login,
    downloadIndivdReport,
    downloadOverallReport,
    uploadReport,
    addLoan,
    logout,
    createToken,
    checkToken,
    resetPassword,
    adminDelete,
    deleteLoan,
    clearUserLoan,
    setQualified,
    makeAdmin,
    uploadFile,
    getApplicationLink
}
