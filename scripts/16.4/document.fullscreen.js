// https://github.com/nguyenj/fullscreen-polyfill
// Modified with Claude
const spec = [
    "fullscreen",
    "fullscreenEnabled",
    "fullscreenElement",
    "fullscreenchange",
    "fullscreenerror",
    "exitFullscreen",
    "requestFullscreen",
];

const webkit = [
    "webkitIsFullScreen",
    "webkitFullscreenEnabled",
    "webkitFullscreenElement",
    "webkitfullscreenchange",
    "webkitfullscreenerror",
    "webkitExitFullscreen",
    "webkitRequestFullscreen",
];

// Make sure document exist, if it doesn't make it a dumb object
if (typeof document === "undefined") {
    try {
        document = {};
    } catch (e) {
        // Cannot create document in this environment
    }
}

// Get the vendor fullscreen prefixed api
const fsVendorKeywords = (function getFullscreenApi() {
    // Safety check for document
    if (!document || typeof document !== "object") {
        return [];
    }

    const fullscreenEnabled = [spec[1], webkit[1], moz[1], ms[1]].find(
        (prefix) => prefix && document[prefix]
    );
    return (
        [spec, webkit, moz, ms].find((vendor) => {
            return vendor.find((prefix) => prefix === fullscreenEnabled);
        }) || []
    );
})();

function handleEvent(eventType, event) {
    try {
        document[spec[0]] =
            document[fsVendorKeywords[0]] ||
            !!document[fsVendorKeywords[2]] ||
            false;
        document[spec[1]] = document[fsVendorKeywords[1]] || false;
        document[spec[2]] = document[fsVendorKeywords[2]] || null;

        if (typeof document.dispatchEvent === "function") {
            document.dispatchEvent(new Event(eventType));
        }
    } catch (e) {
        // Handle event failed, but don't break the page
        if (typeof console !== "undefined" && console.warn) {
            console.warn("Fullscreen event handling failed:", e);
        }
    }
}

function setupShim() {
    // Don't setup if we don't have valid vendor keywords
    if (!fsVendorKeywords.length) {
        return;
    }

    try {
        // fullscreen
        // Defaults to false for cases like MS where they do not have this
        // attribute. Another way to check whether fullscreen is active is to look
        // at the fullscreenElement attribute.
        document[spec[0]] =
            document[fsVendorKeywords[0]] ||
            !!document[fsVendorKeywords[2]] ||
            false;

        // fullscreenEnabled
        document[spec[1]] = document[fsVendorKeywords[1]] || false;

        // fullscreenElement
        document[spec[2]] = document[fsVendorKeywords[2]] || null;

        // onfullscreenchange
        if (
            fsVendorKeywords[3] &&
            typeof document.addEventListener === "function"
        ) {
            document.addEventListener(
                fsVendorKeywords[3],
                handleEvent.bind(document, spec[3]),
                false
            );
        }

        // onfullscreenerror
        if (
            fsVendorKeywords[4] &&
            typeof document.addEventListener === "function"
        ) {
            document.addEventListener(
                fsVendorKeywords[4],
                handleEvent.bind(document, spec[4]),
                false
            );
        }

        // exitFullscreen
        if (typeof document[fsVendorKeywords[5]] === "function") {
            document[spec[5]] = function () {
                return document[fsVendorKeywords[5]]();
            };
        }

        // requestFullscreen
        if (
            typeof Element !== "undefined" &&
            Element.prototype &&
            fsVendorKeywords[6]
        ) {
            Element.prototype[spec[6]] = function () {
                if (typeof this[fsVendorKeywords[6]] === "function") {
                    return this[fsVendorKeywords[6]].apply(this, arguments);
                }
            };
        }
    } catch (e) {
        // Polyfill setup failed, but don't break the page
        if (typeof console !== "undefined" && console.warn) {
            console.warn("Fullscreen polyfill setup failed:", e);
        }
    }
}

// Don't polyfill if it already exist or use UMD pattern for better compatibility
(function () {
    const shouldSetup =
        typeof document !== "undefined" &&
        typeof document[spec[1]] === "undefined" &&
        fsVendorKeywords.length > 0;

    let polyfillResult = {};

    if (shouldSetup) {
        setupShim();
        polyfillResult = {
            setupShim: setupShim,
            isPolyfilled: true,
        };
    }

    // Export for different module systems
    if (typeof module !== "undefined" && module.exports) {
        module.exports = polyfillResult;
    } else if (typeof define === "function" && define.amd) {
        define(function () {
            return polyfillResult;
        });
    } else if (typeof window !== "undefined") {
        window.fullscreenPolyfill = polyfillResult;
    }
})();
