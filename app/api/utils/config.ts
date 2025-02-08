
  const brevo = require('@getbrevo/brevo');
  let apiInstance = new brevo.TransactionalEmailsApi();
  

// Function to send verification email
export async function sendVerificationEmail(email: string, code: string, name: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Account Verification";
  sendSmtpEmail.htmlContent = `
  <html>
   <body>
    <h4 style="color: white;padding: 10px 20px; background: teal; font-size: 17px; border-radius: 8px; text-align: center;">ACCOUNT VERIFICATION</h4>
    <div style="color: gray; font-size: 14px; margin: 10px 0;">
     Dear ${name}, <br /> 
     It is pleasure to have you in contribution to Kamero Research Base, please verify your account to get started! 
     </div><br />
     <div style="background: silver; padding: 10px; font-size: 15px;">
      Verification code: <b>${code}</b>
     </div>
    <p style="margin: 10px 0; font-size: 14px; color: teal;">
     <br />
     Kamero Development Team
     <br />
     info@kamero.rw
     <br />
     +250781121117
    </p>
   </body>
  </html>`;
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "codereveur@gmail.com" };
  sendSmtpEmail.to = [
    { "email": email, "name": "Student" }
  ];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero" };
  sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };
  
  
  apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
    console.log('API called successfully. ');
  }, function (error: any) {
    console.error(error);
  });
  
}


// Function to send verification email
export async function sendChangePasswordVerificationEmail(email: string, code: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Email Verification";
  sendSmtpEmail.htmlContent = `
  <html>
   <body>
    <h4 style="color: white;padding: 10px 20px; background: teal; font-size: 17px; border-radius: 8px; text-align: center;">EMAIL VERIFICATION</h4>
    <div style="color: gray; font-size: 14px; margin: 10px 0;">
      Hello! <br/> Your request to change password has been proccessed, please verify your email
     </div><br />
     <div style="background: silver; padding: 10px; font-size: 15px;">
      Verification code: <b>${code}</b>
     </div>
    <p style="margin: 10px 0; font-size: 14px; color: teal;">
     <br />
     Kamero Development Team
     <br />
     info@kamero.rw
     <br />
     +250781121117
    </p>
   </body>
  </html>`;
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "codereveur@gmail.com" };
  sendSmtpEmail.to = [
    { "email": email, "name": "Student" }
  ];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero" };
  sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };
  
  
  apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
    console.log('API called successfully. ');
  }, function (error: any) {
    console.error(error);
  });
  
}

// Function to send verification email
export async function sendChangePasswordConfirmationEmail(email: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Password Change Confirmation";
  sendSmtpEmail.htmlContent = `
  <html>
   <body>
     
    <div style="font-size: 15px; margin: 10px 0; background: silver; padding: 15px;">
      Hi! <br />
      Your password has been changed successfully! Please visit your dashboard to learn more <a href="https://dashboard.kamero.rw"> Dashboard </a>
    </div>
    <p style="margin: 10px 0; font-size: 14px; color: teal;">
     <br />
     Kamero Development Team
     <br />
     info@kamero.rw
     <br />
     +250781121117
    </p>
   </body>
  </html>`;
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "codereveur@gmail.com" };
  sendSmtpEmail.to = [
    { "email": email, "name": "Student" }
  ];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero" };
  sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };
  
  
  apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
    console.log('API called successfully. ');
  }, function (error: any) {
    console.error(error);
  });
  
}
