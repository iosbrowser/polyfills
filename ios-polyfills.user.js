// ==UserScript==
// @name         iOS Polyfills - Mobile Compatibility Enhancement
// @namespace    https://github.com/iosbrowser/ios-polyfills
// @version      1.0.0
// @description  Comprehensive compatibility script based on iOS Polyfills project, providing modern JavaScript features for older browsers
// @author       iOS Polyfills Team
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    console.log('iOS Polyfills Userscript started.');

    // ============ Configuration and Utility Functions ============
    const STORAGE_KEYS = {
        enabled: 'ios_polyfills_enabled',
        debugMode: 'ios_polyfills_debug'
    };

    const DEFAULTS = {
        enabled: true,
        debugMode: false
    };

    const logPrefix = '[iOS-Polyfills]';
    const log = (...args) => {
        if (getDebugMode()) console.log(logPrefix, ...args);
    };
    const warn = (...args) => console.warn(logPrefix, ...args);
    const error = (...args) => console.error(logPrefix, ...args);

    function getEnabled() {
        return Boolean(GM_getValue(STORAGE_KEYS.enabled, DEFAULTS.enabled));
    }

    function setEnabled(v) {
        GM_setValue(STORAGE_KEYS.enabled, Boolean(v));
        refreshMenu();
    }

    function getDebugMode() {
        return Boolean(GM_getValue(STORAGE_KEYS.debugMode, DEFAULTS.debugMode));
    }

    function setDebugMode(v) {
        GM_setValue(STORAGE_KEYS.debugMode, Boolean(v));
        refreshMenu();
    }

    // ============ Menu Management ============
    let menuIds = [];

    function refreshMenu() {
        // Clear old menu items
        if (menuIds.length) {
            try { 
                menuIds.forEach(GM_unregisterMenuCommand); 
            } catch(e) {}
            menuIds = [];
        }

        const id1 = GM_registerMenuCommand(
            getEnabled() ? '✅ Disable Polyfills' : '❌ Enable Polyfills',
            () => setEnabled(!getEnabled())
        );

        const id2 = GM_registerMenuCommand(
            getDebugMode() ? '🔍 Disable Debug Mode' : '🔍 Enable Debug Mode',
            () => setDebugMode(!getDebugMode())
        );

        const id3 = GM_registerMenuCommand('📊 Check Browser Support', showBrowserSupport);

        menuIds.push(id1, id2, id3);
    }

    function showBrowserSupport() {
        const features = [
            'Array.from', 'Array.includes', 'Object.assign', 'Promise', 
            'Array.flat', 'String.padStart', 'ResizeObserver', 'Promise.any'
        ];
        
        const support = features.map(feature => {
            const supported = checkFeatureSupport(feature);
            return `${feature}: ${supported ? '✅' : '❌'}`;
        }).join('\n');

        alert(`Browser Feature Support:\n\n${support}`);
    }

    function checkFeatureSupport(feature) {
        try {
            const parts = feature.split('.');
            let obj = window;
            for (const part of parts) {
                obj = obj[part];
                if (obj === undefined) return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    // ============ iOS 9.0 Polyfills ============
    function applyiOS90Polyfills() {
        log('Applying iOS 9.0 polyfills...');

        // Array.from polyfill
        if (!Array.from) {
            log('Adding Array.from polyfill');
            Array.from = (function () {
                var iteratorTypes = [
                    '[object Map Iterator]', '[object Set Iterator]',
                    '[object WeakMap Iterator]', '[object WeakSet Iterator]'
                ];

                var toStr = Object.prototype.toString;
                var isCallable = function (fn) {
                    return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
                };
                var toInteger = function (value) {
                    var number = Number(value);
                    if (isNaN(number)) { return 0; }
                    if (number === 0 || !isFinite(number)) { return number; }
                    return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
                };
                var maxSafeInteger = Math.pow(2, 53) - 1;
                var toLength = function (value) {
                    var len = toInteger(value);
                    return Math.min(Math.max(len, 0), maxSafeInteger);
                };

                return function from(arrayLike/*, mapFn, thisArg */) {
                    var iteratee = function (item, k) {
                        if (mapFn) {
                            A[k] = typeof T === 'undefined' ? mapFn(item, k) : mapFn.call(T, item, k);
                        } else {
                            A[k] = item;
                        }
                        return k + 1;
                    };

                    var C = this;
                    var items = Object(arrayLike);

                    if (arrayLike == null) {
                        throw new TypeError("Array.from requires an array-like object - not null or undefined");
                    }

                    var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
                    var T;
                    if (typeof mapFn !== 'undefined') {
                        if (!isCallable(mapFn)) {
                            throw new TypeError('Array.from: when provided, the second argument must be a function');
                        }
                        if (arguments.length > 2) {
                            T = arguments[2];
                        }
                    }

                    var len = toLength(items.length);
                    var A = isCallable(C) ? Object(new C(len)) : new Array(len);
                    var k = 0;

                    if (iteratorTypes.indexOf(items.toString()) !== -1) {
                        var item;
                        while (item = items.next().value) k = iteratee(item, k);
                        A.length = k;
                        return A;
                    }

                    while (k < len) k = iteratee(items[k], k);
                    A.length = len;
                    return A;
                };
            }());
        }

        // Array.includes polyfill
        if (!Array.prototype.includes) {
            log('Adding Array.prototype.includes polyfill');
            Array.prototype.includes = function(searchElement, fromIndex) {
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);
                var len = parseInt(o.length) || 0;

                if (len === 0) {
                    return false;
                }

                var n = parseInt(fromIndex) || 0;
                var k;

                if (n >= 0) {
                    k = n;
                } else {
                    k = len + n;
                    if (k < 0) {k = 0;}
                }

                function sameValueZero(x, y) {
                    return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                }

                for (;k < len; k++) {
                    if (sameValueZero(o[k], searchElement)) {
                        return true;
                    }
                }

                return false;
            };
        }

        // Object.assign polyfill
        if (typeof Object.assign != "function") {
            log('Adding Object.assign polyfill');
            Object.defineProperty(Object, "assign", {
                value: function assign(target, varArgs) {
                    "use strict";
                    if (target == null) {
                        throw new TypeError("Cannot convert undefined or null to object");
                    }
                    var to = Object(target);
                    for (var index = 1; index < arguments.length; index++) {
                        var nextSource = arguments[index];
                        if (nextSource != null) {
                            for (var nextKey in nextSource) {
                                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                    to[nextKey] = nextSource[nextKey];
                                }
                            }
                        }
                    }
                    return to;
                },
                writable: true,
                configurable: true
            });
        }

        // Number polyfills
        if (!Number.isNaN) {
            log('Adding Number.isNaN polyfill');
            Number.isNaN = function(value) {
                return typeof value === 'number' && isNaN(value);
            };
        }

        if (!Number.isFinite) {
            log('Adding Number.isFinite polyfill');
            Number.isFinite = function(value) {
                return typeof value === 'number' && isFinite(value);
            };
        }

        // WeakSet polyfill
        if (typeof WeakSet === 'undefined') {
            log('Adding WeakSet polyfill');
            window.WeakSet = (function() {
                function WeakSet() {
                    this._id = '_WeakSet_' + Math.random();
                }
                
                WeakSet.prototype.add = function(obj) {
                    if (Object(obj) !== obj) throw new TypeError("Invalid value used in weak set");
                    obj[this._id] = true;
                    return this;
                };
                
                WeakSet.prototype.delete = function(obj) {
                    if (Object(obj) !== obj) return false;
                    if (obj[this._id]) {
                        delete obj[this._id];
                        return true;
                    }
                    return false;
                };
                
                WeakSet.prototype.has = function(obj) {
                    if (Object(obj) !== obj) return false;
                    return !!obj[this._id];
                };
                
                return WeakSet;
            })();
        }
    }

    // ============ iOS 10.0 Polyfills ============
    function applyiOS100Polyfills() {
        log('Applying iOS 10.0 polyfills...');

        // NodeList.forEach polyfill
        if (window.NodeList && !NodeList.prototype.forEach) {
            log('Adding NodeList.prototype.forEach polyfill');
            NodeList.prototype.forEach = function (callback, thisArg) {
                thisArg = thisArg || window;
                for (var i = 0; i < this.length; i++) {
                    callback.call(thisArg, this[i], i, this);
                }
            };
        }

        // String.padStart and padEnd polyfills
        if (!String.prototype.padStart) {
            log('Adding String.prototype.padStart polyfill');
            String.prototype.padStart = function padStart(targetLength, padString) {
                targetLength = targetLength >> 0;
                padString = String(typeof padString !== 'undefined' ? padString : ' ');
                if (this.length > targetLength) {
                    return String(this);
                } else {
                    targetLength = targetLength - this.length;
                    if (targetLength > padString.length) {
                        padString += padString.repeat(targetLength / padString.length);
                    }
                    return padString.slice(0, targetLength) + String(this);
                }
            };
        }

        if (!String.prototype.padEnd) {
            log('Adding String.prototype.padEnd polyfill');
            String.prototype.padEnd = function padEnd(targetLength, padString) {
                targetLength = targetLength >> 0;
                padString = String(typeof padString !== 'undefined' ? padString : ' ');
                if (this.length > targetLength) {
                    return String(this);
                } else {
                    targetLength = targetLength - this.length;
                    if (targetLength > padString.length) {
                        padString += padString.repeat(targetLength / padString.length);
                    }
                    return String(this) + padString.slice(0, targetLength);
                }
            };
        }
    }

    // ============ iOS 12.0 Polyfills ============
    function applyiOS120Polyfills() {
        log('Applying iOS 12.0 polyfills...');

        // Array.flat and flatMap polyfills
        if (!Array.prototype.flat) {
            log('Adding Array.prototype.flat polyfill');
            Object.defineProperty(Array.prototype, "flat", {
                configurable: true,
                value: function r() {
                    var t = isNaN(arguments[0]) ? 1 : Number(arguments[0]);
                    return t ? Array.prototype.reduce.call(this, function(a, e) {
                        return Array.isArray(e) ? a.push.apply(a, r.call(e, t - 1)) : a.push(e), a;
                    }, []) : Array.prototype.slice.call(this);
                },
                writable: true
            });
        }

        if (!Array.prototype.flatMap) {
            log('Adding Array.prototype.flatMap polyfill');
            Object.defineProperty(Array.prototype, "flatMap", {
                configurable: true,
                value: function(r) {
                    return Array.prototype.map.apply(this, arguments).flat();
                },
                writable: true
            });
        }

        // String.trimStart and trimEnd polyfills
        if (!String.prototype.trimStart) {
            log('Adding String.prototype.trimStart polyfill');
            String.prototype.trimStart = String.prototype.trimLeft || function() {
                return this.replace(/^\s+/, '');
            };
        }

        if (!String.prototype.trimEnd) {
            log('Adding String.prototype.trimEnd polyfill');
            String.prototype.trimEnd = String.prototype.trimRight || function() {
                return this.replace(/\s+$/, '');
            };
        }
    }

    // ============ iOS 14.0 Polyfills ============
    function applyiOS140Polyfills() {
        log('Applying iOS 14.0 polyfills...');

        // Promise.any polyfill
        if (!Promise.any) {
            log('Adding Promise.any polyfill');
            Promise.any = o => new Promise(((i, l) => {
                var n, t, v, d, e;
                let u = !1, c = [], h = 0, f = [];
                function a(o) { u || (u = !0, i(o)); }
                function r(o) { f.push(o), f.length >= h && l(new AggregateError(f, 'All promises were rejected')); }
                for (let i of o) h++, c.push(i);
                for (let o of c)
                    void 0 !== (null === (n = o) || void 0 === n ? void 0 : n.then) || void 0 !== (null === (t = o) || void 0 === t ? void 0 : t.catch) ?
                        (null === (d = null === (v = o) || void 0 === v ? void 0 : v.then((o => a(o)))) || void 0 === d || d.catch((o => {})),
                            null === (e = o) || void 0 === e || e.catch((o => r(o)))) : a(o);
            }));
        }

        // EventTarget polyfill for older browsers
        if (typeof EventTarget === 'undefined') {
            log('Adding EventTarget polyfill');
            window.EventTarget = function() {
                this.listeners = {};
            };

            EventTarget.prototype.addEventListener = function(type, callback) {
                if (!(type in this.listeners)) {
                    this.listeners[type] = [];
                }
                this.listeners[type].push(callback);
            };

            EventTarget.prototype.removeEventListener = function(type, callback) {
                if (!(type in this.listeners)) {
                    return;
                }
                var stack = this.listeners[type];
                for (var i = 0, l = stack.length; i < l; i++) {
                    if (stack[i] === callback) {
                        stack.splice(i, 1);
                        return;
                    }
                }
            };

            EventTarget.prototype.dispatchEvent = function(event) {
                if (!(event.type in this.listeners)) {
                    return true;
                }
                var stack = this.listeners[event.type].slice();
                for (var i = 0, l = stack.length; i < l; i++) {
                    stack[i].call(this, event);
                }
                return !event.defaultPrevented;
            };
        }
    }

    // ============ iOS 16.0 Polyfills ============
    function applyiOS160Polyfills() {
        log('Applying iOS 16.0 polyfills...');

        // Array.toSorted polyfill
        if (!Array.prototype.toSorted) {
            log('Adding Array.prototype.toSorted polyfill');
            Object.defineProperty(Array.prototype, 'toSorted', {
                value: function (compareFn) {
                    const O = Object(this);
                    const len = parseInt(O.length) || 0;
                    const items = [];
                    
                    for (let i = 0; i < len; i++) {
                        if (i in O) {
                            items[i] = O[i];
                        }
                    }

                    if (compareFn !== undefined) {
                        if (typeof compareFn !== 'function') {
                            throw new TypeError('Comparefn must be a function');
                        }
                        return items.sort(compareFn);
                    } else {
                        return items.sort();
                    }
                },
                writable: true,
                configurable: true
            });
        }

        // Array.toReversed polyfill
        if (!Array.prototype.toReversed) {
            log('Adding Array.prototype.toReversed polyfill');
            Object.defineProperty(Array.prototype, 'toReversed', {
                value: function() {
                    const O = Object(this);
                    const len = parseInt(O.length) || 0;
                    const A = new Array(len);
                    
                    for (let k = 0; k < len; k++) {
                        const from = len - k - 1;
                        if (from in O) {
                            A[k] = O[from];
                        }
                    }
                    
                    return A;
                },
                writable: true,
                configurable: true
            });
        }

        // Array.with polyfill
        if (!Array.prototype.with) {
            log('Adding Array.prototype.with polyfill');
            Object.defineProperty(Array.prototype, 'with', {
                value: function(index, value) {
                    const O = Object(this);
                    const len = parseInt(O.length) || 0;
                    const relativeIndex = parseInt(index) || 0;
                    const actualIndex = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
                    
                    if (actualIndex >= len || actualIndex < 0) {
                        throw new RangeError('Invalid index');
                    }
                    
                    const A = new Array(len);
                    for (let k = 0; k < len; k++) {
                        A[k] = k === actualIndex ? value : O[k];
                    }
                    
                    return A;
                },
                writable: true,
                configurable: true
            });
        }
    }

    // ============ Viewport Fixes (Post Scripts) ============
    function applyViewportFixes() {
        log('Applying viewport fixes...');
        
        // Viewport min-width polyfill
        var viewport = document.querySelector("meta[name=viewport]");
        if (viewport) {
            var content = viewport.getAttribute("content");
            var parts = content.split(",");
            for (var i = 0; i < parts.length; ++i) {
                var part = parts[i].trim();
                var pair = part.split("=");
                if (pair[0] === "min-width") {
                    var minWidth = parseInt(pair[1]);
                    if (screen.width < minWidth) {
                        document.head.removeChild(viewport);

                        var newViewport = document.createElement("meta");
                        newViewport.setAttribute("name", "viewport");
                        newViewport.setAttribute("content", "width=" + minWidth);
                        document.head.appendChild(newViewport);
                        log('Applied viewport min-width fix:', minWidth);
                        break;
                    }
                }
            }
        }
    }

    // ============ Main Execution Logic ============
    function applyAllPolyfills() {
        if (!getEnabled()) {
            log('Polyfills disabled by user');
            return;
        }

        log('Starting iOS Polyfills application...');

        // Apply polyfills in iOS version order
        applyiOS90Polyfills();   // Polyfills needed for iOS 9.0 and earlier
        applyiOS100Polyfills();  // Polyfills needed for iOS 10.0 and earlier  
        applyiOS120Polyfills();  // Polyfills needed for iOS 12.0 and earlier
        applyiOS140Polyfills();  // Polyfills needed for iOS 14.0 and earlier
        applyiOS160Polyfills();  // Polyfills needed for iOS 16.0 and earlier

        log('All polyfills applied successfully');
    }

    function applyPostScripts() {
        if (!getEnabled()) return;
        
        log('Applying post-load scripts...');
        applyViewportFixes();
        log('Post-load scripts applied');
    }

    // ============ Initialization ============
    function init() {
        refreshMenu();
        
        // Apply polyfills at document start
        applyAllPolyfills();
        
        // Apply post scripts after document load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyPostScripts);
        } else {
            applyPostScripts();
        }

        console.log('iOS Polyfills Userscript initialized successfully');
    }

    // Start the script
    init();

})();
