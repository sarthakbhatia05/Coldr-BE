import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transporter } from "../utils/mailer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.join(__dirname, "../templates");

export const getTemplates = (req, res) => {
  try {
    const templates = fs
      .readdirSync(templateDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const templatePath = path.join(templateDir, file);
        const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        return {
          name: templateConfig.name,
          description: templateConfig.description,
          variables: templateConfig.variables,
          subject: templateConfig.subject
        };
      });
    res.json({ templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error reading templates" });
  }
};

export const sendEmail = async (req, res) => {
  try {
    const {
      name,
      email,
      recipientName,
      role,
      company,
      experience,
      skills,
      phoneNumber,
      refresh_token // <-- Accept refresh_token from frontend
    } = req.body;
    const resumeFile = req.file;

    // Validate required fields
    const requiredFields = { name, email, recipientName, role, company, experience, skills, phoneNumber };
    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Load template configuration
    const templateConfigPath = path.join(templateDir, "job-application.json");
    const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
    const templateData = { name, email, recipientName, role, company, experience, skills, phoneNumber };
    const html = await ejs.renderFile(path.join(templateDir, `${templateConfig.name}.ejs`), templateData);
    const subject = templateConfig.subject.replace('{{role}}', role).replace('{{company}}', company);

    if (refresh_token) {
      // Use Gmail API
      const { google } = await import('googleapis');
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
      const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
      oauth2Client.setCredentials({ refresh_token });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      let rawMessage = `To: ${email}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`;
      // Attachments not supported in simple raw, would need MIME multipart for resume
      if (resumeFile) {
        // For demo, skip attachment if using Gmail API
        rawMessage += `\r\n\r\n[Attachment omitted in Gmail API demo]`;
      }
      const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } });
      return res.json({ success: true, message: "Email sent via Gmail API!" });
    } else {
      // Fallback to nodemailer
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: html,
      };
      if (resumeFile) {
        mailOptions.attachments = [{ filename: resumeFile.originalname, content: resumeFile.buffer, contentType: resumeFile.mimetype }];
      }
      const result = await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: "Email sent successfully!", messageId: result.messageId });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
