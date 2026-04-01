/**
 * 🛡️ 異常觀測修復計畫 - 情境融合精準版
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('🛡️ 異常觀測修復計畫')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function callGemini(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    return data.candidates[0].content.parts[0].text;
  } catch (e) { return "系統通訊失敗，請檢查 API Key"; }
}

function processAIRequest(landmarks, mode) {
  const prompt = `
    你是一個冷酷的規則怪談監控系統。請針對地標：【${landmarks.join('、')}】，在「${mode}」情境下生成 6 條簡短指令。
    
    【核心任務】：
    1. 每個地標固定生成 2 條指令，總共 6 條。
    2. 【敘事要求】：不要使用「地標，行為」這種死板格式。請將地標自然地編織進句子裡。
       - 優秀範例：經過全聯門口時，請務必盯著自己的鞋尖快步走過。
       - 錯誤範例：全聯，盯著鞋尖走路。
    3. 隨機讓其中 1 到 3 條指令包含以下「異常狀態」之一：
       - 正在「閉著眼睛」做事。
       - 正在「回頭看」後方。
       - 畫面中出現「紅色」的物品或光影。
       - 提到「老闆正在對你笑」。
    4. 其餘為「安全卡片」，內容必須正常且不可包含上述四種狀態。
    5. 【禁令】：絕對不要在句子中出現「不要、不可、禁止」等規則字眼。
    6. 格式：每一條指令用 | 隔開。若為異常，句尾加上 (ERROR)。不要標題，不要換行。
  `;
  return callGemini(prompt);
}

// 精準判定邏輯：比對玩家選擇與當次生成的錯誤清單
function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);

  // 計算漏抓與抓錯
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) {
    return "【判定：完全修復】\n你的觀測極其敏銳，所有的時空雜訊已被徹底清除。";
  } else if (missing.length > 0) {
    return `【判定：修復失敗】\n偵測到漏網之魚。仍有 ${missing.length} 個污染源殘留在路徑中，這非常危險。`;
  } else {
    return "【判定：過度隔離】\n你移除了正常的訊號，這可能導致現實邏輯崩潰。請重新校準你的直覺。";
  }
}
