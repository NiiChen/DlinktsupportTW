let failCount = 0;
async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();
  if (!message) return;

  const chatLog = document.getElementById('chatLog');

  const userMsg = document.createElement('div');
  userMsg.className = 'message';
  userMsg.textContent = message;
  chatLog.appendChild(userMsg);

  const faq = await fetch('faq_data.json').then(res => res.json());
  const results = faq.filter(item =>
    item.question.includes(message) ||
    item.keywords.split(',').some(k => message.includes(k)) ||
    item.similar_phrases.split(',').some(p => message.includes(p.trim()))
  );

  const botReply = document.createElement('div');
  botReply.className = 'message bot';

  if (results.length > 0) {
    failCount = 0;
    let reply = '以下是我找到的建議問答，請問有幫助到您嗎？<br/><ul>';
    results.slice(0, 3).forEach(item => {
      reply += `<li><strong>${item.question}</strong><br/>${item.answer}</li>`;
    });
    reply += '</ul>請問這些回答是否有幫助？（請輸入：有 / 沒有）';
    botReply.innerHTML = reply;
  } else {
    failCount += 1;
    if (failCount >= 3) {
      botReply.innerHTML = `D妹目前還沒找到解答 😢<br/>
建議您撥打客服電話讓專人協助您唷～<br/>
📞 0800-002-615 / (02) 6600-0123 分機 8715<br/>
🕘 週一至五 9:00~18:00；國定假日 10:00~19:00`;
    } else {
      botReply.innerHTML = '目前找不到完全對應的問題 😥<br/>請再更精準地描述您的問題，我會再幫您找看看！';
    }
  }

  chatLog.appendChild(botReply);
  input.value = '';
}