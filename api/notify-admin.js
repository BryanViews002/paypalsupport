export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, category, message } = req.body;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0070ba; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">PayPal Support Alert</h1>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A new support request has been submitted.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold; width: 30%;">Name:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${name}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${email}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Category:</td><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${category}</td></tr>
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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer re_8HBkCqtU_GNf2BqKfohtaQzLra2cxuYkq'
      },
      body: JSON.stringify({
        from: 'PayPal Support <onboarding@resend.dev>',
        to: 'paypalsmartsupport@gmail.com',
        subject: `New Support Ticket: ${category}`,
        html: htmlContent
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
