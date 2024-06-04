const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  // There are a couple of different servers nodemailer
  // knows how to deal with, Gmail is one of them, so we don't have
  // to configure it manually
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    secureConnection: false, // workaround for development
    // getting this error routines:ssl3_get_record:wrong version
    // Activate in gmail "less secure app" option
    // in case you want gmail configuration
    // https://myaccount.google.com/lesssecureapps
    // https://support.google.com/accounts/answer/6010255?hl=en
    // Let's use mailtrap.io for dev emails
  });

  // 2) Define the email option
  const mailOptions = {
    from: `Test Example <test@example.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
