const nodemailer = require('nodemailer');

// Create Nodemailer Transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback test/development logger if credentials not populated yet
  return null;
};

/**
 * Send Verification OTP Email
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP verification code
 * @param {string} type - 'signup' or 'reset'
 */
const sendOTPEmail = async (toEmail, otpCode, type = 'signup') => {
  const isSignup = type === 'signup';
  const title = isSignup ? 'Verify Your Keyline Design Account' : 'Reset Your Keyline Design Password';
  const actionText = isSignup 
    ? 'Use the following 6-digit verification code to complete your Keyline Design account sign up:' 
    : 'Use the following 6-digit code to reset your Keyline Design account password:';

  console.log(`\n==================================================`);
  console.log(`✉️  EMAIL OTP SENT TO [${toEmail}]: ${otpCode} (${type})`);
  console.log(`==================================================\n`);

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('ℹ️ SMTP_PASS not set yet. OTP logged above for development test.');
      return { success: true, simulated: true };
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; padding: 12px; background: rgba(245, 158, 11, 0.15); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3);">
            <span style="font-size: 20px; font-weight: 800; color: #f59e0b; letter-spacing: 1.5px;">KEYLINE DESIGN</span>
          </div>
        </div>

        <h2 style="font-size: 22px; font-weight: 700; text-align: center; color: #ffffff; margin-bottom: 12px;">${title}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; text-align: center; margin-bottom: 24px;">
          ${actionText}
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; padding: 16px 36px; background: #18181b; border: 2px dashed #f59e0b; border-radius: 12px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #fbbf24;">${otpCode}</span>
          </div>
        </div>

        <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this verification code, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #27272a; margin: 28px 0 16px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Keyline Design Studio. All rights reserved.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Keyline Design Security" <${process.env.SMTP_USER || 'no-reply@keylinedesign.com'}>`,
      to: toEmail,
      subject: isSignup ? `${otpCode} is your Keyline Design Email Verification Code` : `${otpCode} is your Password Reset Code`,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Error sending email via SMTP:', err);
    // Still allow flow in dev mode so developer is not blocked
    return { success: true, simulated: true, error: err.message };
  }
};

module.exports = {
  sendOTPEmail,
};
