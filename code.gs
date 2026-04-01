/**
 * 🛡️ 異常觀測 API 服務端 (解析優化版)
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

    return ContentService.createTextOutput(JSON.stringify({ "data": result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "data": "ERROR: " + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processAIRequest(landmarks) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // 強化提示詞：明確要求純文字輸出，嚴禁 Markdown
  const prompt = `你是一個冷酷的規則怪談系統。
  請針對地標：【${landmarks.join('、')}】生成 6 條簡短指令。
  要求：
  1. 每個地標固定 2 條，將地標自然編織進句子中。
  2. 隨機讓 1 到 3 條指令包含異常：閉眼、回頭看、紅色物品、老闆正在笑。
  3. 句尾有異常的加上 (ERROR)。
  4. 輸出格式：每條指令用 | 隔開。
  5. 嚴禁事項：嚴禁輸出任何 Markdown 標籤、標題、換行或解釋文字。只給指令文字。`;

  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { 
    "method": "post", 
    "contentType": "application/json", 
    "payload": JSON.stringify(payload), 
    "muteHttpExceptions": true 
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  if (json.candidates && json.candidates[0].content.parts[0].text) {
    let text = json.candidates[0].content.parts[0].text;
    // 🛡️ 過濾可能的 Markdown 代碼區塊標籤
    text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    return text;
  } else {
    throw new Error("Gemini 無法生成內容，請確認 API Key 額度或設定。");
  }
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) return "【判定：完全修復】\n觀測極其精準，所有污染源已清除。";
  if (missing.length > 0) return `【判定：修復失敗】\n漏掉 ${missing.length} 個污染源，這非常危險。`;
  return "【判定：過度隔離】\n你移除了正常的訊號，導致現實邏輯崩潰。";
}
