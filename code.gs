/**
 * 導航修復作戰：後端核心
 * 2026 數位教育實驗計畫
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('🛡️ 導航修復作戰')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 串接 Gemini API 的核心函式
function processAIRequest(landmarks, mode) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return "錯誤：尚未設定 API Key";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // 建立 Prompt 提示詞
  const prompt = `
    你是一位「混亂 AI」。請根據以下三個真實地標：${landmarks.join('、')}，
    以及冒險模式：${mode}，生成一段大約 100 字的「故障導航指令」。
    要求：
    1. 邏輯必須崩壞、荒謬。
    2. 必須包含這三個地標，但要根據模式進行「變形」（例如古代模式中，電線桿變成了長槍）。
    3. 結尾要有一個危險或奇怪的行動指令（例如：請跳入早餐店的油鍋）。
  `;

  const payload = {
    "contents": [{ "parts": [{ "text": prompt }] }]
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "通訊失敗：" + e.toString();
  }
}
