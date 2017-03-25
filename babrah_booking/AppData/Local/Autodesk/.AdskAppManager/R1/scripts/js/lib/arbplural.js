/*
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Application Resource Bundle (ARB) plural support library.
 * This file contains data and methods to provide plural support in ARB
 * message substitution. Plural rules are based on the latest CLDR(1.9)
 * release. It should cover all the languages available in CLDR.
 *
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Regular expression to identify plural message.
 * @type {RegExp}
 * @private
 */
arb.PLURAL_RULE_REGEX_ = /^\{\s*(\w+)\s*,\s*plural\s*,(\s*offset:(\d+))?\s*/;


/**
 * The locale used for selecting plural rules.
 * @type {string}
 * @private
 */
arb.pluralLanguage_ = 'en';


/**
 * Sets plural rules locale.
 */
arb.setPluralLanguage = function(language) {
  if (language in arb.pluralRuleMap_) {
    arb.pluralLanguage_ = language;
  } else {
    arb.pluralLanguage_ = '$$';
  }
}


/**
 * Processes plural message.
 * If it is a plural message, a branch selected based on plural rule will be
 * returned for further processing. Otherwise, original message will be
 * returned. In either case, non-plural related placeholder won't be touched.
 *
 * @param {string} str original message string.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string after plural processing is done.
 * @private
 */
arb.processPluralRules_ = function(str, opt_values) {
  var m = arb.PLURAL_RULE_REGEX_.exec(str);
  if (!m) {
    return str;
  }

  var type = typeof opt_values;
  var arg;
  if (type == 'object' || type == 'function') {
    if (!(m[1] in opt_values)) {
      return str;
    }
    arg = opt_values[m[1]];
  } else {
    var order = parseInt(m[1]);
    if (m[1] != '' + order || order >= arguments.length) {
      return str;
    }
    arg = arguments[order];
  }

  var branches = arb.parseBranches_(str.substring(m[0].length));
  if (!branches) {
    return str;
  }

  if (arg in branches) {
    return branches['' + arg];
  }

  if (typeof arg != 'number') {
    return str;
  }

  var offset = m[3] ? parseInt(m[3]) : 0;

  var rule = arb.getRuleName(arg - offset);

  if (rule in branches) {
    return branches[rule].replace('#', arg - offset);
  }

  if ('other' in branches) {
    return branches['other'].replace('#', arg - offset);
  }

  return str;
};


/**
 * Parses the branches parts of a plural message into a map of selective
 * branches.
 *
 * @param {string} str plural message string to be parsed.
 * @return {?Object.<string, string>} a map of plural key name to plural
 *     select branch or null if parsing failed.
 * @private
 */
arb.parseBranches_ = function(str) {
  var branches = {};
  var regex = /(?:=(\d+)|(\w+))\s+\{/;
  while (true) {
    if (str.charAt(0) == '}') {
      return branches;
    }

    var m = regex.exec(str);
    if (!m) {
      return null;
    }
    var key = m[1] ? m[1] : m[2];
    str = str.substring(m[0].length);
    var openBrackets = 1;
    var i;
    for (i = 0; i < str.length && openBrackets > 0; i++) {
      var ch = str.charAt(i);
      if (ch == '}') {
        openBrackets--;
      } else if (ch == '{') {
        openBrackets++;
      }
    }
    if (openBrackets != 0) {
      return null;
    }

    // grab branch content without ending "}"
    branches[key] = str.substring(0, i - 1);
    str = str.substring(i).replace(/^\s*/, '');
    if (str == '') {
      return null;
    }
  }
};


/**
 * Returns plural rule name based on given number.
 *
 * @param {number} n number for plural selection.
 * @return {string} plural rule name.
 */
arb.getRuleName = function(n) {
  return arb.pluralRules_[arb.pluralRuleMap_[arb.pluralLanguage_]](n);
};


/**
 * Collection of all possible plural rules.
 * This tables is manually created from CLDR 1.9. Size is the biggest concern.
 * @type {Object.<number, function(number):string>}
 * @private
 */
arb.pluralRules_ = {
    // "one": "n is 1"
    0: function(n) {
        return (n == 1) ? 'one' : 'other';
    },

    // "one": "n in 0..1"
    1: function(n) {
        return (n == 0 || n == 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..10",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n mod 100 in 11..99"
    2: function(n) {
        return ((n % 100) >= 3 && (n % 100) <= 10 && n == Math.floor(n)) ?
            'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' : (n == 2) ?
            'two' : ((n % 100) >= 11 && (n % 100) <= 99 && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n mod 10 is 1 and n mod 100 is not 11",
    // "many": "n mod 10 is 0 or n mod 10 in 5..9 or n mod 100 in 11..14"
    3: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : ((n % 10) == 1 && (n % 100) != 11) ? 'one' :
            ((n % 10) == 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n is 3",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n is 6"
    4: function(n) {
        return (n == 3) ? 'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' :
            (n == 2) ? 'two' : (n == 6) ? 'many' : 'other';
    },

    // "one": "n within 0..2 and n is not 2"
    5: function(n) {
        return (n >= 0 && n < 2) ? 'one' : 'other';
    },

    // "two": "n is 2",
    // "one": "n is 1"
    6: function(n) {
        return (n == 2) ? 'two' : (n == 1) ? 'one' : 'other';
    },

    // "few": "n in 2..4",
    // "one": "n is 1"
    7: function(n) {
        return (n == 2 || n == 3 || n == 4) ? 'few' :
            (n == 1) ? 'one' : 'other';
    },

    // "zero": "n is 0",
    // "one": "n within 0..2 and n is not 0 and n is not 2"
    8: function(n) {
        return (n == 0) ? 'zero' : (n > 0 && n < 2) ? 'one' : 'other';
    },

    // "few": "n mod 10 in 2..9 and n mod 100 not in 11..19",
    // "one": "n mod 10 is 1 and n mod 100 not in 11..19"
    9: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 9 &&
               ((n % 100) < 11 || (n % 100) > 19) && n == Math.floor(n)) ?
               'few' :
               ((n % 10) == 1 && ((n % 100) < 11 || (n % 100) > 19)) ? 'one' :
               'other';
    },

    // "zero": "n is 0",
    // "one": "n mod 10 is 1 and n mod 100 is not 11"
    10: function(n) {
        return (n == 0) ? 'zero' : ((n % 10) == 1 && (n % 100) != 11) ?
            'one' : 'other';
    },

    // "one": "n mod 10 is 1 and n is not 11"
    11: function(n) {
        return ((n % 10) == 1 && n != 11) ? 'one' : 'other';
    },

    // "few": "n is 0 OR n is not 1 AND n mod 100 in 1..19",
    // "one": "n is 1"
    12: function(n) {
        return (n == 1) ? 'one' :
            (n == 0 ||
             (n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'few' : 'other';
    },

    // "few": "n is 0 or n mod 100 in 2..10",
    // "one": "n is 1",
    // "many": "n mod 100 in 11..19"
    13: function(n) {
        return (n == 0 || (n % 100) >= 2 && (n % 100) <= 10 &&
                n == Math.floor(n)) ? 'few' : (n == 1) ? 'one' :
            ((n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'many' : 'other';

    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n is 1",
    // "many": "n is not 1 and n mod 10 in 0..1 or
    //          n mod 10 in 5..9 or n mod 100 in 12..14"
    14: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : (n == 1) ? 'one' :
            ((n % 10) == 0 || (n % 10) == 1 ||
             (((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 12 && (n % 100) <= 14)) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n in 2..10",
    // "one": "n within 0..1"
    15: function(n) {
        return (n >= 2 && n <= 10 && n == Math.floor(n)) ? 'few' :
            (n >= 0 && n <= 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..4",
    // "two": "n mod 100 is 2",
    // "one": "n mod 100 is 1"
    16: function(n) {
        var m = n % 100;
        return (m == 3 || m == 4) ? 'few' : (m == 2) ? 'two' :
               (m == 1) ? 'one' : 'other';
    },

    // No plural form
    17: function(n) {
        return 'other';
    }
};


/**
 * Mapping of locale to plural rule type.
 * @type {Object}
 * @private
 */
arb.pluralRuleMap_ = {
    'af': 0, 'ak': 1, 'am': 1, 'ar': 2,
    'be': 3, 'bem': 0, 'bg': 0, 'bh': 1, 'bn': 0, 'br': 4, 'brx': 0, 'bs': 3,
    'ca': 0, 'chr': 0, 'ckb': 0, 'cs': 7, 'cy': 4, 'da': 0, 'dz': 0,
    'el': 0, 'en': 0, 'eo': 0, 'es': 0, 'et': 0, 'eu': 0,
    'ff': 5, 'fi': 0, 'fil': 1, 'fo': 0, 'fr': 5, 'fur': 0, 'fy': 0,
    'ga': 6, 'gl': 0, 'gsw': 0, 'gu': 0, 'guw': 1,
    'ha': 0, 'he': 0, 'hi': 1, 'hr': 3,
    'is': 0, 'it': 0, 'iw': 0, 'kab': 5, 'ku': 0,
    'lag': 8, 'lb': 0, 'ln': 1, 'lt': 9, 'lv': 10,
    'mg': 1, 'mk': 11, 'ml': 0, 'mn': 0, 'mo': 12, 'mr': 0, 'mt': 13,
    'nah': 0, 'nb': 0, 'ne': 0, 'nl': 0, 'nn': 0, 'no': 0, 'nso': 1,
    'om': 0, 'or': 0,
    'pa': 0, 'pap': 0, 'pl': 14, 'ps': 0, 'pt': 0,
    'rm': 0, 'ro': 12, 'ru': 3,
    'se': 6, 'sh': 3, 'shi': 15, 'sk': 7, 'sl': 16, 'sma': 6, 'smi': 6,
    'smj': 6, 'smn': 6, 'sms': 6, 'so': 0, 'sg': 0, 'sr': 3, 'sv': 0, 'sw': 0,
    'ta': 0, 'te': 0, 'ti': 1, 'tk': 0, 'tl': 1,
    'uk': 3, 'ur': 0, 'wa': 1, 'zu': 0,
    '$$': 17   // Special item for language without plural rules.
};


// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFMs9iydqct5k
// SIG // TF2WZSGNKti/fIS5oIIUMDCCA+4wggNXoAMCAQICEH6T
// SIG // 6/t8xk5Z6kuad9QG/DswDQYJKoZIhvcNAQEFBQAwgYsx
// SIG // CzAJBgNVBAYTAlpBMRUwEwYDVQQIEwxXZXN0ZXJuIENh
// SIG // cGUxFDASBgNVBAcTC0R1cmJhbnZpbGxlMQ8wDQYDVQQK
// SIG // EwZUaGF3dGUxHTAbBgNVBAsTFFRoYXd0ZSBDZXJ0aWZp
// SIG // Y2F0aW9uMR8wHQYDVQQDExZUaGF3dGUgVGltZXN0YW1w
// SIG // aW5nIENBMB4XDTEyMTIyMTAwMDAwMFoXDTIwMTIzMDIz
// SIG // NTk1OVowXjELMAkGA1UEBhMCVVMxHTAbBgNVBAoTFFN5
// SIG // bWFudGVjIENvcnBvcmF0aW9uMTAwLgYDVQQDEydTeW1h
// SIG // bnRlYyBUaW1lIFN0YW1waW5nIFNlcnZpY2VzIENBIC0g
// SIG // RzIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// SIG // AQCxrLNJVEuXHBIK2CV5kSJXKm/cuCbEQ3Nrwr8uUFr7
// SIG // FMJ2jkMBJUO0oeJF9Oi3e8N0zCLXtJQAAvdN7b+0t0Qk
// SIG // a81fRTvRRM5DEnMXgotptCvLmR6schsmTXEfsTHd+1Fh
// SIG // AlOmqvVJLAV4RaUvic7nmef+jOJXPz3GktxK+Hsz5HkK
// SIG // +/B1iEGc/8UDUZmq12yfk2mHZSmDhcJgFMTIyTsU2sCB
// SIG // 8B8NdN6SIqvK9/t0fCfm90obf6fDni2uiuqm5qonFn1h
// SIG // 95hxEbziUKFL5V365Q6nLJ+qZSDT2JboyHylTkhE/xni
// SIG // RAeSC9dohIBdanhkRc1gRn5UwRN8xXnxycFxAgMBAAGj
// SIG // gfowgfcwHQYDVR0OBBYEFF+a9W5czMx0mtTdfe8/2+xM
// SIG // gC7dMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcwAYYW
// SIG // aHR0cDovL29jc3AudGhhd3RlLmNvbTASBgNVHRMBAf8E
// SIG // CDAGAQH/AgEAMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6
// SIG // Ly9jcmwudGhhd3RlLmNvbS9UaGF3dGVUaW1lc3RhbXBp
// SIG // bmdDQS5jcmwwEwYDVR0lBAwwCgYIKwYBBQUHAwgwDgYD
// SIG // VR0PAQH/BAQDAgEGMCgGA1UdEQQhMB+kHTAbMRkwFwYD
// SIG // VQQDExBUaW1lU3RhbXAtMjA0OC0xMA0GCSqGSIb3DQEB
// SIG // BQUAA4GBAAMJm495739ZMKrvaLX64wkdu0+CBl03X6ZS
// SIG // nxaN6hySCURu9W3rWHww6PlpjSNzCxJvR6muORH4KrGb
// SIG // sBrDjutZlgCtzgxNstAxpghcKnr84nodV0yoZRjpeUBi
// SIG // JZZux8c3aoMhCI5B6t3ZVz8dd0mHKhYGXqY4aiISo1EZ
// SIG // g362MIIEozCCA4ugAwIBAgIQDs/0OMj+vzVuBNhqmBsa
// SIG // UDANBgkqhkiG9w0BAQUFADBeMQswCQYDVQQGEwJVUzEd
// SIG // MBsGA1UEChMUU3ltYW50ZWMgQ29ycG9yYXRpb24xMDAu
// SIG // BgNVBAMTJ1N5bWFudGVjIFRpbWUgU3RhbXBpbmcgU2Vy
// SIG // dmljZXMgQ0EgLSBHMjAeFw0xMjEwMTgwMDAwMDBaFw0y
// SIG // MDEyMjkyMzU5NTlaMGIxCzAJBgNVBAYTAlVTMR0wGwYD
// SIG // VQQKExRTeW1hbnRlYyBDb3Jwb3JhdGlvbjE0MDIGA1UE
// SIG // AxMrU3ltYW50ZWMgVGltZSBTdGFtcGluZyBTZXJ2aWNl
// SIG // cyBTaWduZXIgLSBHNDCCASIwDQYJKoZIhvcNAQEBBQAD
// SIG // ggEPADCCAQoCggEBAKJjCzlEuLsjp0RJuw7/ofBhClOT
// SIG // sJjbrSwPSsVu/4Y8U1UPFc4EPyv9qZaW2b5heQtbyUyG
// SIG // duXgQ0sile7CK0PBn9hotI5AT+6FOLkRxSPyZFjwFTJv
// SIG // TlehroikAtcqHs1L4d1j1ReJMluwXplaqJ0oUA4X7pbb
// SIG // YTtFUR3PElYLkkf8q672Zj1HrHBy55LnX80QucSDZJQZ
// SIG // vSWA4ejSIqXQugJ6oXeTW2XD7hd0vEGGKtwITIySjJEt
// SIG // nndEH2jWqHR32w5bMotWizO92WPISZ06xcXqMwvS8aMb
// SIG // 9Iu+2bNXizveBKd6IrIkri7HcMW+ToMmCPsLvalPmQjh
// SIG // EChyqs0CAwEAAaOCAVcwggFTMAwGA1UdEwEB/wQCMAAw
// SIG // FgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/
// SIG // BAQDAgeAMHMGCCsGAQUFBwEBBGcwZTAqBggrBgEFBQcw
// SIG // AYYeaHR0cDovL3RzLW9jc3Aud3Muc3ltYW50ZWMuY29t
// SIG // MDcGCCsGAQUFBzAChitodHRwOi8vdHMtYWlhLndzLnN5
// SIG // bWFudGVjLmNvbS90c3MtY2EtZzIuY2VyMDwGA1UdHwQ1
// SIG // MDMwMaAvoC2GK2h0dHA6Ly90cy1jcmwud3Muc3ltYW50
// SIG // ZWMuY29tL3Rzcy1jYS1nMi5jcmwwKAYDVR0RBCEwH6Qd
// SIG // MBsxGTAXBgNVBAMTEFRpbWVTdGFtcC0yMDQ4LTIwHQYD
// SIG // VR0OBBYEFEbGaaMOShQe1UzaUmMXP142vA3mMB8GA1Ud
// SIG // IwQYMBaAFF+a9W5czMx0mtTdfe8/2+xMgC7dMA0GCSqG
// SIG // SIb3DQEBBQUAA4IBAQB4O7SRKgBM8I9iMDd4o4QnB28Y
// SIG // st4l3KDUlAOqhk4ln5pAAxzdzuN5yyFoBtq2MrRtv/Qs
// SIG // JmMz5ElkbQ3mw2cO9wWkNWx8iRbG6bLfsundIMZxD82V
// SIG // dNy2XN69Nx9DeOZ4tc0oBCCjqvFLxIgpkQ6A0RH83Vx2
// SIG // bk9eDkVGQW4NsOo4mrE62glxEPwcebSAe6xp9P2ctgwW
// SIG // K/F/Wwk9m1viFsoTgW0ALjgNqCmPLOGy9FqpAa8VnCwv
// SIG // SRvbIrvD/niUUcOGsYKIXfA9tFGheTMrLnu53CAJE3Hr
// SIG // ahlbz+ilMFcsiUk/uc9/yb8+ImhjU5q9aXSsxR08f5Lg
// SIG // w7wc2AR1MIIFhTCCBG2gAwIBAgIQKcFbP6rNUmpOZ708
// SIG // Tn4/8jANBgkqhkiG9w0BAQUFADCBtDELMAkGA1UEBhMC
// SIG // VVMxFzAVBgNVBAoTDlZlcmlTaWduLCBJbmMuMR8wHQYD
// SIG // VQQLExZWZXJpU2lnbiBUcnVzdCBOZXR3b3JrMTswOQYD
// SIG // VQQLEzJUZXJtcyBvZiB1c2UgYXQgaHR0cHM6Ly93d3cu
// SIG // dmVyaXNpZ24uY29tL3JwYSAoYykxMDEuMCwGA1UEAxMl
// SIG // VmVyaVNpZ24gQ2xhc3MgMyBDb2RlIFNpZ25pbmcgMjAx
// SIG // MCBDQTAeFw0xMjA3MjUwMDAwMDBaFw0xNTA5MjAyMzU5
// SIG // NTlaMIHIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2Fs
// SIG // aWZvcm5pYTETMBEGA1UEBxMKU2FuIFJhZmFlbDEWMBQG
// SIG // A1UEChQNQXV0b2Rlc2ssIEluYzE+MDwGA1UECxM1RGln
// SIG // aXRhbCBJRCBDbGFzcyAzIC0gTWljcm9zb2Z0IFNvZnR3
// SIG // YXJlIFZhbGlkYXRpb24gdjIxHzAdBgNVBAsUFkRlc2ln
// SIG // biBTb2x1dGlvbnMgR3JvdXAxFjAUBgNVBAMUDUF1dG9k
// SIG // ZXNrLCBJbmMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQCoYmDrmd0Gq8ezSsDlfgaJFEFplNPNhWzM
// SIG // 2uFQaYAB/ggpQ11+N4B6ao+TqrNIWDIqt3JKhaU889nx
// SIG // l/7teWGwuOurstI2Z0bEDhXiXam/bicK2HVLyntliQ+6
// SIG // tT+nlgfN8tgB2NzM0BpE1YCnU2b6DwQw4V7BV+/F//83
// SIG // yGFOpePlumzXxNw9EKWkaq81slmmTxf7UxZgP9PGbLw8
// SIG // gLAPk4PTJI97+5BBqhkLb1YqSfWn3PNMfsNKhw/VwAN0
// SIG // dRKeM6H8SkOdz+osr+NyH86lsKQuics4fwK5uFSHQHsI
// SIG // t6Z0tqWvminRqceUi9ugRlGryh9X1ZqCqfL/ggdzYa3Z
// SIG // AgMBAAGjggF7MIIBdzAJBgNVHRMEAjAAMA4GA1UdDwEB
// SIG // /wQEAwIHgDBABgNVHR8EOTA3MDWgM6Axhi9odHRwOi8v
// SIG // Y3NjMy0yMDEwLWNybC52ZXJpc2lnbi5jb20vQ1NDMy0y
// SIG // MDEwLmNybDBEBgNVHSAEPTA7MDkGC2CGSAGG+EUBBxcD
// SIG // MCowKAYIKwYBBQUHAgEWHGh0dHBzOi8vd3d3LnZlcmlz
// SIG // aWduLmNvbS9ycGEwEwYDVR0lBAwwCgYIKwYBBQUHAwMw
// SIG // cQYIKwYBBQUHAQEEZTBjMCQGCCsGAQUFBzABhhhodHRw
// SIG // Oi8vb2NzcC52ZXJpc2lnbi5jb20wOwYIKwYBBQUHMAKG
// SIG // L2h0dHA6Ly9jc2MzLTIwMTAtYWlhLnZlcmlzaWduLmNv
// SIG // bS9DU0MzLTIwMTAuY2VyMB8GA1UdIwQYMBaAFM+Zqep7
// SIG // JvRLyY6P1/AFJu/j0qedMBEGCWCGSAGG+EIBAQQEAwIE
// SIG // EDAWBgorBgEEAYI3AgEbBAgwBgEBAAEB/zANBgkqhkiG
// SIG // 9w0BAQUFAAOCAQEA2OkGvuiY7TyI6yVTQAYmTO+MpOFG
// SIG // C8MflHSbofJiuLxrS1KXbkzsAPFPPsU1ouftFhsXFtDQ
// SIG // 8rMTq/jwugTpbJUREV0buEkLl8AKRhYQTKBKg1I/puBv
// SIG // bkJocDE0pRwtBz3xSlXXEwyYPcbCOnrM3OZ5bKx1Qiii
// SIG // vixlcGWhO3ws904ssutPFf4mV5PDi3U2Yp1HgbBK/Um/
// SIG // FLr6YAYeZaA8KY1CfQEisF3UKTwm72d7S+fJf++SOGea
// SIG // K0kumehVcbavQJTOVebuZ9V+qU0nk1lMrqve9BnQK69B
// SIG // QqNZu77vCO0wm81cfynAxkOYKZG3idY47qPJOgXKkwmI
// SIG // 2+92ozCCBgowggTyoAMCAQICEFIA5aolVvwahu2WydRL
// SIG // M8cwDQYJKoZIhvcNAQEFBQAwgcoxCzAJBgNVBAYTAlVT
// SIG // MRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEfMB0GA1UE
// SIG // CxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE6MDgGA1UE
// SIG // CxMxKGMpIDIwMDYgVmVyaVNpZ24sIEluYy4gLSBGb3Ig
// SIG // YXV0aG9yaXplZCB1c2Ugb25seTFFMEMGA1UEAxM8VmVy
// SIG // aVNpZ24gQ2xhc3MgMyBQdWJsaWMgUHJpbWFyeSBDZXJ0
// SIG // aWZpY2F0aW9uIEF1dGhvcml0eSAtIEc1MB4XDTEwMDIw
// SIG // ODAwMDAwMFoXDTIwMDIwNzIzNTk1OVowgbQxCzAJBgNV
// SIG // BAYTAlVTMRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEf
// SIG // MB0GA1UECxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE7
// SIG // MDkGA1UECxMyVGVybXMgb2YgdXNlIGF0IGh0dHBzOi8v
// SIG // d3d3LnZlcmlzaWduLmNvbS9ycGEgKGMpMTAxLjAsBgNV
// SIG // BAMTJVZlcmlTaWduIENsYXNzIDMgQ29kZSBTaWduaW5n
// SIG // IDIwMTAgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQD1I0tepdeKuzLp1Ff37+THJn6tGZj+qJ19
// SIG // lPY2axDXdYEwfwRof8srdR7NHQiM32mUpzejnHuA4Jnh
// SIG // 7jdNX847FO6G1ND1JzW8JQs4p4xjnRejCKWrsPvNamKC
// SIG // TNUh2hvZ8eOEO4oqT4VbkAFPyad2EH8nA3y+rn59wd35
// SIG // BbwbSJxp58CkPDxBAD7fluXF5JRx1lUBxwAmSkA8taEm
// SIG // qQynbYCOkCV7z78/HOsvlvrlh3fGtVayejtUMFMb32I0
// SIG // /x7R9FqTKIXlTBdOflv9pJOZf9/N76R17+8V9kfn+Bly
// SIG // 2C40Gqa0p0x+vbtPDD1X8TDWpjaO1oB21xkupc1+NC2J
// SIG // AgMBAAGjggH+MIIB+jASBgNVHRMBAf8ECDAGAQH/AgEA
// SIG // MHAGA1UdIARpMGcwZQYLYIZIAYb4RQEHFwMwVjAoBggr
// SIG // BgEFBQcCARYcaHR0cHM6Ly93d3cudmVyaXNpZ24uY29t
// SIG // L2NwczAqBggrBgEFBQcCAjAeGhxodHRwczovL3d3dy52
// SIG // ZXJpc2lnbi5jb20vcnBhMA4GA1UdDwEB/wQEAwIBBjBt
// SIG // BggrBgEFBQcBDARhMF+hXaBbMFkwVzBVFglpbWFnZS9n
// SIG // aWYwITAfMAcGBSsOAwIaBBSP5dMahqyNjmvDz4Bq1EgY
// SIG // LHsZLjAlFiNodHRwOi8vbG9nby52ZXJpc2lnbi5jb20v
// SIG // dnNsb2dvLmdpZjA0BgNVHR8ELTArMCmgJ6AlhiNodHRw
// SIG // Oi8vY3JsLnZlcmlzaWduLmNvbS9wY2EzLWc1LmNybDA0
// SIG // BggrBgEFBQcBAQQoMCYwJAYIKwYBBQUHMAGGGGh0dHA6
// SIG // Ly9vY3NwLnZlcmlzaWduLmNvbTAdBgNVHSUEFjAUBggr
// SIG // BgEFBQcDAgYIKwYBBQUHAwMwKAYDVR0RBCEwH6QdMBsx
// SIG // GTAXBgNVBAMTEFZlcmlTaWduTVBLSS0yLTgwHQYDVR0O
// SIG // BBYEFM+Zqep7JvRLyY6P1/AFJu/j0qedMB8GA1UdIwQY
// SIG // MBaAFH/TZafC3ey78DAJ80M5+gKvMzEzMA0GCSqGSIb3
// SIG // DQEBBQUAA4IBAQBWIuY0pMRhy0i5Aa1WqGQP2YyRxLvM
// SIG // DOWteqAif99HOEotbNF/cRp87HCpsfBP5A8MU/oVXv50
// SIG // mEkkhYEmHJEUR7BMY4y7oTTUxkXoDYUmcwPQqYxkbdxx
// SIG // kuZFBWAVWVE5/FgUa/7UpO15awgMQXLnNyIGCb4j6T9E
// SIG // mh7pYZ3MsZBc/D3SjaxCPWU21LQ9QCiPmxDPIybMSyDL
// SIG // kB9djEw0yjzY5TfWb6UgvTTrJtmuDefFmvehtCGRM2+G
// SIG // 6Fi7JXx0Dlj+dRtjP84xfJuPG5aexVN2hFucrZH6rO2T
// SIG // ul3IIVPCglNjrxINUIcRGz1UUpaKLJw9khoImgUux5Ol
// SIG // SJHTMYIEtzCCBLMCAQEwgckwgbQxCzAJBgNVBAYTAlVT
// SIG // MRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEfMB0GA1UE
// SIG // CxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE7MDkGA1UE
// SIG // CxMyVGVybXMgb2YgdXNlIGF0IGh0dHBzOi8vd3d3LnZl
// SIG // cmlzaWduLmNvbS9ycGEgKGMpMTAxLjAsBgNVBAMTJVZl
// SIG // cmlTaWduIENsYXNzIDMgQ29kZSBTaWduaW5nIDIwMTAg
// SIG // Q0ECECnBWz+qzVJqTme9PE5+P/IwCQYFKw4DAhoFAKCB
// SIG // tDAZBgkqhkiG9w0BCQMxDAYKKwYBBAGCNwIBBDAcBgor
// SIG // BgEEAYI3AgELMQ4wDAYKKwYBBAGCNwIBFTAjBgkqhkiG
// SIG // 9w0BCQQxFgQUcZJtOdeMhQUmwlSUOr4nxrmWnfMwVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQBbQ84Jk2E95ho4TfYPS8o7KHT14wpkpLO6wjhpcuIl
// SIG // yW48K1KnjTwEAaB+nh0jbc8jRrIR46girzBr8oQS0Vmy
// SIG // qbwjuXal659Q9MeELsBfSQbbUEVbbEOZUgL3qZrRpym6
// SIG // 22b3eXwyyYixvLCEyK/y5WVZIBwcTAYgBcth6UAJyoeZ
// SIG // Ci0VhwYT1zSB4ZQHO+ToGef0GP63+n2Cl0Q2i1qfhqnJ
// SIG // +1tJ3Snn7URgdkW2un2HYjyhnhpMUmUffTc4kOfWT4KG
// SIG // JsEgpdKw+ObdjeiFMioVKynHI60qIIFcet8EXIYsa97v
// SIG // GvogFWfNlcDz8C1iM+6URKECieWjBXdqs492oYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyOVowIwYJKoZIhvcNAQkEMRYEFFyB49JU
// SIG // 8lB3rKwMwCZAq9HclfsvMA0GCSqGSIb3DQEBAQUABIIB
// SIG // AIVu8kfB7zFYV+IGXy1eby7eEutifYZEfz+NGhVf4v4q
// SIG // s0XSmyDJwsuvJE4iIp1iNpEX/pdysW5qqOk+fH4UziqK
// SIG // pE9oOQ4tSvmLjbWEd1ak3+GjILMSIZM2MOXKzb9jltMu
// SIG // 615d9S/zhVyf1ht9b1hc0cLDMKFH1O3VZLYE0qG4MdUV
// SIG // lr+Zz2swp1fpKXME9lh3Dx7aSEI2N9Y0UU9CQltlHpbK
// SIG // 1brzLfqR3j5x3LLUG1LIHPbsIN7MqyL0v7RUqsG6RZ1G
// SIG // QkbuwtCcrhoZEDNXse1eawOHEZ7ICxqiMyPgvOkF1RTW
// SIG // fV82VO7IOvedYkM11pT84xVzj43BQeWlopk=
// SIG // End signature block
