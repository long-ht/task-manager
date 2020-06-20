const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nklthor@gmail.com',
        subject: 'Thank you for joining in!',
        text: `Hi ${name}, welcome to task-manager!`
    });
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nklthor@gmail.com',
        subject: 'We are sorry to see you go!',
        text: `Goodbye ${name}, we are sorry to see you go! Please leave us some feedback for what we can do better`
    });
}
module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}