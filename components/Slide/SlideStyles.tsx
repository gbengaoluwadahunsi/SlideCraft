/**
 * SlideStyles.tsx
 * 
 * Extracted CSS logic for Slide components.
 */

export const getSlideStyles = (
  scopeClass: string,
  activeAccentColor: string,
  activeTextColor: string,
  activeBgColor: string,
  titleColor?: string
) => {
  const resolvedTitleColor = titleColor || activeAccentColor;

  return `
    .${scopeClass} { 
      overflow: visible !important;
    }
    .${scopeClass} * { overflow: visible !important; max-width: 100%; box-sizing: border-box; }
    .${scopeClass} p, .${scopeClass} div, .${scopeClass} span { 
      word-wrap: break-word !important; 
      overflow-wrap: break-word !important; 
      white-space: normal !important;
      overflow: visible !important;
      max-width: 100% !important;
    }
    .${scopeClass} strong, .${scopeClass} b { color: var(--slide-accent); font-weight: 700; }
    .${scopeClass} em, .${scopeClass} i { 
      ${titleColor ? '' : 'background-color: var(--slide-accent-33);'} 
      color: var(--slide-accent); 
      font-style: normal; 
      ${titleColor ? '' : 'padding: 0 4px; border-radius: 4px;'} 
    }
    .${scopeClass} code { 
      background-color: transparent; 
      color: var(--slide-accent); 
      padding: 0 2px; 
      font-family: var(--font-roboto-mono), monospace; 
      font-weight: bold; 
    }
    .${scopeClass} ul, .${scopeClass} ol { 
      margin: 1rem 0; 
      padding-left: 0;
      padding-right: 0;
      list-style-position: outside;
      overflow: visible;
      display: block;
    }
    .${scopeClass} ul { 
      list-style-type: disc; 
      padding-left: 2.5rem;
      list-style-position: outside;
      margin-left: 0;
      margin-right: 0;
    }
    .${scopeClass} ul li, .${scopeClass} ol li { 
      margin: 0.5rem 0; 
      line-height: 1.6; 
      padding-left: 0.5rem;
      padding-right: 0;
      list-style-position: outside;
      position: relative;
      display: list-item;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      white-space: normal !important;
      overflow: visible !important;
    }
    .${scopeClass} .slide-content, .${scopeClass} .slide-content p {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      white-space: normal !important;
      overflow: visible !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .${scopeClass} ul li::marker { 
      color: var(--slide-accent) !important; 
      font-size: 1.2em !important;
      font-weight: bold !important;
      display: list-item !important;
    }
    .${scopeClass} ol { 
      list-style-type: decimal; 
      padding-left: 3rem;
    }
    .${scopeClass} ol li { 
      counter-increment: list-counter;
      padding-left: 3rem;
    }
    .${scopeClass} ol li::marker { 
      color: var(--slide-accent); 
      font-weight: bold;
      font-size: 1.1em;
      content: counter(list-counter) '.';
      position: absolute;
      left: 0;
      width: 2.5rem;
      text-align: right;
      padding-right: 0.75rem;
    }
    .${scopeClass} table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 1.5rem 0; 
      border-radius: 8px; 
      overflow: visible;
      background-color: rgba(0,0,0,0.2);
      border: 1px solid var(--slide-accent-40);
      table-layout: auto;
    }
    .${scopeClass} table thead { 
      background-color: var(--slide-accent-20); 
    }
    .${scopeClass} table th { 
      padding: 1rem; 
      text-align: left; 
      font-weight: bold; 
      color: var(--slide-accent);
      border-bottom: 2px solid var(--slide-accent-60);
      white-space: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: visible;
      vertical-align: top;
    }
    .${scopeClass} table td { 
      padding: 0.75rem 1rem; 
      border-bottom: 1px solid var(--slide-accent-20);
      color: var(--slide-text);
      white-space: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: visible;
      vertical-align: top;
    }
    .${scopeClass} table tbody tr { 
      overflow: visible;
    }
    .${scopeClass} table tbody tr:hover { 
      background-color: var(--slide-accent-10); 
    }
    .${scopeClass} table tbody tr:last-child td { 
      border-bottom: none; 
    }
  `;
};
