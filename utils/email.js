const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.user = user;
    this.from = `Carlos Guisao <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return 1;
    }

    // 1) Create a transporter for development
    // There are a couple of different servers nodemailer
    // knows how to deal with, Gmail is one of them, so we don't have
    // to configure it manually
    return nodemailer.createTransport({
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
  }

  async send(template, subject) {
    // 1) render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2) Define the email option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
