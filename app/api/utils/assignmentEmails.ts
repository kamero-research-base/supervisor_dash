// app/api/utils/assignmentEmails.ts
// Complete assignment notification emails using Brevo - Replaces emailService.ts

const brevo = require('@getbrevo/brevo');
let apiInstance = new brevo.TransactionalEmailsApi();

interface AssignmentEmailData {
  studentEmail: string;
  studentName: string;
  assignmentTitle: string;
  assignmentDescription: string;
  supervisorName: string;
  dueDate: string;
  customMessage?: string;
  assignmentUrl?: string;
}

interface UninviteEmailData {
  studentEmail: string;
  studentName: string;
  assignmentTitle: string;
  supervisorName: string;
  reason?: string;
}

interface GradeNotificationData {
  studentEmail: string;
  studentName: string;
  assignmentTitle: string;
  supervisorName: string;
  score: number;
  maxScore: number;
  feedback?: string;
  assignmentUrl?: string;
}

interface StatusChangeEmailData {
  studentEmail: string;
  studentName: string;
  assignmentTitle: string;
  supervisorName: string;
  isActive: boolean;
  dueDate: string;
  assignmentUrl?: string;
  reason?: string;
}

// Function to send assignment invitation email
export async function sendAssignmentInvitationEmail(data: AssignmentEmailData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `📚 New Assignment: ${data.assignmentTitle}`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Assignment Invitation</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdfa; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #ccfbf1;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            📚 New Assignment Invitation
          </h1>
          <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
            You have been invited to participate in a new assignment by your instructor <strong>${data.supervisorName}</strong>.
          </p>
          
          <!-- Assignment Details Box -->
          <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0f766e; font-size: 16px; margin: 0 0 12px 0;">📝 ${data.assignmentTitle}</h3>
            <p style="color: #4b5563; font-size: 14px; margin: 0 0 12px 0; line-height: 1.5;"><strong>Description:</strong> ${data.assignmentDescription}</p>
            <div style="background: #ffffff; border-left: 4px solid #dc2626; padding: 12px; border-radius: 0 4px 4px 0; margin: 12px 0;">
              <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0;">
                📅 <strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">👨‍🏫 <strong>Instructor:</strong> ${data.supervisorName}</p>
          </div>
          
          ${data.customMessage ? `
          <!-- Custom Message -->
          <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 15px; border-radius: 0 4px 4px 0; margin: 20px 0;">
            <p style="color: #92400e; font-size: 12px; margin: 0 0 6px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
              💬 Message from Instructor:
            </p>
            <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.5;">
              "${data.customMessage}"
            </p>
          </div>
          ` : ''}
          
          ${data.assignmentUrl ? `
          <!-- Action Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.assignmentUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);">
              🚀 View Assignment Details
            </a>
          </div>
          ` : ''}
          
          <!-- Instructions -->
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">
              📋 What to do next:
            </p>
            <ul style="color: #1f2937; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li>Log in to your student portal</li>
              <li>Review assignment requirements and attachments</li>
              <li>Begin working on your submission</li>
              <li>Submit before the deadline</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0 0; line-height: 1.6;">
            If you have any questions about this assignment, please contact your instructor directly or reach out to our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #0d9488; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">
            Need help? Contact us at info@kamero.rw
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "assignment-invitation" };
    sendSmtpEmail.params = { 
      "student_name": data.studentName, 
      "assignment_title": data.assignmentTitle,
      "supervisor_name": data.supervisorName,
      "due_date": data.dueDate
    };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`✅ Assignment invitation email sent successfully to ${data.studentEmail}`);
        console.log(`📚 Assignment: "${data.assignmentTitle}" | 👨‍🎓 Student: ${data.studentName}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send assignment invitation email:', error);
        resolve(false); // Don't reject, just return false so the process continues
      });
    });
  } catch (error) {
    console.error('❌ Assignment invitation email error:', error);
    return false;
  }
}

// Function to send assignment status change notification email (NEW)
export async function sendAssignmentStatusChangeEmail(data: StatusChangeEmailData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    const statusText = data.isActive ? 'Reactivated' : 'Deactivated';
    const statusEmoji = data.isActive ? '✅' : '⏸️';
    const statusColor = data.isActive ? '#059669' : '#f59e0b';
    const statusBgColor = data.isActive ? '#ecfdf5' : '#fffbeb';
    const statusBorderColor = data.isActive ? '#10b981' : '#f59e0b';
    
    sendSmtpEmail.subject = `${statusEmoji} Assignment ${statusText}: ${data.assignmentTitle}`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Status Changed</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${statusBgColor}; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid ${statusBorderColor};">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor === '#059669' ? '#047857' : '#d97706'} 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            ${statusEmoji} Assignment ${statusText}
          </h1>
          <p style="color: ${statusColor === '#059669' ? '#a7f3d0' : '#fde68a'}; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          
          <!-- Status Change Notice -->
          <div style="background: ${statusBgColor}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; border-radius: 0 4px 4px 0;">
            <p style="color: ${statusColor === '#059669' ? '#065f46' : '#92400e'}; font-weight: 600; margin: 0 0 8px 0; font-size: 15px;">
              ${statusEmoji} Assignment Status Update
            </p>
            <p style="color: ${statusColor === '#059669' ? '#047857' : '#78350f'}; margin: 0; font-size: 14px; line-height: 1.5;">
              Your assignment <strong>"${data.assignmentTitle}"</strong> has been <strong>${data.isActive ? 'reactivated' : 'temporarily deactivated'}</strong> by your instructor <strong>${data.supervisorName}</strong>.
            </p>
          </div>
          
          <!-- Assignment Details -->
          <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: ${statusColor}; font-size: 16px; margin: 0 0 12px 0;">📝 ${data.assignmentTitle}</h3>
            <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">👨‍🏫 <strong>Instructor:</strong> ${data.supervisorName}</p>
            ${data.isActive ? `
            <div style="background: #ffffff; border-left: 4px solid #dc2626; padding: 12px; border-radius: 0 4px 4px 0; margin: 12px 0;">
              <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0;">
                📅 <strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            ` : ''}
            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">📅 <strong>Status changed on:</strong> ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          ${data.reason ? `
          <!-- Reason -->
          <div style="background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 15px; border-radius: 0 4px 4px 0; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 12px; margin: 0 0 6px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
              💬 Message from Instructor:
            </p>
            <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.5;">
              ${data.reason}
            </p>
          </div>
          ` : ''}
          
          ${data.assignmentUrl && data.isActive ? `
          <!-- Action Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.assignmentUrl}" style="display: inline-block; background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor === '#059669' ? '#047857' : '#d97706'} 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              🚀 Continue Working
            </a>
          </div>
          ` : ''}
          
          <!-- Information Box -->
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">
              ℹ️ What this means:
            </p>
            <ul style="color: #1f2937; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.5;">
              ${data.isActive ? `
              <li>You can now access and work on this assignment</li>
              <li>The assignment deadline is still in effect</li>
              <li>Submit your work before the due date</li>
              <li>Contact your instructor if you have questions</li>
              ` : `
              <li>This assignment is temporarily unavailable for submissions</li>
              <li>Any work in progress is saved but cannot be submitted</li>
              <li>Your instructor will notify you when it's reactivated</li>
              <li>Contact your instructor if you have concerns</li>
              `}
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0 0; line-height: 1.6;">
            If you have any questions about this status change, please contact your instructor <strong>${data.supervisorName}</strong> directly.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: ${statusColor}; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated notification. Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">
            Need help? Contact us at info@kamero.rw
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "assignment-status-change" };
    sendSmtpEmail.params = {
      "student_name": data.studentName,
      "assignment_title": data.assignmentTitle,
      "supervisor_name": data.supervisorName,
      "status": data.isActive ? 'active' : 'inactive'
    };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`✅ Assignment status change email sent successfully to ${data.studentEmail}`);
        console.log(`${statusEmoji} Assignment: "${data.assignmentTitle}" | Status: ${data.isActive ? 'Active' : 'Inactive'} | 👨‍🎓 Student: ${data.studentName}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send assignment status change email:', error);
        resolve(false); // Don't reject, just return false so the process continues
      });
    });
  } catch (error) {
    console.error('❌ Assignment status change email error:', error);
    return false;
  }
}

