/**
 * 🛡️ 異常觀測修復計畫 - 三地標純淨版
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
  } catch (e) { return "通訊失敗"; }
}

function processAIRequest(landmarks) {
  const prompt = `
    你是一個冷酷的規則怪談系統。請針對地標：【${landmarks.join('、')}】生成 6 條簡短指令。
    
    【核心任務】：
    1. 每個地標固定生成 2 條指令，總共 6 條。
    2. 【敘事要求】：將地標自然編織進句子中，不要使用「地標，行為」格式。
       - 範例：路過全聯時，請盯著腳尖快步走過，不要抬頭。
    3. 隨機讓 1 到 3 條指令包含異常狀態：閉眼、回頭看、紅色、老闆在笑。
    4. 禁令：不要出現「不要、不可、禁止」等字眼。指令必須是動作描述。
    5. 格式：每一條指令用 | 隔開。若為異常，句尾加上 (ERROR)。不要標題。
  `;
  return callGemini(prompt);
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);

  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) {
    return "【判定：完全修復】\n觀測極其精準，所有雜訊已徹底清除。你守護了這條街道。";
  } else if (missing.length > 0) {
    return `【判定：修復失敗】\n偵測到漏網之魚。仍有 ${missing.length} 個污染源留在路徑中。`;
  } else {
    return "【判定：過度隔離】\n你移除了正常的訊號。這可能導致導航崩潰，請重新校準直覺。";
  }
}
