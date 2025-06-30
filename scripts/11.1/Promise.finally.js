// https://gist.github.com/developit/e96097d9b657f2a2f3e588ffde433437
if (!('finally' in Promise.prototype)) {
    Promise.prototype.finally = function (t) { if ("function" != typeof t) return this.then(t, t); const e = this.constructor || Promise; return this.then(o => e.resolve(t()).then(() => o), o => e.resolve(t()).then(() => { throw o })) };
}
