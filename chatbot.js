let round = 1;
let sessionResolved = false;
let currentFAQMatches = [];

const MAX_ROUNDS = 3;

const SUPABASE_URL = 'https://isxzglzdtytltsekvfhw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 替換成你自己的 Key
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function loadFAQ() {
  const res = await fetch('faq_data.json');
  return res.json();
}

function appendMessage(sender, text, isHTML = false) {
  const chatBox = document.getElementById('chat-box');
  const message = document.createElement('div');
  message.className = `message ${sender}`;

  if (sender === 'bot') {
    message.innerHTML = `
      <img src="images/Dmeiphoto.png" alt="D妹頭像" class="avatar" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 8px;">
      <div class="bubble">${isHTML ? text : text.replace(/\n/g, "<br>")}</div>
    `;
  } else {
    message.innerHTML = `
      <img src="images/userphoto.png" alt="使用者頭像" class="avatar" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 8px;">
      <div class="bubble">${text.replace(/\n/g, "<br>")}</div>
    `;
  }

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function resetChat() {
  round = 1;
  sessionResolved = false;
  currentFAQMatches = [];
  document.getElementById('chat-box').innerHTML = '';
  appendMessage('bot', '哈囉！請問有什麼問題需要 D妹幫助呢？請輸入您的問題');
}

async function handleUserInput(userInput) {
  appendMessage('user', userInput);
  const faqList = await loadFAQ();
  currentFAQMatches = matchFAQ(userInput, faqList);

  if (currentFAQMatches.length === 0) {
    appendMessage('bot', '很抱歉，我暫時無法找到相關的答案 😢');
    await recordToSupabase(userInput, null, false);

    if (round >= MAX_ROUNDS) {
      appendMessage('bot', `
        很抱歉還是沒能幫上忙 🙇‍♀️<br>
        如有需要，您可以撥打客服專線：<br>
        📞 0800-002-615 或 (02) 6600-0123 分機 8715<br>
        🕘 週一至五 9:00–18:00；國定假日 10:00–19:00<br><br>
        👉 <button onclick="resetChat()">🔁 重新開始對話</button>
      `, true);
    } else {
      round++;
      appendMessage('bot', '請再更精準描述您的問題唷！');
    }

    return;
  }

  showFAQResults(currentFAQMatches);
}

function matchFAQ(input, faqs) {
  input = input.toLowerCase();
  return faqs.filter(faq =>
    faq.question.toLowerCase().includes(input) ||
    (faq.keywords && faq.keywords.toLowerCase().split(',').some(k => input.includes(k.trim()))) ||
    (faq.similar_phrases && faq.similar_phrases.toLowerCase().split(',').some(p => input.includes(p.trim())))
  ).slice(0, 3);
}

function showFAQResults(matches) {
  matches.forEach(match => {
    appendMessage('bot', `<strong>Q:</strong> ${match.question}<br><strong>A:</strong> ${match.answer}`, true);
  });

  const feedbackButtons = `
    <div class="feedback">
      <button onclick="handleFeedback(true)">✅ 有幫助</butt
