require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_PASS set:', !!process.env.GMAIL_APP_PASSWORD);
  
  const t = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    const r = await t.sendMail({
      from: '"NetClicks by Ari" <netclicksbyari@gmail.com>',
      to: 'netclicksbyari@gmail.com',
      subject: 'OTP Test - LeadGen Pipeline',
      html: '<h2>Test Email</h2><p>If you see this, Gmail SMTP is working.</p><p>Code: <b>123456</b></p>'
    });
    console.log('SUCCESS:', r.messageId);
  } catch(e) {
    console.log('FAILED:', e.message);
  }
}

test();
