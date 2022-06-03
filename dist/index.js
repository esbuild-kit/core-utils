'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var module$1 = require('module');
var path = require('path');
var url = require('url');
var esbuild = require('esbuild');
var crypto = require('crypto');
var fs = require('fs');
var os = require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);

var require$1 = (
			false
				? /* @__PURE__ */ module$1.createRequire((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)))
				: require
		);

var sourceMapSupport$1 = {exports: {}};

var sourceMap = {};

var sourceMapGenerator = {};

var base64Vlq = {};

var base64$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
base64$1.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
base64$1.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = base64$1;

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
base64Vlq.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
base64Vlq.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var util$5 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	/**
	 * This is a helper function for getting values from parameter/options
	 * objects.
	 *
	 * @param args The object we are extracting values from
	 * @param name The name of the property we are getting.
	 * @param defaultValue An optional value to return if the property is missing
	 * from the object. If this is not specified and the property is missing, an
	 * error will be thrown.
	 */
	function getArg(aArgs, aName, aDefaultValue) {
	  if (aName in aArgs) {
	    return aArgs[aName];
	  } else if (arguments.length === 3) {
	    return aDefaultValue;
	  } else {
	    throw new Error('"' + aName + '" is a required argument.');
	  }
	}
	exports.getArg = getArg;

	var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
	var dataUrlRegexp = /^data:.+\,.+$/;

	function urlParse(aUrl) {
	  var match = aUrl.match(urlRegexp);
	  if (!match) {
	    return null;
	  }
	  return {
	    scheme: match[1],
	    auth: match[2],
	    host: match[3],
	    port: match[4],
	    path: match[5]
	  };
	}
	exports.urlParse = urlParse;

	function urlGenerate(aParsedUrl) {
	  var url = '';
	  if (aParsedUrl.scheme) {
	    url += aParsedUrl.scheme + ':';
	  }
	  url += '//';
	  if (aParsedUrl.auth) {
	    url += aParsedUrl.auth + '@';
	  }
	  if (aParsedUrl.host) {
	    url += aParsedUrl.host;
	  }
	  if (aParsedUrl.port) {
	    url += ":" + aParsedUrl.port;
	  }
	  if (aParsedUrl.path) {
	    url += aParsedUrl.path;
	  }
	  return url;
	}
	exports.urlGenerate = urlGenerate;

	/**
	 * Normalizes a path, or the path portion of a URL:
	 *
	 * - Replaces consecutive slashes with one slash.
	 * - Removes unnecessary '.' parts.
	 * - Removes unnecessary '<dir>/..' parts.
	 *
	 * Based on code in the Node.js 'path' core module.
	 *
	 * @param aPath The path or url to normalize.
	 */
	function normalize(aPath) {
	  var path = aPath;
	  var url = urlParse(aPath);
	  if (url) {
	    if (!url.path) {
	      return aPath;
	    }
	    path = url.path;
	  }
	  var isAbsolute = exports.isAbsolute(path);

	  var parts = path.split(/\/+/);
	  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
	    part = parts[i];
	    if (part === '.') {
	      parts.splice(i, 1);
	    } else if (part === '..') {
	      up++;
	    } else if (up > 0) {
	      if (part === '') {
	        // The first part is blank if the path is absolute. Trying to go
	        // above the root is a no-op. Therefore we can remove all '..' parts
	        // directly after the root.
	        parts.splice(i + 1, up);
	        up = 0;
	      } else {
	        parts.splice(i, 2);
	        up--;
	      }
	    }
	  }
	  path = parts.join('/');

	  if (path === '') {
	    path = isAbsolute ? '/' : '.';
	  }

	  if (url) {
	    url.path = path;
	    return urlGenerate(url);
	  }
	  return path;
	}
	exports.normalize = normalize;

	/**
	 * Joins two paths/URLs.
	 *
	 * @param aRoot The root path or URL.
	 * @param aPath The path or URL to be joined with the root.
	 *
	 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	 *   first.
	 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	 *   is updated with the result and aRoot is returned. Otherwise the result
	 *   is returned.
	 *   - If aPath is absolute, the result is aPath.
	 *   - Otherwise the two paths are joined with a slash.
	 * - Joining for example 'http://' and 'www.example.com' is also supported.
	 */
	function join(aRoot, aPath) {
	  if (aRoot === "") {
	    aRoot = ".";
	  }
	  if (aPath === "") {
	    aPath = ".";
	  }
	  var aPathUrl = urlParse(aPath);
	  var aRootUrl = urlParse(aRoot);
	  if (aRootUrl) {
	    aRoot = aRootUrl.path || '/';
	  }

	  // `join(foo, '//www.example.org')`
	  if (aPathUrl && !aPathUrl.scheme) {
	    if (aRootUrl) {
	      aPathUrl.scheme = aRootUrl.scheme;
	    }
	    return urlGenerate(aPathUrl);
	  }

	  if (aPathUrl || aPath.match(dataUrlRegexp)) {
	    return aPath;
	  }

	  // `join('http://', 'www.example.com')`
	  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
	    aRootUrl.host = aPath;
	    return urlGenerate(aRootUrl);
	  }

	  var joined = aPath.charAt(0) === '/'
	    ? aPath
	    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

	  if (aRootUrl) {
	    aRootUrl.path = joined;
	    return urlGenerate(aRootUrl);
	  }
	  return joined;
	}
	exports.join = join;

	exports.isAbsolute = function (aPath) {
	  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
	};

	/**
	 * Make a path relative to a URL or another path.
	 *
	 * @param aRoot The root path or URL.
	 * @param aPath The path or URL to be made relative to aRoot.
	 */
	function relative(aRoot, aPath) {
	  if (aRoot === "") {
	    aRoot = ".";
	  }

	  aRoot = aRoot.replace(/\/$/, '');

	  // It is possible for the path to be above the root. In this case, simply
	  // checking whether the root is a prefix of the path won't work. Instead, we
	  // need to remove components from the root one by one, until either we find
	  // a prefix that fits, or we run out of components to remove.
	  var level = 0;
	  while (aPath.indexOf(aRoot + '/') !== 0) {
	    var index = aRoot.lastIndexOf("/");
	    if (index < 0) {
	      return aPath;
	    }

	    // If the only part of the root that is left is the scheme (i.e. http://,
	    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
	    // have exhausted all components, so the path is not relative to the root.
	    aRoot = aRoot.slice(0, index);
	    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
	      return aPath;
	    }

	    ++level;
	  }

	  // Make sure we add a "../" for each component we removed from the root.
	  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
	}
	exports.relative = relative;

	var supportsNullProto = (function () {
	  var obj = Object.create(null);
	  return !('__proto__' in obj);
	}());

	function identity (s) {
	  return s;
	}

	/**
	 * Because behavior goes wacky when you set `__proto__` on objects, we
	 * have to prefix all the strings in our set with an arbitrary character.
	 *
	 * See https://github.com/mozilla/source-map/pull/31 and
	 * https://github.com/mozilla/source-map/issues/30
	 *
	 * @param String aStr
	 */
	function toSetString(aStr) {
	  if (isProtoString(aStr)) {
	    return '$' + aStr;
	  }

	  return aStr;
	}
	exports.toSetString = supportsNullProto ? identity : toSetString;

	function fromSetString(aStr) {
	  if (isProtoString(aStr)) {
	    return aStr.slice(1);
	  }

	  return aStr;
	}
	exports.fromSetString = supportsNullProto ? identity : fromSetString;

	function isProtoString(s) {
	  if (!s) {
	    return false;
	  }

	  var length = s.length;

	  if (length < 9 /* "__proto__".length */) {
	    return false;
	  }

	  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
	      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
	      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
	      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
	      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
	      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
	      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
	      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
	      s.charCodeAt(length - 9) !== 95  /* '_' */) {
	    return false;
	  }

	  for (var i = length - 10; i >= 0; i--) {
	    if (s.charCodeAt(i) !== 36 /* '$' */) {
	      return false;
	    }
	  }

	  return true;
	}

	/**
	 * Comparator between two mappings where the original positions are compared.
	 *
	 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	 * mappings with the same original source/line/column, but different generated
	 * line and column the same. Useful when searching for a mapping with a
	 * stubbed out mapping.
	 */
	function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
	  var cmp = strcmp(mappingA.source, mappingB.source);
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalLine - mappingB.originalLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalColumn - mappingB.originalColumn;
	  if (cmp !== 0 || onlyCompareOriginal) {
	    return cmp;
	  }

	  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.generatedLine - mappingB.generatedLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByOriginalPositions = compareByOriginalPositions;

	/**
	 * Comparator between two mappings with deflated source and name indices where
	 * the generated positions are compared.
	 *
	 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	 * mappings with the same generated line and column, but different
	 * source/name/original line and column the same. Useful when searching for a
	 * mapping with a stubbed out mapping.
	 */
	function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
	  var cmp = mappingA.generatedLine - mappingB.generatedLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	  if (cmp !== 0 || onlyCompareGenerated) {
	    return cmp;
	  }

	  cmp = strcmp(mappingA.source, mappingB.source);
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalLine - mappingB.originalLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalColumn - mappingB.originalColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

	function strcmp(aStr1, aStr2) {
	  if (aStr1 === aStr2) {
	    return 0;
	  }

	  if (aStr1 === null) {
	    return 1; // aStr2 !== null
	  }

	  if (aStr2 === null) {
	    return -1; // aStr1 !== null
	  }

	  if (aStr1 > aStr2) {
	    return 1;
	  }

	  return -1;
	}

	/**
	 * Comparator between two mappings with inflated source and name strings where
	 * the generated positions are compared.
	 */
	function compareByGeneratedPositionsInflated(mappingA, mappingB) {
	  var cmp = mappingA.generatedLine - mappingB.generatedLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = strcmp(mappingA.source, mappingB.source);
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalLine - mappingB.originalLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalColumn - mappingB.originalColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

	/**
	 * Strip any JSON XSSI avoidance prefix from the string (as documented
	 * in the source maps specification), and then parse the string as
	 * JSON.
	 */
	function parseSourceMapInput(str) {
	  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
	}
	exports.parseSourceMapInput = parseSourceMapInput;

	/**
	 * Compute the URL of a source given the the source root, the source's
	 * URL, and the source map's URL.
	 */
	function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
	  sourceURL = sourceURL || '';

	  if (sourceRoot) {
	    // This follows what Chrome does.
	    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
	      sourceRoot += '/';
	    }
	    // The spec says:
	    //   Line 4: An optional source root, useful for relocating source
	    //   files on a server or removing repeated values in the
	    //   “sources” entry.  This value is prepended to the individual
	    //   entries in the “source” field.
	    sourceURL = sourceRoot + sourceURL;
	  }

	  // Historically, SourceMapConsumer did not take the sourceMapURL as
	  // a parameter.  This mode is still somewhat supported, which is why
	  // this code block is conditional.  However, it's preferable to pass
	  // the source map URL to SourceMapConsumer, so that this function
	  // can implement the source URL resolution algorithm as outlined in
	  // the spec.  This block is basically the equivalent of:
	  //    new URL(sourceURL, sourceMapURL).toString()
	  // ... except it avoids using URL, which wasn't available in the
	  // older releases of node still supported by this library.
	  //
	  // The spec says:
	  //   If the sources are not absolute URLs after prepending of the
	  //   “sourceRoot”, the sources are resolved relative to the
	  //   SourceMap (like resolving script src in a html document).
	  if (sourceMapURL) {
	    var parsed = urlParse(sourceMapURL);
	    if (!parsed) {
	      throw new Error("sourceMapURL could not be parsed");
	    }
	    if (parsed.path) {
	      // Strip the last path component, but keep the "/".
	      var index = parsed.path.lastIndexOf('/');
	      if (index >= 0) {
	        parsed.path = parsed.path.substring(0, index + 1);
	      }
	    }
	    sourceURL = join(urlGenerate(parsed), sourceURL);
	  }

	  return normalize(sourceURL);
	}
	exports.computeSourceURL = computeSourceURL;
} (util$5));

var arraySet = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$4 = util$5;
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet$2() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet$2.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet$2();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet$2.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet$2.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util$4.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet$2.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util$4.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet$2.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util$4.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet$2.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet$2.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

arraySet.ArraySet = ArraySet$2;

var mappingList = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$3 = util$5;

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util$3.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList$1() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList$1.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList$1.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList$1.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util$3.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

mappingList.MappingList = MappingList$1;

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ$1 = base64Vlq;
var util$2 = util$5;
var ArraySet$1 = arraySet.ArraySet;
var MappingList = mappingList.MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator$1(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util$2.getArg(aArgs, 'file', null);
  this._sourceRoot = util$2.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util$2.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator$1.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator$1.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator$1({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util$2.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util$2.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator$1.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util$2.getArg(aArgs, 'generated');
    var original = util$2.getArg(aArgs, 'original', null);
    var source = util$2.getArg(aArgs, 'source', null);
    var name = util$2.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator$1.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util$2.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util$2.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util$2.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator$1.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util$2.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet$1();
    var newNames = new ArraySet$1();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util$2.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util$2.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util$2.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util$2.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator$1.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator$1.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = '';

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util$2.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ$1.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ$1.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ$1.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ$1.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ$1.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator$1.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util$2.relative(aSourceRoot, source);
      }
      var key = util$2.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator$1.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator$1.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

sourceMapGenerator.SourceMapGenerator = SourceMapGenerator$1;

var sourceMapConsumer = {};

var binarySearch$2 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	exports.GREATEST_LOWER_BOUND = 1;
	exports.LEAST_UPPER_BOUND = 2;

	/**
	 * Recursive implementation of binary search.
	 *
	 * @param aLow Indices here and lower do not contain the needle.
	 * @param aHigh Indices here and higher do not contain the needle.
	 * @param aNeedle The element being searched for.
	 * @param aHaystack The non-empty array being searched.
	 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
	 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
	 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
	 *     closest element that is smaller than or greater than the one we are
	 *     searching for, respectively, if the exact element cannot be found.
	 */
	function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
	  // This function terminates when one of the following is true:
	  //
	  //   1. We find the exact element we are looking for.
	  //
	  //   2. We did not find the exact element, but we can return the index of
	  //      the next-closest element.
	  //
	  //   3. We did not find the exact element, and there is no next-closest
	  //      element than the one we are searching for, so we return -1.
	  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
	  var cmp = aCompare(aNeedle, aHaystack[mid], true);
	  if (cmp === 0) {
	    // Found the element we are looking for.
	    return mid;
	  }
	  else if (cmp > 0) {
	    // Our needle is greater than aHaystack[mid].
	    if (aHigh - mid > 1) {
	      // The element is in the upper half.
	      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
	    }

	    // The exact needle element was not found in this haystack. Determine if
	    // we are in termination case (3) or (2) and return the appropriate thing.
	    if (aBias == exports.LEAST_UPPER_BOUND) {
	      return aHigh < aHaystack.length ? aHigh : -1;
	    } else {
	      return mid;
	    }
	  }
	  else {
	    // Our needle is less than aHaystack[mid].
	    if (mid - aLow > 1) {
	      // The element is in the lower half.
	      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
	    }

	    // we are in termination case (3) or (2) and return the appropriate thing.
	    if (aBias == exports.LEAST_UPPER_BOUND) {
	      return mid;
	    } else {
	      return aLow < 0 ? -1 : aLow;
	    }
	  }
	}

	/**
	 * This is an implementation of binary search which will always try and return
	 * the index of the closest element if there is no exact hit. This is because
	 * mappings between original and generated line/col pairs are single points,
	 * and there is an implicit region between each of them, so a miss just means
	 * that you aren't on the very start of a region.
	 *
	 * @param aNeedle The element you are looking for.
	 * @param aHaystack The array that is being searched.
	 * @param aCompare A function which takes the needle and an element in the
	 *     array and returns -1, 0, or 1 depending on whether the needle is less
	 *     than, equal to, or greater than the element, respectively.
	 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
	 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
	 *     closest element that is smaller than or greater than the one we are
	 *     searching for, respectively, if the exact element cannot be found.
	 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
	 */
	exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
	  if (aHaystack.length === 0) {
	    return -1;
	  }

	  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
	                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
	  if (index < 0) {
	    return -1;
	  }

	  // We have found either the exact element, or the next-closest element than
	  // the one we are searching for. However, there may be more than one such
	  // element. Make sure we always return the smallest of these.
	  while (index - 1 >= 0) {
	    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
	      break;
	    }
	    --index;
	  }

	  return index;
	};
} (binarySearch$2));

var quickSort$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
quickSort$1.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$1 = util$5;
var binarySearch$1 = binarySearch$2;
var ArraySet = arraySet.ArraySet;
var base64VLQ = base64Vlq;
var quickSort = quickSort$1.quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util$1.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util$1.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util$1.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util$1.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util$1.compareByOriginalPositions,
                                  binarySearch$1.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

sourceMapConsumer.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sources = util$1.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util$1.getArg(sourceMap, 'names', []);
  var sourceRoot = util$1.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util$1.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util$1.getArg(sourceMap, 'mappings');
  var file = util$1.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util$1.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util$1.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util$1.isAbsolute(sourceRoot) && util$1.isAbsolute(source)
        ? util$1.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util$1.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util$1.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util$1.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util$1.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util$1.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch$1.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util$1.compareByGeneratedPositionsDeflated,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util$1.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util$1.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util$1.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util$1.getArg(mapping, 'originalLine', null),
          column: util$1.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util$1.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util$1.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util$1.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util$1.getArg(aArgs, 'line'),
      originalColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util$1.compareByOriginalPositions,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util$1.getArg(mapping, 'generatedLine', null),
          column: util$1.getArg(mapping, 'generatedColumn', null),
          lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

sourceMapConsumer.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sections = util$1.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util$1.getArg(s, 'offset');
    var offsetLine = util$1.getArg(offset, 'line');
    var offsetColumn = util$1.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util$1.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch$1.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util$1.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util$1.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util$1.compareByOriginalPositions);
  };

sourceMapConsumer.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

var sourceNode = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
var util = util$5;

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

sourceNode.SourceNode = SourceNode;

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

sourceMap.SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
sourceMap.SourceMapConsumer = sourceMapConsumer.SourceMapConsumer;
sourceMap.SourceNode = sourceNode.SourceNode;

/* eslint-disable node/no-deprecated-api */

var toString$1 = Object.prototype.toString;

var isModern = (
  typeof Buffer !== 'undefined' &&
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'
);

function isArrayBuffer (input) {
  return toString$1.call(input).slice(8, -1) === 'ArrayBuffer'
}

function fromArrayBuffer (obj, byteOffset, length) {
  byteOffset >>>= 0;

  var maxLength = obj.byteLength - byteOffset;

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds")
  }

  if (length === undefined) {
    length = maxLength;
  } else {
    length >>>= 0;

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds")
    }
  }

  return isModern
    ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
    : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  return isModern
    ? Buffer.from(string, encoding)
    : new Buffer(string, encoding)
}

