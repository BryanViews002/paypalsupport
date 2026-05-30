import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, category, message } = req.body;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0070ba; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">New Support Request</h1>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 15px; margin-bottom: 20px;">A new support request has been submitted. Please review and respond at your earliest convenience.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold; width: 30%;">Name:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${name}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${email}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Topic:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${category}</td></tr>
        </table>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #0070ba; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        Log in to the Admin Dashboard to reply.
      </div>
    </div>
  `;

  try {
    await sgMail.send({
      to: 'paypalsmartsupsupport@gmail.com',
      from: {
        email: 'paypalsmartsupsupport@gmail.com',
        name: 'Support App'
      },
      replyTo: email,
      subject: `Support Request: ${category} from ${name}`,
      html: htmlContent,
      text: `New support request from ${name} (${email}).\nTopic: ${category}\nMessage: ${message}`,
      headers: {
        'X-Priority': '1',
        'Importance': 'high'
      },
      mailSettings: {
        bypassListManagement: {
          enable: true
        }
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) console.error(error.response.body);
    res.status(500).json({ error: error.message });
  }
}
