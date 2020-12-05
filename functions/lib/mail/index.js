"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_config_1 = require("../utils/firebase_config");
const templates_1 = require("./templates");
//@ts-nocheck
const sgMail = require("@sendgrid/mail");
const send = async ({ to, from = firebase_config_1.functions.config().sendgrid.from_email, subject, text, html = text, }) => {
    sgMail.setApiKey(firebase_config_1.functions.config().sendgrid.api_key);
    await sgMail.send({
        to,
        from,
        subject,
        text,
        html,
    });
};
const Mail = {
    send,
    templates: templates_1.default,
};
exports.default = Mail;
