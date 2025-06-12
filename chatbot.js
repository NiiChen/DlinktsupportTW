
  const toggleBtn = document.getElementById('chatbot-toggle');
  const chatbotWindow = document.getElementById('chatbot-window');
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatbotContent = document.getElementById('chatbot-content');

  // 顯示/隱藏聊天視窗
  toggleBtn.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
  });

  // 發送訊息並查找 FAQ
  sendButton.addEventListener('click', async () => {
    const question = userInput.value.trim();
    if (!question) return;
    appendMessage('user', question);
    userInput.value = '';

    const response = await findAnswer(question);
    appendMessage('bot', response || '很抱歉，找不到相關資料。');
  });

  function appendMessage(sender, text) {
    const message = document.createElement('div');
    message.textContent = (sender === 'user' ? '你：' : 'D妹：') + text;
    chatbotContent.appendChild(message);
    chatbotContent.scrollTop = chatbotContent.scrollHeight;
  }

  async function findAnswer(userInput) {
    try {
      const res = await fetch('/supportTW/faq_data.json');
      const data = await res.json();
      const found = data.find(item => userInput.includes(item.question));
      return found ? found.answer : null;
    } catch (e) {
      return '無法讀取 FAQ 資料。';
    }
  }
});