function bufferFrom (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return isModern
    ? Buffer.from(value)
    : new Buffer(value)
}

var bufferFrom_1 = bufferFrom;

(function (module, exports) {
	var SourceMapConsumer = sourceMap.SourceMapConsumer;
	var path = path__default["default"];

	var fs;
	try {
	  fs = require$1('fs');
	  if (!fs.existsSync || !fs.readFileSync) {
	    // fs doesn't have all methods we need
	    fs = null;
	  }
	} catch (err) {
	  /* nop */
	}

	var bufferFrom = bufferFrom_1;

	/**
	 * Requires a module which is protected against bundler minification.
	 *
	 * @param {NodeModule} mod
	 * @param {string} request
	 */
	function dynamicRequire(mod, request) {
	  return mod.require(request);
	}

	// Only install once if called multiple times
	var errorFormatterInstalled = false;
	var uncaughtShimInstalled = false;

	// If true, the caches are reset before a stack trace formatting operation
	var emptyCacheBetweenOperations = false;

	// Supports {browser, node, auto}
	var environment = "auto";

	// Maps a file path to a string containing the file contents
	var fileContentsCache = {};

	// Maps a file path to a source map for that file
	var sourceMapCache = {};

	// Regex for detecting source maps
	var reSourceMap = /^data:application\/json[^,]+base64,/;

	// Priority list of retrieve handlers
	var retrieveFileHandlers = [];
	var retrieveMapHandlers = [];

	function isInBrowser() {
	  if (environment === "browser")
	    return true;
	  if (environment === "node")
	    return false;
	  return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
	}

	function hasGlobalProcessEventEmitter() {
	  return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
	}

	function globalProcessVersion() {
	  if ((typeof process === 'object') && (process !== null)) {
	    return process.version;
	  } else {
	    return '';
	  }
	}

	function globalProcessStderr() {
	  if ((typeof process === 'object') && (process !== null)) {
	    return process.stderr;
	  }
	}

	function globalProcessExit(code) {
	  if ((typeof process === 'object') && (process !== null) && (typeof process.exit === 'function')) {
	    return process.exit(code);
	  }
	}

	function handlerExec(list) {
	  return function(arg) {
	    for (var i = 0; i < list.length; i++) {
	      var ret = list[i](arg);
	      if (ret) {
	        return ret;
	      }
	    }
	    return null;
	  };
	}

	var retrieveFile = handlerExec(retrieveFileHandlers);

	retrieveFileHandlers.push(function(path) {
	  // Trim the path to make sure there is no extra whitespace.
	  path = path.trim();
	  if (/^file:/.test(path)) {
	    // existsSync/readFileSync can't handle file protocol, but once stripped, it works
	    path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
	      return drive ?
	        '' : // file:///C:/dir/file -> C:/dir/file
	        '/'; // file:///root-dir/file -> /root-dir/file
	    });
	  }
	  if (path in fileContentsCache) {
	    return fileContentsCache[path];
	  }

	  var contents = '';
	  try {
	    if (!fs) {
	      // Use SJAX if we are in the browser
	      var xhr = new XMLHttpRequest();
	      xhr.open('GET', path, /** async */ false);
	      xhr.send(null);
	      if (xhr.readyState === 4 && xhr.status === 200) {
	        contents = xhr.responseText;
	      }
	    } else if (fs.existsSync(path)) {
	      // Otherwise, use the filesystem
	      contents = fs.readFileSync(path, 'utf8');
	    }
	  } catch (er) {
	    /* ignore any errors */
	  }

	  return fileContentsCache[path] = contents;
	});

	// Support URLs relative to a directory, but be careful about a protocol prefix
	// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
	function supportRelativeURL(file, url) {
	  if (!file) return url;
	  var dir = path.dirname(file);
	  var match = /^\w+:\/\/[^\/]*/.exec(dir);
	  var protocol = match ? match[0] : '';
	  var startPath = dir.slice(protocol.length);
	  if (protocol && /^\/\w\:/.test(startPath)) {
	    // handle file:///C:/ paths
	    protocol += '/';
	    return protocol + path.resolve(dir.slice(protocol.length), url).replace(/\\/g, '/');
	  }
	  return protocol + path.resolve(dir.slice(protocol.length), url);
	}

	function retrieveSourceMapURL(source) {
	  var fileData;

	  if (isInBrowser()) {
	     try {
	       var xhr = new XMLHttpRequest();
	       xhr.open('GET', source, false);
	       xhr.send(null);
	       fileData = xhr.readyState === 4 ? xhr.responseText : null;

	       // Support providing a sourceMappingURL via the SourceMap header
	       var sourceMapHeader = xhr.getResponseHeader("SourceMap") ||
	                             xhr.getResponseHeader("X-SourceMap");
	       if (sourceMapHeader) {
	         return sourceMapHeader;
	       }
	     } catch (e) {
	     }
	  }

	  // Get the URL of the source map
	  fileData = retrieveFile(source);
	  var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
	  // Keep executing the search to find the *last* sourceMappingURL to avoid
	  // picking up sourceMappingURLs from comments, strings, etc.
	  var lastMatch, match;
	  while (match = re.exec(fileData)) lastMatch = match;
	  if (!lastMatch) return null;
	  return lastMatch[1];
	}
	// Can be overridden by the retrieveSourceMap option to install. Takes a
	// generated source filename; returns a {map, optional url} object, or null if
	// there is no source map.  The map field may be either a string or the parsed
	// JSON object (ie, it must be a valid argument to the SourceMapConsumer
	// constructor).
	var retrieveSourceMap = handlerExec(retrieveMapHandlers);
	retrieveMapHandlers.push(function(source) {
	  var sourceMappingURL = retrieveSourceMapURL(source);
	  if (!sourceMappingURL) return null;

	  // Read the contents of the source map
	  var sourceMapData;
	  if (reSourceMap.test(sourceMappingURL)) {
	    // Support source map URL as a data url
	    var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
	    sourceMapData = bufferFrom(rawData, "base64").toString();
	    sourceMappingURL = source;
	  } else {
	    // Support source map URLs relative to the source URL
	    sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
	    sourceMapData = retrieveFile(sourceMappingURL);
	  }

	  if (!sourceMapData) {
	    return null;
	  }

	  return {
	    url: sourceMappingURL,
	    map: sourceMapData
	  };
	});

	function mapSourcePosition(position) {
	  var sourceMap = sourceMapCache[position.source];
	  if (!sourceMap) {
	    // Call the (overrideable) retrieveSourceMap function to get the source map.
	    var urlAndMap = retrieveSourceMap(position.source);
	    if (urlAndMap) {
	      sourceMap = sourceMapCache[position.source] = {
	        url: urlAndMap.url,
	        map: new SourceMapConsumer(urlAndMap.map)
	      };

	      // Load all sources stored inline with the source map into the file cache
	      // to pretend like they are already loaded. They may not exist on disk.
	      if (sourceMap.map.sourcesContent) {
	        sourceMap.map.sources.forEach(function(source, i) {
	          var contents = sourceMap.map.sourcesContent[i];
	          if (contents) {
	            var url = supportRelativeURL(sourceMap.url, source);
	            fileContentsCache[url] = contents;
	          }
	        });
	      }
	    } else {
	      sourceMap = sourceMapCache[position.source] = {
	        url: null,
	        map: null
	      };
	    }
	  }

	  // Resolve the source URL relative to the URL of the source map
	  if (sourceMap && sourceMap.map && typeof sourceMap.map.originalPositionFor === 'function') {
	    var originalPosition = sourceMap.map.originalPositionFor(position);

	    // Only return the original position if a matching line was found. If no
	    // matching line is found then we return position instead, which will cause
	    // the stack trace to print the path and line for the compiled file. It is
	    // better to give a precise location in the compiled file than a vague
	    // location in the original file.
	    if (originalPosition.source !== null) {
	      originalPosition.source = supportRelativeURL(
	        sourceMap.url, originalPosition.source);
	      return originalPosition;
	    }
	  }

	  return position;
	}

	// Parses code generated by FormatEvalOrigin(), a function inside V8:
	// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
	function mapEvalOrigin(origin) {
	  // Most eval() calls are in this format
	  var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
	  if (match) {
	    var position = mapSourcePosition({
	      source: match[2],
	      line: +match[3],
	      column: match[4] - 1
	    });
	    return 'eval at ' + match[1] + ' (' + position.source + ':' +
	      position.line + ':' + (position.column + 1) + ')';
	  }

	  // Parse nested eval() calls using recursion
	  match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
	  if (match) {
	    return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
	  }

	  // Make sure we still return useful information if we didn't find anything
	  return origin;
	}

	// This is copied almost verbatim from the V8 source code at
	// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
	// implementation of wrapCallSite() used to just forward to the actual source
	// code of CallSite.prototype.toString but unfortunately a new release of V8
	// did something to the prototype chain and broke the shim. The only fix I
	// could find was copy/paste.
	function CallSiteToString() {
	  var fileName;
	  var fileLocation = "";
	  if (this.isNative()) {
	    fileLocation = "native";
	  } else {
	    fileName = this.getScriptNameOrSourceURL();
	    if (!fileName && this.isEval()) {
	      fileLocation = this.getEvalOrigin();
	      fileLocation += ", ";  // Expecting source position to follow.
	    }

	    if (fileName) {
	      fileLocation += fileName;
	    } else {
	      // Source code does not originate from a file and is not native, but we
	      // can still get the source position inside the source string, e.g. in
	      // an eval string.
	      fileLocation += "<anonymous>";
	    }
	    var lineNumber = this.getLineNumber();
	    if (lineNumber != null) {
	      fileLocation += ":" + lineNumber;
	      var columnNumber = this.getColumnNumber();
	      if (columnNumber) {
	        fileLocation += ":" + columnNumber;
	      }
	    }
	  }

	  var line = "";
	  var functionName = this.getFunctionName();
	  var addSuffix = true;
	  var isConstructor = this.isConstructor();
	  var isMethodCall = !(this.isToplevel() || isConstructor);
	  if (isMethodCall) {
	    var typeName = this.getTypeName();
	    // Fixes shim to be backward compatable with Node v0 to v4
	    if (typeName === "[object Object]") {
	      typeName = "null";
	    }
	    var methodName = this.getMethodName();
	    if (functionName) {
	      if (typeName && functionName.indexOf(typeName) != 0) {
	        line += typeName + ".";
	      }
	      line += functionName;
	      if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
	        line += " [as " + methodName + "]";
	      }
	    } else {
	      line += typeName + "." + (methodName || "<anonymous>");
	    }
	  } else if (isConstructor) {
	    line += "new " + (functionName || "<anonymous>");
	  } else if (functionName) {
	    line += functionName;
	  } else {
	    line += fileLocation;
	    addSuffix = false;
	  }
	  if (addSuffix) {
	    line += " (" + fileLocation + ")";
	  }
	  return line;
	}

	function cloneCallSite(frame) {
	  var object = {};
	  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
	    object[name] = /^(?:is|get)/.test(name) ? function() { return frame[name].call(frame); } : frame[name];
	  });
	  object.toString = CallSiteToString;
	  return object;
	}

	function wrapCallSite(frame, state) {
	  // provides interface backward compatibility
	  if (state === undefined) {
	    state = { nextPosition: null, curPosition: null };
	  }
	  if(frame.isNative()) {
	    state.curPosition = null;
	    return frame;
	  }

	  // Most call sites will return the source file from getFileName(), but code
	  // passed to eval() ending in "//# sourceURL=..." will return the source file
	  // from getScriptNameOrSourceURL() instead
	  var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
	  if (source) {
	    var line = frame.getLineNumber();
	    var column = frame.getColumnNumber() - 1;

	    // Fix position in Node where some (internal) code is prepended.
	    // See https://github.com/evanw/node-source-map-support/issues/36
	    // Header removed in node at ^10.16 || >=11.11.0
	    // v11 is not an LTS candidate, we can just test the one version with it.
	    // Test node versions for: 10.16-19, 10.20+, 12-19, 20-99, 100+, or 11.11
	    var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
	    var headerLength = noHeader.test(globalProcessVersion()) ? 0 : 62;
	    if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
	      column -= headerLength;
	    }

	    var position = mapSourcePosition({
	      source: source,
	      line: line,
	      column: column
	    });
	    state.curPosition = position;
	    frame = cloneCallSite(frame);
	    var originalFunctionName = frame.getFunctionName;
	    frame.getFunctionName = function() {
	      if (state.nextPosition == null) {
	        return originalFunctionName();
	      }
	      return state.nextPosition.name || originalFunctionName();
	    };
	    frame.getFileName = function() { return position.source; };
	    frame.getLineNumber = function() { return position.line; };
	    frame.getColumnNumber = function() { return position.column + 1; };
	    frame.getScriptNameOrSourceURL = function() { return position.source; };
	    return frame;
	  }

	  // Code called using eval() needs special handling
	  var origin = frame.isEval() && frame.getEvalOrigin();
	  if (origin) {
	    origin = mapEvalOrigin(origin);
	    frame = cloneCallSite(frame);
	    frame.getEvalOrigin = function() { return origin; };
	    return frame;
	  }

	  // If we get here then we were unable to change the source position
	  return frame;
	}

	// This function is part of the V8 stack trace API, for more info see:
	// https://v8.dev/docs/stack-trace-api
	function prepareStackTrace(error, stack) {
	  if (emptyCacheBetweenOperations) {
	    fileContentsCache = {};
	    sourceMapCache = {};
	  }

	  var name = error.name || 'Error';
	  var message = error.message || '';
	  var errorString = name + ": " + message;

	  var state = { nextPosition: null, curPosition: null };
	  var processedStack = [];
	  for (var i = stack.length - 1; i >= 0; i--) {
	    processedStack.push('\n    at ' + wrapCallSite(stack[i], state));
	    state.nextPosition = state.curPosition;
	  }
	  state.curPosition = state.nextPosition = null;
	  return errorString + processedStack.reverse().join('');
	}

	// Generate position and snippet of original source with pointer
	function getErrorSource(error) {
	  var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
	  if (match) {
	    var source = match[1];
	    var line = +match[2];
	    var column = +match[3];

	    // Support the inline sourceContents inside the source map
	    var contents = fileContentsCache[source];

	    // Support files on disk
	    if (!contents && fs && fs.existsSync(source)) {
	      try {
	        contents = fs.readFileSync(source, 'utf8');
	      } catch (er) {
	        contents = '';
	      }
	    }

	    // Format the line from the original source code like node does
	    if (contents) {
	      var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
	      if (code) {
	        return source + ':' + line + '\n' + code + '\n' +
	          new Array(column).join(' ') + '^';
	      }
	    }
	  }
	  return null;
	}

	function printErrorAndExit (error) {
	  var source = getErrorSource(error);

	  // Ensure error is printed synchronously and not truncated
	  var stderr = globalProcessStderr();
	  if (stderr && stderr._handle && stderr._handle.setBlocking) {
	    stderr._handle.setBlocking(true);
	  }

	  if (source) {
	    console.error();
	    console.error(source);
	  }

	  console.error(error.stack);
	  globalProcessExit(1);
	}

	function shimEmitUncaughtException () {
	  var origEmit = process.emit;

	  process.emit = function (type) {
	    if (type === 'uncaughtException') {
	      var hasStack = (arguments[1] && arguments[1].stack);
	      var hasListeners = (this.listeners(type).length > 0);

	      if (hasStack && !hasListeners) {
	        return printErrorAndExit(arguments[1]);
	      }
	    }

	    return origEmit.apply(this, arguments);
	  };
	}

	var originalRetrieveFileHandlers = retrieveFileHandlers.slice(0);
	var originalRetrieveMapHandlers = retrieveMapHandlers.slice(0);

	exports.wrapCallSite = wrapCallSite;
	exports.getErrorSource = getErrorSource;
	exports.mapSourcePosition = mapSourcePosition;
	exports.retrieveSourceMap = retrieveSourceMap;

	exports.install = function(options) {
	  options = options || {};

	  if (options.environment) {
	    environment = options.environment;
	    if (["node", "browser", "auto"].indexOf(environment) === -1) {
	      throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}")
	    }
	  }

	  // Allow sources to be found by methods other than reading the files
	  // directly from disk.
	  if (options.retrieveFile) {
	    if (options.overrideRetrieveFile) {
	      retrieveFileHandlers.length = 0;
	    }

	    retrieveFileHandlers.unshift(options.retrieveFile);
	  }

	  // Allow source maps to be found by methods other than reading the files
	  // directly from disk.
	  if (options.retrieveSourceMap) {
	    if (options.overrideRetrieveSourceMap) {
	      retrieveMapHandlers.length = 0;
	    }

	    retrieveMapHandlers.unshift(options.retrieveSourceMap);
	  }

	  // Support runtime transpilers that include inline source maps
	  if (options.hookRequire && !isInBrowser()) {
	    // Use dynamicRequire to avoid including in browser bundles
	    var Module = dynamicRequire(module, 'module');
	    var $compile = Module.prototype._compile;

	    if (!$compile.__sourceMapSupport) {
	      Module.prototype._compile = function(content, filename) {
	        fileContentsCache[filename] = content;
	        sourceMapCache[filename] = undefined;
	        return $compile.call(this, content, filename);
	      };

	      Module.prototype._compile.__sourceMapSupport = true;
	    }
	  }

	  // Configure options
	  if (!emptyCacheBetweenOperations) {
	    emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
	      options.emptyCacheBetweenOperations : false;
	  }

	  // Install the error reformatter
	  if (!errorFormatterInstalled) {
	    errorFormatterInstalled = true;
	    Error.prepareStackTrace = prepareStackTrace;
	  }

	  if (!uncaughtShimInstalled) {
	    var installHandler = 'handleUncaughtExceptions' in options ?
	      options.handleUncaughtExceptions : true;

	    // Do not override 'uncaughtException' with our own handler in Node.js
	    // Worker threads. Workers pass the error to the main thread as an event,
	    // rather than printing something to stderr and exiting.
	    try {
	      // We need to use `dynamicRequire` because `require` on it's own will be optimized by WebPack/Browserify.
	      var worker_threads = dynamicRequire(module, 'worker_threads');
	      if (worker_threads.isMainThread === false) {
	        installHandler = false;
	      }
	    } catch(e) {}

	    // Provide the option to not install the uncaught exception handler. This is
	    // to support other uncaught exception handlers (in test frameworks, for
	    // example). If this handler is not installed and there are no other uncaught
	    // exception handlers, uncaught exceptions will be caught by node's built-in
	    // exception handler and the process will still be terminated. However, the
	    // generated JavaScript code will be shown above the stack trace instead of
	    // the original source code.
	    if (installHandler && hasGlobalProcessEventEmitter()) {
	      uncaughtShimInstalled = true;
	      shimEmitUncaughtException();
	    }
	  }
	};

	exports.resetRetrieveHandlers = function() {
	  retrieveFileHandlers.length = 0;
	  retrieveMapHandlers.length = 0;

	  retrieveFileHandlers = originalRetrieveFileHandlers.slice(0);
	  retrieveMapHandlers = originalRetrieveMapHandlers.slice(0);

	  retrieveSourceMap = handlerExec(retrieveMapHandlers);
	  retrieveFile = handlerExec(retrieveFileHandlers);
	};
} (sourceMapSupport$1, sourceMapSupport$1.exports));

