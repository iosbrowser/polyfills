(() => {
  const NativeRegExp = RegExp;
  const nativeExec = RegExp.prototype.exec;
  const nativeTest = RegExp.prototype.test;

  let disablePatch = false;

  function containsLookbehind(pattern) {
    if (typeof pattern !== 'string') return false;
    for (let i = 0; i < pattern.length - 3; i++) {
      if (pattern[i] === '\\') {
        i++; // Skip escaped char
        continue;
      }
      if (
        pattern[i] === '(' &&
        pattern[i + 1] === '?' &&
        pattern[i + 2] === '<' &&
        (pattern[i + 3] === '=' || pattern[i + 3] === '!')
      ) {
        return true;
      }
    }
    return false;
  }

  function extractLookbehind(pattern) {
    const lbMatch = pattern.match(/^(\(\?<([=!])((?:\\.|[^\\()])*)\))/);
    if (!lbMatch) return null;
    return {
      full: lbMatch[1],
      type: lbMatch[2],    // "=" or "!"
      pattern: lbMatch[3], // the inner lookbehind
      rest: pattern.slice(lbMatch[1].length),
    };
  }

  function emulateExec(str) {
    if (disablePatch) return nativeExec.call(this, str);

    const parsed = this.__lookbehind;
    if (!parsed) return nativeExec.call(this, str);

    let lbRe, mainRe;
    try {
      disablePatch = true;
      lbRe = new NativeRegExp(parsed.pattern + "$", this.__originalFlags.replace("g", ""));
      mainRe = new NativeRegExp(parsed.rest, this.__originalFlags);
    } catch (e) {
      disablePatch = false;
      return null;
    } finally {
      disablePatch = false;
    }

    for (let pos = 0; pos <= str.length; pos++) {
      let mainMatch;
      try {
        disablePatch = true;
        mainMatch = mainRe.exec(str.slice(pos));
      } finally {
        disablePatch = false;
      }

      if (!mainMatch || mainMatch.index !== 0) continue;

      const prefix = str.slice(0, pos);

      let lbMatchFound;
      try {
        disablePatch = true;
        lbMatchFound = lbRe.test(prefix);
      } finally {
        disablePatch = false;
      }

      if ((parsed.type === "=" && lbMatchFound) || (parsed.type === "!" && !lbMatchFound)) {
        mainMatch.index = pos;
        mainMatch.input = str;
        return mainMatch;
      }
    }

    return null;
  }

  function emulateTest(str) {
    if (disablePatch) return nativeTest.call(this, str);

    const result = emulateExec.call(this, str);
    return result !== null;
  }

  // Patch RegExp constructor
  function PatchedRegExp(pattern, flags) {
    const patternStr = typeof pattern === 'string' ? pattern : pattern.source;
    const flagsStr = flags ?? (pattern && pattern.flags) ?? "";

    if (!containsLookbehind(patternStr)) {
      return new NativeRegExp(patternStr, flagsStr);
    }

    const parsed = extractLookbehind(patternStr);
    if (!parsed) {
      return new NativeRegExp(patternStr, flagsStr);
    }

    const fakePattern = parsed.rest;
    const re = new NativeRegExp(fakePattern, flagsStr);

    // Store data safely to avoid recursive access
    re.__lookbehind = parsed;
    re.__originalFlags = flagsStr;

    re.exec = emulateExec;
    re.test = emulateTest;

    return re;
  }

  // Preserve prototype chain
  PatchedRegExp.prototype = NativeRegExp.prototype;
  PatchedRegExp.prototype.constructor = PatchedRegExp;

  // Replace global RegExp
  RegExp = PatchedRegExp;

  // Also patch RegExp.prototype.exec/test for native regexes
  RegExp.prototype.exec = function patchedExec(str) {
    if (disablePatch) return nativeExec.call(this, str);

    const patternStr = this.source;
    const flagsStr = this.flags;

    if (!containsLookbehind(patternStr)) {
      return nativeExec.call(this, str);
    }

    const parsed = extractLookbehind(patternStr);
    if (!parsed) {
      return nativeExec.call(this, str);
    }

    // Create a temporary wrapper RegExp object
    const fake = new NativeRegExp(parsed.rest, flagsStr);
    fake.__lookbehind = parsed;
    fake.__originalFlags = flagsStr;
    return emulateExec.call(fake, str);
  };

  RegExp.prototype.test = function patchedTest(str) {
    if (disablePatch) return nativeTest.call(this, str);

    const patternStr = this.source;
    const flagsStr = this.flags;

    if (!containsLookbehind(patternStr)) {
      return nativeTest.call(this, str);
    }

    const parsed = extractLookbehind(patternStr);
    if (!parsed) {
      return nativeTest.call(this, str);
    }

    const fake = new NativeRegExp(parsed.rest, flagsStr);
    fake.__lookbehind = parsed;
    fake.__originalFlags = flagsStr;
    return emulateTest.call(fake, str);
  };
})();
