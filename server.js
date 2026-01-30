const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const CLIENT_ID = '1465564759641554994'; // Replace
const CLIENT_SECRET = '_4DsDSBrt1zQmmdK_1YKeKS30uVMRpfT'; // Replace
const REDIRECT_URI = 'http://localhost:8000'; // Same as your redirect URL

const USER_WEBHOOK_URL = 'https://discord.com/api/webhooks/1466454765910098196/l6vo2sb9TctxWNNEPHufr_qgN5mtsrKtUDKGih55JIY-N8TVzn9-BAkotjJn5U9UAoU-'; // Replace
const RESULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1466487182666760469/rTecVh6lxX1BKyE7aNsND40BCKtknehF1Pq3RNQ2oSXgbJ6yucf2UsRr6TJ2NclyfBNj'; // Replace

app.post('/auth', async (req, res) => {
  const code = req.body.code;
  // Exchange code for token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.access_token) {
    // Get user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Check whitelist
    const whitelist = ['DISCORD_ID_1', 'DISCORD_ID_2']; // Replace with your IDs
    const allowed = whitelist.includes(userData.id);

    // Send user info to webhook
    await fetch(USER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `New user login: <@${userData.id}>`,
        username: 'User Info Bot',
        embeds: [
          {
            title: 'Discord User Details',
            fields: [
              { name: 'Username', value: userData.username },
              { name: 'Discriminator', value: userData.discriminator },
              { name: 'ID', value: userData.id },
              { name: 'Avatar', value: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 'No avatar' },
            ],
          },
        ],
      }),
    });

    res.json({ allowed, userData });
  } else {
    res.json({ allowed: false });
  }
});

app.post('/submit-quiz', async (req, res) => {
  const { userId, userName, answers, score } = req.body;

  // Send quiz results to webhook
  await fetch(RESULT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `<@${userId}> just completed the quiz with score: ${score}/15`,
      username: 'Quiz Results Bot',
      embeds: [
        {
          title: 'Quiz Results',
          description: `User: ${userName} (${userId})`,
          fields: Object.entries(answers).map(([q, ans]) => ({ name: q, value: ans })),
          footer: { text: `Score: ${score}/15` },
        },
      ],
    }),
  });

  res.json({ message: 'Results sent' });
});

app.listen(8000, () => console.log('Server running on http://localhost:8000'));