var sourceMapSupport = sourceMapSupport$1.exports;

const hasNativeSourceMapSupport = "setSourceMapsEnabled" in process;

function installSourceMapSupport() {
  if (hasNativeSourceMapSupport) {
    process.setSourceMapsEnabled(true);
    return;
  }
  const sourcemaps = /* @__PURE__ */ new Map();
  sourceMapSupport.install({
    environment: "node",
    retrieveSourceMap(url) {
      const map = sourcemaps.get(url);
      return map ? { url, map } : null;
    }
  });
  return sourcemaps;
}

/* es-module-lexer 0.10.5 */
const A=1===new Uint8Array(new Uint16Array([1]).buffer)[0];function parse$1(E,g="@"){if(!C)return init.then((()=>parse$1(E)));const I=E.length+1,o=(C.__heap_base.value||C.__heap_base)+4*I-C.memory.buffer.byteLength;o>0&&C.memory.grow(Math.ceil(o/65536));const k=C.sa(I-1);if((A?B:Q)(E,new Uint16Array(C.memory.buffer,k,I)),!C.parse())throw Object.assign(new Error(`Parse error ${g}:${E.slice(0,C.e()).split("\n").length}:${C.e()-E.lastIndexOf("\n",C.e()-1)}`),{idx:C.e()});const J=[],i=[];for(;C.ri();){const A=C.is(),Q=C.ie(),B=C.ai(),g=C.id(),I=C.ss(),o=C.se();let k;C.ip()&&(k=w(E.slice(-1===g?A-1:A,-1===g?Q+1:Q))),J.push({n:k,s:A,e:Q,ss:I,se:o,d:g,a:B});}for(;C.re();){const A=E.slice(C.es(),C.ee()),Q=A[0];i.push('"'===Q||"'"===Q?w(A):A);}function w(A){try{return (0,eval)(A)}catch(A){}}return [J,i,!!C.f()]}function Q(A,Q){const B=A.length;let C=0;for(;C<B;){const B=A.charCodeAt(C);Q[C++]=(255&B)<<8|B>>>8;}}function B(A,Q){const B=A.length;let C=0;for(;C<B;)Q[C]=A.charCodeAt(C++);}let C;const init=WebAssembly.compile((E="AGFzbQEAAAABKghgAX8Bf2AEf39/fwBgAn9/AGAAAX9gAABgAX8AYAN/f38Bf2ACf38BfwMqKQABAgMDAwMDAwMDAwMDAwMAAAQEBAUEBQAAAAAEBAAGBwACAAAABwMGBAUBcAEBAQUDAQABBg8CfwFBkPIAC38AQZDyAAsHZBEGbWVtb3J5AgACc2EAAAFlAAMCaXMABAJpZQAFAnNzAAYCc2UABwJhaQAIAmlkAAkCaXAACgJlcwALAmVlAAwCcmkADQJyZQAOAWYADwVwYXJzZQAQC19faGVhcF9iYXNlAwEKhjQpaAEBf0EAIAA2AtQJQQAoArAJIgEgAEEBdGoiAEEAOwEAQQAgAEECaiIANgLYCUEAIAA2AtwJQQBBADYCtAlBAEEANgLECUEAQQA2ArwJQQBBADYCuAlBAEEANgLMCUEAQQA2AsAJIAELnwEBA39BACgCxAkhBEEAQQAoAtwJIgU2AsQJQQAgBDYCyAlBACAFQSBqNgLcCSAEQRxqQbQJIAQbIAU2AgBBACgCqAkhBEEAKAKkCSEGIAUgATYCACAFIAA2AgggBSACIAJBAmpBACAGIANGGyAEIANGGzYCDCAFIAM2AhQgBUEANgIQIAUgAjYCBCAFQQA2AhwgBUEAKAKkCSADRjoAGAtIAQF/QQAoAswJIgJBCGpBuAkgAhtBACgC3AkiAjYCAEEAIAI2AswJQQAgAkEMajYC3AkgAkEANgIIIAIgATYCBCACIAA2AgALCABBACgC4AkLFQBBACgCvAkoAgBBACgCsAlrQQF1Cx4BAX9BACgCvAkoAgQiAEEAKAKwCWtBAXVBfyAAGwsVAEEAKAK8CSgCCEEAKAKwCWtBAXULHgEBf0EAKAK8CSgCDCIAQQAoArAJa0EBdUF/IAAbCx4BAX9BACgCvAkoAhAiAEEAKAKwCWtBAXVBfyAAGws7AQF/AkBBACgCvAkoAhQiAEEAKAKkCUcNAEF/DwsCQCAAQQAoAqgJRw0AQX4PCyAAQQAoArAJa0EBdQsLAEEAKAK8CS0AGAsVAEEAKALACSgCAEEAKAKwCWtBAXULFQBBACgCwAkoAgRBACgCsAlrQQF1CyUBAX9BAEEAKAK8CSIAQRxqQbQJIAAbKAIAIgA2ArwJIABBAEcLJQEBf0EAQQAoAsAJIgBBCGpBuAkgABsoAgAiADYCwAkgAEEARwsIAEEALQDkCQvnCwEGfyMAQYDaAGsiASQAQQBBAToA5AlBAEH//wM7AewJQQBBACgCrAk2AvAJQQBBACgCsAlBfmoiAjYCiApBACACQQAoAtQJQQF0aiIDNgKMCkEAQQA7AeYJQQBBADsB6AlBAEEAOwHqCUEAQQA6APQJQQBBADYC4AlBAEEAOgDQCUEAIAFBgNIAajYC+AlBACABQYASajYC/AlBACABNgKACkEAQQA6AIQKAkACQAJAAkADQEEAIAJBAmoiBDYCiAogAiADTw0BAkAgBC8BACIDQXdqQQVJDQACQAJAAkACQAJAIANBm39qDgUBCAgIAgALIANBIEYNBCADQS9GDQMgA0E7Rg0CDAcLQQAvAeoJDQEgBBARRQ0BIAJBBGpBgghBChAoDQEQEkEALQDkCQ0BQQBBACgCiAoiAjYC8AkMBwsgBBARRQ0AIAJBBGpBjAhBChAoDQAQEwtBAEEAKAKICjYC8AkMAQsCQCACLwEEIgRBKkYNACAEQS9HDQQQFAwBC0EBEBULQQAoAowKIQNBACgCiAohAgwACwtBACEDIAQhAkEALQDQCQ0CDAELQQAgAjYCiApBAEEAOgDkCQsDQEEAIAJBAmoiBDYCiAoCQAJAAkACQAJAAkAgAkEAKAKMCk8NACAELwEAIgNBd2pBBUkNBQJAAkACQAJAAkACQAJAAkACQAJAIANBYGoOCg8OCA4ODg4HAQIACwJAAkACQAJAIANBoH9qDgoIEREDEQERERECAAsgA0GFf2oOAwUQBgsLQQAvAeoJDQ8gBBARRQ0PIAJBBGpBgghBChAoDQ8QEgwPCyAEEBFFDQ4gAkEEakGMCEEKECgNDhATDA4LIAQQEUUNDSACKQAEQuyAhIOwjsA5Ug0NIAIvAQwiBEF3aiICQRdLDQtBASACdEGfgIAEcUUNCwwMC0EAQQAvAeoJIgJBAWo7AeoJQQAoAvwJIAJBAnRqQQAoAvAJNgIADAwLQQAvAeoJIgNFDQhBACADQX9qIgU7AeoJQQAvAegJIgNFDQsgA0ECdEEAKAKACmpBfGooAgAiBigCFEEAKAL8CSAFQf//A3FBAnRqKAIARw0LAkAgBigCBA0AIAYgBDYCBAtBACADQX9qOwHoCSAGIAJBBGo2AgwMCwsCQEEAKALwCSIELwEAQSlHDQBBACgCxAkiAkUNACACKAIEIARHDQBBAEEAKALICSICNgLECQJAIAJFDQAgAkEANgIcDAELQQBBADYCtAkLIAFBgBBqQQAvAeoJIgJqQQAtAIQKOgAAQQAgAkEBajsB6glBACgC/AkgAkECdGogBDYCAEEAQQA6AIQKDAoLQQAvAeoJIgJFDQZBACACQX9qIgM7AeoJIAJBAC8B7AkiBEcNAUEAQQAvAeYJQX9qIgI7AeYJQQBBACgC+AkgAkH//wNxQQF0ai8BADsB7AkLEBYMCAsgBEH//wNGDQcgA0H//wNxIARJDQQMBwtBJxAXDAYLQSIQFwwFCyADQS9HDQQCQAJAIAIvAQQiAkEqRg0AIAJBL0cNARAUDAcLQQEQFQwGCwJAAkACQAJAQQAoAvAJIgQvAQAiAhAYRQ0AAkACQAJAIAJBVWoOBAEFAgAFCyAEQX5qLwEAQVBqQf//A3FBCkkNAwwECyAEQX5qLwEAQStGDQIMAwsgBEF+ai8BAEEtRg0BDAILAkAgAkH9AEYNACACQSlHDQFBACgC/AlBAC8B6glBAnRqKAIAEBlFDQEMAgtBACgC/AlBAC8B6gkiA0ECdGooAgAQGg0BIAFBgBBqIANqLQAADQELIAQQGw0AIAJFDQBBASEEIAJBL0ZBAC0A9AlBAEdxRQ0BCxAcQQAhBAtBACAEOgD0CQwEC0EALwHsCUH//wNGQQAvAeoJRXFBAC0A0AlFcUEALwHoCUVxIQMMBgsQHUEAIQMMBQsgBEGgAUcNAQtBAEEBOgCECgtBAEEAKAKICjYC8AkLQQAoAogKIQIMAAsLIAFBgNoAaiQAIAMLHQACQEEAKAKwCSAARw0AQQEPCyAAQX5qLwEAEB4LpgYBBH9BAEEAKAKICiIAQQxqIgE2AogKQQEQISECAkACQAJAAkACQEEAKAKICiIDIAFHDQAgAhAlRQ0BCwJAAkACQAJAAkAgAkGff2oODAYBAwgBBwEBAQEBBAALAkACQCACQSpGDQAgAkH2AEYNBSACQfsARw0CQQAgA0ECajYCiApBARAhIQNBACgCiAohAQNAAkACQCADQf//A3EiAkEiRg0AIAJBJ0YNACACECQaQQAoAogKIQIMAQsgAhAXQQBBACgCiApBAmoiAjYCiAoLQQEQIRoCQCABIAIQJiIDQSxHDQBBAEEAKAKICkECajYCiApBARAhIQMLQQAoAogKIQICQCADQf0ARg0AIAIgAUYNBSACIQEgAkEAKAKMCk0NAQwFCwtBACACQQJqNgKICgwBC0EAIANBAmo2AogKQQEQIRpBACgCiAoiAiACECYaC0EBECEhAgtBACgCiAohAwJAIAJB5gBHDQAgA0ECakGeCEEGECgNAEEAIANBCGo2AogKIABBARAhECIPC0EAIANBfmo2AogKDAMLEB0PCwJAIAMpAAJC7ICEg7COwDlSDQAgAy8BChAeRQ0AQQAgA0EKajYCiApBARAhIQJBACgCiAohAyACECQaIANBACgCiAoQAkEAQQAoAogKQX5qNgKICg8LQQAgA0EEaiIDNgKICgtBACADQQRqIgI2AogKQQBBADoA5AkDQEEAIAJBAmo2AogKQQEQISEDQQAoAogKIQICQCADECRBIHJB+wBHDQBBAEEAKAKICkF+ajYCiAoPC0EAKAKICiIDIAJGDQEgAiADEAICQEEBECEiAkEsRg0AAkAgAkE9Rw0AQQBBACgCiApBfmo2AogKDwtBAEEAKAKICkF+ajYCiAoPC0EAKAKICiECDAALCw8LQQAgA0EKajYCiApBARAhGkEAKAKICiEDC0EAIANBEGo2AogKAkBBARAhIgJBKkcNAEEAQQAoAogKQQJqNgKICkEBECEhAgtBACgCiAohAyACECQaIANBACgCiAoQAkEAQQAoAogKQX5qNgKICg8LIAMgA0EOahACC6sGAQR/QQBBACgCiAoiAEEMaiIBNgKICgJAAkACQAJAAkACQAJAAkACQAJAQQEQISICQVlqDggCCAECAQEBBwALIAJBIkYNASACQfsARg0CC0EAKAKICiABRg0HC0EALwHqCQ0BQQAoAogKIQJBACgCjAohAwNAIAIgA08NBAJAAkAgAi8BACIBQSdGDQAgAUEiRw0BCyAAIAEQIg8LQQAgAkECaiICNgKICgwACwtBACgCiAohAkEALwHqCQ0BAkADQAJAAkACQCACQQAoAowKTw0AQQEQISICQSJGDQEgAkEnRg0BIAJB/QBHDQJBAEEAKAKICkECajYCiAoLQQEQIRpBACgCiAoiAikAAELmgMiD8I3ANlINBkEAIAJBCGo2AogKQQEQISICQSJGDQMgAkEnRg0DDAYLIAIQFwtBAEEAKAKICkECaiICNgKICgwACwsgACACECIMBQtBAEEAKAKICkF+ajYCiAoPC0EAIAJBfmo2AogKDwsQHQ8LQQBBACgCiApBAmo2AogKQQEQIUHtAEcNAUEAKAKICiICQQJqQZYIQQYQKA0BQQAoAvAJLwEAQS5GDQEgACAAIAJBCGpBACgCqAkQAQ8LQQAoAvwJQQAvAeoJIgJBAnRqQQAoAogKNgIAQQAgAkEBajsB6glBACgC8AkvAQBBLkYNAEEAQQAoAogKIgFBAmo2AogKQQEQISECIABBACgCiApBACABEAFBAEEALwHoCSIBQQFqOwHoCUEAKAKACiABQQJ0akEAKALECTYCAAJAIAJBIkYNACACQSdGDQBBAEEAKAKICkF+ajYCiAoPCyACEBdBAEEAKAKICkECaiICNgKICgJAAkACQEEBECFBV2oOBAECAgACC0EAQQAoAogKQQJqNgKICkEBECEaQQAoAsQJIgEgAjYCBCABQQE6ABggAUEAKAKICiICNgIQQQAgAkF+ajYCiAoPC0EAKALECSIBIAI2AgQgAUEBOgAYQQBBAC8B6glBf2o7AeoJIAFBACgCiApBAmo2AgxBAEEALwHoCUF/ajsB6AkPC0EAQQAoAogKQX5qNgKICg8LC0cBA39BACgCiApBAmohAEEAKAKMCiEBAkADQCAAIgJBfmogAU8NASACQQJqIQAgAi8BAEF2ag4EAQAAAQALC0EAIAI2AogKC5gBAQN/QQBBACgCiAoiAUECajYCiAogAUEGaiEBQQAoAowKIQIDQAJAAkACQCABQXxqIAJPDQAgAUF+ai8BACEDAkACQCAADQAgA0EqRg0BIANBdmoOBAIEBAIECyADQSpHDQMLIAEvAQBBL0cNAkEAIAFBfmo2AogKDAELIAFBfmohAQtBACABNgKICg8LIAFBAmohAQwACwu/AQEEf0EAKAKICiEAQQAoAowKIQECQAJAA0AgACICQQJqIQAgAiABTw0BAkACQCAALwEAIgNBpH9qDgUBAgICBAALIANBJEcNASACLwEEQfsARw0BQQBBAC8B5gkiAEEBajsB5glBACgC+AkgAEEBdGpBAC8B7Ak7AQBBACACQQRqNgKICkEAQQAvAeoJQQFqIgA7AewJQQAgADsB6gkPCyACQQRqIQAMAAsLQQAgADYCiAoQHQ8LQQAgADYCiAoLiAEBBH9BACgCiAohAUEAKAKMCiECAkACQANAIAEiA0ECaiEBIAMgAk8NASABLwEAIgQgAEYNAgJAIARB3ABGDQAgBEF2ag4EAgEBAgELIANBBGohASADLwEEQQ1HDQAgA0EGaiABIAMvAQZBCkYbIQEMAAsLQQAgATYCiAoQHQ8LQQAgATYCiAoLbAEBfwJAAkAgAEFfaiIBQQVLDQBBASABdEExcQ0BCyAAQUZqQf//A3FBBkkNACAAQSlHIABBWGpB//8DcUEHSXENAAJAIABBpX9qDgQBAAABAAsgAEH9AEcgAEGFf2pB//8DcUEESXEPC0EBCy4BAX9BASEBAkAgAEH2CEEFEB8NACAAQYAJQQMQHw0AIABBhglBAhAfIQELIAELgwEBAn9BASEBAkACQAJAAkACQAJAIAAvAQAiAkFFag4EBQQEAQALAkAgAkGbf2oOBAMEBAIACyACQSlGDQQgAkH5AEcNAyAAQX5qQZIJQQYQHw8LIABBfmovAQBBPUYPCyAAQX5qQYoJQQQQHw8LIABBfmpBnglBAxAfDwtBACEBCyABC5MDAQJ/QQAhAQJAAkACQAJAAkACQAJAAkACQCAALwEAQZx/ag4UAAECCAgICAgICAMECAgFCAYICAcICwJAAkAgAEF+ai8BAEGXf2oOBAAJCQEJCyAAQXxqQa4IQQIQHw8LIABBfGpBsghBAxAfDwsCQAJAIABBfmovAQBBjX9qDgIAAQgLAkAgAEF8ai8BACICQeEARg0AIAJB7ABHDQggAEF6akHlABAgDwsgAEF6akHjABAgDwsgAEF8akG4CEEEEB8PCyAAQX5qLwEAQe8ARw0FIABBfGovAQBB5QBHDQUCQCAAQXpqLwEAIgJB8ABGDQAgAkHjAEcNBiAAQXhqQcAIQQYQHw8LIABBeGpBzAhBAhAfDwtBASEBIABBfmoiAEHpABAgDQQgAEHQCEEFEB8PCyAAQX5qQeQAECAPCyAAQX5qQdoIQQcQHw8LIABBfmpB6AhBBBAfDwsCQCAAQX5qLwEAIgJB7wBGDQAgAkHlAEcNASAAQXxqQe4AECAPCyAAQXxqQfAIQQMQHyEBCyABC3ABAn8CQAJAA0BBAEEAKAKICiIAQQJqIgE2AogKIABBACgCjApPDQECQAJAAkAgAS8BACIBQaV/ag4CAQIACwJAIAFBdmoOBAQDAwQACyABQS9HDQIMBAsQJxoMAQtBACAAQQRqNgKICgwACwsQHQsLNQEBf0EAQQE6ANAJQQAoAogKIQBBAEEAKAKMCkECajYCiApBACAAQQAoArAJa0EBdTYC4AkLNAEBf0EBIQECQCAAQXdqQf//A3FBBUkNACAAQYABckGgAUYNACAAQS5HIAAQJXEhAQsgAQtJAQN/QQAhAwJAIAAgAkEBdCICayIEQQJqIgBBACgCsAkiBUkNACAAIAEgAhAoDQACQCAAIAVHDQBBAQ8LIAQvAQAQHiEDCyADCz0BAn9BACECAkBBACgCsAkiAyAASw0AIAAvAQAgAUcNAAJAIAMgAEcNAEEBDwsgAEF+ai8BABAeIQILIAILnAEBA39BACgCiAohAQJAA0ACQAJAIAEvAQAiAkEvRw0AAkAgAS8BAiIBQSpGDQAgAUEvRw0EEBQMAgsgABAVDAELAkACQCAARQ0AIAJBd2oiAUEXSw0BQQEgAXRBn4CABHFFDQEMAgsgAhAjRQ0DDAELIAJBoAFHDQILQQBBACgCiAoiA0ECaiIBNgKICiADQQAoAowKSQ0ACwsgAgvCAwEBfwJAIAFBIkYNACABQSdGDQAQHQ8LQQAoAogKIQIgARAXIAAgAkECakEAKAKICkEAKAKkCRABQQBBACgCiApBAmo2AogKQQAQISEAQQAoAogKIQECQAJAIABB4QBHDQAgAUECakGkCEEKEChFDQELQQAgAUF+ajYCiAoPC0EAIAFBDGo2AogKAkBBARAhQfsARg0AQQAgATYCiAoPC0EAKAKICiICIQADQEEAIABBAmo2AogKAkACQAJAQQEQISIAQSJGDQAgAEEnRw0BQScQF0EAQQAoAogKQQJqNgKICkEBECEhAAwCC0EiEBdBAEEAKAKICkECajYCiApBARAhIQAMAQsgABAkIQALAkAgAEE6Rg0AQQAgATYCiAoPC0EAQQAoAogKQQJqNgKICgJAQQEQISIAQSJGDQAgAEEnRg0AQQAgATYCiAoPCyAAEBdBAEEAKAKICkECajYCiAoCQAJAQQEQISIAQSxGDQAgAEH9AEYNAUEAIAE2AogKDwtBAEEAKAKICkECajYCiApBARAhQf0ARg0AQQAoAogKIQAMAQsLQQAoAsQJIgEgAjYCECABQQAoAogKQQJqNgIMCzABAX8CQAJAIABBd2oiAUEXSw0AQQEgAXRBjYCABHENAQsgAEGgAUYNAEEADwtBAQttAQJ/AkACQANAAkAgAEH//wNxIgFBd2oiAkEXSw0AQQEgAnRBn4CABHENAgsgAUGgAUYNASAAIQIgARAlDQJBACECQQBBACgCiAoiAEECajYCiAogAC8BAiIADQAMAgsLIAAhAgsgAkH//wNxC2gBAn9BASEBAkACQCAAQV9qIgJBBUsNAEEBIAJ0QTFxDQELIABB+P8DcUEoRg0AIABBRmpB//8DcUEGSQ0AAkAgAEGlf2oiAkEDSw0AIAJBAUcNAQsgAEGFf2pB//8DcUEESSEBCyABC4sBAQJ/AkBBACgCiAoiAi8BACIDQeEARw0AQQAgAkEEajYCiApBARAhIQJBACgCiAohAAJAAkAgAkEiRg0AIAJBJ0YNACACECQaQQAoAogKIQEMAQsgAhAXQQBBACgCiApBAmoiATYCiAoLQQEQISEDQQAoAogKIQILAkAgAiAARg0AIAAgARACCyADC3IBBH9BACgCiAohAEEAKAKMCiEBAkACQANAIABBAmohAiAAIAFPDQECQAJAIAIvAQAiA0Gkf2oOAgEEAAsgAiEAIANBdmoOBAIBAQIBCyAAQQRqIQAMAAsLQQAgAjYCiAoQHUEADwtBACACNgKICkHdAAtJAQN/QQAhAwJAIAJFDQACQANAIAAtAAAiBCABLQAAIgVHDQEgAUEBaiEBIABBAWohACACQX9qIgINAAwCCwsgBCAFayEDCyADCwvCAQIAQYAIC6QBAAB4AHAAbwByAHQAbQBwAG8AcgB0AGUAdABhAGYAcgBvAG0AcwBzAGUAcgB0AHYAbwB5AGkAZQBkAGUAbABlAGkAbgBzAHQAYQBuAHQAeQByAGUAdAB1AHIAZABlAGIAdQBnAGcAZQBhAHcAYQBpAHQAaAByAHcAaABpAGwAZQBmAG8AcgBpAGYAYwBhAHQAYwBmAGkAbgBhAGwAbABlAGwAcwAAQaQJCxABAAAAAgAAAAAEAAAQOQAA","undefined"!=typeof Buffer?Buffer.from(E,"base64"):Uint8Array.from(atob(E),(A=>A.charCodeAt(0))))).then(WebAssembly.instantiate).then((({exports:A})=>{C=A;}));var E;

