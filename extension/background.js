// Background service worker для НМО Автозаполнение (MV3).
chrome.runtime.onInstalled.addListener(() => {
  console.log("[NMO Helper] Установлено");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "NMO_SET_DATA" && msg.data) {
    chrome.storage.local.set({ nmo_data: msg.data, nmo_data_updated: Date.now() }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg && msg.type === "NMO_GET_DATA") {
    chrome.storage.local.get(["nmo_data", "nmo_data_updated"], (res) => {
      sendResponse(res);
    });
    return true;
  }
});