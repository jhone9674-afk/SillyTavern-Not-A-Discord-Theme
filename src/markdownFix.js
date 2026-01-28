import { eventSource, event_types } from '../../../../../script.js';

/**
 * Robust Smart Markdown Spacing Fix for SillyTavern.
 * Uses MutationObserver to handle dynamic message rendering and ensure real spaces are injected correctly.
 */
export function initializeMarkdownFix() {
    console.log('[NADTheme] Initializing Robust Markdown Spacing Fix');

    const chatContainer = document.getElementById('chat');
    if (!chatContainer) {
        console.warn('[NADTheme] Chat container not found, will retry initialization.');
        return;
    }

    // Process existing messages
    document.querySelectorAll('.mes_text').forEach(applySpacingFix);

    // Watch for new messages or message updates
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target.nodeType === Node.ELEMENT_NODE
                    ? mutation.target
                    : mutation.target.parentElement;

                if (target) {
                    const mesText = target.closest('.mes_text');
                    if (mesText) applySpacingFix(mesText);
                }

                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && node.classList.contains('mes')) {
                                const text = node.querySelector('.mes_text');
                                if (text) applySpacingFix(text);
                            }
                            const mesTexts = node.querySelectorAll ? node.querySelectorAll('.mes_text') : [];
                            mesTexts.forEach(applySpacingFix);
                        }
                    });
                }
            }
        }
    });

    observer.observe(chatContainer, { childList: true, subtree: true, characterData: true });

    // Legacy fallback for rendering events
    eventSource.on(event_types.MESSAGE_RENDERED, (messageId) => {
        const messageElement = document.querySelector(`.mes[mesid="${messageId}"] .mes_text`);
        if (messageElement) {
            applySpacingFix(messageElement);
        }
    });
}

function applySpacingFix(container) {
    if (!container) return;

    const italics = container.querySelectorAll('em, i');
    // Punctuation that should be ATTACHED to the italicized word (no space)
    const attachedPunctuation = /^[\.,!\?\:;"'\)\]\}>—]/;
    // Punctuation/symbols that should have a SPACE before them if they follow italics
    // (Usually just opening brackets or quotes, but handled by the general logic)

    italics.forEach(el => {
        // Fix space BEFORE
        const prev = el.previousSibling;
        if (prev) {
            if (prev.nodeType === Node.TEXT_NODE) {
                const text = prev.textContent;
                // If ends with a non-space character that isn't an opening bracket/quote
                if (/[^\s\(\[\{"']$/.test(text)) {
                    // Check if we haven't already added a space
                    if (!text.endsWith(' ')) {
                        prev.textContent = text + ' ';
                    }
                }
            } else if (prev.nodeType === Node.ELEMENT_NODE) {
                const prevText = prev.innerText || prev.textContent;
                if (/[^\s\(\[\{"']$/.test(prevText)) {
                    el.style.marginLeft = '0.25em';
                }
            }
        }

        // Fix space AFTER
        const next = el.nextSibling;
        if (next) {
            if (next.nodeType === Node.TEXT_NODE) {
                const text = next.textContent;
                // If starts with a non-space character AND it's not "attached" punctuation
                if (text.length > 0 && !/^\s/.test(text) && !attachedPunctuation.test(text)) {
                    next.textContent = ' ' + text;
                }
            } else if (next.nodeType === Node.ELEMENT_NODE) {
                const nextText = next.innerText || next.textContent;
                if (nextText.length > 0 && !/^\s/.test(nextText) && !attachedPunctuation.test(nextText)) {
                    el.style.marginRight = '0.25em';
                }
            }
        }
    });
}
