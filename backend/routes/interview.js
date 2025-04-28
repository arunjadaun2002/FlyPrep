import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      preferredDate,
      preferredTime,
      collegeYear,
      company,
      message
    } = req.body;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'techengfly@gmail.com',
      subject: `New Interview Request from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Preferred Date: ${preferredDate}
Preferred Time: ${preferredTime}
College Year: ${collegeYear}
College Name: ${company}
Additional Information: ${message}
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

export default router; 