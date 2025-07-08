// https://github.com/nguyenj/fullscreen-polyfill
(function () {
    "use strict";

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

    // Get the vendor fullscreen prefixed api
    const fsVendorKeywords = (function getFullscreenApi() {
        const fullscreenEnabled = [spec[1], webkit[1]].find(
            (prefix) => prefix && document[prefix]
        );
        return (
            [spec, webkit].find((vendor) => {
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

            document.dispatchEvent(new Event(eventType));
        } catch (e) {
            console.warn("Fullscreen event handling failed:", e);
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
            if (fsVendorKeywords[3]) {
                document.addEventListener(
                    fsVendorKeywords[3],
                    handleEvent.bind(document, spec[3]),
                    false
                );
            }

            // onfullscreenerror
            if (fsVendorKeywords[4]) {
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
            if (Element.prototype && fsVendorKeywords[6]) {
                Element.prototype[spec[6]] = function () {
                    if (typeof this[fsVendorKeywords[6]] === "function") {
                        return this[fsVendorKeywords[6]].apply(this, arguments);
                    }
                };
            }
        } catch (e) {
            console.warn("Fullscreen polyfill setup failed:", e);
        }
    }

    // Don't polyfill if it already exists
    function initPolyfill() {
        const shouldSetup =
            typeof document[spec[1]] === "undefined" &&
            fsVendorKeywords.length > 0;

        if (shouldSetup) {
            setupShim();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPolyfill);
    } else {
        initPolyfill();
    }
})();
