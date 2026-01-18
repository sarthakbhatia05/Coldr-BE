import { google } from "googleapis";

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const googleAuth = (req, res) => {
  const oauth2Client = createOAuthClient();

  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  const oauth2Client = createOAuthClient();
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(
      `${frontendUrl}/?refresh_token=${tokens.refresh_token}`
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to exchange code" });
  }
};

export const sendEmail = async (req, res) => {
  const oauth2Client = createOAuthClient();
  const { refresh_token, to, subject, message } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "Missing refresh_token" });
  }

  try {
    oauth2Client.setCredentials({ refresh_token });

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email" });
  }
};
