import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const results = {};

  if (!process.env.GMAIL_APP_PASSWORD) {
    return res.status(200).json({ error: 'GMAIL_APP_PASSWORD is missing' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'paypalsmartsupsupport@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Test 1: Admin notification email
  try {
    await transporter.sendMail({
      from: '"Support App" <paypalsmartsupsupport@gmail.com>',
      to: 'paypalsmartsupsupport@gmail.com',
      replyTo: 'bryanjoe0012@gmail.com',
      subject: 'New Support Request from Bryan Joe',
      text: 'New support request from Bryan Joe (bryanjoe0012@gmail.com).\nTopic: Account access or security\nMessage: This is a test message to the admin.',
      html: '<p>New support request from <strong>Bryan Joe</strong> (bryanjoe0012@gmail.com).</p><p><strong>Topic:</strong> Account access or security</p><p><strong>Message:</strong> This is a test message to the admin.</p>',
      headers: { 'X-Priority': '1', 'Importance': 'high' },
    });
    results.adminEmailSent = true;
    results.adminEmailTo = 'paypalsmartsupsupport@gmail.com';
  } catch (error) {
    results.adminEmailSent = false;
    results.adminEmailError = error.message;
  }

  // Test 2: User notification email
  try {
    await transporter.sendMail({
      from: '"Customer Support" <paypalsmartsupsupport@gmail.com>',
      to: 'bryanjoe0012@gmail.com',
      replyTo: 'paypalsmartsupsupport@gmail.com',
      subject: 'Re: Your Support Request',
      text: 'Hello Bryan Joe,\n\nOur support team has responded to your inquiry:\n\n"Thank you for reaching out. We have received your message and will assist you shortly."\n\nThank you,\nCustomer Support Team',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eaebec;border-top:4px solid #0070ba;">
          <div style="padding:30px;">
            <h2 style="font-weight:400;color:#2c2e2f;">Hello Bryan Joe,</h2>
            <p style="font-size:15px;line-height:24px;">Our support team has responded to your recent inquiry:</p>
            <div style="background:#f7f9fa;padding:20px;border-left:4px solid #0070ba;margin-bottom:24px;">
              <p style="margin:0;">Thank you for reaching out. We have received your message and will assist you shortly.</p>
            </div>
            <p style="font-size:15px;">Thank you,<br><strong>Customer Support Team</strong></p>
          </div>
        </div>
      `,
    });
    results.userEmailSent = true;
    results.userEmailTo = 'bryanjoe0012@gmail.com';
  } catch (error) {
    results.userEmailSent = false;
    results.userEmailError = error.message;
  }

  results.overall = (results.adminEmailSent && results.userEmailSent) ? 'ALL_OK' : 'PARTIAL_FAILURE';
  return res.status(200).json(results);
}