/* es-module-lexer 0.10.5 */
let e,a,r,s=2<<19;const i$1=1===new Uint8Array(new Uint16Array([1]).buffer)[0]?function(e,a){const r=e.length;let s=0;for(;s<r;)a[s]=e.charCodeAt(s++);}:function(e,a){const r=e.length;let s=0;for(;s<r;){const r=e.charCodeAt(s);a[s++]=(255&r)<<8|r>>>8;}},t="xportmportlassetafromssertvoyiedeleinstantyreturdebuggeawaithrwhileforifcatcfinallels";let c,f,n$1;function parse(k,l="@"){c=k,f=l;const u=2*c.length+(2<<18);if(u>s||!e){for(;u>s;)s*=2;a=new ArrayBuffer(s),i$1(t,new Uint16Array(a,16,85)),e=function(e,a,r){"use asm";var s=new e.Int8Array(r),i=new e.Int16Array(r),t=new e.Int32Array(r),c=new e.Uint8Array(r),f=new e.Uint16Array(r),n=992;function b(e){e=e|0;var a=0,r=0,c=0,b=0,u=0,w=0,v=0;v=n;n=n+11520|0;u=v+2048|0;s[763]=1;i[377]=0;i[378]=0;i[379]=0;i[380]=-1;t[57]=t[2];s[764]=0;t[56]=0;s[762]=0;t[58]=v+10496;t[59]=v+2304;t[60]=v;s[765]=0;e=(t[3]|0)+-2|0;t[61]=e;a=e+(t[54]<<1)|0;t[62]=a;e:while(1){r=e+2|0;t[61]=r;if(e>>>0>=a>>>0){b=18;break}a:do{switch(i[r>>1]|0){case 9:case 10:case 11:case 12:case 13:case 32:break;case 101:{if((((i[379]|0)==0?D(r)|0:0)?(m(e+4|0,16,10)|0)==0:0)?(k(),(s[763]|0)==0):0){b=9;break e}else b=17;break}case 105:{if(D(r)|0?(m(e+4|0,26,10)|0)==0:0){l();b=17;}else b=17;break}case 59:{b=17;break}case 47:switch(i[e+4>>1]|0){case 47:{j();break a}case 42:{y(1);break a}default:{b=16;break e}}default:{b=16;break e}}}while(0);if((b|0)==17){b=0;t[57]=t[61];}e=t[61]|0;a=t[62]|0;}if((b|0)==9){e=t[61]|0;t[57]=e;b=19;}else if((b|0)==16){s[763]=0;t[61]=e;b=19;}else if((b|0)==18)if(!(s[762]|0)){e=r;b=19;}else e=0;do{if((b|0)==19){e:while(1){a=e+2|0;t[61]=a;c=a;if(e>>>0>=(t[62]|0)>>>0){b=75;break}a:do{switch(i[a>>1]|0){case 9:case 10:case 11:case 12:case 13:case 32:break;case 101:{if(((i[379]|0)==0?D(a)|0:0)?(m(e+4|0,16,10)|0)==0:0){k();b=74;}else b=74;break}case 105:{if(D(a)|0?(m(e+4|0,26,10)|0)==0:0){l();b=74;}else b=74;break}case 99:{if((D(a)|0?(m(e+4|0,36,8)|0)==0:0)?M(i[e+12>>1]|0)|0:0){s[765]=1;b=74;}else b=74;break}case 40:{r=t[57]|0;c=t[59]|0;b=i[379]|0;i[379]=b+1<<16>>16;t[c+((b&65535)<<2)>>2]=r;b=74;break}case 41:{a=i[379]|0;if(!(a<<16>>16)){b=36;break e}a=a+-1<<16>>16;i[379]=a;r=i[378]|0;if(r<<16>>16!=0?(w=t[(t[60]|0)+((r&65535)+-1<<2)>>2]|0,(t[w+20>>2]|0)==(t[(t[59]|0)+((a&65535)<<2)>>2]|0)):0){a=w+4|0;if(!(t[a>>2]|0))t[a>>2]=c;t[w+12>>2]=e+4;i[378]=r+-1<<16>>16;b=74;}else b=74;break}case 123:{b=t[57]|0;c=t[51]|0;e=b;do{if((i[b>>1]|0)==41&(c|0)!=0?(t[c+4>>2]|0)==(b|0):0){a=t[52]|0;t[51]=a;if(!a){t[47]=0;break}else {t[a+28>>2]=0;break}}}while(0);r=i[379]|0;b=r&65535;s[u+b>>0]=s[765]|0;s[765]=0;c=t[59]|0;i[379]=r+1<<16>>16;t[c+(b<<2)>>2]=e;b=74;break}case 125:{e=i[379]|0;if(!(e<<16>>16)){b=49;break e}r=e+-1<<16>>16;i[379]=r;a=i[380]|0;if(e<<16>>16!=a<<16>>16)if(a<<16>>16!=-1&(r&65535)<(a&65535)){b=53;break e}else {b=74;break a}else {c=t[58]|0;b=(i[377]|0)+-1<<16>>16;i[377]=b;i[380]=i[c+((b&65535)<<1)>>1]|0;h();b=74;break a}}case 39:{d(39);b=74;break}case 34:{d(34);b=74;break}case 47:switch(i[e+4>>1]|0){case 47:{j();break a}case 42:{y(1);break a}default:{a=t[57]|0;r=i[a>>1]|0;r:do{if(!(U(r)|0)){switch(r<<16>>16){case 41:if(q(t[(t[59]|0)+(f[379]<<2)>>2]|0)|0){b=71;break r}else {b=68;break r}case 125:break;default:{b=68;break r}}e=f[379]|0;if(!(p(t[(t[59]|0)+(e<<2)>>2]|0)|0)?(s[u+e>>0]|0)==0:0)b=68;else b=71;}else switch(r<<16>>16){case 46:if(((i[a+-2>>1]|0)+-48&65535)<10){b=68;break r}else {b=71;break r}case 43:if((i[a+-2>>1]|0)==43){b=68;break r}else {b=71;break r}case 45:if((i[a+-2>>1]|0)==45){b=68;break r}else {b=71;break r}default:{b=71;break r}}}while(0);r:do{if((b|0)==68){b=0;if(!(o(a)|0)){switch(r<<16>>16){case 0:{b=71;break r}case 47:break;default:{e=1;break r}}if(!(s[764]|0))e=1;else b=71;}else b=71;}}while(0);if((b|0)==71){g();e=0;}s[764]=e;b=74;break a}}case 96:{h();b=74;break}default:b=74;}}while(0);if((b|0)==74){b=0;t[57]=t[61];}e=t[61]|0;}if((b|0)==36){L();e=0;break}else if((b|0)==49){L();e=0;break}else if((b|0)==53){L();e=0;break}else if((b|0)==75){e=(i[380]|0)==-1&(i[379]|0)==0&(s[762]|0)==0&(i[378]|0)==0;break}}}while(0);n=v;return e|0}function k(){var e=0,a=0,r=0,c=0,f=0,n=0;f=t[61]|0;n=f+12|0;t[61]=n;a=w(1)|0;e=t[61]|0;if(!((e|0)==(n|0)?!(I(a)|0):0))c=3;e:do{if((c|0)==3){a:do{switch(a<<16>>16){case 100:{B(e,e+14|0);break e}case 97:{t[61]=e+10;w(1)|0;e=t[61]|0;c=6;break}case 102:{c=6;break}case 99:{if((m(e+2|0,36,8)|0)==0?(r=e+10|0,$(i[r>>1]|0)|0):0){t[61]=r;f=w(1)|0;n=t[61]|0;E(f)|0;B(n,t[61]|0);t[61]=(t[61]|0)+-2;break e}e=e+4|0;t[61]=e;c=13;break}case 108:case 118:{c=13;break}case 123:{t[61]=e+2;e=w(1)|0;r=t[61]|0;while(1){if(N(e)|0){d(e);e=(t[61]|0)+2|0;t[61]=e;}else {E(e)|0;e=t[61]|0;}w(1)|0;e=C(r,e)|0;if(e<<16>>16==44){t[61]=(t[61]|0)+2;e=w(1)|0;}a=r;r=t[61]|0;if(e<<16>>16==125){c=32;break}if((r|0)==(a|0)){c=29;break}if(r>>>0>(t[62]|0)>>>0){c=31;break}}if((c|0)==29){L();break e}else if((c|0)==31){L();break e}else if((c|0)==32){t[61]=r+2;c=34;break a}break}case 42:{t[61]=e+2;w(1)|0;c=t[61]|0;C(c,c)|0;c=34;break}default:{}}}while(0);if((c|0)==6){t[61]=e+16;e=w(1)|0;if(e<<16>>16==42){t[61]=(t[61]|0)+2;e=w(1)|0;}n=t[61]|0;E(e)|0;B(n,t[61]|0);t[61]=(t[61]|0)+-2;break}else if((c|0)==13){e=e+4|0;t[61]=e;s[763]=0;a:while(1){t[61]=e+2;n=w(1)|0;e=t[61]|0;switch((E(n)|0)<<16>>16){case 91:case 123:{c=15;break a}default:{}}a=t[61]|0;if((a|0)==(e|0))break e;B(e,a);switch((w(1)|0)<<16>>16){case 61:{c=19;break a}case 44:break;default:{c=20;break a}}e=t[61]|0;}if((c|0)==15){t[61]=(t[61]|0)+-2;break}else if((c|0)==19){t[61]=(t[61]|0)+-2;break}else if((c|0)==20){t[61]=(t[61]|0)+-2;break}}else if((c|0)==34)a=w(1)|0;e=t[61]|0;if(a<<16>>16==102?(m(e+2|0,52,6)|0)==0:0){t[61]=e+8;u(f,w(1)|0);break}t[61]=e+-2;}}while(0);return}function l(){var e=0,a=0,r=0,c=0,f=0;f=t[61]|0;a=f+12|0;t[61]=a;e:do{switch((w(1)|0)<<16>>16){case 40:{e=t[61]|0;a=t[59]|0;r=i[379]|0;i[379]=r+1<<16>>16;t[a+((r&65535)<<2)>>2]=e;if((i[t[57]>>1]|0)!=46){e=t[61]|0;t[61]=e+2;r=w(1)|0;v(f,t[61]|0,0,e);e=t[51]|0;a=t[60]|0;f=i[378]|0;i[378]=f+1<<16>>16;t[a+((f&65535)<<2)>>2]=e;switch(r<<16>>16){case 39:{d(39);break}case 34:{d(34);break}default:{t[61]=(t[61]|0)+-2;break e}}e=(t[61]|0)+2|0;t[61]=e;switch((w(1)|0)<<16>>16){case 44:{t[61]=(t[61]|0)+2;w(1)|0;r=t[51]|0;t[r+4>>2]=e;f=t[61]|0;t[r+16>>2]=f;s[r+24>>0]=1;t[61]=f+-2;break e}case 41:{i[379]=(i[379]|0)+-1<<16>>16;f=t[51]|0;t[f+4>>2]=e;t[f+12>>2]=(t[61]|0)+2;s[f+24>>0]=1;i[378]=(i[378]|0)+-1<<16>>16;break e}default:{t[61]=(t[61]|0)+-2;break e}}}break}case 46:{t[61]=(t[61]|0)+2;if(((w(1)|0)<<16>>16==109?(e=t[61]|0,(m(e+2|0,44,6)|0)==0):0)?(i[t[57]>>1]|0)!=46:0)v(f,f,e+8|0,2);break}case 42:case 39:case 34:{c=16;break}case 123:{e=t[61]|0;if(i[379]|0){t[61]=e+-2;break e}while(1){if(e>>>0>=(t[62]|0)>>>0)break;e=w(1)|0;if(!(N(e)|0)){if(e<<16>>16==125){c=31;break}}else d(e);e=(t[61]|0)+2|0;t[61]=e;}if((c|0)==31)t[61]=(t[61]|0)+2;w(1)|0;e=t[61]|0;if(m(e,50,8)|0){L();break e}t[61]=e+8;e=w(1)|0;if(N(e)|0){u(f,e);break e}else {L();break e}}default:if((t[61]|0)!=(a|0))c=16;}}while(0);do{if((c|0)==16){if(i[379]|0){t[61]=(t[61]|0)+-2;break}e=t[62]|0;a=t[61]|0;while(1){if(a>>>0>=e>>>0){c=23;break}r=i[a>>1]|0;if(N(r)|0){c=21;break}c=a+2|0;t[61]=c;a=c;}if((c|0)==21){u(f,r);break}else if((c|0)==23){L();break}}}while(0);return}function u(e,a){e=e|0;a=a|0;var r=0,s=0;r=(t[61]|0)+2|0;switch(a<<16>>16){case 39:{d(39);s=5;break}case 34:{d(34);s=5;break}default:L();}do{if((s|0)==5){v(e,r,t[61]|0,1);t[61]=(t[61]|0)+2;s=(w(0)|0)<<16>>16==97;a=t[61]|0;if(s?(m(a+2|0,58,10)|0)==0:0){t[61]=a+12;if((w(1)|0)<<16>>16!=123){t[61]=a;break}e=t[61]|0;r=e;e:while(1){t[61]=r+2;r=w(1)|0;switch(r<<16>>16){case 39:{d(39);t[61]=(t[61]|0)+2;r=w(1)|0;break}case 34:{d(34);t[61]=(t[61]|0)+2;r=w(1)|0;break}default:r=E(r)|0;}if(r<<16>>16!=58){s=16;break}t[61]=(t[61]|0)+2;switch((w(1)|0)<<16>>16){case 39:{d(39);break}case 34:{d(34);break}default:{s=20;break e}}t[61]=(t[61]|0)+2;switch((w(1)|0)<<16>>16){case 125:{s=25;break e}case 44:break;default:{s=24;break e}}t[61]=(t[61]|0)+2;if((w(1)|0)<<16>>16==125){s=25;break}r=t[61]|0;}if((s|0)==16){t[61]=a;break}else if((s|0)==20){t[61]=a;break}else if((s|0)==24){t[61]=a;break}else if((s|0)==25){s=t[51]|0;t[s+16>>2]=e;t[s+12>>2]=(t[61]|0)+2;break}}t[61]=a+-2;}}while(0);return}function o(e){e=e|0;e:do{switch(i[e>>1]|0){case 100:switch(i[e+-2>>1]|0){case 105:{e=S(e+-4|0,68,2)|0;break e}case 108:{e=S(e+-4|0,72,3)|0;break e}default:{e=0;break e}}case 101:{switch(i[e+-2>>1]|0){case 115:break;case 116:{e=S(e+-4|0,78,4)|0;break e}default:{e=0;break e}}switch(i[e+-4>>1]|0){case 108:{e=O(e+-6|0,101)|0;break e}case 97:{e=O(e+-6|0,99)|0;break e}default:{e=0;break e}}}case 102:{if((i[e+-2>>1]|0)==111?(i[e+-4>>1]|0)==101:0)switch(i[e+-6>>1]|0){case 99:{e=S(e+-8|0,86,6)|0;break e}case 112:{e=S(e+-8|0,98,2)|0;break e}default:{e=0;break e}}else e=0;break}case 110:{e=e+-2|0;if(O(e,105)|0)e=1;else e=S(e,102,5)|0;break}case 111:{e=O(e+-2|0,100)|0;break}case 114:{e=S(e+-2|0,112,7)|0;break}case 116:{e=S(e+-2|0,126,4)|0;break}case 119:switch(i[e+-2>>1]|0){case 101:{e=O(e+-4|0,110)|0;break e}case 111:{e=S(e+-4|0,134,3)|0;break e}default:{e=0;break e}}default:e=0;}}while(0);return e|0}function h(){var e=0,a=0,r=0;a=t[62]|0;r=t[61]|0;e:while(1){e=r+2|0;if(r>>>0>=a>>>0){a=8;break}switch(i[e>>1]|0){case 96:{a=9;break e}case 36:{if((i[r+4>>1]|0)==123){a=6;break e}break}case 92:{e=r+4|0;break}default:{}}r=e;}if((a|0)==6){t[61]=r+4;e=i[380]|0;a=t[58]|0;r=i[377]|0;i[377]=r+1<<16>>16;i[a+((r&65535)<<1)>>1]=e;r=(i[379]|0)+1<<16>>16;i[379]=r;i[380]=r;}else if((a|0)==8){t[61]=e;L();}else if((a|0)==9)t[61]=e;return}function w(e){e=e|0;var a=0,r=0,s=0;r=t[61]|0;e:do{a=i[r>>1]|0;a:do{if(a<<16>>16!=47)if(e)if(M(a)|0)break;else break e;else if(z(a)|0)break;else break e;else switch(i[r+2>>1]|0){case 47:{j();break a}case 42:{y(e);break a}default:{a=47;break e}}}while(0);s=t[61]|0;r=s+2|0;t[61]=r;}while(s>>>0<(t[62]|0)>>>0);return a|0}function d(e){e=e|0;var a=0,r=0,s=0,c=0;c=t[62]|0;a=t[61]|0;while(1){s=a+2|0;if(a>>>0>=c>>>0){a=9;break}r=i[s>>1]|0;if(r<<16>>16==e<<16>>16){a=10;break}if(r<<16>>16==92){r=a+4|0;if((i[r>>1]|0)==13){a=a+6|0;a=(i[a>>1]|0)==10?a:r;}else a=r;}else if(T(r)|0){a=9;break}else a=s;}if((a|0)==9){t[61]=s;L();}else if((a|0)==10)t[61]=s;return}function v(e,a,r,i){e=e|0;a=a|0;r=r|0;i=i|0;var c=0,f=0;c=t[55]|0;t[55]=c+32;f=t[51]|0;t[((f|0)==0?188:f+28|0)>>2]=c;t[52]=f;t[51]=c;t[c+8>>2]=e;if(2==(i|0))e=r;else e=1==(i|0)?r+2|0:0;t[c+12>>2]=e;t[c>>2]=a;t[c+4>>2]=r;t[c+16>>2]=0;t[c+20>>2]=i;s[c+24>>0]=1==(i|0)&1;t[c+28>>2]=0;return}function A(){var e=0,a=0,r=0;r=t[62]|0;a=t[61]|0;e:while(1){e=a+2|0;if(a>>>0>=r>>>0){a=6;break}switch(i[e>>1]|0){case 13:case 10:{a=6;break e}case 93:{a=7;break e}case 92:{e=a+4|0;break}default:{}}a=e;}if((a|0)==6){t[61]=e;L();e=0;}else if((a|0)==7){t[61]=e;e=93;}return e|0}function C(e,a){e=e|0;a=a|0;var r=0,s=0;r=t[61]|0;s=i[r>>1]|0;if(s<<16>>16==97){t[61]=r+4;r=w(1)|0;e=t[61]|0;if(N(r)|0){d(r);a=(t[61]|0)+2|0;t[61]=a;}else {E(r)|0;a=t[61]|0;}s=w(1)|0;r=t[61]|0;}if((r|0)!=(e|0))B(e,a);return s|0}function g(){var e=0,a=0,r=0;e:while(1){e=t[61]|0;a=e+2|0;t[61]=a;if(e>>>0>=(t[62]|0)>>>0){r=7;break}switch(i[a>>1]|0){case 13:case 10:{r=7;break e}case 47:break e;case 91:{A()|0;break}case 92:{t[61]=e+4;break}default:{}}}if((r|0)==7)L();return}function p(e){e=e|0;switch(i[e>>1]|0){case 62:{e=(i[e+-2>>1]|0)==61;break}case 41:case 59:{e=1;break}case 104:{e=S(e+-2|0,160,4)|0;break}case 121:{e=S(e+-2|0,168,6)|0;break}case 101:{e=S(e+-2|0,180,3)|0;break}default:e=0;}return e|0}function y(e){e=e|0;var a=0,r=0,s=0,c=0,f=0;c=(t[61]|0)+2|0;t[61]=c;r=t[62]|0;while(1){a=c+2|0;if(c>>>0>=r>>>0)break;s=i[a>>1]|0;if(!e?T(s)|0:0)break;if(s<<16>>16==42?(i[c+4>>1]|0)==47:0){f=8;break}c=a;}if((f|0)==8){t[61]=a;a=c+4|0;}t[61]=a;return}function m(e,a,r){e=e|0;a=a|0;r=r|0;var i=0,t=0;e:do{if(!r)e=0;else {while(1){i=s[e>>0]|0;t=s[a>>0]|0;if(i<<24>>24!=t<<24>>24)break;r=r+-1|0;if(!r){e=0;break e}else {e=e+1|0;a=a+1|0;}}e=(i&255)-(t&255)|0;}}while(0);return e|0}function I(e){e=e|0;e:do{switch(e<<16>>16){case 38:case 37:case 33:{e=1;break}default:if((e&-8)<<16>>16==40|(e+-58&65535)<6)e=1;else {switch(e<<16>>16){case 91:case 93:case 94:{e=1;break e}default:{}}e=(e+-123&65535)<4;}}}while(0);return e|0}function U(e){e=e|0;e:do{switch(e<<16>>16){case 38:case 37:case 33:break;default:if(!((e+-58&65535)<6|(e+-40&65535)<7&e<<16>>16!=41)){switch(e<<16>>16){case 91:case 94:break e;default:{}}return e<<16>>16!=125&(e+-123&65535)<4|0}}}while(0);return 1}function x(e){e=e|0;var a=0,r=0,s=0,c=0;r=n;n=n+16|0;s=r;t[s>>2]=0;t[54]=e;a=t[3]|0;c=a+(e<<1)|0;e=c+2|0;i[c>>1]=0;t[s>>2]=e;t[55]=e;t[47]=0;t[51]=0;t[49]=0;t[48]=0;t[53]=0;t[50]=0;n=r;return a|0}function S(e,a,r){e=e|0;a=a|0;r=r|0;var s=0,c=0;s=e+(0-r<<1)|0;c=s+2|0;e=t[3]|0;if(c>>>0>=e>>>0?(m(c,a,r<<1)|0)==0:0)if((c|0)==(e|0))e=1;else e=$(i[s>>1]|0)|0;else e=0;return e|0}function O(e,a){e=e|0;a=a|0;var r=0;r=t[3]|0;if(r>>>0<=e>>>0?(i[e>>1]|0)==a<<16>>16:0)if((r|0)==(e|0))r=1;else r=$(i[e+-2>>1]|0)|0;else r=0;return r|0}function $(e){e=e|0;e:do{if((e+-9&65535)<5)e=1;else {switch(e<<16>>16){case 32:case 160:{e=1;break e}default:{}}e=e<<16>>16!=46&(I(e)|0);}}while(0);return e|0}function j(){var e=0,a=0,r=0;e=t[62]|0;r=t[61]|0;e:while(1){a=r+2|0;if(r>>>0>=e>>>0)break;switch(i[a>>1]|0){case 13:case 10:break e;default:r=a;}}t[61]=a;return}function B(e,a){e=e|0;a=a|0;var r=0,s=0;r=t[55]|0;t[55]=r+12;s=t[53]|0;t[((s|0)==0?192:s+8|0)>>2]=r;t[53]=r;t[r>>2]=e;t[r+4>>2]=a;t[r+8>>2]=0;return}function E(e){e=e|0;while(1){if(M(e)|0)break;if(I(e)|0)break;e=(t[61]|0)+2|0;t[61]=e;e=i[e>>1]|0;if(!(e<<16>>16)){e=0;break}}return e|0}function P(){var e=0;e=t[(t[49]|0)+20>>2]|0;switch(e|0){case 1:{e=-1;break}case 2:{e=-2;break}default:e=e-(t[3]|0)>>1;}return e|0}function q(e){e=e|0;if(!(S(e,140,5)|0)?!(S(e,150,3)|0):0)e=S(e,156,2)|0;else e=1;return e|0}function z(e){e=e|0;switch(e<<16>>16){case 160:case 32:case 12:case 11:case 9:{e=1;break}default:e=0;}return e|0}function D(e){e=e|0;if((t[3]|0)==(e|0))e=1;else e=$(i[e+-2>>1]|0)|0;return e|0}function F(){var e=0;e=t[(t[49]|0)+12>>2]|0;if(!e)e=-1;else e=e-(t[3]|0)>>1;return e|0}function G(){var e=0;e=t[(t[49]|0)+16>>2]|0;if(!e)e=-1;else e=e-(t[3]|0)>>1;return e|0}function H(){var e=0;e=t[(t[49]|0)+4>>2]|0;if(!e)e=-1;else e=e-(t[3]|0)>>1;return e|0}function J(){var e=0;e=t[49]|0;e=t[((e|0)==0?188:e+28|0)>>2]|0;t[49]=e;return (e|0)!=0|0}function K(){var e=0;e=t[50]|0;e=t[((e|0)==0?192:e+8|0)>>2]|0;t[50]=e;return (e|0)!=0|0}function L(){s[762]=1;t[56]=(t[61]|0)-(t[3]|0)>>1;t[61]=(t[62]|0)+2;return}function M(e){e=e|0;return (e|128)<<16>>16==160|(e+-9&65535)<5|0}function N(e){e=e|0;return e<<16>>16==39|e<<16>>16==34|0}function Q(){return (t[(t[49]|0)+8>>2]|0)-(t[3]|0)>>1|0}function R(){return (t[(t[50]|0)+4>>2]|0)-(t[3]|0)>>1|0}function T(e){e=e|0;return e<<16>>16==13|e<<16>>16==10|0}function V(){return (t[t[49]>>2]|0)-(t[3]|0)>>1|0}function W(){return (t[t[50]>>2]|0)-(t[3]|0)>>1|0}function X(){return c[(t[49]|0)+24>>0]|0|0}function Y(e){e=e|0;t[3]=e;return}function Z(){return (s[763]|0)!=0|0}function _(){return t[56]|0}function ee(e){e=e|0;n=e+992+15&-16;return 992}return {su:ee,ai:G,e:_,ee:R,es:W,f:Z,id:P,ie:H,ip:X,is:V,p:b,re:K,ri:J,sa:x,se:F,ses:Y,ss:Q}}("undefined"!=typeof self?self:global,{},a),r=e.su(s-(2<<17));}const h=c.length+1;e.ses(r),e.sa(h-1),i$1(c,new Uint16Array(a,r,h)),e.p()||(n$1=e.e(),o());const w=[],d=[];for(;e.ri();){const a=e.is(),r=e.ie(),s=e.ai(),i=e.id(),t=e.ss(),f=e.se();let n;e.ip()&&(n=b(-1===i?a:a+1,c.charCodeAt(-1===i?a-1:a))),w.push({n:n,s:a,e:r,ss:t,se:f,d:i,a:s});}for(;e.re();){const a=e.es(),r=c.charCodeAt(a);d.push(34===r||39===r?b(a+1,r):c.slice(e.es(),e.ee()));}return [w,d,!!e.f()]}function b(e,a){n$1=e;let r="",s=n$1;for(;;){n$1>=c.length&&o();const e=c.charCodeAt(n$1);if(e===a)break;92===e?(r+=c.slice(s,n$1),r+=k(),s=n$1):(8232===e||8233===e||u(e)&&o(),++n$1);}return r+=c.slice(s,n$1++),r}function k(){let e=c.charCodeAt(++n$1);switch(++n$1,e){case 110:return "\n";case 114:return "\r";case 120:return String.fromCharCode(l(2));case 117:return function(){let e;123===c.charCodeAt(n$1)?(++n$1,e=l(c.indexOf("}",n$1)-n$1),++n$1,e>1114111&&o()):e=l(4);return e<=65535?String.fromCharCode(e):(e-=65536,String.fromCharCode(55296+(e>>10),56320+(1023&e)))}();case 116:return "\t";case 98:return "\b";case 118:return "\v";case 102:return "\f";case 13:10===c.charCodeAt(n$1)&&++n$1;case 10:return "";case 56:case 57:o();default:if(e>=48&&e<=55){let a=c.substr(n$1-1,3).match(/^[0-7]+/)[0],r=parseInt(a,8);return r>255&&(a=a.slice(0,-1),r=parseInt(a,8)),n$1+=a.length-1,e=c.charCodeAt(n$1),"0"===a&&56!==e&&57!==e||o(),String.fromCharCode(r)}return u(e)?"":String.fromCharCode(e)}}function l(e){const a=n$1;let r=0,s=0;for(let a=0;a<e;++a,++n$1){let e,i=c.charCodeAt(n$1);if(95!==i){if(i>=97)e=i-97+10;else if(i>=65)e=i-65+10;else {if(!(i>=48&&i<=57))break;e=i-48;}if(e>=16)break;s=i,r=16*r+e;}else 95!==s&&0!==a||o(),s=i;}return 95!==s&&n$1-a===e||o(),r}function u(e){return 13===e||10===e}function o(){throw Object.assign(Error(`Parse error ${f}:${c.slice(0,n$1).split("\n").length}:${n$1-c.lastIndexOf("\n",n$1-1)}`),{idx:n$1})}

