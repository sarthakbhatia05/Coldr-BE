import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();


export const generateColdEmail = async (profile, jd, instructions, recipientName, company) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let prompt = "";

    const profileContext = `
      User Profile:
      Name: ${profile.name}
      Role/Position: ${profile.position}
      Skills: ${profile.skills}
      Experience: ${profile.experience}
    `;

    const recipientContext = `
      Recipient Details:
      Name: ${recipientName || "Hiring Manager"}
      Company: ${company || "the company"}
    `;

    if (jd) {
      prompt = `
        You are an expert copywriter specializing in cold emails for job applications.
        
        Task: Write a personalized cold email to ${recipientName || "a recruiter"} at ${company || "their company"} based on the following Job Description (JD) and User Profile.
        
        ${profileContext}
        ${recipientContext}
        
        Job Description:
        ${jd}
        
        Instructions:
        1. Address the recipient by name if provided.
        2. Mention the company name.
        3. Analyze the JD to identify key skills and requirements.
        4. Map the user's skills and experience to these requirements.
        5. Keep the tone professional yet engaging.
        6. The email should be concise (under 100 words).
        7. Do not write your name is this and that.
        8. Tell that I came across this opportunity and I would like to express my interest for that.
        9. ${instructions || ""}
        
        Output Format:
        Return ONLY a valid JSON object with the following structure:
        {
          "subject": "The email subject line",
          "body": "The email body (HTML format, use <p>, <br>, <strong> etc. for formatting)"
        }
        Do not include markdown formatting (like \`\`\`json) in the response.
      `;
    } else {
      prompt = `
        You are an expert copywriter specializing in cold emails for job applications.
        
        Task: Write a general cold email to ${recipientName || "a recruiter"} at ${company || "their company"} based on the User Profile. No specific Job Description is provided.
        
        ${profileContext}
        ${recipientContext}
        
        Instructions:
        1. Address the recipient by name if provided.
        2. Mention the company name.
        3. Highlight the user's top skills and experience.
        4. Express interest in potential opportunities relevant to their role (${profile.position}).
        5. Keep the tone professional yet engaging.
        6. The email should be concise (under 150 words).
        7. Should contain signoff like "Best regards," + "Name" and phone number 
        8. ${instructions || "Focus on the value the user can bring to the company."}
        
        Output Format:
        Return ONLY a valid JSON object with the following structure:
        {
          "subject": "The email subject line",
          "body": "The email body (HTML format, use <p>, <br>, <strong> etc. for formatting)"
        }
        Do not include markdown formatting (like \`\`\`json) in the response.
      `;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting if the model ignores instructions
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Error generating email:", error);
    throw new Error("Failed to generate email content");
  }
};
