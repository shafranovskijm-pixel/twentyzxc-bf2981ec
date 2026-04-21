// Content script: автозаполнение полей на порталах НМФО и org.edu.
(function () {
  function setReactValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value == null ? "" : String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function findField(keys) {
    const inputs = document.querySelectorAll("input, textarea");
    for (const el of inputs) {
      if (el.type === "hidden" || el.disabled || el.readOnly) continue;
      const sig = [
        el.name || "",
        el.id || "",
        el.placeholder || "",
        (el.getAttribute("aria-label") || ""),
        ((el.labels && el.labels[0]?.innerText) || ""),
        (el.closest("label")?.innerText || ""),
      ].join(" ").toLowerCase();
      if (keys.some((k) => sig.includes(k.toLowerCase()))) return el;
    }
    return null;
  }

  // Карта: ключ из БД → массив поисковых подстрок (имя/id/placeholder/label).
  const FIELD_MAP = {
    organization_name: ["полное наименование", "наименование организации", "full_name", "orgname"],
    organization_abbr: ["сокращ", "аббревиат", "short_name", "abbrev"],
    inn: ["инн", "inn"],
    kpp: ["кпп", "kpp"],
    ogrn: ["огрн", "ogrn"],
    legal_address: ["юридический адрес", "юр. адрес", "legal_addr"],
    actual_address: ["фактический адрес", "fact_addr"],
    organization_phone: ["телефон организации", "phone_org", "org_phone"],
    organization_email: ["e-mail организации", "email организации", "org_email"],
    organization_website: ["сайт", "website", "url"],
    region: ["регион", "region"],
    license_number: ["номер лицензии", "license_num"],
    license_date: ["дата лицензии", "license_date"],
    responsible_name: ["фио", "full name", "имя", "name"],
    responsible_email: ["email", "e-mail", "почта"],
    responsible_mobile: ["мобильный", "mobile", "телефон"],
    responsible_snils: ["снилс", "snils"],
    responsible_position: ["должность", "position"],
    responsible_birth_date: ["дата рождения", "birth"],
    responsible_login: ["логин", "login"],
  };

  function fillAll(data) {
    let filled = 0;
    for (const [key, hints] of Object.entries(FIELD_MAP)) {
      const value = data[key];
      if (value == null || value === "") continue;
      const el = findField(hints);
      if (el) {
        setReactValue(el, value);
        el.style.outline = "2px solid #d4be37";
        setTimeout(() => { el.style.outline = ""; }, 2500);
        filled++;
      }
    }
    return filled;
  }

  // Слушаем команду из popup.
  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg && msg.type === "NMO_FILL") {
      const filled = fillAll(msg.data || {});
      sendResponse({ filled });
    }
    return true;
  });
})();