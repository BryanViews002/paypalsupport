import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c2e2f; max-width: 600px; margin: 0 auto; border: 1px solid #eaebec; border-top: 5px solid #0070ba;">
      <div style="padding: 30px;">
        <img src="https://www.paypalobjects.com/marketing/web/icons/monogram/pp32.png" alt="PayPal" style="height: 32px; margin-bottom: 24px; display: block;" />
        <h2 style="font-weight: 300; font-size: 28px; line-height: 36px; margin: 0 0 24px 0; color: #2c2e2f;">
          Hello ${name},
        </h2>
        <p style="font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          You have a new message from PayPal Customer Support regarding your recent inquiry.
        </p>
        <div style="background-color: #f7f9fa; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
          <p style="font-size: 16px; line-height: 24px; margin: 0;">
            ${message}
          </p>
        </div>
        <p style="font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          To reply, please return to your secure support chat session.
        </p>
        <p style="font-size: 16px; line-height: 24px; margin: 0;">
          Thanks,<br>
          <strong>PayPal Support Team</strong>
        </p>
      </div>
      <div style="background-color: #f7f9fa; padding: 20px 30px; border-top: 1px solid #eaebec; text-align: left; font-size: 12px; line-height: 18px; color: #687173;">
        <p style="margin: 0 0 10px 0;">Please do not reply to this email. We are unable to respond to inquiries sent to this address.</p>
        <p style="margin: 0;">Copyright &copy; ${new Date().getFullYear()} PayPal, Inc. All rights reserved. PayPal is located at 2211 N. First St., San Jose, CA 95131.</p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'paypalsmartsupsupport@gmail.com',
        pass: 'xiiy kxje obxc mrem'
      }
    });

    const info = await transporter.sendMail({
      from: '"PayPal Support" <paypalsmartsupsupport@gmail.com>',
      to: email, // Can send to any address now!
      subject: 'Update on your PayPal Support Case',
      html: htmlContent
    });

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: error.message });
  }
}
