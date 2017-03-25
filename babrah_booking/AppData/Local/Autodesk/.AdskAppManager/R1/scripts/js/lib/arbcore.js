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
 * @fileoverview Application Resource Bundle (ARB) supporting library.
 * This library provides a set of API to access resource stored in ARB and
 * methods to localize the HTML DOM tree using those resources.
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Creates arb namespace.
 */
var arb = {};


/**
 * This is the global resource selector that can be used to switch locale,
 * scheme, etc. globally. Empty string is a valid value that means no global
 * selector.
 * @type {string}
 * @private
 */
arb.resourceSelector_ = '';


/**
 * Sets resource selector. This will affect all future resource selection.
 *
 * @param {string} selector resource selection string joined by ':'.
 */
arb.setResourceSelector = function(selector) {
  arb.resourceSelector_ = selector;
};


/**
 * DOM text node type.
 */
arb.TEXT_NODE_TYPE = 3;


/**
 * Cross-browser function for setting the text content of an element.
 * Code is borrowed from Closure.
 *
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 * @private
 */
arb.setTextContent_ = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == arb.TEXT_NODE_TYPE) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    var child;
    while ((child = element.firstChild)) {
      node.removeChild(child);
    }
    element.appendChild(element.ownerDocument.createTextNode(text));
  }
};


/**
 * Performs message substitution in DOM tree.
 */
arb.localizeHtml = function() {
  var resource = arb.getResource();
  arb.localizeSubtree(document, resource);
};


/**
 * Localizes a DOM subtree start from given elem.
 *
 * @param {Document | Element} elem the root of the subtree to be visited.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.localizeSubtree = function(elem, resource) {
  if (elem) {
    var origResource = resource;
    // If namespace is specified in the element, use it in its scope.
    if (elem.getAttribute && elem.getAttribute('arb:namespace')) {
      resource = arb.getResource(elem.getAttribute('arb:namespace')) ||
          resource;
    }

    // If no resource specified, don't do anything. There is nothing wrong
    // about it. A page can choose to skip localization this way.
    if (resource) {
      arb.localizeNode(elem, resource);
      for (var i = 0; i < elem.childNodes.length; i++) {
        var child = elem.childNodes[i];
        arb.localizeSubtree(child, resource);
      }
    }
    resource = origResource;
  }
};


/**
 * Localizes a DOM element. Different type of element has different type of
 * attribute to be localized, not necessarily text content.
 *
 * @param {Document | Element} elem the DOM element to be localized.
 * @param {Object.<string, string|Object>} resource resource bundle.
 */
arb.localizeNode = function(elem, resource) {
  var resId = elem.getAttribute && elem.getAttribute('arb:id') || elem.id;

  if (!resId) {
    return;
  }

  switch(elem.nodeName) {
    case 'IMG':
      arb.localizeElement_(elem, resId, resource, ['src', 'alt']);
      break;
    case 'INPUT':
      arb.localizeElement_(elem, resId, resource,
                           ['value', 'placeholder', 'defaultValue']);
      break;
    case 'AREA':
      arb.localizeElement_(elem, resId, resource, ['alt']);
      break;
    case 'OBJECT':
      arb.localizeElement_(elem, resId, resource, ['standby']);
      break;
    case 'OPTION':
      arb.localizeElement_(elem, resId, resource, ['value', 'label']);
      break;
    case 'OPTGROUP':
      arb.localizeElement_(elem, resId, resource, ['label']);
      break;
    case 'STYLE':
      if (resId in resource) {
        if (elem.styleSheet) {
          elem.styleSheet.cssText = resource[resId];
        } else {
          arb.setTextContent_(elem, resource[resId]);
        }
      }
      break;
    default:
      (resId in resource) && arb.setTextContent_(elem, resource[resId]);
  }
};


/**
 * Injects localized resource into element's attribute.
 *
 * @param {Element} elem the DOM element that need to have resource injected.
 * @param {string} resId ARB resource id.
 * @param {Object.<string, string|Object>} resource  ARB resource bundle.
 * @param {Array.<string>} attrs possible attributes in this element that may
 *     take localization resource.
 * @private
 */
arb.localizeElement_ = function(elem, resId, resource, attrs) {
  for (var i = 0; i < attrs.length; i++) {
    var fieldId = resId + '@' + attrs[i];
    (fieldId in resource) && (elem[attrs[i]] = resource[fieldId]);
  }
};


/**
 * Replaces placeholder in string with given values. For the time being
 * {} is used to mark placeholder. Placeholder will only be replaced if
 * a named argument or positional argument is available.
 *
 * @param {string} str message string possibly with placeholders.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string with placeholder(s) replaced.
 */