var charToInteger = {};
var chars$1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
for (var i = 0; i < chars$1.length; i++) {
    charToInteger[chars$1.charCodeAt(i)] = i;
}
function encode$1(decoded) {
    var sourceFileIndex = 0; // second field
    var sourceCodeLine = 0; // third field
    var sourceCodeColumn = 0; // fourth field
    var nameIndex = 0; // fifth field
    var mappings = '';
    for (var i = 0; i < decoded.length; i++) {
        var line = decoded[i];
        if (i > 0)
            mappings += ';';
        if (line.length === 0)
            continue;
        var generatedCodeColumn = 0; // first field
        var lineMappings = [];
        for (var _i = 0, line_1 = line; _i < line_1.length; _i++) {
            var segment = line_1[_i];
            var segmentMappings = encodeInteger$1(segment[0] - generatedCodeColumn);
            generatedCodeColumn = segment[0];
            if (segment.length > 1) {
                segmentMappings +=
                    encodeInteger$1(segment[1] - sourceFileIndex) +
                        encodeInteger$1(segment[2] - sourceCodeLine) +
                        encodeInteger$1(segment[3] - sourceCodeColumn);
                sourceFileIndex = segment[1];
                sourceCodeLine = segment[2];
                sourceCodeColumn = segment[3];
            }
            if (segment.length === 5) {
                segmentMappings += encodeInteger$1(segment[4] - nameIndex);
                nameIndex = segment[4];
            }
            lineMappings.push(segmentMappings);
        }
        mappings += lineMappings.join(',');
    }
    return mappings;
}
function encodeInteger$1(num) {
    var result = '';
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        var clamped = num & 31;
        num >>>= 5;
        if (num > 0) {
            clamped |= 32;
        }
        result += chars$1[clamped];
    } while (num > 0);
    return result;
}

class BitSet {
	constructor(arg) {
		this.bits = arg instanceof BitSet ? arg.bits.slice() : [];
	}

	add(n) {
		this.bits[n >> 5] |= 1 << (n & 31);
	}

	has(n) {
		return !!(this.bits[n >> 5] & (1 << (n & 31)));
	}
}

class Chunk {
	constructor(start, end, content) {
		this.start = start;
		this.end = end;
		this.original = content;

		this.intro = '';
		this.outro = '';

		this.content = content;
		this.storeName = false;
		this.edited = false;

		// we make these non-enumerable, for sanity while debugging
		Object.defineProperties(this, {
			previous: { writable: true, value: null },
			next: { writable: true, value: null },
		});
	}

	appendLeft(content) {
		this.outro += content;
	}

	appendRight(content) {
		this.intro = this.intro + content;
	}

	clone() {
		const chunk = new Chunk(this.start, this.end, this.original);

		chunk.intro = this.intro;
		chunk.outro = this.outro;
		chunk.content = this.content;
		chunk.storeName = this.storeName;
		chunk.edited = this.edited;

		return chunk;
	}

	contains(index) {
		return this.start < index && index < this.end;
	}

