"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = void 0;
//@ts-nocheck
const cf_1 = require("../utils/cf");
const firebase_config_1 = require("../utils/firebase_config");
const _1 = require(".");
const mail_1 = require("../mail");
exports.createAdmin = cf_1.withSuperAdmin(async (config, data, context) => {
    const { email, password, displayName, sendEmailAlert = true } = data;
    //STEP1: preconditions
    if (!(email && password && displayName))
        throw `invalid arguments. 'email', 'password' and 'displayName' are required`;
    //STEP2 create admin record in auth table
    const user = await firebase_config_1.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName,
    });
    //STEP3: create admin reacord in the users collection
    await firebase_config_1.refs.users.doc(user.uid).set(_1.default.get_new_doc({ email, displayName }));
    //STEP4 set custom claims for identification as admin (role)
    await firebase_config_1.auth().setCustomUserClaims(user.uid, { admin: true });
    //STEP5: send email alert
    if (sendEmailAlert)
        await mail_1.default.send({
            to: email,
            from: "info@waterlink.pk",
            subject: "Waterlink Admin account created!",
            text: `Hi ${displayName}! your Waterlink Admin account has been created!\n\nEmail: ${email}\nPassword: ${password}`,
            html: mail_1.default.templates.create_admin(displayName, email, password),
        }).catch((e) => console.error("Admin.create_admin error sending email:", e));
});
