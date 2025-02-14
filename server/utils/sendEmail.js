const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const Participant = require("../models/participant");
const crypto = require("crypto");




const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email account password or app password
  },
});


exports.sendVerificationEmail = async (email) => {
  // Generate a secure, random token
  const token = crypto.randomBytes(32).toString("hex");

  // Store the token in the user record
  const user = await Participant.findOneAndUpdate(
    { email },
    { verificationToken: token },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found.");
  }

  // Include the user's email in the verification link
  const verificationLink = `${process.env.BASE_URL}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: {
      name: "Nyeusi Music Competition",
      address: process.env.EMAIL_FROM,
    },
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <p>Thank you for signing up for the Nyeusi Give Black December Music Competition!</p>
      <p>To complete your registration, please follow this link: <a href="${verificationLink}">Verify Email</a></p>
      <p>Or copy and paste the following URL into your browser: ${verificationLink}</p>
      <p>NOTE: If this email landed in your spam folder, please mark it as "not spam" and move it to your inbox before proceeding.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
