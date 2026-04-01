/**
 * 🛡️ 異常觀測 API 服務端 (穩定版)
 */

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const mode = params.action;
    
    let result = "";
    if (mode === "generate") {
      result = processAIRequest(params.landmarks);
    } else if (mode === "verify") {
      result = verifyResults(params.playerChoices, params.correctAnswers);
    }

    // 關鍵：確保回傳的是 JSON 物件
    return ContentService.createTextOutput(JSON.stringify({ "data": result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    // 若出錯，回傳錯誤訊息而非 null
    return ContentService.createTextOutput(JSON.stringify({ "data": "ERROR: " + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processAIRequest(landmarks) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `你是一個冷酷的規則怪談系統。針對地標：【${landmarks.join('、')}】生成 6 條簡短指令。要求：地標自然編織進句子。隨機 1-3 條含異常(閉眼、回頭、紅色、老闆笑)。句尾加 (ERROR)。用 | 隔開。不准出現「不要、不可」。不要標題。`;

  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.candidates && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Gemini API 回傳格式異常");
  }
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) return "【判定：完全修復】\n觀測極其精準，雜訊已清除。";
  if (missing.length > 0) return `【判定：修復失敗】\n漏掉 ${missing.length} 個污染源。`;
  return "【判定：過度隔離】\n你移除了正常訊號導致崩潰。";
}
