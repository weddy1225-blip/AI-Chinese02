/**
 * 🛡️ 異常觀測 API 服務端 (敘事融合強化版)
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
  
  // 🎭 敘事強化提示詞：強調地標必須是動作發生的「場景」
  const prompt = `你是一個冷酷的規則怪談監控系統。
  【任務】：針對地標：【${landmarks.join('、')}】生成 6 條具有強烈不安感的導航指令。
  
  【寫作要求】：
  1. 融合深度：嚴禁使用「在地標，做某事」的格式。地標必須是環境的一部分。
     - ❌ 錯誤範例：在全聯門口，看見老闆在笑。
     - ✅ 正確範例：路過全聯那扇自動感應門時，若發現玻璃倒影中的老闆正對你僵硬地微笑，請加快腳步。
  2. 數量：每個地標生成 2 條不同情境的指令，共 6 條。
  3. 污染源：隨機選取 1 到 3 條指令注入「絕對禁止」的行為：
     - 行為：閉著眼睛、回頭看、看見紅色的事物、老闆在笑。
  4. 標記：包含污染行為的句尾加上 (ERROR)。
  5. 格式：每條指令用 | 隔開，不准有標題或 Markdown。只給文字。`;

  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
  
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  if (json.candidates && json.candidates[0].content.parts[0].text) {
    let text = json.candidates[0].content.parts[0].text;
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  } else {
    throw new Error("觀測儀無法讀取地標波動");
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
