const brevo = require('@getbrevo/brevo');
let apiInstance = new brevo.TransactionalEmailsApi();

// Function to send OTP verification email (general purpose)
export async function sendVerificationEmail(email: string, code: string, name: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "OTP Verification - Kamero Research Base";
  sendSmtpEmail.htmlContent = `
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
  </head>
  <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; line-height: 1.6;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
          OTP Verification
        </h1>
        <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 14px;">
          Kamero Research Base
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 24px;">
        <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
          Hello ${name},
        </p>
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
          Please use the following verification code to complete your authentication:
        </p>
        
        <!-- OTP Code Box -->
        <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="color: #0f766e; font-size: 12px; margin: 0 0 8px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
            Verification Code
          </p>
          <div style="background: #ffffff; border: 1px solid #0d9488; border-radius: 4px; padding: 12px; display: inline-block;">
            <span style="font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #0d9488; letter-spacing: 2px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
            This code expires in 10 minutes
          </p>
        </div>
        
        <!-- Security Notice -->
        <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px; border-radius: 0 4px 4px 0; margin: 20px 0;">
          <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
            Security Notice:
          </p>
          <p style="color: #78350f; font-size: 12px; margin: 4px 0 0 0;">
            Never share this code. We'll never ask for it via phone or email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #0d9488; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
  sendSmtpEmail.to = [{ "email": email, "name": name }];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
  sendSmtpEmail.headers = { "X-Kamero-Service": "otp-verification" };
  sendSmtpEmail.params = { "user_name": name, "verification_code": code };
  
  return new Promise((resolve, reject) => {
    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
      console.log('✅ OTP verification email sent successfully');
      resolve();
    }, function (error: any) {
      console.error('❌ Failed to send OTP email:', error);
      reject(error);
    });
  });
}

// Function to send password reset OTP email
export async function sendChangePasswordVerificationEmail(email: string, code: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Password Reset OTP - Kamero Research Base";
  sendSmtpEmail.htmlContent = `
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
  </head>
  <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdfa; line-height: 1.6;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #ccfbf1;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
          Password Reset OTP
        </h1>
        <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 14px;">
          Kamero Research Base
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 24px;">
        <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
          Hello,
        </p>
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
          Please use the following code to reset your password:
        </p>
        
        <!-- OTP Code Box -->
        <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="color: #0f766e; font-size: 12px; margin: 0 0 8px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
            Reset Code
          </p>
          <div style="background: #ffffff; border: 1px solid #0d9488; border-radius: 4px; padding: 12px; display: inline-block;">
            <span style="font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #0d9488; letter-spacing: 2px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
            This code expires in 10 minutes
          </p>
        </div>
        
        <!-- Security Notice -->
        <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px; border-radius: 0 4px 4px 0; margin: 20px 0;">
          <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
            Security Alert:
          </p>
          <p style="color: #78350f; font-size: 12px; margin: 4px 0 0 0;">
            If you didn't request this, contact support immediately at info@kamero.rw
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #0d9488; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
  sendSmtpEmail.to = [{ "email": email, "name": "User" }];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
  sendSmtpEmail.headers = { "X-Kamero-Service": "password-reset" };
  sendSmtpEmail.params = { "reset_code": code };
  
  return new Promise((resolve, reject) => {
    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
      console.log('✅ Password reset OTP email sent successfully');
      resolve();
    }, function (error: any) {
      console.error('❌ Failed to send password reset email:', error);
      reject(error);
    });
  });
}

// Function to send password change confirmation email
export async function sendChangePasswordConfirmationEmail(email: string): Promise<void> {

  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Password Updated - Kamero Research Base";
  sendSmtpEmail.htmlContent = `
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Updated</title>
  </head>
  <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdfa; line-height: 1.6;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #ccfbf1;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
          Password Updated
        </h1>
        <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 14px;">
          Kamero Research Base
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 24px;">
        <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
          Hello,
        </p>
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
          Your password has been successfully updated. Your account is now secured with your new password.
        </p>
        
        <!-- Success Confirmation -->
        <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="width: 40px; height: 40px; background: #0d9488; border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: #ffffff; font-size: 20px; font-weight: bold;">✓</span>
          </div>
          <p style="color: #0f766e; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Password Change Confirmed
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Updated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
        <!-- Security Notice -->
        <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px; border-radius: 0 4px 4px 0; margin: 20px 0;">
          <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
            Security Tip:
          </p>
          <p style="color: #78350f; font-size: 12px; margin: 4px 0 0 0;">
            Keep your password confidential and use a unique password.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #0d9488; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  
  sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
  sendSmtpEmail.to = [{ "email": email, "name": "User" }];
  sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
  sendSmtpEmail.headers = { "X-Kamero-Service": "password-confirmation" };
  sendSmtpEmail.params = { "confirmation_time": new Date().toISOString() };
  
  return new Promise((resolve, reject) => {
    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data: any) {
      console.log('✅ Password change confirmation email sent successfully');
      resolve();
    }, function (error: any) {
      console.error('❌ Failed to send password confirmation email:', error);
      reject(error);
    });
  });
}