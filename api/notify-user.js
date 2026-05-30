import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'paypalsmartsupsupport@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #2c2e2f; max-width: 600px; margin: 0 auto; border: 1px solid #eaebec; border-top: 4px solid #0070ba;">
      <div style="padding: 30px;">
        <h2 style="font-weight: 400; font-size: 24px; margin: 0 0 20px 0; color: #2c2e2f;">Hello ${name},</h2>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
          Our support team has responded to your recent inquiry. Here is their message:
        </p>
        <div style="background-color: #f7f9fa; padding: 20px; border-radius: 4px; margin-bottom: 24px; border-left: 4px solid #0070ba;">
          <p style="font-size: 15px; line-height: 24px; margin: 0;">${message}</p>
        </div>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
          To continue this conversation, please return to your support chat session.
        </p>
        <p style="font-size: 15px; margin: 0;">
          Thank you,<br>
          <strong>Customer Support Team</strong>
        </p>
      </div>
      <div style="background-color: #f7f9fa; padding: 16px 30px; border-top: 1px solid #eaebec; font-size: 11px; color: #687173;">
        <p style="margin: 0;">You are receiving this email because you submitted a support request. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Customer Support" <paypalsmartsupsupport@gmail.com>',
      to: email,
      replyTo: 'paypalsmartsupsupport@gmail.com',
      subject: `Re: Your Support Request`,
      text: `Hello ${name},\n\nOur support team has responded to your inquiry:\n\n"${message}"\n\nThank you,\nCustomer Support Team`,
      html: htmlContent
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: error.message });
  }
}
