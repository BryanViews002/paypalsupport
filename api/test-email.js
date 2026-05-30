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

  // Test 1: Admin notification email
  try {
    await sgMail.send({
      to: 'paypalsmartsupsupport@gmail.com',
      from: { email: 'paypalsmartsupsupport@gmail.com', name: 'Support App' },
      replyTo: 'testuser@example.com',
      subject: 'TEST: New Support Request from Test User',
      text: 'New support request from Test User (testuser@example.com).\nTopic: Account access or security\nMessage: This is a test message.',
      html: '<p>New support request from <strong>Test User</strong>.</p><p>Topic: Account access or security</p><p>Message: This is a test message.</p>',
      headers: { 'X-Priority': '1', 'Importance': 'high' },
    });
    results.adminEmailSent = true;
  } catch (error) {
    results.adminEmailSent = false;
    results.adminEmailError = error.message;
    results.adminSendgridResponse = error.response ? JSON.stringify(error.response.body) : null;
  }

  // Test 2: User notification email
  try {
    await sgMail.send({
      to: 'paypalsmartsupsupport@gmail.com', // sending to admin for test
      from: { email: 'paypalsmartsupsupport@gmail.com', name: 'Customer Support' },
      subject: 'TEST: Re: Your Support Request',
      text: 'Hello Test User,\n\nOur support team has responded:\n\n"This is a test agent reply."\n\nThank you,\nCustomer Support Team',
      html: '<p>Hello Test User,</p><p>Agent replied: <em>This is a test agent reply.</em></p>',
    });
    results.userEmailSent = true;
  } catch (error) {
    results.userEmailSent = false;
    results.userEmailError = error.message;
    results.userSendgridResponse = error.response ? JSON.stringify(error.response.body) : null;
  }

  results.status = (results.adminEmailSent && results.userEmailSent) ? 'ALL_OK' : 'PARTIAL_FAILURE';
  return res.status(200).json(results);
}