	eachNext(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.next;
		}
	}

	eachPrevious(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.previous;
		}
	}

	edit(content, storeName, contentOnly) {
		this.content = content;
		if (!contentOnly) {
			this.intro = '';
			this.outro = '';
		}
		this.storeName = storeName;

		this.edited = true;

		return this;
	}

	prependLeft(content) {
		this.outro = content + this.outro;
	}

	prependRight(content) {
		this.intro = content + this.intro;
	}

	split(index) {
		const sliceIndex = index - this.start;

		const originalBefore = this.original.slice(0, sliceIndex);
		const originalAfter = this.original.slice(sliceIndex);

		this.original = originalBefore;

		const newChunk = new Chunk(index, this.end, originalAfter);
		newChunk.outro = this.outro;
		this.outro = '';

		this.end = index;

		if (this.edited) {
			// TODO is this block necessary?...
			newChunk.edit('', false);
			this.content = '';
		} else {
			this.content = originalBefore;
		}

		newChunk.next = this.next;
		if (newChunk.next) newChunk.next.previous = newChunk;
		newChunk.previous = this;
		this.next = newChunk;

		return newChunk;
	}

	toString() {
		return this.intro + this.content + this.outro;
	}

	trimEnd(rx) {
		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				this.split(this.start + trimmed.length).edit('', undefined, true);
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.intro = this.intro.replace(rx, '');
			if (this.intro.length) return true;
		}
	}

	trimStart(rx) {
		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				this.split(this.end - trimmed.length);
				this.edit('', undefined, true);
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.outro = this.outro.replace(rx, '');
			if (this.outro.length) return true;
		}
	}
}

let btoa = () => {
	throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
};
if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
	btoa = (str) => window.btoa(unescape(encodeURIComponent(str)));
} else if (typeof Buffer === 'function') {
	btoa = (str) => Buffer.from(str, 'utf-8').toString('base64');
}

class SourceMap$1 {
	constructor(properties) {
		this.version = 3;
		this.file = properties.file;
		this.sources = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names = properties.names;
		this.mappings = encode$1(properties.mappings);
	}

	toString() {
		return JSON.stringify(this);
	}

	toUrl() {
		return 'data:application/json;charset=utf-8;base64,' + btoa(this.toString());
	}
}

function guessIndent(code) {
	const lines = code.split('\n');

	const tabbed = lines.filter((line) => /^\t+/.test(line));
	const spaced = lines.filter((line) => /^ {2,}/.test(line));

	if (tabbed.length === 0 && spaced.length === 0) {
		return null;
	}

	// More lines tabbed than spaced? Assume tabs, and
	// default to tabs in the case of a tie (or nothing
	// to go on)
	if (tabbed.length >= spaced.length) {
		return '\t';
	}

	// Otherwise, we need to guess the multiple
	const min = spaced.reduce((previous, current) => {
		const numSpaces = /^ +/.exec(current)[0].length;
		return Math.min(numSpaces, previous);
	}, Infinity);

	return new Array(min + 1).join(' ');
}

function getRelativePath(from, to) {
	const fromParts = from.split(/[/\\]/);
	const toParts = to.split(/[/\\]/);

	fromParts.pop(); // get dirname

	while (fromParts[0] === toParts[0]) {
		fromParts.shift();
		toParts.shift();
	}

	if (fromParts.length) {
		let i = fromParts.length;
		while (i--) fromParts[i] = '..';
	}

	return fromParts.concat(toParts).join('/');
}

const toString = Object.prototype.toString;

function isObject(thing) {
	return toString.call(thing) === '[object Object]';
}

function getLocator(source) {
	const originalLines = source.split('\n');
	const lineOffsets = [];

	for (let i = 0, pos = 0; i < originalLines.length; i++) {
		lineOffsets.push(pos);
		pos += originalLines[i].length + 1;
	}

	return function locate(index) {
		let i = 0;
		let j = lineOffsets.length;
		while (i < j) {
			const m = (i + j) >> 1;
			if (index < lineOffsets[m]) {
				j = m;
			} else {
				i = m + 1;
			}
		}
		const line = i - 1;
		const column = index - lineOffsets[line];
		return { line, column };
	};
}

class Mappings {
	constructor(hires) {
		this.hires = hires;
		this.generatedCodeLine = 0;
		this.generatedCodeColumn = 0;
		this.raw = [];
		this.rawSegments = this.raw[this.generatedCodeLine] = [];
		this.pending = null;
	}

	addEdit(sourceIndex, content, loc, nameIndex) {
		if (content.length) {
			const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
			if (nameIndex >= 0) {
				segment.push(nameIndex);
			}
			this.rawSegments.push(segment);
		} else if (this.pending) {
			this.rawSegments.push(this.pending);
		}

		this.advance(content);
		this.pending = null;
	}

	addUneditedChunk(sourceIndex, chunk, original, loc, sourcemapLocations) {
		let originalCharIndex = chunk.start;
		let first = true;

		while (originalCharIndex < chunk.end) {
			if (this.hires || first || sourcemapLocations.has(originalCharIndex)) {
				this.rawSegments.push([this.generatedCodeColumn, sourceIndex, loc.line, loc.column]);
			}

			if (original[originalCharIndex] === '\n') {
				loc.line += 1;
				loc.column = 0;
				this.generatedCodeLine += 1;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
				this.generatedCodeColumn = 0;
				first = true;
			} else {
				loc.column += 1;
				this.generatedCodeColumn += 1;
				first = false;
			}

			originalCharIndex += 1;
		}

		this.pending = null;
	}

	advance(str) {
		if (!str) return;

		const lines = str.split('\n');

		if (lines.length > 1) {
			for (let i = 0; i < lines.length - 1; i++) {
				this.generatedCodeLine++;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
			}
			this.generatedCodeColumn = 0;
		}

		this.generatedCodeColumn += lines[lines.length - 1].length;
	}
}

const n = '\n';

const warned = {
	insertLeft: false,
	insertRight: false,
	storeName: false,
};

class MagicString {
	constructor(string, options = {}) {
		const chunk = new Chunk(0, string.length, string);

		Object.defineProperties(this, {
			original: { writable: true, value: string },
			outro: { writable: true, value: '' },
			intro: { writable: true, value: '' },
			firstChunk: { writable: true, value: chunk },
			lastChunk: { writable: true, value: chunk },
			lastSearchedChunk: { writable: true, value: chunk },
			byStart: { writable: true, value: {} },
			byEnd: { writable: true, value: {} },
			filename: { writable: true, value: options.filename },
			indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
			sourcemapLocations: { writable: true, value: new BitSet() },
			storedNames: { writable: true, value: {} },
			indentStr: { writable: true, value: guessIndent(string) },
		});

		this.byStart[0] = chunk;
		this.byEnd[string.length] = chunk;
	}

	addSourcemapLocation(char) {
		this.sourcemapLocations.add(char);
	}

	append(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.outro += content;
		return this;
	}

	appendLeft(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.appendLeft(content);
		} else {
			this.intro += content;
		}
		return this;
	}

	appendRight(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.appendRight(content);
		} else {
			this.outro += content;
		}
		return this;
	}

	clone() {
		const cloned = new MagicString(this.original, { filename: this.filename });

		let originalChunk = this.firstChunk;
		let clonedChunk = (cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone());

		while (originalChunk) {
			cloned.byStart[clonedChunk.start] = clonedChunk;
			cloned.byEnd[clonedChunk.end] = clonedChunk;

			const nextOriginalChunk = originalChunk.next;
			const nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

			if (nextClonedChunk) {
				clonedChunk.next = nextClonedChunk;
				nextClonedChunk.previous = clonedChunk;

				clonedChunk = nextClonedChunk;
			}

			originalChunk = nextOriginalChunk;
		}

		cloned.lastChunk = clonedChunk;

		if (this.indentExclusionRanges) {
			cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
		}

		cloned.sourcemapLocations = new BitSet(this.sourcemapLocations);

		cloned.intro = this.intro;
		cloned.outro = this.outro;

		return cloned;
	}

	generateDecodedMap(options) {
		options = options || {};

		const sourceIndex = 0;
		const names = Object.keys(this.storedNames);
		const mappings = new Mappings(options.hires);

		const locate = getLocator(this.original);

		if (this.intro) {
			mappings.advance(this.intro);
		}

		this.firstChunk.eachNext((chunk) => {
			const loc = locate(chunk.start);

			if (chunk.intro.length) mappings.advance(chunk.intro);

			if (chunk.edited) {
				mappings.addEdit(
					sourceIndex,
					chunk.content,
					loc,
					chunk.storeName ? names.indexOf(chunk.original) : -1
				);
			} else {
				mappings.addUneditedChunk(sourceIndex, chunk, this.original, loc, this.sourcemapLocations);
			}

			if (chunk.outro.length) mappings.advance(chunk.outro);
		});

		return {
			file: options.file ? options.file.split(/[/\\]/).pop() : null,
			sources: [options.source ? getRelativePath(options.file || '', options.source) : null],
			sourcesContent: options.includeContent ? [this.original] : [null],
			names,
			mappings: mappings.raw,
		};
	}

	generateMap(options) {
		return new SourceMap$1(this.generateDecodedMap(options));
	}

	getIndentString() {
		return this.indentStr === null ? '\t' : this.indentStr;
	}

	indent(indentStr, options) {
		const pattern = /^[^\r\n]/gm;

		if (isObject(indentStr)) {
			options = indentStr;
			indentStr = undefined;
		}

		indentStr = indentStr !== undefined ? indentStr : this.indentStr || '\t';

		if (indentStr === '') return this; // noop

		options = options || {};

		// Process exclusion ranges
		const isExcluded = {};

		if (options.exclude) {
			const exclusions =
				typeof options.exclude[0] === 'number' ? [options.exclude] : options.exclude;
			exclusions.forEach((exclusion) => {
				for (let i = exclusion[0]; i < exclusion[1]; i += 1) {
					isExcluded[i] = true;
				}
			});
		}

		let shouldIndentNextCharacter = options.indentStart !== false;
		const replacer = (match) => {
			if (shouldIndentNextCharacter) return `${indentStr}${match}`;
			shouldIndentNextCharacter = true;
			return match;
		};

		this.intro = this.intro.replace(pattern, replacer);

		let charIndex = 0;
		let chunk = this.firstChunk;

		while (chunk) {
			const end = chunk.end;

			if (chunk.edited) {
				if (!isExcluded[charIndex]) {
					chunk.content = chunk.content.replace(pattern, replacer);

					if (chunk.content.length) {
						shouldIndentNextCharacter = chunk.content[chunk.content.length - 1] === '\n';
					}
				}
			} else {
				charIndex = chunk.start;

				while (charIndex < end) {
					if (!isExcluded[charIndex]) {
						const char = this.original[charIndex];

						if (char === '\n') {
							shouldIndentNextCharacter = true;
						} else if (char !== '\r' && shouldIndentNextCharacter) {
							shouldIndentNextCharacter = false;

							if (charIndex === chunk.start) {
								chunk.prependRight(indentStr);
							} else {
								this._splitChunk(chunk, charIndex);
								chunk = chunk.next;
								chunk.prependRight(indentStr);
							}
						}
					}

					charIndex += 1;
				}
			}

			charIndex = chunk.end;
			chunk = chunk.next;
		}

		this.outro = this.outro.replace(pattern, replacer);

		return this;
	}

	insert() {
		throw new Error(
			'magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)'
		);
	}

	insertLeft(index, content) {
		if (!warned.insertLeft) {
			console.warn(
				'magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead'
			); // eslint-disable-line no-console
			warned.insertLeft = true;
		}

		return this.appendLeft(index, content);
	}

	insertRight(index, content) {
		if (!warned.insertRight) {
			console.warn(
				'magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead'
			); // eslint-disable-line no-console
			warned.insertRight = true;
		}

		return this.prependRight(index, content);
	}

	move(start, end, index) {
		if (index >= start && index <= end) throw new Error('Cannot move a selection inside itself');

		this._split(start);
		this._split(end);
		this._split(index);

		const first = this.byStart[start];
		const last = this.byEnd[end];

		const oldLeft = first.previous;
		const oldRight = last.next;

		const newRight = this.byStart[index];
		if (!newRight && last === this.lastChunk) return this;
		const newLeft = newRight ? newRight.previous : this.lastChunk;

		if (oldLeft) oldLeft.next = oldRight;
		if (oldRight) oldRight.previous = oldLeft;

		if (newLeft) newLeft.next = first;
		if (newRight) newRight.previous = last;

		if (!first.previous) this.firstChunk = last.next;
		if (!last.next) {
			this.lastChunk = first.previous;
			this.lastChunk.next = null;
		}

		first.previous = newLeft;
		last.next = newRight || null;

		if (!newLeft) this.firstChunk = first;
		if (!newRight) this.lastChunk = last;
		return this;
	}

	overwrite(start, end, content, options) {
		if (typeof content !== 'string') throw new TypeError('replacement content must be a string');

		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		if (end > this.original.length) throw new Error('end is out of bounds');
		if (start === end)
			throw new Error(
				'Cannot overwrite a zero-length range – use appendLeft or prependRight instead'
			);

		this._split(start);
		this._split(end);

		if (options === true) {
			if (!warned.storeName) {
				console.warn(
					'The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string'
				); // eslint-disable-line no-console
				warned.storeName = true;
			}

			options = { storeName: true };
		}
		const storeName = options !== undefined ? options.storeName : false;
		const contentOnly = options !== undefined ? options.contentOnly : false;

		if (storeName) {
			const original = this.original.slice(start, end);
			Object.defineProperty(this.storedNames, original, {
				writable: true,
				value: true,
				enumerable: true,
			});
		}

		const first = this.byStart[start];
		const last = this.byEnd[end];

		if (first) {
			let chunk = first;
			while (chunk !== last) {
				if (chunk.next !== this.byStart[chunk.end]) {
					throw new Error('Cannot overwrite across a split point');
				}
				chunk = chunk.next;
				chunk.edit('', false);
			}

			first.edit(content, storeName, contentOnly);
		} else {
			// must be inserting at the end
			const newChunk = new Chunk(start, end, '').edit(content, storeName);

			// TODO last chunk in the array may not be the last chunk, if it's moved...
			last.next = newChunk;
			newChunk.previous = last;
		}
		return this;
	}

	prepend(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.intro = content + this.intro;
		return this;
	}

	prependLeft(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.prependLeft(content);
		} else {
			this.intro = content + this.intro;
		}
		return this;
	}

	prependRight(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.prependRight(content);
		} else {
			this.outro = content + this.outro;
		}
		return this;
	}

	remove(start, end) {
		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		if (start === end) return this;

		if (start < 0 || end > this.original.length) throw new Error('Character is out of bounds');
		if (start > end) throw new Error('end must be greater than start');

		this._split(start);
		this._split(end);

		let chunk = this.byStart[start];

		while (chunk) {
			chunk.intro = '';
			chunk.outro = '';
			chunk.edit('');

			chunk = end > chunk.end ? this.byStart[chunk.end] : null;
		}
		return this;
	}

	lastChar() {
		if (this.outro.length) return this.outro[this.outro.length - 1];
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length) return chunk.outro[chunk.outro.length - 1];
			if (chunk.content.length) return chunk.content[chunk.content.length - 1];
			if (chunk.intro.length) return chunk.intro[chunk.intro.length - 1];
		} while ((chunk = chunk.previous));
		if (this.intro.length) return this.intro[this.intro.length - 1];
		return '';
	}

	lastLine() {
		let lineIndex = this.outro.lastIndexOf(n);
		if (lineIndex !== -1) return this.outro.substr(lineIndex + 1);
		let lineStr = this.outro;
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length > 0) {
				lineIndex = chunk.outro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.outro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.outro + lineStr;
			}

			if (chunk.content.length > 0) {
				lineIndex = chunk.content.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.content.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.content + lineStr;
			}

			if (chunk.intro.length > 0) {
				lineIndex = chunk.intro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.intro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.intro + lineStr;
			}
		} while ((chunk = chunk.previous));
		lineIndex = this.intro.lastIndexOf(n);
		if (lineIndex !== -1) return this.intro.substr(lineIndex + 1) + lineStr;
		return this.intro + lineStr;
	}

	slice(start = 0, end = this.original.length) {
		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		let result = '';

		// find start chunk
		let chunk = this.firstChunk;
		while (chunk && (chunk.start > start || chunk.end <= start)) {
			// found end chunk before start
			if (chunk.start < end && chunk.end >= end) {
				return result;
			}

			chunk = chunk.next;
		}

		if (chunk && chunk.edited && chunk.start !== start)
			throw new Error(`Cannot use replaced character ${start} as slice start anchor.`);

		const startChunk = chunk;
		while (chunk) {
			if (chunk.intro && (startChunk !== chunk || chunk.start === start)) {
				result += chunk.intro;
			}

			const containsEnd = chunk.start < end && chunk.end >= end;
			if (containsEnd && chunk.edited && chunk.end !== end)
				throw new Error(`Cannot use replaced character ${end} as slice end anchor.`);

			const sliceStart = startChunk === chunk ? start - chunk.start : 0;
			const sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

			result += chunk.content.slice(sliceStart, sliceEnd);

			if (chunk.outro && (!containsEnd || chunk.end === end)) {
				result += chunk.outro;
			}

			if (containsEnd) {
				break;
			}

			chunk = chunk.next;
		}

		return result;
	}

	// TODO deprecate this? not really very useful
	snip(start, end) {
		const clone = this.clone();
		clone.remove(0, start);
		clone.remove(end, clone.original.length);

		return clone;
	}

	_split(index) {
		if (this.byStart[index] || this.byEnd[index]) return;

		let chunk = this.lastSearchedChunk;
		const searchForward = index > chunk.end;

		while (chunk) {
			if (chunk.contains(index)) return this._splitChunk(chunk, index);

			chunk = searchForward ? this.byStart[chunk.end] : this.byEnd[chunk.start];
		}
	}

	_splitChunk(chunk, index) {
		if (chunk.edited && chunk.content.length) {
			// zero-length edited chunks are a special case (overlapping replacements)
			const loc = getLocator(this.original)(index);
			throw new Error(
				`Cannot split a chunk that has already been edited (${loc.line}:${loc.column} – "${chunk.original}")`
			);
		}

		const newChunk = chunk.split(index);

		this.byEnd[index] = chunk;
		this.byStart[index] = newChunk;
		this.byEnd[newChunk.end] = newChunk;

		if (chunk === this.lastChunk) this.lastChunk = newChunk;

		this.lastSearchedChunk = chunk;
		return true;
	}

	toString() {
		let str = this.intro;

		let chunk = this.firstChunk;
		while (chunk) {
			str += chunk.toString();
			chunk = chunk.next;
		}

		return str + this.outro;
	}

	isEmpty() {
		let chunk = this.firstChunk;
		do {
			if (
				(chunk.intro.length && chunk.intro.trim()) ||
				(chunk.content.length && chunk.content.trim()) ||
				(chunk.outro.length && chunk.outro.trim())
			)
				return false;
		} while ((chunk = chunk.next));
		return true;
	}

	length() {
		let chunk = this.firstChunk;
		let length = 0;
		do {
			length += chunk.intro.length + chunk.content.length + chunk.outro.length;
		} while ((chunk = chunk.next));
		return length;
	}

	trimLines() {
		return this.trim('[\\r\\n]');
	}

	trim(charType) {
		return this.trimStart(charType).trimEnd(charType);
	}

	trimEndAborted(charType) {
		const rx = new RegExp((charType || '\\s') + '+$');

		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		let chunk = this.lastChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimEnd(rx);

			// if chunk was trimmed, we have a new lastChunk
			if (chunk.end !== end) {
				if (this.lastChunk === chunk) {
					this.lastChunk = chunk.next;
				}

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.previous;
		} while (chunk);

		return false;
	}

	trimEnd(charType) {
		this.trimEndAborted(charType);
		return this;
	}
	trimStartAborted(charType) {
		const rx = new RegExp('^' + (charType || '\\s') + '+');

		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		let chunk = this.firstChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimStart(rx);

			if (chunk.end !== end) {
				// special case...
				if (chunk === this.lastChunk) this.lastChunk = chunk.next;

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.next;
		} while (chunk);

		return false;
	}

	trimStart(charType) {
		this.trimStartAborted(charType);
		return this;
	}

	hasChanged() {
		return this.original !== this.toString();
	}

	replace(searchValue, replacement) {
		function getReplacement(match, str) {
			if (typeof replacement === 'string') {
				return replacement.replace(/\$(\$|&|\d+)/g, (_, i) => {
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
					if (i === '$') return '$';
					if (i === '&') return match[0];
					const num = +i;
					if (num < match.length) return match[+i];
					return `$${i}`;
				});
			} else {
				return replacement(...match, match.index, str, match.groups);
			}
		}
		function matchAll(re, str) {
			let match;
			const matches = [];
			while ((match = re.exec(str))) {
				matches.push(match);
			}
			return matches;
		}
		if (typeof searchValue !== 'string' && searchValue.global) {
			const matches = matchAll(searchValue, this.original);
			matches.forEach((match) => {
				if (match.index != null)
					this.overwrite(
						match.index,
						match.index + match[0].length,
						getReplacement(match, this.original)
					);
			});
		} else {
			const match = this.original.match(searchValue);
			if (match && match.index != null)
				this.overwrite(
					match.index,
					match.index + match[0].length,
					getReplacement(match, this.original)
				);
		}
		return this;
	}
}

