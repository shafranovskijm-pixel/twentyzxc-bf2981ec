const content = document.getElementById("content");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
}

chrome.storage.local.get(["nmo_data", "nmo_data_updated"], (res) => {
  const data = res.nmo_data;
  if (!data) {
    content.innerHTML = `
      <div class="empty">
        Данные не получены.<br><br>
        Откройте админ-панель <strong>24zxc.ru/admin</strong>,
        перейдите в карточку заявки НМО и нажмите
        «Передать в расширение».
      </div>`;
    return;
  }

  const updated = res.nmo_data_updated
    ? new Date(res.nmo_data_updated).toLocaleString("ru-RU")
    : "—";

  content.innerHTML = `
    <div class="org">${data.organization_name || "Без названия"}</div>
    <div class="meta">
      ${data.inn ? "ИНН: " + data.inn : ""}<br>
      Обновлено: ${updated}
    </div>
    <button id="fill">Заполнить эту страницу</button>
    <button id="clear" class="secondary">Очистить данные</button>
  `;

  document.getElementById("fill").addEventListener("click", async () => {
    setStatus("Заполняем поля…");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      setStatus("Не найдена активная вкладка");
      return;
    }
    if (!/nmfo-vo\.edu\.rosminzdrav\.ru|org\.edu\.rosminzdrav\.ru/.test(tab.url || "")) {
      setStatus("Откройте nmfo-vo.edu.rosminzdrav.ru или org.edu.rosminzdrav.ru");
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: "NMO_FILL", data }, (resp) => {
      if (chrome.runtime.lastError) {
        setStatus("Ошибка: " + chrome.runtime.lastError.message);
        return;
      }
      const n = (resp && resp.filled) || 0;
      setStatus(`Заполнено полей: ${n}. Капчу и отправку — вручную.`);
    });
  });

  document.getElementById("clear").addEventListener("click", () => {
    chrome.storage.local.remove(["nmo_data", "nmo_data_updated"], () => {
      window.close();
    });
  });
});