arb.msg = function(str, opt_values) {
  // Plural support is an optional feature. When it is desired, developer
  // should include arbplural.js, where arb.processPluralRules_ is defined.
  if (arb.processPluralRules_) {
    str = arb.processPluralRules_(str, opt_values);
  }
  var type = typeof opt_values;
  if (type == 'object' || type == 'function') {
    for (var key in opt_values) {
      var value = ('' + opt_values[key]).replace(/\$/g, '$$$$');
      str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), value);
    }
  } else {
     for (var i = 1; i < arguments.length; i++) {
       str = str.replace(
           new RegExp('\\{' + (i - 1) + '\\}', 'g'), arguments[i]);
     }
  }
  return str;
};


/**
 * Resource name part as it appears in regular expression.
 * @type {number}
 * @private
 */
arb.RESOURCE_NAME_PART_ = 1;


/**
 * Obtains the resouce name from URL. That will allow resource to be selected
 * through use of url parameter.
 *
 * @return {string} arb name as passed in Url.
 */
arb.getParamFromUrl = function(paramName) {
  var regex = new RegExp('[\\\\?&]' + paramName + '=([^&#]*)', 'i');
  var m = regex.exec(window.location.href);
  return m ? m[arb.RESOURCE_NAME_PART_] : null;
};


/**
 * Maps ARB namespace into ARB instance.
 * @type {Object.<string, Object>}
 * @private
 */
arb.resourceMap_ = {};


/**
 * Checks if an object is empty or not.
 *
 * @param  {Object} obj An object to be checked for emptiness.
 * @return {boolean} true if the object has not direct properties.
 * @private
 */
arb.isEmpty = function(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};


/**
 * Namespace delimiter.
 * @type {string}
 * @private
 */
arb.NAMESPACE_DELIMITER_ = ':';


/**
 * Registers a ARB resource object.
 *
 * @param {string|array.string} namespaces ARB resource object's namespaces.
 *     This parameter can be either a string or an array, the later allows a
 *     resource to be registered under different names.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.register = function(namespaces, resource) {
  if (typeof namespaces == 'string') {
    arb.resourceMap_[namespaces] = resource;
  } else {
    for (var i = 0; i < namespaces.length; i++) {
      arb.resourceMap_[namespaces[i]] = resource;
    }
  }
};


/**
 * Calls the callback for all the registerd namespace/locale pairs. This
 * function only iterates through fully qualified namespaces.
 *
 * @param {function(string)} arbCallback
 */
arb.iterateRegistry = function(arbCallback) {
  for (var namespace in arb.resourceMap_) {
    if (arb.resourceMap_.hasOwnProperty(namespace)) {
      arbCallback(namespace);
    }
  }
};


/**
 * Retrieves ARB resource object that best fits selector given. The algorithm
 * of this method tries to satisfy the selector as much as possible, and does
 * it in the specified priority. Selector given to this method takes priority
 * over global resource selector set through "setResourceSelector".
 *
 * @param {?string} opt_selector resource selector used to choose desired ARB
 *        resource object together with global resource selector.
 *
 * @return {Object.<string, string|Object>} The ARB resource object desired.
 *     or empty object if no ARB resource object registered with given
 *     namespace.
 */
arb.getResource = function(opt_selector) {
  var candidates = arb.resourceMap_;
  if (!opt_selector) {
    opt_selector = arb.resourceSelector_;
  } else if (arb.resourceSelector_) {
    opt_selector += arb.NAMESPACE_DELIMITER_ + arb.resourceSelector_;
  }

  // If opt_namespace is not given, default namespace will be used.
  if (opt_selector) {
    // This will only be true if opt_namespace is fully qualified.
    if (opt_selector in arb.resourceMap_) {
        return arb.resourceMap_[opt_selector];
    }

    var parts = opt_selector.split(arb.NAMESPACE_DELIMITER_);
    for (var i = 0; i < parts.length; i++) {
      var newCandidates = {};
      var pattern = new RegExp('(:|^)' + parts[i] + '(:|$)');
      for (var namespace in candidates) {
        if (pattern.test(namespace)) {
          newCandidates[namespace] = candidates[namespace];
        }
      }
      if (!arb.isEmpty(newCandidates)) {
        candidates = newCandidates;
      }
    }
  }

  var minLength = Number.MAX_VALUE;
  var bestNamespace = '';
  for (var namespace in candidates) {
    if (!namespace) { // empty string
      bestNamespace = namespace;
      break;
    }
    var len = namespace.split(arb.NAMESPACE_DELIMITER_).length;
    if (len < minLength) {
      minLength = len;
      bestNamespace = namespace;
    }
  }

  if (arb.resourceMap_.hasOwnProperty(bestNamespace)) {
    return arb.resourceMap_[bestNamespace];
  }
  return {};
};