const comma = ','.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const intToChar = new Uint8Array(64); // 64 possible chars.
const charToInt = new Uint8Array(128); // z is 122 in ASCII
for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    intToChar[i] = c;
    charToInt[c] = i;
}
// Provide a fallback for older environments.
const td = typeof TextDecoder !== 'undefined'
    ? /* #__PURE__ */ new TextDecoder()
    : typeof Buffer !== 'undefined'
        ? {
            decode(buf) {
                const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
                return out.toString();
            },
        }
        : {
            decode(buf) {
                let out = '';
                for (let i = 0; i < buf.length; i++) {
                    out += String.fromCharCode(buf[i]);
                }
                return out;
            },
        };
function decode(mappings) {
    const state = new Int32Array(5);
    const decoded = [];
    let index = 0;
    do {
        const semi = indexOf(mappings, index);
        const line = [];
        let sorted = true;
        let lastCol = 0;
        state[0] = 0;
        for (let i = index; i < semi; i++) {
            let seg;
            i = decodeInteger(mappings, i, state, 0); // genColumn
            const col = state[0];
            if (col < lastCol)
                sorted = false;
            lastCol = col;
            if (hasMoreVlq(mappings, i, semi)) {
                i = decodeInteger(mappings, i, state, 1); // sourcesIndex
                i = decodeInteger(mappings, i, state, 2); // sourceLine
                i = decodeInteger(mappings, i, state, 3); // sourceColumn
                if (hasMoreVlq(mappings, i, semi)) {
                    i = decodeInteger(mappings, i, state, 4); // namesIndex
                    seg = [col, state[1], state[2], state[3], state[4]];
                }
                else {
                    seg = [col, state[1], state[2], state[3]];
                }
            }
            else {
                seg = [col];
            }
            line.push(seg);
        }
        if (!sorted)
            sort(line);
        decoded.push(line);
        index = semi + 1;
    } while (index <= mappings.length);
    return decoded;
}
function indexOf(mappings, index) {
    const idx = mappings.indexOf(';', index);
    return idx === -1 ? mappings.length : idx;
}
function decodeInteger(mappings, pos, state, j) {
    let value = 0;
    let shift = 0;
    let integer = 0;
    do {
        const c = mappings.charCodeAt(pos++);
        integer = charToInt[c];
        value |= (integer & 31) << shift;
        shift += 5;
    } while (integer & 32);
    const shouldNegate = value & 1;
    value >>>= 1;
    if (shouldNegate) {
        value = -0x80000000 | -value;
    }
    state[j] += value;
    return pos;
}
function hasMoreVlq(mappings, i, length) {
    if (i >= length)
        return false;
    return mappings.charCodeAt(i) !== comma;
}
function sort(line) {
    line.sort(sortComparator$1);
}
function sortComparator$1(a, b) {
    return a[0] - b[0];
}
function encode(decoded) {
    const state = new Int32Array(5);
    const bufLength = 1024 * 16;
    const subLength = bufLength - 36;
    const buf = new Uint8Array(bufLength);
    const sub = buf.subarray(0, subLength);
    let pos = 0;
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
        const line = decoded[i];
        if (i > 0) {
            if (pos === bufLength) {
                out += td.decode(buf);
                pos = 0;
            }
            buf[pos++] = semicolon;
        }
        if (line.length === 0)
            continue;
        state[0] = 0;
        for (let j = 0; j < line.length; j++) {
            const segment = line[j];
            // We can push up to 5 ints, each int can take at most 7 chars, and we
            // may push a comma.
            if (pos > subLength) {
                out += td.decode(sub);
                buf.copyWithin(0, subLength, pos);
                pos -= subLength;
            }
            if (j > 0)
                buf[pos++] = comma;
            pos = encodeInteger(buf, pos, state, segment, 0); // genColumn
            if (segment.length === 1)
                continue;
            pos = encodeInteger(buf, pos, state, segment, 1); // sourcesIndex
            pos = encodeInteger(buf, pos, state, segment, 2); // sourceLine
            pos = encodeInteger(buf, pos, state, segment, 3); // sourceColumn
            if (segment.length === 4)
                continue;
            pos = encodeInteger(buf, pos, state, segment, 4); // namesIndex
        }
    }
    return out + td.decode(buf.subarray(0, pos));
}
function encodeInteger(buf, pos, state, segment, j) {
    const next = segment[j];
    let num = next - state[j];
    state[j] = next;
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        let clamped = num & 0b011111;
        num >>>= 5;
        if (num > 0)
            clamped |= 0b100000;
        buf[pos++] = intToChar[clamped];
    } while (num > 0);
    return pos;
}

// Matches the scheme of a URL, eg "http://"
const schemeRegex = /^[\w+.-]+:\/\//;
/**
 * Matches the parts of a URL:
 * 1. Scheme, including ":", guaranteed.
 * 2. User/password, including "@", optional.
 * 3. Host, guaranteed.
 * 4. Port, including ":", optional.
 * 5. Path, including "/", optional.
 */
const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?/;
/**
 * File URLs are weird. They dont' need the regular `//` in the scheme, they may or may not start
 * with a leading `/`, they can have a domain (but only if they don't start with a Windows drive).
 *
 * 1. Host, optional.
 * 2. Path, which may inclue "/", guaranteed.
 */
const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/]*)?)?(\/?.*)/i;
function isAbsoluteUrl(input) {
    return schemeRegex.test(input);
}
function isSchemeRelativeUrl(input) {
    return input.startsWith('//');
}
function isAbsolutePath(input) {
    return input.startsWith('/');
}
function isFileUrl(input) {
    return input.startsWith('file:');
}
function parseAbsoluteUrl(input) {
    const match = urlRegex.exec(input);
    return makeUrl(match[1], match[2] || '', match[3], match[4] || '', match[5] || '/');
}
function parseFileUrl(input) {
    const match = fileRegex.exec(input);
    const path = match[2];
    return makeUrl('file:', '', match[1] || '', '', isAbsolutePath(path) ? path : '/' + path);
}
function makeUrl(scheme, user, host, port, path) {
    return {
        scheme,
        user,
        host,
        port,
        path,
        relativePath: false,
    };
}
function parseUrl(input) {
    if (isSchemeRelativeUrl(input)) {
        const url = parseAbsoluteUrl('http:' + input);
        url.scheme = '';
        return url;
    }
    if (isAbsolutePath(input)) {
        const url = parseAbsoluteUrl('http://foo.com' + input);
        url.scheme = '';
        url.host = '';
        return url;
    }
    if (isFileUrl(input))
        return parseFileUrl(input);
    if (isAbsoluteUrl(input))
        return parseAbsoluteUrl(input);
    const url = parseAbsoluteUrl('http://foo.com/' + input);
    url.scheme = '';
    url.host = '';
    url.relativePath = true;
    return url;
}
function stripPathFilename(path) {
    // If a path ends with a parent directory "..", then it's a relative path with excess parent
    // paths. It's not a file, so we can't strip it.
    if (path.endsWith('/..'))
        return path;
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}
function mergePaths(url, base) {
    // If we're not a relative path, then we're an absolute path, and it doesn't matter what base is.
    if (!url.relativePath)
        return;
    normalizePath(base);
    // If the path is just a "/", then it was an empty path to begin with (remember, we're a relative
    // path).
    if (url.path === '/') {
        url.path = base.path;
    }
    else {
        // Resolution happens relative to the base path's directory, not the file.
        url.path = stripPathFilename(base.path) + url.path;
    }
    // If the base path is absolute, then our path is now absolute too.
    url.relativePath = base.relativePath;
}
/**
 * The path can have empty directories "//", unneeded parents "foo/..", or current directory
 * "foo/.". We need to normalize to a standard representation.
 */
function normalizePath(url) {
    const { relativePath } = url;
    const pieces = url.path.split('/');
    // We need to preserve the first piece always, so that we output a leading slash. The item at
    // pieces[0] is an empty string.
    let pointer = 1;
    // Positive is the number of real directories we've output, used for popping a parent directory.
    // Eg, "foo/bar/.." will have a positive 2, and we can decrement to be left with just "foo".
    let positive = 0;
    // We need to keep a trailing slash if we encounter an empty directory (eg, splitting "foo/" will
    // generate `["foo", ""]` pieces). And, if we pop a parent directory. But once we encounter a
    // real directory, we won't need to append, unless the other conditions happen again.
    let addTrailingSlash = false;
    for (let i = 1; i < pieces.length; i++) {
        const piece = pieces[i];
        // An empty directory, could be a trailing slash, or just a double "//" in the path.
        if (!piece) {
            addTrailingSlash = true;
            continue;
        }
        // If we encounter a real directory, then we don't need to append anymore.
        addTrailingSlash = false;
        // A current directory, which we can always drop.
        if (piece === '.')
            continue;
        // A parent directory, we need to see if there are any real directories we can pop. Else, we
        // have an excess of parents, and we'll need to keep the "..".
        if (piece === '..') {
            if (positive) {
                addTrailingSlash = true;
                positive--;
                pointer--;
            }
            else if (relativePath) {
                // If we're in a relativePath, then we need to keep the excess parents. Else, in an absolute
                // URL, protocol relative URL, or an absolute path, we don't need to keep excess.
                pieces[pointer++] = piece;
            }
            continue;
        }
        // We've encountered a real directory. Move it to the next insertion pointer, which accounts for
        // any popped or dropped directories.
        pieces[pointer++] = piece;
        positive++;
    }
    let path = '';
    for (let i = 1; i < pointer; i++) {
        path += '/' + pieces[i];
    }
    if (!path || (addTrailingSlash && !path.endsWith('/..'))) {
        path += '/';
    }
    url.path = path;
}
/**
 * Attempts to resolve `input` URL/path relative to `base`.
 */
function resolve$1(input, base) {
    if (!input && !base)
        return '';
    const url = parseUrl(input);
    // If we have a base, and the input isn't already an absolute URL, then we need to merge.
    if (base && !url.scheme) {
        const baseUrl = parseUrl(base);
        url.scheme = baseUrl.scheme;
        // If there's no host, then we were just a path.
        if (!url.host) {
            // The host, user, and port are joined, you can't copy one without the others.
            url.user = baseUrl.user;
            url.host = baseUrl.host;
            url.port = baseUrl.port;
        }
        mergePaths(url, baseUrl);
    }
    normalizePath(url);
    // If the input (and base, if there was one) are both relative, then we need to output a relative.
    if (url.relativePath) {
        // The first char is always a "/".
        const path = url.path.slice(1);
        if (!path)
            return '.';
        // If base started with a leading ".", or there is no base and input started with a ".", then we
        // need to ensure that the relative path starts with a ".". We don't know if relative starts
        // with a "..", though, so check before prepending.
        const keepRelative = (base || input).startsWith('.');
        return !keepRelative || path.startsWith('.') ? path : './' + path;
    }
    // If there's no host (and no scheme/user/port), then we need to output an absolute path.
    if (!url.scheme && !url.host)
        return url.path;
    // We're outputting either an absolute URL, or a protocol relative one.
    return `${url.scheme}//${url.user}${url.host}${url.port}${url.path}`;
}

function resolve(input, base) {
    // The base is always treated as a directory, if it's not empty.
    // https://github.com/mozilla/source-map/blob/8cb3ee57/lib/util.js#L327
    // https://github.com/chromium/chromium/blob/da4adbb3/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js#L400-L401
    if (base && !base.endsWith('/'))
        base += '/';
    return resolve$1(input, base);
}

/**
 * Removes everything after the last "/", but leaves the slash.
 */
function stripFilename(path) {
    if (!path)
        return '';
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}

const COLUMN = 0;

function maybeSort(mappings, owned) {
    const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
    if (unsortedIndex === mappings.length)
        return mappings;
    // If we own the array (meaning we parsed it from JSON), then we're free to directly mutate it. If
    // not, we do not want to modify the consumer's input array.
    if (!owned)
        mappings = mappings.slice();
    for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
        mappings[i] = sortSegments(mappings[i], owned);
    }
    return mappings;
}
function nextUnsortedSegmentLine(mappings, start) {
    for (let i = start; i < mappings.length; i++) {
        if (!isSorted(mappings[i]))
            return i;
    }
    return mappings.length;
}
function isSorted(line) {
    for (let j = 1; j < line.length; j++) {
        if (line[j][COLUMN] < line[j - 1][COLUMN]) {
            return false;
        }
    }
    return true;
}
function sortSegments(line, owned) {
    if (!owned)
        line = line.slice();
    return line.sort(sortComparator);
}
function sortComparator(a, b) {
    return a[COLUMN] - b[COLUMN];
}

let found = false;
/**
 * A binary search implementation that returns the index if a match is found.
 * If no match is found, then the left-index (the index associated with the item that comes just
 * before the desired index) is returned. To maintain proper sort order, a splice would happen at
 * the next index:
 *
 * ```js
 * const array = [1, 3];
 * const needle = 2;
 * const index = binarySearch(array, needle, (item, needle) => item - needle);
 *
 * assert.equal(index, 0);
 * array.splice(index + 1, 0, needle);
 * assert.deepEqual(array, [1, 2, 3]);
 * ```
 */
