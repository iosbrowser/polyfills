// ChatGPT Lookbehind Polyfill

// Minimal XRegExp-like shim
var XRegExp = (function () {
    function exec(str, regex, pos) {
        regex = cloneRegex(regex);
        regex.lastIndex = pos || 0;
        return regex.exec(str);
    }

    function replace(str, regex, replacement) {
        return str.replace(regex, replacement);
    }

    function cloneRegex(regex) {
        return new RegExp(regex.source, regex.flags);
    }

    return { exec, replace };
})();

// Lookbehind polyfill plugin
(function (XRegExp) {

    function extractLookbehind(source) {
        const start = source.indexOf('(?<');
        if (start === -1) return null;

        const typeChar = source[start + 3];
        if (typeChar !== '=' && typeChar !== '!') return null;

        const type = typeChar === '=';
        let depth = 1;
        let i = start + 4;
        const len = source.length;

        while (i < len && depth > 0) {
            const char = source[i];
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === '\\') i++; // skip escaped char
            i++;
        }

        if (depth !== 0) return null;

        const full = source.slice(start, i);
        const body = source.slice(start + 4, i - 1);

        return {
            full,
            type,
            body,
            main: source.replace(full, '')
        };
    }

    function prepareLb(lbBody, lbType) {
        const lookbehindRegex = XRegExp.exec(lbBody, /^(?:\(\?[\w$]+\))?(.*)$/);
        const pattern = lookbehindRegex ? lookbehindRegex[1] : lbBody;
        return {
            lb: new RegExp(pattern + '$(?!\\s)'),
            type: lbType
        };
    }

    XRegExp.execLb = function (str, lbStr, regex) {
        let pos = 0, match, leftContext;
        const lb = prepareLb(lbStr.body, lbStr.type);
        while (match = XRegExp.exec(str, regex, pos)) {
            leftContext = str.slice(0, match.index);
            if (lb.type === lb.lb.test(leftContext)) {
                return match;
            }
            pos = match.index + 1;
        }
        return null;
    };

    XRegExp.testLb = function (str, lbStr, regex) {
        return !!XRegExp.execLb(str, lbStr, regex);
    };

    XRegExp.searchLb = function (str, lbStr, regex) {
        const match = XRegExp.execLb(str, lbStr, regex);
        return match ? match.index : -1;
    };

    XRegExp.matchAllLb = function (str, lbStr, regex) {
        const matches = [], lb = prepareLb(lbStr.body, lbStr.type);
        let pos = 0, match, leftContext;
        while (match = XRegExp.exec(str, regex, pos)) {
            leftContext = str.slice(0, match.index);
            if (lb.type === lb.lb.test(leftContext)) {
                matches.push(match[0]);
                pos = match.index + (match[0].length || 1);
            } else {
                pos = match.index + 1;
            }
        }
        return matches;
    };

    XRegExp.replaceLb = function (str, lbStr, regex, replacement) {
        const lb = prepareLb(lbStr.body, lbStr.type);
        let output = '', pos = 0, lastEnd = 0, match, leftContext;
        while (match = XRegExp.exec(str, regex, pos)) {
            leftContext = str.slice(0, match.index);
            if (lb.type === lb.lb.test(leftContext)) {
                output += str.slice(lastEnd, match.index) + XRegExp.replace(match[0], regex, replacement);
                lastEnd = match.index + match[0].length;
                if (!regex.global) break;
                pos = match.index + (match[0].length || 1);
            } else {
                pos = match.index + 1;
            }
        }
        return output + str.slice(lastEnd);
    };

    // --- Patch methods on RegExp and String ---

    const NativeRegExp = RegExp;
    const originalExec = NativeRegExp.prototype.exec;
    const originalTest = NativeRegExp.prototype.test;
    const originalMatch = String.prototype.match;
    const originalSearch = String.prototype.search;
    const originalReplace = String.prototype.replace;

    // RegExp.prototype.exec
    NativeRegExp.prototype.exec = function (str) {
        const lbInfo = extractLookbehind(this.source);
        if (lbInfo) {
            const mainPattern = this.source.replace(lbInfo.full, '');
            return XRegExp.execLb(str, lbInfo, new NativeRegExp(mainPattern, this.flags));
        }
        return originalExec.call(this, str);
    };

    // RegExp.prototype.test
    NativeRegExp.prototype.test = function (str) {
        const lbInfo = extractLookbehind(this.source);
        if (lbInfo) {
            const mainPattern = this.source.replace(lbInfo.full, '');
            return XRegExp.testLb(str, lbInfo, new NativeRegExp(mainPattern, this.flags));
        }
        return originalTest.call(this, str);
    };

    // String.prototype.match
    String.prototype.match = function (regex) {
        if (regex && regex.source && regex.source.includes('(?<')) {
            const lbInfo = extractLookbehind(regex.source);
            if (lbInfo) {
                const mainPattern = regex.source.replace(lbInfo.full, '');
                const mainRegex = new NativeRegExp(mainPattern, regex.flags);
                return regex.global
                    ? XRegExp.matchAllLb(this, lbInfo, mainRegex)
                    : (() => {
                        const m = XRegExp.execLb(this, lbInfo, mainRegex);
                        return m ? [m[0]] : null;
                    })();
            }
        }
        return originalMatch.call(this, regex);
    };

    // String.prototype.search
    String.prototype.search = function (regex) {
        if (regex && regex.source && regex.source.includes('(?<')) {
            const lbInfo = extractLookbehind(regex.source);
            if (lbInfo) {
                const mainPattern = regex.source.replace(lbInfo.full, '');
                return XRegExp.searchLb(this, lbInfo, new NativeRegExp(mainPattern, regex.flags));
            }
        }
        return originalSearch.call(this, regex);
    };

    // String.prototype.replace
    String.prototype.replace = function (regex, replacement) {
        if (regex && regex.source && regex.source.includes('(?<')) {
            const lbInfo = extractLookbehind(regex.source);
            if (lbInfo) {
                const mainPattern = regex.source.replace(lbInfo.full, '');
                return XRegExp.replaceLb(this, lbInfo, new NativeRegExp(mainPattern, regex.flags), replacement);
            }
        }
        return originalReplace.call(this, regex, replacement);
    };

    // --- Override global RegExp constructor ---
    function PolyfilledRegExp(pattern, flags) {
        if (this instanceof PolyfilledRegExp) {
            const source = pattern instanceof NativeRegExp ? pattern.source : String(pattern);
            const actualFlags = pattern instanceof NativeRegExp ? (flags || pattern.flags) : (flags || "");

            const lbInfo = extractLookbehind(source);
            const mainPattern = lbInfo ? lbInfo.main : source;

            const re = new NativeRegExp(mainPattern, actualFlags);
            if (lbInfo) {
                re._hasPolyfillLookbehind = true;
                re._lookbehind = lbInfo;
            }

            Object.setPrototypeOf(re, PolyfilledRegExp.prototype);
            return re;
        }
        return new PolyfilledRegExp(pattern, flags);
    }

    PolyfilledRegExp.prototype = Object.create(NativeRegExp.prototype);
    PolyfilledRegExp.prototype.constructor = PolyfilledRegExp;

    PolyfilledRegExp.prototype.exec = NativeRegExp.prototype.exec;
    PolyfilledRegExp.prototype.test = NativeRegExp.prototype.test;

    // Swap out the global RegExp
    window.RegExp = PolyfilledRegExp;

})(XRegExp);
