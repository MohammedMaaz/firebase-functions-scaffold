//@ts-nocheck
import { withSuperAdmin } from "../utils/cf";
import { auth, functions, refs } from "../utils/firebase_config";
import Admin from ".";
import Mail from "../mail";

export const createAdmin = withSuperAdmin(async (config, data, context) => {
  const { email, password, displayName, sendEmailAlert = true } = data;

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
  await refs.users.doc(user.uid).set(Admin.get_new_doc({ email, displayName }));

  //STEP4 set custom claims for identification as admin (role)
  await auth().setCustomUserClaims(user.uid, { admin: true });

  //STEP5: send email alert
  if (sendEmailAlert)
    await Mail.send({
      to: email,
      from: "info@waterlink.pk",
      subject: "Waterlink Admin account created!",
      text: `Hi ${displayName}! your Waterlink Admin account has been created!\n\nEmail: ${email}\nPassword: ${password}`,
      html: Mail.templates.create_admin(displayName, email, password),
    }).catch((e) =>
      console.error("Admin.create_admin error sending email:", e)
    );
});
