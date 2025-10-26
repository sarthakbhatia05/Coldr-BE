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
      phoneNumber 
    } = req.body;
    const resumeFile = req.file;

    console.log('Received data:', req.body);
    console.log('Extracted variables:', { name, email, recipientName, role, company, experience, skills, phoneNumber });

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

    // Render HTML from template with all variables
    const templateData = {
      name,
      email,
      recipientName,
      role,
      company,
      experience,
      skills,
      phoneNumber
    };

    const html = await ejs.renderFile(
      path.join(templateDir, `${templateConfig.name}.ejs`),
      templateData
    );

    // Generate subject from template
    const subject = templateConfig.subject
      .replace('{{role}}', role)
      .replace('{{company}}', company);

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // Send to the applicant's email or change to your email
      subject: subject,
      html: html,
    };

    // Add attachment if resume file is provided
    if (resumeFile) {
      mailOptions.attachments = [
        {
          filename: resumeFile.originalname,
          content: resumeFile.buffer,
          contentType: resumeFile.mimetype
        }
      ];
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);

    res.json({ 
      success: true, 
      message: "Email sent successfully!",
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
