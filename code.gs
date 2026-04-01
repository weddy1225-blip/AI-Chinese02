/**
 * 🛡️ 異常觀測 API 服務端 (強化核心規則版)
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
  
  // 核心規則強調：明確要求 AI 針對關鍵字生成
  const prompt = `你是一個冷酷的規則怪談系統。
  請針對地標：【${landmarks.join('、')}】生成 6 條簡短指令。
  要求：
  1. 每個地標固定 2 條。
  2. 【關鍵字注入】：隨機選取 1 到 3 條指令注入「絕對禁止」的污染行為：
     - 行為包含：閉著眼睛、回頭看、看見紅色的事物、老闆正在笑。
  3. 句尾有污染行為的請加上 (ERROR)。
  4. 輸出格式：每條指令用 | 隔開。
  5. 禁令：嚴禁出現「不要、不可」等否定詞，必須是動作描述。不要輸出 Markdown 或任何標題。`;

  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
  
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  if (json.candidates && json.candidates[0].content.parts[0].text) {
    let text = json.candidates[0].content.parts[0].text;
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  } else {
    throw new Error("無法接收觀測訊號");
  }
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) return "【判定：完全修復】\n觀測極其精準。正常訊號已全數保留。";
  if (missing.length > 0) return `【判定：修復失敗】\n警告！仍有 ${missing.length} 個污染行為未被隔離。`;
  return "【判定：過度隔離】\n你誤將正常行為視為污染，導致邏輯鏈中斷。";
}
