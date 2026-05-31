import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, category, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'paypalsmartsupsupport@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0070ba; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">New User Message</h1>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 15px; margin-bottom: 20px;">A user has sent a new message in the chat.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold; width: 30%;">Name:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${name || 'User'}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${email || 'N/A'}</td></tr>
        </table>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #0070ba; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Support App" <paypalsmartsupsupport@gmail.com>',
      to: 'paypalsmartsupsupport@gmail.com',
      replyTo: email,
      subject: `New Message from ${name || email}`,
      text: `New message from ${name} (${email}).\n\nMessage: ${message}`,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: error.message });
  }
}
