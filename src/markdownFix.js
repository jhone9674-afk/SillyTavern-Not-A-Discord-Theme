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
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If a whole message was added
                        if (node.classList && node.classList.contains('mes')) {
                            const text = node.querySelector('.mes_text');
                            if (text) applySpacingFix(text);
                        }
                        // Or if content inside an existing message changed
                        if (node.classList && node.classList.contains('mes_text')) {
                            applySpacingFix(node);
                        }
                        // Handle cases where sub-elements might be inserted
                        const mesTexts = node.querySelectorAll ? node.querySelectorAll('.mes_text') : [];
                        mesTexts.forEach(applySpacingFix);
                    }
                });
            }
        }
    });

    observer.observe(chatContainer, { childList: true, subtree: true });

    // Legacy fallback for rendering events
    eventSource.on(event_types.MESSAGE_RENDERED, (messageId) => {
        const messageElement = document.querySelector(`.mes[mesid="${messageId}"] .mes_text`);
        if (messageElement) {
            applySpacingFix(messageElement);
        }
    });
}

function applySpacingFix(container) {
    if (!container || container.getAttribute('data-spacing-fixed') === 'true') return;

    const italics = container.querySelectorAll('em, i');
    const punctuationRegex = /^[\.,!\?\:;"'\)\]\}\(]/;

    let fixedCount = 0;

    italics.forEach(el => {
        // Fix space BEFORE
        const prev = el.previousSibling;
        if (prev) {
            if (prev.nodeType === Node.TEXT_NODE) {
                const text = prev.textContent;
                // If ends with a word character and NOT a space
                if (/\w$/.test(text)) {
                    prev.textContent = text + ' ';
                    fixedCount++;
                }
            } else if (prev.nodeType === Node.ELEMENT_NODE) {
                // If it's another inline element, they might be glued
                // We don't want to mess with everything, but if it ends in text...
                const prevText = prev.innerText || prev.textContent;
                if (/\w$/.test(prevText)) {
                    el.style.marginLeft = '0.25em';
                    fixedCount++;
                }
            }
        }

        // Fix space AFTER
        const next = el.nextSibling;
        if (next) {
            if (next.nodeType === Node.TEXT_NODE) {
                const text = next.textContent;
                // If starts with a word character (not punctuation/space)
                if (/^\w/.test(text) && !punctuationRegex.test(text)) {
                    next.textContent = ' ' + text;
                    fixedCount++;
                }
            } else if (next.nodeType === Node.ELEMENT_NODE) {
                const nextText = next.innerText || next.textContent;
                if (/^\w/.test(nextText) && !punctuationRegex.test(nextText)) {
                    el.style.marginRight = '0.25em';
                    fixedCount++;
                }
            }
        }
    });

    // Mark as potentially fixed to avoid infinite loops, 
    // but only if we actually found italics to check.
    if (italics.length > 0) {
        container.setAttribute('data-spacing-fixed', 'true');
    }
}