/**
 * Checks if the given arb instance is in compact form.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @return {boolean} true if it is in compact form.
 */
arb.isCompact = function(resource) {
  for (var prop in resource) {
    if (resource.hasOwnProperty(prop) && prop[0] == '@') {
      return false;
    }
  }
  return true;
};


/**
 * Creates namespace for development mode methods.
 */
arb.dbg = {};


/**
 * Returns type of data as identified by resource id.
 * The type information might not be available for specified resource. Empty
 * string will be returned in such case.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id.
 *
 * @return {string} type string if available, or empty string.
 */
arb.dbg.getType = function(resource, resId) {
  if (resId.charAt(0) == '@') {
    return 'attr';
  }
  var atResId = '@' + resId;
  if (resource.hasOwnProperty(atResId) &&
      resource[atResId].hasOwnProperty('type')) {
    return resource[atResId]['type'];
  }
  return '';
};


/**
 * Checks if the resource identified by resId is in given context. If the
 * resource has no context or if the desired context is the prefix of
 * resource's context, it will return true as well.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id to be checked.
 * @param {string} context context desired.
 *
 * @return {boolean} true if the resource is in given context.
 */
arb.dbg.isInContext = function(resource, resId, context) {
  var contextRegex = new RegExp('^' + context + '($|:.*)');
  var atResId = '@' + resId;
  return resId.charAt(0) != '@' &&
      (!resource.hasOwnProperty(atResId) ||
       !resource[atResId].hasOwnProperty('context') ||
       contextRegex.test(resource[atResId]['context']));
};


/**
 * Returns the value of an attribute for a resource. Empty string will
 * be returned if attribute is not available.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId id of the resource to be checked.
 * @param {string} attrName attribute name of interest.
 *
 * @return {string} attribute value desired, or empty string.
 */
arb.dbg.getAttr = function(resource, resId, attrName) {
  var atResId = '@' + resId;
  if (!resource.hasOwnProperty(atResId)) {
    return '';
  }

  var msgAttr = resource[atResId];
  return msgAttr.hasOwnProperty(attrName) ? msgAttr[attrName] : '';
};


// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFMQmEvDaxl1m
// SIG // zhi40lG9sAJZ6ZRXoIIUMDCCA+4wggNXoAMCAQICEH6T
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
// SIG // 9w0BCQQxFgQUhDYr1hSpVzYZuJc0Zb810bvAr2EwVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQAkbEVZ93PhiOkStuNJ+4jnGC4DXHg+VsX180AdlL2y
// SIG // urhcqPkKN9Wy1LZbrJMX40FdA88e4tDq9k1Yzpn43rDW
// SIG // J1coyECdvDYS9qveroJWa7uUDLUVS+AigyesMfP0hrQO
// SIG // /QphHV1hdiIRXpKbliE0BHEKFeK7l4O5tcFRZzgAeEG3
// SIG // 4NhuW3jOdL0QW4+mGU/TUAKuI/xy+BgDzucFVFmVrW62
// SIG // QldTtKv9hdkh2b0CvY82nCCH6d08gLzja1/erDcrRE4l
// SIG // 9S1K8rOsHQy6mAFri6tUZwAIXDhffjV7cA1iygw60cD7
// SIG // JLZwJV6wvEgFMgs4y6HT3Lq9EOFfVrKaPSVqoYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyOVowIwYJKoZIhvcNAQkEMRYEFCA+DIHM
// SIG // JAspmFSsZKZ42HUnNAZ2MA0GCSqGSIb3DQEBAQUABIIB
// SIG // ACi1MYMDlFwC49Bfd2bz8GNpWtsP7/V4FcSIk9y4CoKI
// SIG // R2L/CkKGld0KAqWspL3qV7f+aU7Q4wehjGWZGYUTStXN
// SIG // NtKKD7ZKEpxeR2dEYFOrvP3FN8BKty3xfAO0831cbg3L
// SIG // 1Ecig8qGceDDlmrtiAzpi/sKo7znYl3r5QvKP3hUYCiw
// SIG // xzGYo/Cqqsvu4qF15I/MYkAYAPNb/dnhp6H6rxEYoPCC
// SIG // Kd5Pa+Vjk2IA7grk+tNkoYbf6boD0auQMhlmkO5rUWFx
// SIG // HADSqLqWKsPnje0l43zut40dUMA8k6dIZzP/uonHHL6i
// SIG // BJyGyJV7ruXXqPHoBmNhqREUF3ImH1shhws=
// SIG // End signature block
