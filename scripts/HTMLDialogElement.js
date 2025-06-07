HTMLDialogElement = String;
const originalMatches = Element.prototype.matches;
Element.prototype.matches = function(selector) {
    const modifiedSelector = selector.replace(/:modal/g, '.modal');
    return originalMatches.call(this, modifiedSelector);
};