import { google } from 'googleapis';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export const googleAuth = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid',
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  const code = req.query.code;
  try {
    console.log('I am here', req);
    const { tokens } = await oauth2Client.getToken(code);
  // Redirect to frontend with refresh_token as query param
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/?refresh_token=${tokens.refresh_token}`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to exchange code' });
  }
};

export const sendEmail = async (req, res) => {
  const { refresh_token, to, subject, message } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });
  try {
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
};
