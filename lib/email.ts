import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  // If Resend is not configured, log the email instead
  if (!resend || !process.env.RESEND_API_KEY) {
    console.log('📧 Email would be sent (Resend not configured):');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text || html);
    return { success: true, messageId: 'logged' };
  }

  try {
    // Use custom domain if configured, otherwise fall back to default
    let from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';
    
    // If a custom domain is configured, use it (even in development)
    // This allows sending to any email address once domain is verified
    // Only use default domain if no custom domain is configured
    
    const emailPayload: Record<string, string> = { from, to, subject };
    if (html) emailPayload.html = html;
    if (text) emailPayload.text = text;
    const { data, error } = await resend.emails.send(emailPayload as any);

    if (error) {
      console.error('Resend email error:', error);
      
      // If domain verification error, try with default domain
      if (error.statusCode === 403 && error.message?.includes('domain is not verified')) {
        console.log('⚠️  Custom domain not verified. Retrying with default Resend domain...');
        const retryPayload: Record<string, string> = { from: 'onboarding@resend.dev', to, subject };
        if (html) retryPayload.html = html;
        if (text) retryPayload.text = text;
        const { data: retryData, error: retryError } = await resend.emails.send(retryPayload as any);
        
        if (retryError) {
          console.error('Resend email error (retry):', retryError);
          throw retryError;
        }
        
        return { success: true, messageId: retryData?.id || 'sent' };
      }
      
      throw error;
    }

    return { success: true, messageId: data?.id || 'sent' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: 'Verify your Carouslk account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #ffd700; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Carouslk!</h1>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Carouslk! Please verify your email by visiting: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: 'Reset your Carouslk password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #ffd700; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <div class="footer">
              <p>For security reasons, this link can only be used once.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
}
