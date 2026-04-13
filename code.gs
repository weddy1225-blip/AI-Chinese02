/**
 * 🛡️ 異常觀測中心 - 後端穩定版
 * 修正內容：強制過濾 Markdown 標籤，預防前端 split 失敗。
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
    return ContentService.createTextOutput(JSON.stringify({ "data": "ERROR: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processAIRequest(landmarks) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  
  const prompt = `你是一個冷酷的監控系統。
  【任務】：針對地標：【${landmarks.join('、')}】生成 6 條給國小四年級生的短指令。
  
  【寫作要求】：
  1. 字數限制：每條指令「嚴格控制」在 20 字以內，語法簡單。
  2. 巧妙融合：將地標鑲嵌在動作中（例如：路過「地標」時...），不要放在句首。
  3. 注入污染：隨機 1-3 條指令包含：閉著眼睛、回頭看、紅色的東西、老闆正在笑。
  4. 標記：包含上述污染行為的句子末尾必須加上 (ERROR)。
  5. 格式：每條指令用 | 隔開。禁止任何 Markdown 標籤或解釋。`;

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
    // 🧹 清理 AI 可能噴出的 Markdown 語法 (如 ```text )
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  } else {
    throw new Error("API 回傳內容格式異常。");
  }
}

function verifyResults(playerChoices, correctAnswers) {
  const playerArr = playerChoices.split(' ; ').map(s => s.trim()).filter(s => s.length > 0);
  const correctArr = correctAnswers.split('|').map(s => s.trim()).filter(s => s.length > 0);
  const missing = correctArr.filter(item => !playerArr.includes(item));
  const wrong = playerArr.filter(item => !correctArr.includes(item));

  if (missing.length === 0 && wrong.length === 0) return "【任務成功】\n你救了這個地方，現實已恢復穩定！";
  if (missing.length > 0) return `【修復失敗】\n還有 ${missing.length} 個污染源沒被抓出來。`;
  return "【觀測失誤】\n你把正常訊號也丟掉了，請重新校準。";
}