function binarySearch(haystack, needle, low, high) {
    while (low <= high) {
        const mid = low + ((high - low) >> 1);
        const cmp = haystack[mid][COLUMN] - needle;
        if (cmp === 0) {
            found = true;
            return mid;
        }
        if (cmp < 0) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    found = false;
    return low - 1;
}
function upperBound(haystack, needle, index) {
    for (let i = index + 1; i < haystack.length; index = i++) {
        if (haystack[i][COLUMN] !== needle)
            break;
    }
    return index;
}
function lowerBound(haystack, needle, index) {
    for (let i = index - 1; i >= 0; index = i--) {
        if (haystack[i][COLUMN] !== needle)
            break;
    }
    return index;
}
function memoizedState() {
    return {
        lastKey: -1,
        lastNeedle: -1,
        lastIndex: -1,
    };
}
/**
 * This overly complicated beast is just to record the last tested line/column and the resulting
 * index, allowing us to skip a few tests if mappings are monotonically increasing.
 */
function memoizedBinarySearch(haystack, needle, state, key) {
    const { lastKey, lastNeedle, lastIndex } = state;
    let low = 0;
    let high = haystack.length - 1;
    if (key === lastKey) {
        if (needle === lastNeedle) {
            found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
            return lastIndex;
        }
        if (needle >= lastNeedle) {
            // lastIndex may be -1 if the previous needle was not found.
            low = lastIndex === -1 ? 0 : lastIndex;
        }
        else {
            high = lastIndex;
        }
    }
    state.lastKey = key;
    state.lastNeedle = needle;
    return (state.lastIndex = binarySearch(haystack, needle, low, high));
}
const LEAST_UPPER_BOUND = -1;
const GREATEST_LOWER_BOUND = 1;
/**
 * Returns the decoded (array of lines of segments) form of the SourceMap's mappings field.
 */
let decodedMappings;
/**
 * A low-level API to find the segment associated with a generated line/column (think, from a
 * stack trace). Line and column here are 0-based, unlike `originalPositionFor`.
 */
let traceSegment;
class TraceMap {
    constructor(map, mapUrl) {
        this._decodedMemo = memoizedState();
        this._bySources = undefined;
        this._bySourceMemos = undefined;
        const isString = typeof map === 'string';
        if (!isString && map._decodedMemo)
            return map;
        const parsed = (isString ? JSON.parse(map) : map);
        const { version, file, names, sourceRoot, sources, sourcesContent } = parsed;
        this.version = version;
        this.file = file;
        this.names = names;
        this.sourceRoot = sourceRoot;
        this.sources = sources;
        this.sourcesContent = sourcesContent;
        const from = resolve(sourceRoot || '', stripFilename(mapUrl));
        this.resolvedSources = sources.map((s) => resolve(s || '', from));
        const { mappings } = parsed;
        if (typeof mappings === 'string') {
            this._encoded = mappings;
            this._decoded = undefined;
        }
        else {
            this._encoded = undefined;
            this._decoded = maybeSort(mappings, isString);
        }
    }
}
(() => {
    decodedMappings = (map) => {
        return (map._decoded || (map._decoded = decode(map._encoded)));
    };
    traceSegment = (map, line, column) => {
        const decoded = decodedMappings(map);
        // It's common for parent source maps to have pointers to lines that have no
        // mapping (like a "//# sourceMappingURL=") at the end of the child file.
        if (line >= decoded.length)
            return null;
        return traceSegmentInternal(decoded[line], map._decodedMemo, line, column, GREATEST_LOWER_BOUND);
    };
})();
function traceSegmentInternal(segments, memo, line, column, bias) {
    let index = memoizedBinarySearch(segments, column, memo, line);
    if (found) {
        index = (bias === LEAST_UPPER_BOUND ? upperBound : lowerBound)(segments, column, index);
    }
    else if (bias === LEAST_UPPER_BOUND)
        index++;
    if (index === -1 || index === segments.length)
        return null;
    return segments[index];
}

/**
 * Gets the index associated with `key` in the backing array, if it is already present.
 */
let get;
/**
 * Puts `key` into the backing array, if it is not already present. Returns
 * the index of the `key` in the backing array.
 */
let put;
/**
 * SetArray acts like a `Set` (allowing only one occurrence of a string `key`), but provides the
 * index of the `key` in the backing array.
 *
 * This is designed to allow synchronizing a second array with the contents of the backing array,
 * like how in a sourcemap `sourcesContent[i]` is the source content associated with `source[i]`,
 * and there are never duplicates.
 */
class SetArray {
    constructor() {
        this._indexes = { __proto__: null };
        this.array = [];
    }
}
(() => {
    get = (strarr, key) => strarr._indexes[key];
    put = (strarr, key) => {
        // The key may or may not be present. If it is present, it's a number.
        const index = get(strarr, key);
        if (index !== undefined)
            return index;
        const { array, _indexes: indexes } = strarr;
        return (indexes[key] = array.push(key) - 1);
    };
})();

/**
 * A low-level API to associate a generated position with an original source position. Line and
 * column here are 0-based, unlike `addMapping`.
 */
let addSegment;
/**
 * Adds/removes the content of the source file to the source map.
 */
let setSourceContent;
/**
 * Returns a sourcemap object (with decoded mappings) suitable for passing to a library that expects
 * a sourcemap, or to JSON.stringify.
 */
let decodedMap;
/**
 * Returns a sourcemap object (with encoded mappings) suitable for passing to a library that expects
 * a sourcemap, or to JSON.stringify.
 */
let encodedMap;
/**
 * Provides the state to generate a sourcemap.
 */
class GenMapping {
    constructor({ file, sourceRoot } = {}) {
        this._names = new SetArray();
        this._sources = new SetArray();
        this._sourcesContent = [];
        this._mappings = [];
        this.file = file;
        this.sourceRoot = sourceRoot;
    }
}
(() => {
    addSegment = (map, genLine, genColumn, source, sourceLine, sourceColumn, name) => {
        const { _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names, } = map;
        const line = getLine(mappings, genLine);
        if (source == null) {
            const seg = [genColumn];
            const index = getColumnIndex(line, genColumn, seg);
            return insert(line, index, seg);
        }
        const sourcesIndex = put(sources, source);
        const seg = name
            ? [genColumn, sourcesIndex, sourceLine, sourceColumn, put(names, name)]
            : [genColumn, sourcesIndex, sourceLine, sourceColumn];
        const index = getColumnIndex(line, genColumn, seg);
        if (sourcesIndex === sourcesContent.length)
            sourcesContent[sourcesIndex] = null;
        insert(line, index, seg);
    };
    setSourceContent = (map, source, content) => {
        const { _sources: sources, _sourcesContent: sourcesContent } = map;
        sourcesContent[put(sources, source)] = content;
    };
    decodedMap = (map) => {
        const { file, sourceRoot, _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names, } = map;
        return {
            version: 3,
            file,
            names: names.array,
            sourceRoot: sourceRoot || undefined,
            sources: sources.array,
            sourcesContent,
            mappings,
        };
    };
    encodedMap = (map) => {
        const decoded = decodedMap(map);
        return Object.assign(Object.assign({}, decoded), { mappings: encode(decoded.mappings) });
    };
})();
function getLine(mappings, index) {
    for (let i = mappings.length; i <= index; i++) {
        mappings[i] = [];
    }
    return mappings[index];
}
function getColumnIndex(line, column, seg) {
    let index = line.length;
    for (let i = index - 1; i >= 0; i--, index--) {
        const current = line[i];
        const col = current[0];
        if (col > column)
            continue;
        if (col < column)
            break;
        const cmp = compare(current, seg);
        if (cmp === 0)
            return index;
        if (cmp < 0)
            break;
    }
    return index;
}
function compare(a, b) {
    let cmp = compareNum(a.length, b.length);
    if (cmp !== 0)
        return cmp;
    // We've already checked genColumn
    if (a.length === 1)
        return 0;
    cmp = compareNum(a[1], b[1]);
    if (cmp !== 0)
        return cmp;
    cmp = compareNum(a[2], b[2]);
    if (cmp !== 0)
        return cmp;
    cmp = compareNum(a[3], b[3]);
    if (cmp !== 0)
        return cmp;
    if (a.length === 4)
        return 0;
    return compareNum(a[4], b[4]);
}
function compareNum(a, b) {
    return a - b;
}
function insert(array, index, value) {
    if (index === -1)
        return;
    for (let i = array.length; i > index; i--) {
        array[i] = array[i - 1];
    }
    array[index] = value;
}

const SOURCELESS_MAPPING = {
    source: null,
    column: null,
    line: null,
    name: null,
    content: null,
};
const EMPTY_SOURCES = [];
function Source(map, sources, source, content) {
    return {
        map,
        sources,
        source,
        content,
    };
}
/**
 * MapSource represents a single sourcemap, with the ability to trace mappings into its child nodes
 * (which may themselves be SourceMapTrees).
 */
function MapSource(map, sources) {
    return Source(map, sources, '', null);
}
/**
 * A "leaf" node in the sourcemap tree, representing an original, unmodified source file. Recursive
 * segment tracing ends at the `OriginalSource`.
 */
function OriginalSource(source, content) {
    return Source(null, EMPTY_SOURCES, source, content);
}
/**
 * traceMappings is only called on the root level SourceMapTree, and begins the process of
 * resolving each mapping in terms of the original source files.
 */
function traceMappings(tree) {
    const gen = new GenMapping({ file: tree.map.file });
    const { sources: rootSources, map } = tree;
    const rootNames = map.names;
    const rootMappings = decodedMappings(map);
    for (let i = 0; i < rootMappings.length; i++) {
        const segments = rootMappings[i];
        let lastSource = null;
        let lastSourceLine = null;
        let lastSourceColumn = null;
        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            const genCol = segment[0];
            let traced = SOURCELESS_MAPPING;
            // 1-length segments only move the current generated column, there's no source information
            // to gather from it.
            if (segment.length !== 1) {
                const source = rootSources[segment[1]];
                traced = originalPositionFor(source, segment[2], segment[3], segment.length === 5 ? rootNames[segment[4]] : '');
                // If the trace is invalid, then the trace ran into a sourcemap that doesn't contain a
                // respective segment into an original source.
                if (traced == null)
                    continue;
            }
            // So we traced a segment down into its original source file. Now push a
            // new segment pointing to this location.
            const { column, line, name, content, source } = traced;
            if (line === lastSourceLine && column === lastSourceColumn && source === lastSource) {
                continue;
            }
            lastSourceLine = line;
            lastSourceColumn = column;
            lastSource = source;
            // Sigh, TypeScript can't figure out source/line/column are either all null, or all non-null...
            addSegment(gen, i, genCol, source, line, column, name);
            if (content != null)
                setSourceContent(gen, source, content);
        }
    }
    return gen;
}
/**
 * originalPositionFor is only called on children SourceMapTrees. It recurses down into its own
 * child SourceMapTrees, until we find the original source map.
 */
function originalPositionFor(source, line, column, name) {
    if (!source.map) {
        return { column, line, name, source: source.source, content: source.content };
    }
    const segment = traceSegment(source.map, line, column);
    // If we couldn't find a segment, then this doesn't exist in the sourcemap.
    if (segment == null)
        return null;
    // 1-length segments only move the current generated column, there's no source information
    // to gather from it.
    if (segment.length === 1)
        return SOURCELESS_MAPPING;
    return originalPositionFor(source.sources[segment[1]], segment[2], segment[3], segment.length === 5 ? source.map.names[segment[4]] : name);
}

function asArray(value) {
    if (Array.isArray(value))
        return value;
    return [value];
}
/**
 * Recursively builds a tree structure out of sourcemap files, with each node
 * being either an `OriginalSource` "leaf" or a `SourceMapTree` composed of
 * `OriginalSource`s and `SourceMapTree`s.
 *
 * Every sourcemap is composed of a collection of source files and mappings
 * into locations of those source files. When we generate a `SourceMapTree` for
 * the sourcemap, we attempt to load each source file's own sourcemap. If it
 * does not have an associated sourcemap, it is considered an original,
 * unmodified source file.
 */
function buildSourceMapTree(input, loader) {
    const maps = asArray(input).map((m) => new TraceMap(m, ''));
    const map = maps.pop();
    for (let i = 0; i < maps.length; i++) {
        if (maps[i].sources.length > 1) {
            throw new Error(`Transformation map ${i} must have exactly one source file.\n` +
                'Did you specify these with the most recent transformation maps first?');
        }
    }
    let tree = build(map, loader, '', 0);
    for (let i = maps.length - 1; i >= 0; i--) {
        tree = MapSource(maps[i], [tree]);
    }
    return tree;
}
function build(map, loader, importer, importerDepth) {
    const { resolvedSources, sourcesContent } = map;
    const depth = importerDepth + 1;
    const children = resolvedSources.map((sourceFile, i) => {
        // The loading context gives the loader more information about why this file is being loaded
        // (eg, from which importer). It also allows the loader to override the location of the loaded
        // sourcemap/original source, or to override the content in the sourcesContent field if it's
        // an unmodified source file.
        const ctx = {
            importer,
            depth,
            source: sourceFile || '',
            content: undefined,
        };
        // Use the provided loader callback to retrieve the file's sourcemap.
        // TODO: We should eventually support async loading of sourcemap files.
        const sourceMap = loader(ctx.source, ctx);
        const { source, content } = ctx;
        // If there is a sourcemap, then we need to recurse into it to load its source files.
        if (sourceMap)
            return build(new TraceMap(sourceMap, source), loader, source, depth);
        // Else, it's an an unmodified source file.
        // The contents of this unmodified source file can be overridden via the loader context,
        // allowing it to be explicitly null or a string. If it remains undefined, we fall back to
        // the importing sourcemap's `sourcesContent` field.
        const sourceContent = content !== undefined ? content : sourcesContent ? sourcesContent[i] : null;
        return OriginalSource(source, sourceContent);
    });
    return MapSource(map, children);
}

/**
 * A SourceMap v3 compatible sourcemap, which only includes fields that were
 * provided to it.
 */
class SourceMap {
    constructor(map, options) {
        const out = options.decodedMappings ? decodedMap(map) : encodedMap(map);
        this.version = out.version; // SourceMap spec says this should be first.
        this.file = out.file;
        this.mappings = out.mappings;
        this.names = out.names;
        this.sourceRoot = out.sourceRoot;
        this.sources = out.sources;
        if (!options.excludeContent) {
            this.sourcesContent = out.sourcesContent;
        }
    }
    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Traces through all the mappings in the root sourcemap, through the sources
 * (and their sourcemaps), all the way back to the original source location.
 *
 * `loader` will be called every time we encounter a source file. If it returns
 * a sourcemap, we will recurse into that sourcemap to continue the trace. If
 * it returns a falsey value, that source file is treated as an original,
 * unmodified source file.
 *
 * Pass `excludeContent` to exclude any self-containing source file content
 * from the output sourcemap.
 *
 * Pass `decodedMappings` to receive a SourceMap with decoded (instead of
 * VLQ encoded) mappings.
 */
function remapping(input, loader, options) {
    const opts = typeof options === 'object' ? options : { excludeContent: !!options, decodedMappings: false };
    const tree = buildSourceMapTree(input, loader);
    return new SourceMap(traceMappings(tree), opts);
}

const checkEsModule = `.then((mod)=>{
	const exports = Object.keys(mod);
	if(
		exports.length===1&&exports[0]==='default'&&mod.default.__esModule
	){
		return mod.default
	}

	return mod
})`.replace(/[\n\t]+/g, "");
let wasmParserInitialized = false;
init.then(() => {
  wasmParserInitialized = true;
});
const inlineSourceMapPrefix = "\n//# sourceMappingURL=data:application/json;base64,";
function transformDynamicImport({ code, map }, sourcemap) {
  code = code.toString();
  if (!code.includes("import")) {
    return;
  }
  if (sourcemap === "inline") {
    const sourceMapIndex = code.indexOf(inlineSourceMapPrefix);
    const inlineSourceMap = code.slice(sourceMapIndex + inlineSourceMapPrefix.length);
    map = Buffer.from(inlineSourceMap, "base64").toString();
    code = code.slice(0, sourceMapIndex);
  }
  const [imports] = wasmParserInitialized ? parse$1(code) : parse(code);
  if (imports.length === 0) {
    return;
  }
  const magicString = new MagicString(code);
  for (const dynamicImport of imports) {
    if (dynamicImport.d > -1) {
      magicString.appendRight(dynamicImport.se, checkEsModule);
    }
  }
  code = magicString.toString();
  if (sourcemap && map) {
    const generatedMap = magicString.generateMap({ hires: true });
    map = remapping([generatedMap.toString(), map], () => null).toString();
    if (sourcemap === "inline") {
      code += inlineSourceMapPrefix + Buffer.from(map, "utf8").toString("base64");
      map = "";
    }
  } else {
    map = "";
  }
  return {
    code,
    map
  };
}

const sha1 = (data) => crypto__default["default"].createHash("sha1").update(data).digest("hex");

function readJsonFile(filePath) {
  try {
    const jsonString = fs__default["default"].readFileSync(filePath, "utf8");
    return JSON.parse(jsonString);
  } catch {
  }
}

const getTime = () => Math.floor(Date.now() / 1e8);
class FileCache extends Map {
  cacheDirectory = path__default["default"].join(os__default["default"].tmpdir(), "esbuild-kit");
  cacheFiles;
  constructor() {
    super();
    if (!fs__default["default"].existsSync(this.cacheDirectory)) {
      fs__default["default"].mkdirSync(this.cacheDirectory);
    }
    this.cacheFiles = fs__default["default"].readdirSync(this.cacheDirectory).map((fileName) => {
      const [time, key] = fileName.split("-");
      return {
        time: Number(time),
        key,
        fileName
      };
    });
    setImmediate(() => this.expireDiskCache());
  }
  get(key) {
    const memoryCacheHit = super.get(key);
    if (memoryCacheHit) {
      return memoryCacheHit;
    }
    const diskCacheHit = this.cacheFiles.find((cache) => cache.key === key);
    if (!diskCacheHit) {
      return;
    }
    const cacheFilePath = path__default["default"].join(this.cacheDirectory, diskCacheHit.fileName);
    const cachedResult = readJsonFile(cacheFilePath);
    if (!cachedResult) {
      fs__default["default"].promises.unlink(cacheFilePath).then(() => {
        const index = this.cacheFiles.indexOf(diskCacheHit);
        this.cacheFiles.splice(index, 1);
      }, () => {
      });
      return;
    }
    super.set(key, cachedResult);
    return cachedResult;
  }
  set(key, value) {
    super.set(key, value);
    if (value) {
      const time = getTime();
      fs__default["default"].promises.writeFile(path__default["default"].join(this.cacheDirectory, `${time}-${key}`), JSON.stringify(value)).catch(() => {
      });
    }
    return this;
  }
  expireDiskCache() {
    const time = getTime();
    for (const cache of this.cacheFiles) {
      if (time - cache.time > 7) {
        fs__default["default"].promises.unlink(path__default["default"].join(this.cacheDirectory, cache.fileName)).catch(() => {
        });
      }
    }
  }
}
var cache = process.env.ESBK_DISABLE_CACHE ? /* @__PURE__ */ new Map() : new FileCache();

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
const nodeVersion = process.versions.node;
const sourcemap = hasNativeSourceMapSupport ? "inline" : true;
const getTransformOptions = (extendOptions) => {
  const options = __spreadValues({
    target: `node${nodeVersion}`,
    loader: "default",
    sourcemap,
    minifySyntax: true,
    minifyWhitespace: true
  }, extendOptions);
  if (options.sourcefile) {
    const { sourcefile } = options;
    const extension = path__default["default"].extname(sourcefile);
    if (extension) {
      if (extension === ".cts" || extension === ".mts") {
        options.sourcefile = `${sourcefile.slice(0, -3)}ts`;
      }
    } else {
      options.sourcefile += ".js";
    }
  }
  return options;
};
function transformSync(code, filePath, extendOptions) {
  const define = {};
  if (!(filePath.endsWith(".cjs") || filePath.endsWith(".cts"))) {
    define["import.meta.url"] = `'${url.pathToFileURL(filePath)}'`;
  }
  const options = getTransformOptions(__spreadValues({
    sourcefile: filePath,
    define
  }, extendOptions));
  const hash = sha1(code + JSON.stringify(options) + esbuild.version);
  const cacheHit = cache.get(hash);
  if (cacheHit) {
    return cacheHit;
  }
  const transformed = esbuild.transformSync(code, options);
  const dynamicImportTransformed = transformDynamicImport(transformed, sourcemap);
  if (dynamicImportTransformed) {
    transformed.code = dynamicImportTransformed.code;
    transformed.map = dynamicImportTransformed.map;
  }
  if (transformed.warnings.length > 0) {
    const { warnings } = transformed;
    for (const warning of warnings) {
      console.log(warning);
    }
  }
  cache.set(hash, transformed);
  return transformed;
}
async function transform(code, filePath, extendOptions) {
  const options = getTransformOptions(__spreadValues({
    sourcefile: filePath
  }, extendOptions));
  const hash = sha1(code + JSON.stringify(options) + esbuild.version);
  const cacheHit = cache.get(hash);
  if (cacheHit) {
    return cacheHit;
  }
  const transformed = await esbuild.transform(code, options);
  const dynamicImportTransformed = transformDynamicImport(transformed, sourcemap);
  if (dynamicImportTransformed) {
    transformed.code = dynamicImportTransformed.code;
    transformed.map = dynamicImportTransformed.map;
  }
  if (transformed.warnings.length > 0) {
    const { warnings } = transformed;
    for (const warning of warnings) {
      console.log(warning);
    }
  }
  cache.set(hash, transformed);
  return transformed;
}

const tsExtensions = {
  ".js": ".ts",
  ".cjs": ".cts",
  ".mjs": ".mts"
};
function resolveTsPath(filePath) {
  const extension = path__default["default"].extname(filePath);
  const tsExtension = tsExtensions[extension];
  if (tsExtension) {
    return filePath.slice(0, -extension.length) + tsExtension;
  }
}

exports.installSourceMapSupport = installSourceMapSupport;
exports.resolveTsPath = resolveTsPath;
exports.transform = transform;
exports.transformDynamicImport = transformDynamicImport;
exports.transformSync = transformSync;
