// Bridge: ловит postMessage с сайта 24zxc.ru и пересылает данные в storage расширения.
window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "NMO_REGISTRATION_DATA") return;
  const data = event.data.data;
  if (!data || typeof data !== "object") return;
  chrome.runtime.sendMessage({ type: "NMO_SET_DATA", data }, (res) => {
    if (chrome.runtime.lastError) {
      console.warn("[NMO Bridge]", chrome.runtime.lastError.message);
      return;
    }
    if (res && res.ok) {
      console.log("[NMO Bridge] Данные сохранены в расширении");
    }
  });
});