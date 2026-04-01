/**
 * 🛡️ 異常觀測 API 服務端 (GitHub 通訊版)
 */

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const mode = params.action; // generate 或 verify

    let result;
    if (mode === "generate") {
      result = processAIRequest(params.landmarks);
    } else if (mode === "verify") {
      result = verifyResults(params.playerChoices, params.correctAnswers);
    }

    return ContentService.createTextOutput(JSON.stringify({ "data": result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function callGemini(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  return data.candidates[0].content.parts[0].text;
}

function processAIRequest(landmarks) {
  const prompt = `你是一個冷酷的規則怪談系統。針對地標：【${landmarks.join('、')}】生成 6 條簡短指令。要求：地標自然編織進句子。隨機 1-3 條含異常(閉眼、回頭、紅色、老闆笑)。句尾加 (ERROR)。用 | 隔開。不准出現「不要、不可」。不要標題。`;
  return callGemini(prompt);
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) return "【判定：完全修復】\n觀測極其精準，雜訊已清除。";
  if (missing.length > 0) return `【判定：修復失敗】\n漏掉 ${missing.length} 個污染源。`;
  return "【判定：過度隔離】\n你移除了正常訊號，導致現實崩潰。";
}
