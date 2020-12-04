//@ts-nocheck
import Customer from '../customer';
import Driver from '../driver';
import GlobalConfig from '../globalConfig';
import Transporter from '../transporter';
import User from '../user';
import {withAdmin, withSuperAdmin} from '../utils/cf';
import {auth, db, functions, refs} from '../utils/firebase_config';
import SMS from '../sms';
import {uidFromPrivate} from '../utils/utils';
import Admin from '.';
const sgMail = require('@sendgrid/mail');

export const createCustomer = withAdmin(async (config, data, context, t) => {
  const {
    phoneNumber,
    displayName,
    email = null,
    currentOfferId = null,
    walletBalance = 0,
    inviteeUid,
    sendSMSAlert = false,
  } = data;

  let user, shouldCreateProfile;
  const executor = async (t) => {
    user = await User.get_by_phone_number(phoneNumber);
    shouldCreateProfile = false;

    if (!user) {
      shouldCreateProfile = true;
      user = await auth().createUser({phoneNumber});
      User.create({authPhoneNumber: phoneNumber, uid: user.uid, t});
    } else shouldCreateProfile = !(await t.get(refs.customer(user.uid))).exists;

    if (shouldCreateProfile)
      await Customer._signup({
        displayName,
        email,
        currentOfferId,
        walletBalance,
        uid: user.uid,
        createdByAdmin: context.auth.uid,
        t,
        inviteeUid,
        performChecks: false,
      });
  };

  t ? await executor(t) : await db().runTransaction(executor);

  if (shouldCreateProfile && sendSMSAlert)
    await SMS.send({
      phoneNumbers: [phoneNumber],
      message: `Hi ${displayName}! your Waterlink profile has been created. To place your first order install app from this link: https://bit.ly/2Fj5Meh`,
    });

  return user;
});

export const createDriver = withAdmin(async (config, data, context, t) => {
  const {
    phoneNumber,
    displayName,
    tankerDetails = null,
    transporterDetails = null,
    walletBalance = 0,
    transporterLiability = 0,
    cnic,
    sendSMSAlert = false,
  } = data;

  let user, shouldCreateProfile;
  const executor = async (t) => {
    user = await User.get_by_phone_number(phoneNumber);
    shouldCreateProfile = false;

    if (!user) {
      shouldCreateProfile = true;
      user = await auth().createUser({phoneNumber});
      User.create({authPhoneNumber: phoneNumber, uid: user.uid, cnic, t});
    } else shouldCreateProfile = !(await t.get(refs.driver(user.uid))).exists;

    if (shouldCreateProfile) {
      let tankerTypes = null;
      if (tankerDetails)
        tankerTypes = await GlobalConfig.get_value(
          'transport',
          'tankerTypes',
          undefined,
          t,
        );

      await Driver._signup({
        displayName,
        tankerDetails,
        transporterDetails,
        walletBalance,
        transporterLiability,
        tankerTypes,
        uid: user.uid,
        cnic,
        createdByAdmin: context.auth.uid,
        t,
        performProfileCheck: false,
      });
    }
  };

  t ? await executor(t) : await db().runTransaction(executor);

  //only send sms if new user profile is created and sendSMSAlert is enabled
  if (shouldCreateProfile && sendSMSAlert) {
    await SMS.send({
      phoneNumbers: [phoneNumber],
      message: `Hi ${displayName}! your Waterlink Driver profile has been created. To get orders install app from this link: https://bit.ly/2SzAvaG`,
    });
  }

  return user;
});

export const createTransporter = withAdmin(async (config, data, context, t) => {
  const {
    phoneNumber,
    displayName,
    walletBalance = 0,
    sendSMSAlert = false,
  } = data;

  let user, shouldCreateProfile;
  const executor = async (t) => {
    user = await User.get_by_phone_number(phoneNumber);
    shouldCreateProfile = false;

    if (!user) {
      shouldCreateProfile = true;
      user = await auth().createUser({phoneNumber});
      User.create({authPhoneNumber: phoneNumber, uid: user.uid, t});
    } else
      shouldCreateProfile = !(await t.get(refs.transporter(user.uid))).exists;

    if (shouldCreateProfile)
      await Transporter._signup({
        displayName,
        uid: user.uid,
        walletBalance,
        createdByAdmin: context.auth.uid,
        t,
        performChecks: false,
      });
  };

  t ? await executor(t) : await db().runTransaction(executor);

  if (shouldCreateProfile && sendSMSAlert) {
    await SMS.send({
      phoneNumbers: [phoneNumber],
      message: `Hi ${displayName}! your Waterlink Transporter profile has been created. To manage your business go to: http://business.waterlink.pk/`,
    });
  }

  return user;
});

export const createAdmin = withSuperAdmin(async (config, data, context) => {
  sgMail.setApiKey(functions.config().sendgrid.key);
  const {email, password, displayName, sendEmailAlert = true} = data;

  //STEP1: preconditions
  if (!(email && password && displayName))
    throw `invalid arguments. 'email', 'password' and 'displayName' are required`;

  //STEP2 create admin record in auth table
  const user = await auth().createUser({
    email,
    password,
    emailVerified: true,
    displayName,
  });

  //STEP3: create admin reacord in the users collection
  await refs.users.doc(user.uid).set(Admin.get_new_doc({email, displayName}));

  //STEP4 set custom claims for identification as admin (role)
  await auth().setCustomUserClaims(user.uid, {admin: true});

  //STEP5: send email alert
  if (sendEmailAlert)
    await sgMail
      .send({
        to: email,
        from: 'info@waterlink.pk',
        subject: 'Waterlink Admin account created!',
        text: `Hi ${displayName}! your Waterlink Admin account has been created!\n\nEmail: ${email}\nPassword: ${password}`,
        html: `
      <div style="font-family: Calibri, Helvetica, sans-serif;">
        <h1 style="text-align:center;">Waterlink Admin account created!</h1>

        <p>Hi ${displayName}! your Waterlink Admin account has been created. Please use the following information 
        to log into Waterlink Admin Panel.</p>

        <table style="width:95%; background-color: #ddd">
          <tr>
              <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
                Admin Panel Url
              </td>
              <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
                https://admin.waterlink.pk/
              </td>
          </tr>
          <tr>
            <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
               Email
            </td>
            <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
              ${email}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
               Password
            </td>
            <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
              ${password}
            </td>
          </tr>
        </table>

        <p><strong>NOTE:</strong> Please update your password at first login.</p>
      </div>
      `,
      })
      .catch((e) =>
        console.error('Admin.create_admin error sending email:', e),
      );
});
