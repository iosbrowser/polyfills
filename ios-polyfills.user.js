// ==UserScript==
// @name         iOS Polyfills - Mobile Compatibility Enhancement
// @namespace    https://github.com/iosbrowser/ios-polyfills
// @version      1.0.1
// @description  Comprehensive compatibility script with a debug UI for older browsers. Click the top bar for status.
// @author       iOS Polyfills Team
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ============ Debugging UI & Status Tracking ============
    let debugBar = null;
    const polyfillsStatus = {};

    function showStatusPopup() {
        if (!document.body) {
            alert('Document body not ready yet.');
            return;
        }
        const existingPopup = document.getElementById('ios-polyfills-status-popup');
        if (existingPopup) {
            existingPopup.remove();
            return;
        }

        const popup = document.createElement('div');
        popup.id = 'ios-polyfills-status-popup';
        Object.assign(popup.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto',
            backgroundColor: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: '2147483647', padding: '15px'
        });

        let content = '<h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Polyfills Status</h3><ul style="margin:0; padding:0; list-style:none;">';
        const sortedKeys = Object.keys(polyfillsStatus).sort();

        if (sortedKeys.length === 0) {
            content += '<li>Status not available yet.</li>';
        } else {
            for (const key of sortedKeys) {
                const status = polyfillsStatus[key];
                const color = status === 'Applied' ? 'color:green; font-weight:bold;' : 'color:black;';
                content += `<li style="padding: 5px 0; border-bottom: 1px solid #f0f0f0;">${key}: <span style="${color}">${status}</span></li>`;
            }
        }
        content += '</ul>';

        const closeButton = document.createElement('button');
        Object.assign(closeButton.style, {
            position: 'absolute', top: '10px', right: '10px', background: 'transparent',
            border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0', lineHeight: '1'
        });
        closeButton.textContent = '×';
        closeButton.onclick = () => popup.remove();

        popup.innerHTML = content;
        popup.prepend(closeButton);
        document.body.appendChild(popup);
    }

    function createDebugBar() {
        if (document.getElementById('ios-polyfills-debug-bar')) return;
        debugBar = document.createElement('div');
        debugBar.id = 'ios-polyfills-debug-bar';
        Object.assign(debugBar.style, {
            position: 'fixed', top: '0', left: '0', width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', padding: '8px',
            fontFamily: 'Menlo, monospace', fontSize: '12px', zIndex: '2147483646',
            textAlign: 'left', boxSizing: 'border-box', cursor: 'pointer'
        });
        debugBar.textContent = '[iOS-Polyfills] Initializing...';
        debugBar.addEventListener('click', showStatusPopup);
        document.documentElement.appendChild(debugBar);
    }

    const log = (...args) => {
        console.log('[iOS-Polyfills]', ...args);
        if (debugBar) {
            const message = args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    try { return JSON.stringify(arg); } catch (e) { return String(arg); }
                }
                return String(arg);
            }).join(' ');
            debugBar.textContent = `[iOS-Polyfills] ${message}`;
        }
    };


    // ============ iOS 9.0 Polyfills ============
    function applyiOS90Polyfills() {
        log('Checking iOS 9.0 polyfills...');

        // Array.from
        if (!Array.from) {
            polyfillsStatus['Array.from'] = 'Applied';
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
                return function from(arrayLike) {
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
                    var kValue;
                    while (k < len) {
                        kValue = items[k];
                        if (mapFn) {
                            A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                        } else {
                            A[k] = kValue;
                        }
                        k += 1;
                    }
                    A.length = len;
                    return A;
                };
            }());
        } else {
            polyfillsStatus['Array.from'] = 'Native';
        }

        // Array.prototype.includes
        if (!Array.prototype.includes) {
            polyfillsStatus['Array.prototype.includes'] = 'Applied';
            Array.prototype.includes = function(searchElement, fromIndex) {
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }
                var o = Object(this);
                var len = o.length >>> 0;
                if (len === 0) {
                    return false;
                }
                var n = fromIndex | 0;
                var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
                function sameValueZero(x, y) {
                    return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                }
                while (k < len) {
                    if (sameValueZero(o[k], searchElement)) {
                        return true;
                    }
                    k++;
                }
                return false;
            };
        } else {
            polyfillsStatus['Array.prototype.includes'] = 'Native';
        }

        // Object.assign
        if (typeof Object.assign != 'function') {
            polyfillsStatus['Object.assign'] = 'Applied';
            Object.defineProperty(Object, "assign", {
                value: function assign(target, varArgs) {
                    'use strict';
                    if (target == null) {
                        throw new TypeError('Cannot convert undefined or null to object');
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
        } else {
            polyfillsStatus['Object.assign'] = 'Native';
        }
        
        // Number.isNaN
        if (!Number.isNaN) {
            polyfillsStatus['Number.isNaN'] = 'Applied';
            Number.isNaN = function(value) { return typeof value === 'number' && isNaN(value); };
        } else {
            polyfillsStatus['Number.isNaN'] = 'Native';
        }

        // Number.isFinite
        if (!Number.isFinite) {
            polyfillsStatus['Number.isFinite'] = 'Applied';
            Number.isFinite = function(value) { return typeof value === 'number' && isFinite(value); };
        } else {
            polyfillsStatus['Number.isFinite'] = 'Native';
        }

        // WeakSet
        if (typeof WeakSet === 'undefined') {
            polyfillsStatus['WeakSet'] = 'Applied';
            window.WeakSet = (function() {
                function WeakSet() { this._id = '_WeakSet_' + Math.random(); }
                WeakSet.prototype.add = function(obj) { if (Object(obj) !== obj) throw new TypeError("Invalid value used in weak set"); obj[this._id] = true; return this; };
                WeakSet.prototype.delete = function(obj) { if (Object(obj) !== obj) return false; return delete obj[this._id]; };
                WeakSet.prototype.has = function(obj) { return Object(obj) === obj && !!obj[this._id]; };
                return WeakSet;
            })();
        } else {
            polyfillsStatus['WeakSet'] = 'Native';
        }
    }

    // ============ iOS 10.0 Polyfills ============
    function applyiOS100Polyfills() {
        log('Checking iOS 10.0 polyfills...');

        // NodeList.forEach
        if (window.NodeList && !NodeList.prototype.forEach) {
            polyfillsStatus['NodeList.prototype.forEach'] = 'Applied';
            NodeList.prototype.forEach = Array.prototype.forEach;
        } else {
            polyfillsStatus['NodeList.prototype.forEach'] = 'Native';
        }

        // String.padStart
        if (!String.prototype.padStart) {
            polyfillsStatus['String.prototype.padStart'] = 'Applied';
            String.prototype.padStart = function padStart(targetLength, padString) {
                targetLength = targetLength >> 0;
                padString = String((typeof padString !== 'undefined' ? padString : ' '));
                if (this.length > targetLength) { return String(this); }
                targetLength = targetLength - this.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength / padString.length);
                }
                return padString.slice(0, targetLength) + String(this);
            };
        } else {
            polyfillsStatus['String.prototype.padStart'] = 'Native';
        }

        // String.padEnd
        if (!String.prototype.padEnd) {
            polyfillsStatus['String.prototype.padEnd'] = 'Applied';
            String.prototype.padEnd = function padEnd(targetLength, padString) {
                targetLength = targetLength >> 0;
                padString = String((typeof padString !== 'undefined' ? padString : ' '));
                if (this.length > targetLength) { return String(this); }
                targetLength = targetLength - this.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength / padString.length);
                }
                return String(this) + padString.slice(0, targetLength);
            };
        } else {
            polyfillsStatus['String.prototype.padEnd'] = 'Native';
        }
    }

    // ============ iOS 12.0 Polyfills ============
    function applyiOS120Polyfills() {
        log('Checking iOS 12.0 polyfills...');
        
        // Array.flat
        if (!Array.prototype.flat) {
            polyfillsStatus['Array.prototype.flat'] = 'Applied';
            Object.defineProperty(Array.prototype, 'flat', {
                configurable: true,
                value: function flat() {
                    var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);
                    return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
                        if (Array.isArray(cur)) {
                            acc.push.apply(acc, flat.call(cur, depth - 1));
                        } else {
                            acc.push(cur);
                        }
                        return acc;
                    }, []) : Array.prototype.slice.call(this);
                },
                writable: true
            });
        } else {
            polyfillsStatus['Array.prototype.flat'] = 'Native';
        }
        
        // Array.flatMap
        if (!Array.prototype.flatMap) {
            polyfillsStatus['Array.prototype.flatMap'] = 'Applied';
            Object.defineProperty(Array.prototype, 'flatMap', {
                configurable: true,
                value: function (callback) {
                    return Array.prototype.map.apply(this, arguments).flat();
                },
                writable: true
            });
        } else {
            polyfillsStatus['Array.prototype.flatMap'] = 'Native';
        }

        // String.trimStart
        if (!String.prototype.trimStart) {
            polyfillsStatus['String.prototype.trimStart'] = 'Applied';
            String.prototype.trimStart = String.prototype.trimLeft || function () { return this.replace(/^\s+/, ''); };
        } else {
            polyfillsStatus['String.prototype.trimStart'] = 'Native';
        }
        
        // String.trimEnd
        if (!String.prototype.trimEnd) {
            polyfillsStatus['String.prototype.trimEnd'] = 'Applied';
            String.prototype.trimEnd = String.prototype.trimRight || function () { return this.replace(/\s+$/, ''); };
        } else {
            polyfillsStatus['String.prototype.trimEnd'] = 'Native';
        }
    }

    // ============ iOS 14.0 Polyfills ============
    function applyiOS140Polyfills() {
        log('Checking iOS 14.0 polyfills...');
        
        // Promise.any
        if (!Promise.any) {
            polyfillsStatus['Promise.any'] = 'Applied';
            Promise.any = function(promises) {
                return new Promise((resolve, reject) => {
                    const errors = [];
                    let remaining = promises.length;
                    if (remaining === 0) {
                        reject(new AggregateError([], "All promises were rejected"));
                        return;
                    }
                    promises.forEach(promise => {
                        Promise.resolve(promise).then(resolve).catch(error => {
                            errors.push(error);
                            if (--remaining === 0) {
                                reject(new AggregateError(errors, "All promises were rejected"));
                            }
                        });
                    });
                });
            };
        } else {
            polyfillsStatus['Promise.any'] = 'Native';
        }
        
        // EventTarget
        if (typeof EventTarget === 'undefined') {
            polyfillsStatus['EventTarget'] = 'Applied';
            window.EventTarget = function() { this.listeners = {}; };
            Object.assign(EventTarget.prototype, {
                addEventListener: function(type, callback) {
                    if (!(type in this.listeners)) this.listeners[type] = [];
                    this.listeners[type].push(callback);
                },
                removeEventListener: function(type, callback) {
                    if (!(type in this.listeners)) return;
                    const stack = this.listeners[type];
                    for (let i = 0, l = stack.length; i < l; i++) {
                        if (stack[i] === callback) { stack.splice(i, 1); return; }
                    }
                },
                dispatchEvent: function(event) {
                    if (!(event.type in this.listeners)) return true;
                    const stack = this.listeners[event.type].slice();
                    for (let i = 0, l = stack.length; i < l; i++) {
                        stack[i].call(this, event);
                    }
                    return !event.defaultPrevented;
                }
            });
        } else {
            polyfillsStatus['EventTarget'] = 'Native';
        }
    }

    // ============ iOS 16.0 Polyfills ============
    function applyiOS160Polyfills() {
        log('Checking iOS 16.0 polyfills...');

        // Array.toSorted
        if (!Array.prototype.toSorted) {
            polyfillsStatus['Array.prototype.toSorted'] = 'Applied';
            Object.defineProperty(Array.prototype, 'toSorted', {
                value: function (compareFn) { return [...this].sort(compareFn); },
                writable: true, configurable: true
            });
        } else {
            polyfillsStatus['Array.prototype.toSorted'] = 'Native';
        }

        // Array.toReversed
        if (!Array.prototype.toReversed) {
            polyfillsStatus['Array.prototype.toReversed'] = 'Applied';
            Object.defineProperty(Array.prototype, 'toReversed', {
                value: function () { return [...this].reverse(); },
                writable: true, configurable: true
            });
        } else {
            polyfillsStatus['Array.prototype.toReversed'] = 'Native';
        }

        // Array.with
        if (!Array.prototype.with) {
            polyfillsStatus['Array.prototype.with'] = 'Applied';
            Object.defineProperty(Array.prototype, 'with', {
                value: function (index, value) {
                    const copy = [...this];
                    copy[index] = value;
                    return copy;
                },
                writable: true, configurable: true
            });
        } else {
            polyfillsStatus['Array.prototype.with'] = 'Native';
        }
    }

    // ============ Viewport Fixes (Post Scripts) ============
    function applyViewportFixes() {
        log('Applying viewport fixes...');
        const viewport = document.querySelector("meta[name=viewport]");
        if (viewport) {
            const content = viewport.getAttribute("content");
            const minWidthMatch = content.match(/min-width=(\d+)/);
            if (minWidthMatch) {
                const minWidth = parseInt(minWidthMatch[1], 10);
                if (screen.width < minWidth) {
                    viewport.setAttribute("content", "width=" + minWidth);
                    log('Applied viewport min-width fix:', minWidth);
                    polyfillsStatus['Viewport min-width'] = 'Applied';
                    return;
                }
            }
            polyfillsStatus['Viewport min-width'] = 'Not Needed';
        } else {
            polyfillsStatus['Viewport min-width'] = 'Not Found';
        }
    }

    // ============ Main Execution Logic ============
    function applyAllPolyfills() {
        applyiOS90Polyfills();
        applyiOS100Polyfills();
        applyiOS120Polyfills();
        applyiOS140Polyfills();
        applyiOS160Polyfills();
        log('Polyfill checks completed.');
    }

    function applyPostScripts() {
        log('Applying post-load scripts...');
        applyViewportFixes();
        log('Post-load scripts applied.');
    }

    // ============ Initialization ============
    function init() {
        createDebugBar();
        applyAllPolyfills();
        
        log(`State: ${document.readyState}. Waiting for DOMContentLoaded.`);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                log('DOMContentLoaded fired. Applying post-scripts.');
                applyPostScripts();
            });
        } else {
            log('DOM already loaded. Applying post-scripts.');
            applyPostScripts();
        }

        log('✅ Initialized. Click bar for details.');
    }

    init();

})();
