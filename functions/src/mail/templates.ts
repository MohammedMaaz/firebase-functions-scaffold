//@ts-nocheck

const create_admin = (displayName, email, password) => `
<div style="font-family: Calibri, Helvetica, sans-serif;">
  <h1 style="text-align:center;">Admin account created!</h1>

  <p>Hi ${displayName}! your Admin account has been created. Please use the following information 
  to log into Admin Panel.</p>

  <table style="width:95%; background-color: #ddd">
    <tr>
        <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
          Admin Panel Url
        </td>
        <td style="padding: 20px 10px; font-size: 14pt; color: #333;">
          https://admin.myapp.com/
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
`;

const MailTemplates = {
  create_admin,
};

export default MailTemplates;
