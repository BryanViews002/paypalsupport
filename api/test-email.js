import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  const results = {
    hasKey: !!process.env.SENDGRID_API_KEY,
    keyPrefix: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.slice(0, 10) + '...' : 'MISSING',
  };

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(200).json({ ...results, error: 'SENDGRID_API_KEY is missing' });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: 'paypalsmartsupsupport@gmail.com',
      from: {
        email: 'paypalsmartsupsupport@gmail.com',
        name: 'Support App Test'
      },
      subject: 'Test Email - Debug Check',
      text: 'This is a test email from the debug endpoint.',
      html: '<p>This is a <strong>test email</strong> from the debug endpoint.</p>',
    });

    results.emailSent = true;
    results.status = 'SUCCESS';
  } catch (error) {
    results.emailSent = false;
    results.error = error.message;
    results.sendgridResponse = error.response ? JSON.stringify(error.response.body) : null;
  }

  return res.status(200).json(results);
}
