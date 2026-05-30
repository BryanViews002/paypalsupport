import nodemailer from 'nodemailer';

async function sendTestEmails() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'paypalsmartsupsupport@gmail.com',
      pass: 'xiiy kxje obxc mrem'
    }
  });

  try {
    // 1. Test Admin Email
    console.log("Sending test email to Admin...");
    const adminInfo = await transporter.sendMail({
      from: '"PayPal Support App" <paypalsmartsupsupport@gmail.com>',
      to: 'paypalsmartsupsupport@gmail.com',
      subject: 'New Support Ticket: Test from Local Environment',
      html: `<h1>PayPal Support Alert</h1><p>A new test ticket was submitted by bryanjoe0019@gmail.com.</p>`
    });
    console.log("✅ Admin Email Sent! Message ID:", adminInfo.messageId);

    // 2. Test User Email
    console.log("Sending test email to User...");
    const userInfo = await transporter.sendMail({
      from: '"PayPal Support" <paypalsmartsupsupport@gmail.com>',
      to: 'bryanjoe0019@gmail.com',
      subject: 'Update on your PayPal Support Case',
      html: `<h2>Hello,</h2><p>This is a test reply from the admin. The local Node.js email script works perfectly!</p>`
    });
    console.log("✅ User Email Sent! Message ID:", userInfo.messageId);

  } catch (error) {
    console.error("❌ Error sending emails:", error);
  }
}

sendTestEmails();
