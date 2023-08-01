const express = require('express');
const prompt = require('prompt-sync')();
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 1700;
app.use(express.static(__dirname + '/assets'));

// Create a new instance of AssistantV2
const assistant = new AssistantV2({
  version: '2023-06-06',
  authenticator: new IamAuthenticator({
    apikey: 'RzuGEWqDA6wCBkAGZTE47Ss3oEyLoL2dUpburUb1zo-m', // Replace with your API key
  }),
  serviceUrl: 'https://api.us-south.assistant.watson.cloud.ibm.com/instances/0c4f3d32-bd69-4975-b5ef-e8c78eb54cdf', // Replace with the service URL
});

const assistantId = '84ff4280-ddce-4bf5-85d3-ca052b6ab4be'; // Replace with your live enviorement ID
let sessionId = '';

// Create a session
assistant
  .createSession({
    assistantId: assistantId,
  })
  .then((res) => {
    sessionId = res.result.session_id;
    console.log('Session created:', sessionId);
  })
  .catch((err) => {
    console.error(err);
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle the chat request
app.post('/chat', (req, res) => {
  const messageInput = {
    messageType: 'text',
    text: req.body.message,
    options: {
      return_context: true,
    },
  };

  const params = {
    assistantId,
    sessionId,
    input: messageInput,
  };

  assistant
    .message(params)
    .then((response) => {
      const result = response.result;
      console.log(JSON.stringify(result, null, 2));

      const reply = processResult(result);
      res.json({ reply });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    });
});

function processResult(result) {
  let reply = '';

  if (result.output.generic) {
    const textResponses = result.output.generic
      .filter((response) => response.response_type === 'text')
      .map((response) => response.text);

    reply = textResponses.join('\n');
  }

  return reply;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