// Function to send assignment removal notification email
export async function sendAssignmentRemovalEmail(data: UninviteEmailData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `📋 Assignment Removed: ${data.assignmentTitle}`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Removed</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef7f0; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #fed7aa;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            📋 Assignment Update
          </h1>
          <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          
          <!-- Notice Box -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 4px 4px 0;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 8px 0; font-size: 15px;">
              📢 Assignment Update Notice
            </p>
            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">
              You have been removed from the assignment <strong>"${data.assignmentTitle}"</strong> by your instructor <strong>${data.supervisorName}</strong>.
            </p>
          </div>
          
          <!-- Assignment Details -->
          <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ea580c; font-size: 16px; margin: 0 0 12px 0;">📝 ${data.assignmentTitle}</h3>
            <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">👨‍🏫 <strong>Instructor:</strong> ${data.supervisorName}</p>
            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">📅 <strong>Removed on:</strong> ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          ${data.reason ? `
          <!-- Reason -->
          <div style="background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 15px; border-radius: 0 4px 4px 0; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 12px; margin: 0 0 6px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
              💬 Reason:
            </p>
            <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.5;">
              ${data.reason}
            </p>
          </div>
          ` : ''}
          
          <!-- Information Box -->
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">
              ℹ️ What this means:
            </p>
            <ul style="color: #1f2937; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li>You no longer have access to this assignment</li>
              <li>Any work in progress will not be submitted</li>
              <li>This change is effective immediately</li>
              <li>Contact your instructor if you have questions</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0 0; line-height: 1.6;">
            If you believe this is an error or have questions about this change, please contact your instructor <strong>${data.supervisorName}</strong> directly.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #ea580c; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">
            Need help? Contact us at info@kamero.rw
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "assignment-removal" };
    sendSmtpEmail.params = { 
      "student_name": data.studentName, 
      "assignment_title": data.assignmentTitle,
      "supervisor_name": data.supervisorName,
      "removal_date": new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`✅ Assignment removal email sent successfully to ${data.studentEmail}`);
        console.log(`📋 Assignment: "${data.assignmentTitle}" | 👨‍🎓 Student: ${data.studentName}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send assignment removal email:', error);
        resolve(false); // Don't reject, just return false so the process continues
      });
    });
  } catch (error) {
    console.error('❌ Assignment removal email error:', error);
    return false;
  }
}

