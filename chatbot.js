function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value;
  if (!message) return;

  const chatLog = document.getElementById('chatLog');
  const userMsg = document.createElement('div');
  userMsg.className = 'message';
  userMsg.textContent = message;
  chatLog.appendChild(userMsg);

  const botReply = document.createElement('div');
  botReply.className = 'message bot';
  botReply.textContent = '這是模擬回覆：' + message + '（D妹會盡快學會回答！）';
  chatLog.appendChild(botReply);

  input.value = '';
}