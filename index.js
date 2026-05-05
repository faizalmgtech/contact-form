require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const rateLimit = require("express-rate-limit");
const validator = require("validator");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://mindglobetech.com",
      "http://www.mindglobetech.com",
      "https://mindglobetech.com",
      "https://www.mindglobetech.com",
    ],
  }),
);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Too many submissions. Please try again later." },
});
app.use("/contact", limiter);

// ✅ API key hidden safely in Railway environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

app.get("/", (req, res) => {
  res.status(200).send("MindGlobe contact backend is running ✅");
});

app.post("/contact", async (req, res) => {
  const { name, company, email, phone, topic, message, honeypot } = req.body;

  if (honeypot) return res.status(400).json({ error: "Bot detected." });

  if (!name || !company || !email || !message) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const safeName = validator.escape(name);
  const safeCompany = validator.escape(company);
  const safeMessage = validator.escape(message);

  // ✅ Respond immediately
  res.json({ success: true });

  // ✅ Send in background using Resend
  resend.emails
    .send({
      from: "MindGlobe Tech <onboarding@resend.dev>", // ✅ no domain verification needed
      to: process.env.TO_EMAIL, // contact@mindglobetech.com
      replyTo: email, // reply goes to user
      subject: `Inquiry from ${safeName} — ${topic}`,
      html: `
      <h2 style="color:#333">New Inquiry — MindGlobe Tech</h2>
      <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
        <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td>${safeName}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Company</td><td>${safeCompany}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td>${phone || "Not provided"}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Topic</td><td>${topic}</td></tr>
      </table>
      <h3 style="color:#555;margin-top:20px">Message</h3>
      <p style="font-family:sans-serif;font-size:15px;line-height:1.6">${safeMessage}</p>
    `,
    })
    .then(() => {
      console.log("Email sent successfully ✅");
    })
    .catch((err) => {
      console.error("Resend error:", err.message);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);