// Function to send assignment reminder email
export async function sendAssignmentReminderEmail(data: AssignmentEmailData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `⏰ Reminder: ${data.assignmentTitle} - Due Soon`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Reminder</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fffbeb; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #fed7aa;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            ⏰ Assignment Reminder
          </h1>
          <p style="color: #fde68a; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 4px 4px 0;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 8px 0; font-size: 15px;">
              📢 Friendly Reminder!
            </p>
            <p style="color: #78350f; margin: 0; font-size: 14px;">
              Your assignment <strong>"${data.assignmentTitle}"</strong> is due soon. Don't forget to submit it!
            </p>
          </div>
          
          <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 18px;">📅 Due Date</h3>
            <p style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 0;">
              ${new Date(data.dueDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
            If you haven't started yet, please begin working on your assignment as soon as possible. If you've already started, please ensure you submit it before the deadline.
          </p>
          
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">
              ✅ Quick checklist:
            </p>
            <ul style="color: #1f2937; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li>Review the assignment requirements</li>
              <li>Check for any attachments or resources</li>
              <li>Complete your work</li>
              <li>Submit before the deadline</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6;">
            Contact <strong>${data.supervisorName}</strong> if you have any questions or need assistance.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated reminder. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "assignment-reminder" };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`✅ Assignment reminder email sent successfully to ${data.studentEmail}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send assignment reminder email:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Assignment reminder email error:', error);
    return false;
  }
}

// Function to send assignment deadline warning email (URGENT)
export async function sendDeadlineWarningEmail(data: AssignmentEmailData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Calculate time remaining
    const now = new Date();
    const dueDate = new Date(data.dueDate);
    const hoursRemaining = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    sendSmtpEmail.subject = `🚨 URGENT: ${data.assignmentTitle} - Due in ${hoursRemaining} Hours!`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Urgent Assignment Deadline Warning</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef2f2; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 2px solid #fca5a5;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            🚨 URGENT DEADLINE WARNING
          </h1>
          <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          
          <!-- Urgent Alert Box -->
          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 24px;">⚠️ FINAL NOTICE ⚠️</h2>
            <p style="color: #b91c1c; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
              Your assignment <strong>"${data.assignmentTitle}"</strong> is due VERY SOON!
            </p>
            <div style="background: #dc2626; color: white; padding: 12px; border-radius: 4px; font-size: 18px; font-weight: bold; margin: 12px 0;">
              ⏰ ${hoursRemaining} ${hoursRemaining === 1 ? 'HOUR' : 'HOURS'} REMAINING
            </div>
            <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
              Submit immediately to avoid late penalties!
            </p>
          </div>
          
          <!-- Assignment Details -->
          <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 12px 0;">📝 ${data.assignmentTitle}</h3>
            <div style="background: #ffffff; border-left: 4px solid #dc2626; padding: 12px; border-radius: 0 4px 4px 0; margin: 12px 0;">
              <p style="color: #dc2626; font-size: 16px; font-weight: 700; margin: 0;">
                📅 <strong>DEADLINE:</strong> ${new Date(data.dueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">👨‍🏫 <strong>Instructor:</strong> ${data.supervisorName}</p>
          </div>
          
          ${data.assignmentUrl ? `
          <!-- Action Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.assignmentUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3); text-transform: uppercase;">
              🚀 SUBMIT NOW
            </a>
          </div>
          ` : ''}
          
          <!-- Emergency Checklist -->
          <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
              🔥 EMERGENCY CHECKLIST:
            </p>
            <ul style="color: #78350f; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li><strong>STOP</strong> everything else and focus on this assignment</li>
              <li>Submit whatever you have completed (partial credit is better than zero)</li>
              <li>Check the submission platform is working properly</li>
              <li>Contact your instructor immediately if you need help</li>
              <li>Submit at least 30 minutes before the deadline</li>
            </ul>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
              📞 Need immediate help?
            </p>
            <p style="color: #b91c1c; font-size: 14px; margin: 0;">
              Contact <strong>${data.supervisorName}</strong> right now or email info@kamero.rw
            </p>
          </div>
          
          <p style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 16px 0 0 0; text-align: center;">
            ⚠️ ACT NOW - TIME IS RUNNING OUT! ⚠️
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 2px solid #fca5a5; text-align: center; background: #fef2f2;">
          <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base - URGENT ALERT
          </p>
          <p style="color: #991b1b; font-size: 11px; margin: 0;">
            This is a critical deadline warning. Submit your assignment immediately.
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base - URGENT", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Emergency Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "deadline-warning", "X-Priority": "1" };
    sendSmtpEmail.params = {
      "student_name": data.studentName,
      "assignment_title": data.assignmentTitle,
      "supervisor_name": data.supervisorName,
      "hours_remaining": hoursRemaining.toString()
    };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`🚨 URGENT deadline warning email sent successfully to ${data.studentEmail}`);
        console.log(`⏰ Assignment: "${data.assignmentTitle}" | ⚠️ ${hoursRemaining} hours remaining | 👨‍🎓 Student: ${data.studentName}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send deadline warning email:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Deadline warning email error:', error);
    return false;
  }
}

