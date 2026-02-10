import { PlaygroundBlock, PlaygroundSettings } from "@/data/playground-effects";

function getBackgroundCSS(settings: PlaygroundSettings): string {
  const isGradient = settings.backgroundColor.startsWith('linear-gradient');
  let bg = isGradient ? `background: ${settings.backgroundColor};` : `background-color: ${settings.backgroundColor};`;
  const pattern = settings.backgroundPattern || 'none';
  if (pattern === 'dots') bg += `background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0); background-size: 20px 20px;`;
  if (pattern === 'grid') bg += `background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px;`;
  return bg;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blockStyle(block: PlaygroundBlock, globalFont?: string): string {
  const s = block.styles;
  let css = '';
  if (s.backgroundColor && s.backgroundColor !== 'transparent') css += `background-color: ${s.backgroundColor};`;
  if (s.textColor) css += `color: ${s.textColor};`;
  if (s.padding) css += `padding: ${s.padding};`;
  if (s.fontSize) css += `font-size: ${s.fontSize};`;
  if (s.borderRadius) css += `border-radius: ${s.borderRadius};`;
  if (s.textAlign) css += `text-align: ${s.textAlign};`;
  if (s.fontFamily || globalFont) css += `font-family: ${s.fontFamily || globalFont};`;
  if (s.boxShadow) css += `box-shadow: ${s.boxShadow};`;
  return css;
}

function renderBlockHTML(block: PlaygroundBlock, globalFont?: string): string {
  const style = blockStyle(block, globalFont);

  switch (block.type) {
    case 'heading':
      return `<h2 style="${style} font-weight: bold;">${escapeHtml(block.content)}</h2>`;
    case 'text':
      return `<p style="${style}">${escapeHtml(block.content)}</p>`;
    case 'button': {
      const bs = block.buttonStyle || 'filled';
      let btnStyle = style;
      if (bs === 'filled') btnStyle += 'background: #d4a855; color: #000; border: none;';
      if (bs === 'outline') btnStyle += 'background: transparent; border: 2px solid currentColor;';
      if (bs === 'gradient') btnStyle += 'background: linear-gradient(to right, #d4a855, #a855f7); color: #fff; border: none;';
      btnStyle += 'padding: 12px 24px; cursor: pointer; font-weight: 500;';
      return `<div style="text-align: ${block.styles.textAlign || 'center'};"><button style="${btnStyle}">${escapeHtml(block.content)}</button></div>`;
    }
    case 'image': {
      const isFullWidth = block.styles.padding === '0px' && block.styles.borderRadius === '0px';
      const imgContainerStyle = isFullWidth ? 'margin: 0 -24px; width: calc(100% + 48px);' : style;
      return `<div style="${imgContainerStyle}"><img src="${escapeHtml(block.content)}" alt="" style="max-width: 100%; width: 100%; height: auto; border-radius: ${isFullWidth ? '0' : (block.styles.borderRadius || '0')};"></div>`;
    }
    case 'divider':
      return `<div style="padding: 16px 0;"><hr style="border: none; height: 1px; background: ${block.styles.textColor || '#333'};"></div>`;
    case 'spacer':
      return `<div style="${style}"></div>`;
    case 'card':
      return `<div style="${style} border: 1px solid ${block.styles.borderColor || 'rgba(255,255,255,0.1)'}; backdrop-filter: blur(4px);${block.styles.boxShadow ? '' : (block.styles.backgroundColor && block.styles.backgroundColor !== 'transparent' ? ' box-shadow: 0 4px 20px rgba(0,0,0,0.2);' : '')}">${escapeHtml(block.content)}</div>`;
    case 'list': {
      const items = block.content.split('\n').filter(Boolean);
      return `<div style="${style}"><ul style="list-style: disc; padding-left: 20px;">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`;
    }
    case 'quote': {
      const [text, author] = block.content.split('|');
      return `<blockquote style="${style} border-left: 4px solid rgba(212,168,85,0.6); font-style: italic;"><p>«${escapeHtml(text)}»</p>${author ? `<footer style="font-size: 0.875em; opacity: 0.7; font-style: normal;">— ${escapeHtml(author)}</footer>` : ''}</blockquote>`;
    }
    case 'counter': {
      const [value, label] = block.content.split('|');
      return `<div style="${style} text-align: center;"><div style="font-size: 2.5em; font-weight: bold;">${escapeHtml(value)}</div>${label ? `<div style="font-size: 0.875em; opacity: 0.7;">${escapeHtml(label)}</div>` : ''}</div>`;
    }
    case 'columns': {
      const cols = block.content.split('||').filter(Boolean);
      return `<div style="${style} display: grid; grid-template-columns: repeat(${Math.min(cols.length, 4)}, 1fr); gap: 16px;">${cols.map(col => {
        const [title, desc] = col.split('|');
        return `<div style="padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;"><div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(title)}</div>${desc ? `<div style="font-size: 0.875em; opacity: 0.7;">${escapeHtml(desc)}</div>` : ''}</div>`;
      }).join('')}</div>`;
    }
    case 'navbar': {
      const items = block.content.split('\n').filter(Boolean);
      return `<nav style="${style} display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;"><div style="font-weight: bold; font-size: 1.2em;">☰</div><div style="display: flex; gap: 24px;">${items.map(item => {
        const [label] = item.split('|');
        return `<span style="font-size: 0.875em;">${escapeHtml(label)}</span>`;
      }).join('')}</div></nav>`;
    }
    case 'footer': {
      const parts = block.content.split('|').filter(Boolean);
      return `<footer style="${style} border-top: 1px solid rgba(255,255,255,0.1);"><div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875em;"><span>${escapeHtml(parts[0] || '')}</span>${parts.length > 1 ? `<div style="display: flex; gap: 16px; opacity: 0.7;">${parts.slice(1).map(p => `<span>${escapeHtml(p)}</span>`).join('')}</div>` : ''}</div></footer>`;
    }
    case 'icon-text': {
      const [icon, title, desc] = block.content.split('|');
      return `<div style="${style} display: flex; align-items: center; gap: 16px;"><span style="font-size: 2.5em;">${icon}</span><div><div style="font-weight: 600;">${escapeHtml(title || '')}</div>${desc ? `<div style="font-size: 0.875em; opacity: 0.7;">${escapeHtml(desc)}</div>` : ''}</div></div>`;
    }
    case 'gallery': {
      const images = block.content.split('\n').filter(Boolean);
      return `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; ${style}">${images.map(src => `<img src="${escapeHtml(src)}" alt="" style="width: 100%; height: auto; object-fit: cover; border-radius: ${block.styles.borderRadius || '0'};">`).join('')}</div>`;
    }
    case 'video':
      return `<div style="${style}"><div style="position: relative; padding-bottom: 56.25%; overflow: hidden; border-radius: ${block.styles.borderRadius || '0'};"><iframe src="${escapeHtml(block.content)}" style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe></div></div>`;
    case 'socials': {
      const links = block.content.split('\n').filter(Boolean);
      const icons: Record<string, string> = { telegram: '✈️', instagram: '📷', vk: '🔵', youtube: '▶️', tiktok: '🎵', twitter: '🐦' };
      return `<div style="${style} display: flex; justify-content: center; gap: 16px;">${links.map(line => {
        const [platform, url] = line.split('|');
        return `<a href="${escapeHtml(url || '#')}" target="_blank" style="font-size: 1.5em; text-decoration: none;">${icons[platform.trim().toLowerCase()] || '🔗'}</a>`;
      }).join('')}</div>`;
    }
    case 'accordion': {
      const items = block.content.split('\n').filter(Boolean);
      return `<div style="${style}">${items.map(item => {
        const [q, a] = item.split('|');
        return `<details style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 12px 0;"><summary style="cursor: pointer; font-weight: 500;">${escapeHtml(q || '')}</summary><p style="margin-top: 8px; opacity: 0.8; font-size: 0.9em;">${escapeHtml(a || '')}</p></details>`;
      }).join('')}</div>`;
    }
    case 'tabs': {
      const tabs = block.content.split('||').filter(Boolean);
      const id = 'tabs-' + Math.random().toString(36).slice(2, 7);
      return `<div style="${style}"><div style="display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 12px;">${tabs.map((tab, i) => {
        const [title] = tab.split('|');
        return `<button onclick="document.querySelectorAll('.${id}').forEach(e=>e.style.display='none');document.getElementById('${id}-${i}').style.display='block';this.parentElement.querySelectorAll('button').forEach(b=>b.style.opacity='0.5');this.style.opacity='1';" style="padding: 8px 16px; background: none; border: none; color: inherit; cursor: pointer; font-size: inherit; opacity: ${i === 0 ? '1' : '0.5'}; border-bottom: 2px solid ${i === 0 ? 'currentColor' : 'transparent'};">${escapeHtml(title)}</button>`;
      }).join('')}</div>${tabs.map((tab, i) => {
        const [, content] = tab.split('|');
        return `<div id="${id}-${i}" class="${id}" style="display: ${i === 0 ? 'block' : 'none'};">${escapeHtml(content || '')}</div>`;
      }).join('')}</div>`;
    }
    case 'form':
      return `<div style="${style} border: 1px solid rgba(255,255,255,0.1);"><p style="font-weight: 600;">Форма заявки</p><p style="opacity: 0.5; font-size: 0.875em;">Формы работают только на опубликованных страницах</p></div>`;
    default:
      return '';
  }
}

export function exportToHTML(title: string, blocks: PlaygroundBlock[], settings: PlaygroundSettings): string {
  const bgCSS = getBackgroundCSS(settings);
  const globalFont = settings.globalFontFamily || '';
  const fontLink = globalFont ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(globalFont)}:wght@400;500;600;700&display=swap" rel="stylesheet">` : '';

  // Group consecutive counter/icon-text blocks
  const visibleBlocks = blocks.filter(b => !b.hidden);
  const groupableTypes = ['counter', 'icon-text'];
  let blocksHTML = '';
  let i = 0;
  while (i < visibleBlocks.length) {
    const block = visibleBlocks[i];
    if (groupableTypes.includes(block.type)) {
      const group: PlaygroundBlock[] = [block];
      let j = i + 1;
      while (j < visibleBlocks.length && visibleBlocks[j].type === block.type) {
        group.push(visibleBlocks[j]);
        j++;
      }
      if (group.length >= 2) {
        const cols = Math.min(group.length, 4);
        blocksHTML += `\n    <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px;">`;
        group.forEach(gb => { blocksHTML += `\n      ${renderBlockHTML(gb, globalFont)}`; });
        blocksHTML += `\n    </div>`;
        i = j;
        continue;
      }
    }
    blocksHTML += `\n    ${renderBlockHTML(block, globalFont)}`;
    i++;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${fontLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { ${bgCSS} ${globalFont ? `font-family: '${globalFont}', sans-serif;` : ''} min-height: 100vh; }
    .container { max-width: 960px; margin: 0 auto; padding: 24px; }
    .container > * { margin-bottom: 16px; }
    img { display: block; }
    a { color: inherit; }
  </style>
</head>
<body>
  <div class="container">
    ${blocksHTML}
  </div>
</body>
</html>`;
}
