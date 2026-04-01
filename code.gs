function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('導航修復作戰：親子共戰版')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function runMission(action, data) {
  const SCRIPT_PROP = PropertiesService.getScriptProperties();
  const API_KEY = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
  const MODEL_NAME = "gemini-2.5-flash"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  let prompt = "";

  if (action === "GENERATE_QUEST") {
    // 將三個欄位的地標組合起來
    const locString = data.locations.join('、');
    prompt = `你是一個正在干擾現實世界的混亂AI。請根據家長提供的地標：[${locString}]，
    並切換至[${data.adventureMode}]模式，生成一段約120字的「故障導航指令」。
    規則：必須包含這三個地標，且內容要有2個明顯邏輯錯誤。語氣要符合模式（外星/古代/寫實）。
    最後加上：「修復師，你有辦法恢復正常嗎？」請直接回傳故事內容。`;
  } else {
    prompt = `你是導航修復指揮官。請針對學生的修復成果進行評鑑。
    原始故障：[${data.original}]
    學生修復：[${data.studentFix}]
    請給予達成率(%)、指揮官點評與獎勵代碼。使用純文字與符號排版。`;
  }

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const json = JSON.parse(response.getContentText());
    return json.candidates[0].content.parts[0].text;
  } catch (e) {
    return "📡 訊號中斷，請重新嘗試。";
  }
}
