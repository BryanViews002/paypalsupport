import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'paypalsmartsupsupport@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const htmlContent = `
    <div style="font-family: sans-serif; font-size: 16px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.5;">
      <p>Hello ${name},</p>
      <p>You have received a new message from Support:</p>
      <blockquote style="margin: 0; padding: 15px; border-left: 4px solid #0070ba; background-color: #f9f9f9; font-style: italic;">
        ${message}
      </blockquote>
      <p style="margin-top: 20px;">Please return to your chat session on the website to reply.</p>
      <br>
      <p style="font-size: 14px; color: #666;">Thank you,<br>Customer Support</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Customer Support" <paypalsmartsupsupport@gmail.com>',
      to: email,
      replyTo: 'paypalsmartsupsupport@gmail.com',
      subject: `New Message from Support`,
      text: `Hello ${name},\n\nYou have received a new message from Support:\n\n"${message}"\n\nPlease return to your chat session on the website to reply.\n\nThank you,\nCustomer Support`,
      html: htmlContent
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: error.message });
  }
}
