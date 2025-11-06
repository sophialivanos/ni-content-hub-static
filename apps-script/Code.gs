function doPost(e){
  const body = JSON.parse(e.postData.contents || "{}");
  const url = body.url;              // target API
  const payload = body.payload || {}; // forwarded payload
  const headers = body.headers || {};
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers,
    muteHttpExceptions: true
  });
  return ContentService.createTextOutput(res.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}