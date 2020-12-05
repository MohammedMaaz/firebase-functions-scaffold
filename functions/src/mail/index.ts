import { functions } from "../utils/firebase_config";
import MailTemplates from "./templates";

//@ts-nocheck
const sgMail = require("@sendgrid/mail");

const send = async ({
  to,
  from = functions.config().sendgrid.from_email,
  subject,
  text,
  html = text,
}) => {
  sgMail.setApiKey(functions.config().sendgrid.api_key);
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
  templates: MailTemplates,
};

export default Mail;
