import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'REPLACE_WITH_KEY');

async function testSendGrid() {
  // Test 1: User notification email to bryanjoe0019@gmail.com
  try {
    console.log("Sending test to bryanjoe0019@gmail.com...");
    const res1 = await sgMail.send({
      to: 'bryanjoe0019@gmail.com',
      from: 'paypalsmartsupsupport@gmail.com',
      subject: '[TEST] PayPal Support - Admin Reply',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-top: 5px solid #0070ba;">
          <h2>Hello Bryan,</h2>
          <p>This is a <strong>test reply</strong> from your PayPal Support admin dashboard.</p>
          <p>If you received this email, the notification system is working correctly!</p>
          <p>Thanks,<br><strong>PayPal Support Team</strong></p>
        </div>
      `,
    });
    console.log("✅ User email sent! Status:", res1[0].statusCode);
  } catch (err) {
    console.error("❌ User email FAILED:", err.message);
    if (err.response) console.error("Details:", JSON.stringify(err.response.body, null, 2));
  }

  // Test 2: Admin notification email to paypalsmartsupsupport@gmail.com
  try {
    console.log("Sending test to paypalsmartsupsupport@gmail.com (admin)...");
    const res2 = await sgMail.send({
      to: 'paypalsmartsupsupport@gmail.com',
      from: 'paypalsmartsupsupport@gmail.com',
      subject: '[TEST] New Support Ticket',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0070ba; color: white; border-radius: 8px;">
          <h2>New Support Ticket</h2>
          <p><strong>From:</strong> Bryan Joe (bryanjoe0019@gmail.com)</p>
          <p><strong>Category:</strong> Funds not received</p>
          <p><strong>Message:</strong> This is a test message.</p>
        </div>
      `,
    });
    console.log("✅ Admin email sent! Status:", res2[0].statusCode);
  } catch (err) {
    console.error("❌ Admin email FAILED:", err.message);
    if (err.response) console.error("Details:", JSON.stringify(err.response.body, null, 2));
  }
}

testSendGrid();
