let round = 1;
let sessionResolved = false;
let currentFAQMatches = [];

const MAX_ROUNDS = 3;

const SUPABASE_URL = 'https://isxzglzdtytltsekvfhw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ← 請換成你的真實 API Key
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
      <img src="images/Dmeiphoto.png" alt="D妹頭像" class="avatar">
      <div class="bubble">${isHTML ? text : text.replace(/\n/g, "<br>")}</div>
    `;
  } else {
    message.innerHTML = `
      <div class="bubble">${text.replace(/\n/g, "<br>")}</div>
      <img src="images/userphoto.png" alt="使用者頭像" class="avatar">
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
  input = input.toLowerCase().trim();

  // 優先完全匹配的
  const exactMatch = faqs.find(faq => faq.question.toLowerCase().trim() === input);
  if (exactMatch) {
    const others = faqs.filter(f => f.id !== exactMatch.id); // 避免重複
    const similarMatches = others.filter(faq =>
      faq.question.toLowerCase().includes(input) ||
      checkMatch(faq.keywords, input) ||
      checkMatch(faq.similar_phrases, input)
    ).slice(0, 5);
    return [exactMatch, ...similarMatches];
  }

  // 一般模糊匹配（最多 6 筆）
  return faqs.filter(faq =>
    faq.question.toLowerCase().includes(input) ||
    checkMatch(faq.keywords, input) ||
    checkMatch(faq.similar_phrases, input)
  ).slice(0, 6);
}


function checkMatch(field, input) {
  if (!field) return false;
  if (Array.isArray(field)) {
    return field.some(item => input.includes(item.toLowerCase().trim()));
  } else if (typeof field === 'string') {
    return field.split(',').some(item => input.includes(item.toLowerCase().trim()));
  }
  return false;
}

function showFAQResults(matches) {
  const topMatch = matches[0]; // 顯示第一筆為答案
  if (topMatch) {
    appendMessage('bot', `<strong>Q:</strong> ${topMatch.question}<br><strong>A:</strong> ${topMatch.answer}`, true);
  }

  // 顯示其餘前五題建議（排除第一題）
  const suggestionButtons = matches
    .slice(1)               // 從第 2 題開始
    .slice(0, 5)            // 最多 5 題
    .map(match => `<button onclick="handleUserInput('${match.question}')">${match.question}</button>`)
    .join("<br>");
    
  if (suggestionButtons) {
    appendMessage('bot', `<div>你也可以點選以下相關問題：<br>${suggestionButtons}</div>`, true);
  }

  const feedbackButtons = `
    <div class="feedback">
      <button onclick="handleFeedback(true)">✅ 有幫助</button>
      <button onclick="handleFeedback(false)">❌ 沒幫助</button>
    </div>
  `;
  appendMessage('bot', feedbackButtons, true);
}


async function handleFeedback(isResolved) {
  const userInput = document.querySelectorAll('.message.user:last-child')[0]?.textContent || '';
  const matchedId = currentFAQMatches[0]?.id || null;
  await recordToSupabase(userInput, matchedId, isResolved);

  if (isResolved) {
    appendMessage('bot', '太好了！若還有其他問題也歡迎再問唷 😊');
    sessionResolved = true;
  } else {
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
  }
}

async function recordToSupabase(question, matched_faq_id, is_resolved) {
  const payload = {
    question,
    matched_faq_id,
    is_resolved,
    round,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/faq_logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Supabase 紀錄失敗:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('send-button').addEventListener('click', () => {
    const input = document.getElementById('user-input');
    if (input.value.trim()) {
      handleUserInput(input.value.trim());
      input.value = '';
    }
  });

  resetChat();
});

