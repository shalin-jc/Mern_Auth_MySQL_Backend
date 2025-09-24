import nodemailer from 'nodemailer'
import 'dotenv/config'


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: true,
    port: 465,
    auth: { 
        user: 'shalin.bhanat29@gmail.com',
        pass: 'aljkphtyfhuonyzf',
        // user: process.env.SMTP_USER,
        // pass: process.env.SMTP_PASSWORD,
    }
});

export const sendEmail = async( to, subject, text)=>{
    try {
        const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        text: text, // plain‑text body
        // html: "<b>Hello world?</b>", // HTML body
      });

      console.log("Message sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
export default transporter




// fix email regex
// when user click on logout first show the comform logout popup
// remove new password field from reset password page
// add set new password page
// add show password option in all password fields
