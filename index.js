// Load environment variables from .env file (only used locally)
require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Parse incoming JSON data from the form
app.use(express.json());

// Without this, browsers block cross-origin requests
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500", // Live Server
      "http://localhost:5500",
      "http://mindglobetech.com",
      "http://www.mindglobetech.com",
    ],
  }),
);

// Health check — visit Render URL to confirm it's running
app.get("/", (req, res) => {
  res.send("MindGlobe contact backend is running ✅");
});

// Gmail transporter — uses credentials stored in environment variables

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,       // Gmail
//     pass: process.env.EMAIL_PASS,  // Gmail App Password
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// This route handles the form submission
// When  HTML form sends a POST request here, this function runs
app.post("/contact", async (req, res) => {
  const { name, company, email, phone, topic, message } = req.body;

  // Basic validation — reject empty required fields
  if (!name || !company || !email || !message) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL, // shows sender name in inbox
      to: process.env.TO_EMAIL, //  email receives it
      replyTo: email, // when hit Reply, it goes to the user
      subject: `Inquiry from ${name} — ${topic}`,
      html: `
        <h2 style="color:#333">New Inquiry — MindGlobe Tech</h2>
        <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
          <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td>${name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Company</td><td>${company}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td>${email}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td>${phone || "Not provided"}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Topic</td><td>${topic}</td></tr>
        </table>
        <h3 style="color:#555;margin-top:20px">Message</h3>
        <p style="font-family:sans-serif;font-size:15px;line-height:1.6">${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    // Tell the frontend it was successful
    res.json({ success: true });
  } catch (error) {
    // console.error("Full error:", error); // shows full error object
    // console.error("Error message:", error.message); // shows exact reason
    // console.error("Error code:", error.code); //  shows error code
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

// Render automatically sets PORT — always use process.env.PORT in hosted environments
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
