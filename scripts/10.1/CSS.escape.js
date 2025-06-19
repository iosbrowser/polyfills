// https://github.com/mathiasbynens/CSS.escape
; (function (root, factory) {
    factory(root);
}(typeof global != 'undefined' ? global : this, function (root) {

    if (root.CSS && root.CSS.escape) {
        return root.CSS.escape;
    }

    var cssEscape = function (value) {
        if (arguments.length == 0) {
            throw new TypeError('`CSS.escape` requires an argument.');
        }
        var string = String(value);
        var length = string.length;
        var index = -1;
        var codeUnit;
        var result = '';
        var firstCodeUnit = string.charCodeAt(0);

        if (
            length == 1 &&
            firstCodeUnit == 0x002D
        ) {
            return '\\' + string;
        }

        while (++index < length) {
            codeUnit = string.charCodeAt(index);

            if (codeUnit == 0x0000) {
                result += '\uFFFD';
                continue;
            }

            if (
                (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
                (index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
                (
                    index == 1 &&
                    codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
                    firstCodeUnit == 0x002D
                )
            ) {
                result += '\\' + codeUnit.toString(16) + ' ';
                continue;
            }

            if (
                codeUnit >= 0x0080 ||
                codeUnit == 0x002D ||
                codeUnit == 0x005F ||
                codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
                codeUnit >= 0x0041 && codeUnit <= 0x005A ||
                codeUnit >= 0x0061 && codeUnit <= 0x007A
            ) {
                result += string.charAt(index);
                continue;
            }

            result += '\\' + string.charAt(index);
        }
        return result;
    };

    if (!root.CSS) {
        root.CSS = {};
    }

    root.CSS.escape = cssEscape;
    return cssEscape;

}));