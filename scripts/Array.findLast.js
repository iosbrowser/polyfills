if (!Array.prototype.findLast) {
  Array.prototype.findLast = function(callback, thisArg) {
    if (this == null) {
      throw new TypeError('Array.prototype.findLast called on null or undefined');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    const array = Object(this);
    const length = array.length >>> 0;

    for (let i = length - 1; i >= 0; i--) {
      if (i in array && callback.call(thisArg, array[i], i, array)) {
        return array[i];
      }
    }

    return undefined;
  };
}