// Function to send grade notification email
export async function sendGradeNotificationEmail(data: GradeNotificationData): Promise<boolean> {
  try {
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    const percentage = Math.round((data.score / data.maxScore) * 100);
    const gradeColor = percentage >= 70 ? '#059669' : percentage >= 50 ? '#f59e0b' : '#dc2626';
    const gradeEmoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '📊' : '📈';
    
    sendSmtpEmail.subject = `${gradeEmoji} Grade Available: ${data.assignmentTitle} - ${percentage}%`;
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Grade Available</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdf4; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #bbf7d0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${gradeColor} 0%, ${gradeColor === '#059669' ? '#047857' : gradeColor === '#f59e0b' ? '#d97706' : '#b91c1c'} 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
            ${gradeEmoji} Assignment Grade Available
          </h1>
          <p style="color: ${gradeColor === '#059669' ? '#a7f3d0' : gradeColor === '#f59e0b' ? '#fde68a' : '#fca5a5'}; margin: 8px 0 0 0; font-size: 14px;">
            Kamero Research Base
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #1f2937; font-size: 15px; margin: 0 0 20px 0;">
            Dear <strong>${data.studentName}</strong>,
          </p>
          
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
            Your assignment <strong>"${data.assignmentTitle}"</strong> has been graded by <strong>${data.supervisorName}</strong>.
          </p>
          
          <!-- Grade Display Box -->
          <div style="background: #f9fafb; border: 2px solid ${gradeColor}; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
            <h3 style="color: ${gradeColor}; margin: 0 0 16px 0; font-size: 18px;">${gradeEmoji} Your Grade</h3>
            <div style="background: ${gradeColor}; color: white; padding: 20px; border-radius: 8px; margin: 12px 0;">
              <div style="font-size: 36px; font-weight: bold; margin: 0 0 8px 0;">
                ${data.score} / ${data.maxScore}
              </div>
              <div style="font-size: 24px; font-weight: 600;">
                ${percentage}%
              </div>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">
              Assignment: <strong>${data.assignmentTitle}</strong>
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">
              Graded by: <strong>${data.supervisorName}</strong>
            </p>
          </div>
          
          ${data.feedback ? `
          <!-- Feedback Section -->
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 6px 6px 0; margin: 20px 0;">
            <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💬 Instructor Feedback</h4>
            <div style="background: white; padding: 16px; border-radius: 4px; border: 1px solid #bfdbfe;">
              <p style="color: #1f2937; margin: 0; line-height: 1.6; font-size: 14px;">
                "${data.feedback}"
              </p>
            </div>
          </div>
          ` : ''}
          
          ${data.assignmentUrl ? `
          <!-- View Details Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.assignmentUrl}" style="display: inline-block; background: linear-gradient(135deg, ${gradeColor} 0%, ${gradeColor === '#059669' ? '#047857' : gradeColor === '#f59e0b' ? '#d97706' : '#b91c1c'} 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              📋 View Full Grade Report
            </a>
          </div>
          ` : ''}
          
          <!-- Grade Interpretation -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #475569; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">
              📊 Grade Information:
            </p>
            <div style="color: #64748b; font-size: 13px; line-height: 1.5;">
              ${percentage >= 90 ? '🌟 Excellent work! Outstanding performance.' : 
                percentage >= 80 ? '✨ Great job! Very good performance.' :
                percentage >= 70 ? '👍 Good work! Satisfactory performance.' :
                percentage >= 60 ? '📈 Fair performance. Consider reviewing the material.' :
                percentage >= 50 ? '⚠️ Below average. Additional study recommended.' :
                '📚 Needs improvement. Please see your instructor for support.'}
            </div>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0 0; line-height: 1.6;">
            You can view your detailed grade report and feedback in your student portal. If you have questions about your grade, please contact your instructor during office hours.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 24px; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: ${gradeColor}; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            Kamero Research Base
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            This is an automated grade notification. Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">
            Questions about your grade? Contact your instructor directly.
          </p>
        </div>
      </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Kamero Research Base", "email": "noreply@kamero.rw" };
    sendSmtpEmail.to = [{ "email": data.studentEmail, "name": data.studentName }];
    sendSmtpEmail.replyTo = { "email": "info@kamero.rw", "name": "Kamero Support" };
    sendSmtpEmail.headers = { "X-Kamero-Service": "grade-notification" };
    sendSmtpEmail.params = {
      "student_name": data.studentName,
      "assignment_title": data.assignmentTitle,
      "supervisor_name": data.supervisorName,
      "score": data.score.toString(),
      "max_score": data.maxScore.toString(),
      "percentage": percentage.toString()
    };
    
    return new Promise((resolve, reject) => {
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (response: any) {
        console.log(`✅ Grade notification email sent successfully to ${data.studentEmail}`);
        console.log(`📊 Assignment: "${data.assignmentTitle}" | 🎯 Grade: ${data.score}/${data.maxScore} (${percentage}%) | 👨‍🎓 Student: ${data.studentName}`);
        resolve(true);
      }, function (error: any) {
        console.error('❌ Failed to send grade notification email:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Grade notification email error:', error);
    return false;
  }
}

// Convenience function for backward compatibility with the old emailService.ts interface
export async function sendAssignmentInvitationEmailOld(
  studentEmail: string, 
  studentName: string, 
  assignmentTitle: string, 
  assignmentDescription: string,
  supervisorName: string,
  dueDate: string,
  customMessage?: string,
  assignmentUrl?: string
): Promise<boolean> {
  return sendAssignmentInvitationEmail({
    studentEmail,
    studentName,
    assignmentTitle,
    assignmentDescription,
    supervisorName,
    dueDate,
    customMessage,
    assignmentUrl
  });
}