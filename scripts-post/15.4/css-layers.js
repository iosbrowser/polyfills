// ChatGPT
(function polyfillCSSLayer() {
    if (window.__cssLayersPolyfillApplied) return;
    window.__cssLayersPolyfillApplied = true;

    // Parsing utilities
    function cleanCSS(css) {
        return parseBlocks(css).join('');
    }

    function parseBlocks(css, startIndex = 0) {
        const output = [];
        let buffer = '';
        let i = startIndex;

        while (i < css.length) {
            if (css.startsWith('@layer', i)) {
                if (buffer.trim()) output.push(buffer);
                buffer = '';

                i += 6;
                // Safe character skipping with bounds checking
                while (i < css.length && /\s/.test(css[i])) i++;
                while (i < css.length && /[a-zA-Z0-9_.-]/.test(css[i])) i++;
                while (i < css.length && /\s/.test(css[i])) i++;

                if (i < css.length && css[i] === '{') {
                    const { blockContent, endIndex } = extractBlock(css, i);
                    const inner = parseBlocks(blockContent).join('');
                    output.push(inner);
                    i = endIndex;
                    continue;
                } else {
                    // If we can't find '{', treat as regular text and continue safely
                    buffer += '@layer';
                    if (i >= css.length) break;
                    // Don't continue without incrementing i
                }
            }

            if (css[i] === '{') {
                const selector = buffer.trim();
                buffer = '';

                const { blockContent, endIndex } = extractBlock(css, i);
                const nested = parseBlocks(blockContent).join('');

                if (selector.includes('::backdrop')) {
                    i = endIndex;
                    continue;
                }

                const cleanedSelector = selector
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s && !s.includes('::backdrop'))
                    .join(', ');

                if (cleanedSelector) {
                    output.push(`${cleanedSelector} {${nested}}`);
                }

                i = endIndex;
            } else {
                buffer += css[i++];
            }
        }

        if (buffer.trim()) output.push(buffer);
        return output;
    }

    function extractBlock(css, startIndex) {
        let i = startIndex;
        let depth = 0;
        const maxLen = css.length;
        i++; // skip initial {
        const blockStart = i;

        // Add iteration limit as safety measure
        let iterations = 0;
        const maxIterations = maxLen * 2; // Reasonable upper bound

        while (i < maxLen && iterations < maxIterations) {
            if (css[i] === '{') depth++;
            else if (css[i] === '}') {
                if (depth === 0) break;
                depth--;
            }
            i++;
            iterations++;
        }

        if (i >= maxLen) {
            console.warn('⚠️ Unclosed CSS block detected');
            return {
                blockContent: css.slice(blockStart),
                endIndex: maxLen
            };
        }

        if (iterations >= maxIterations) {
            console.warn('⚠️ CSS parsing iteration limit reached, possible infinite loop prevented');
            return {
                blockContent: css.slice(blockStart, i),
                endIndex: i
            };
        }

        const blockContent = css.slice(blockStart, i);
        return { blockContent, endIndex: i + 1 };
    }

    function injectStyle(css, id) {
        if (id && document.getElementById(id)) return;
        const style = document.createElement('style');
        if (id) style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Reload <link> with crossorigin=anonymous to try gaining access to cssRules
    function reloadCrossOriginStylesheet(link) {
        return new Promise((resolve, reject) => {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = link.href;
            newLink.crossOrigin = 'anonymous';
            newLink.onload = () => resolve(newLink);
            newLink.onerror = reject;
            link.parentNode.insertBefore(newLink, link.nextSibling);
            link.remove();
        });
    }

    async function fetchAndInlineStylesheet(href) {
        try {
            const res = await fetch(href, { mode: 'cors' });
            if (!res.ok) throw new Error(`Failed to fetch ${href}`);
            const cssText = await res.text();
            const cleaned = cleanCSS(cssText);
            injectStyle(cleaned);
            return true;
        } catch (e) {
            console.warn(`❌ Could not fetch stylesheet at ${href}`, e);
            return false;
        }
    }

    async function processStyleSheets() {
        const seen = new WeakSet();
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

        for (const sheet of document.styleSheets) {
            if (seen.has(sheet)) continue;
            seen.add(sheet);

            if (sheet.href) {
                const link = links.find(l => l.href === sheet.href);
                if (!link) continue;

                const sheetOrigin = new URL(sheet.href, location.href).origin;
                const pageOrigin = location.origin;

                if (sheetOrigin === pageOrigin) {
                    // Same origin: fetch + inline directly
                    await fetchAndInlineStylesheet(sheet.href);
                    continue;
                }

                // Cross-origin: try fetch first
                const fetched = await fetchAndInlineStylesheet(sheet.href);
                if (fetched) continue;

                // Fetch failed (CSP, network), try reload with crossorigin
                if (!link.crossOrigin) {
                    try {
                        const reloaded = await reloadCrossOriginStylesheet(link);
                        // Wait for new stylesheet to be parsed
                        await new Promise(r => setTimeout(r, 100)); // small delay

                        // Access cssRules if possible
                        const newSheet = Array.from(document.styleSheets).find(
                            s => s.href === reloaded.href
                        );
                        if (newSheet) {
                            try {
                                const cssText = Array.from(newSheet.cssRules)
                                    .map(rule => rule.cssText)
                                    .join('\n');
                                const cleaned = cleanCSS(cssText);
                                injectStyle(cleaned);
                            } catch (e) {
                                console.warn(`❌ Still can’t access cssRules for ${reloaded.href}`, e);
                            }
                        }
                    } catch (reloadErr) {
                        console.warn(`❌ Reload with crossorigin failed for ${link.href}`, reloadErr);
                    }
                }
            } else if (
                sheet.ownerNode &&
                sheet.ownerNode.tagName === 'STYLE' &&
                sheet.ownerNode.textContent.includes('@layer')
            ) {
                const original = sheet.ownerNode.textContent;
                const cleaned = cleanCSS(original);
                injectStyle(cleaned);
            }
        }
    }

    // Run after a 2-second delay, or when document is complete (whichever is later)
    function runPolyfill() {
        setTimeout(() => {
            processStyleSheets();
        }, 2000);
    }

    if (document.readyState === 'complete') {
        runPolyfill();
    } else {
        window.addEventListener('load', runPolyfill);
    }
})();
