"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inspectObject = inspectObject;
exports.parseCapsForInnerDriver = parseCapsForInnerDriver;
exports.insertAppiumPrefixes = insertAppiumPrefixes;
exports.getPackageVersion = getPackageVersion;
exports.pullSettings = pullSettings;
exports.rootDir = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _findRoot = _interopRequireDefault(require("find-root"));

const W3C_APPIUM_PREFIX = 'appium';

function inspectObject(args) {
  function getValueArray(obj, indent = '  ') {
    if (!_lodash.default.isObject(obj)) {
      return [obj];
    }

    let strArr = ['{'];

    for (let [arg, value] of _lodash.default.toPairs(obj)) {
      if (!_lodash.default.isObject(value)) {
        strArr.push(`${indent}  ${arg}: ${value}`);
      } else {
        value = getValueArray(value, `${indent}  `);
        strArr.push(`${indent}  ${arg}: ${value.shift()}`);
        strArr.push(...value);
      }
    }

    strArr.push(`${indent}}`);
    return strArr;
  }

  for (let [arg, value] of _lodash.default.toPairs(args)) {
    value = getValueArray(value);

    _logger.default.info(`  ${arg}: ${value.shift()}`);

    for (let val of value) {
      _logger.default.info(val);
    }
  }
}

function parseCapsForInnerDriver(jsonwpCapabilities, w3cCapabilities, constraints = {}, defaultCapabilities = {}) {
  const hasW3CCaps = _lodash.default.isPlainObject(w3cCapabilities) && (_lodash.default.has(w3cCapabilities, 'alwaysMatch') || _lodash.default.has(w3cCapabilities, 'firstMatch'));

  const hasJSONWPCaps = _lodash.default.isPlainObject(jsonwpCapabilities);

  let protocol = null;
  let desiredCaps = {};
  let processedW3CCapabilities = null;
  let processedJsonwpCapabilities = null;

  if (!hasJSONWPCaps && !hasW3CCaps) {
    return {
      protocol: _appiumBaseDriver.BaseDriver.DRIVER_PROTOCOL.W3C,
      error: new Error('Either JSONWP or W3C capabilities should be provided')
    };
  }

  const {
    W3C,
    MJSONWP
  } = _appiumBaseDriver.BaseDriver.DRIVER_PROTOCOL;
  jsonwpCapabilities = _lodash.default.cloneDeep(jsonwpCapabilities);
  w3cCapabilities = _lodash.default.cloneDeep(w3cCapabilities);
  defaultCapabilities = _lodash.default.cloneDeep(defaultCapabilities);

  if (!_lodash.default.isEmpty(defaultCapabilities)) {
    if (hasW3CCaps) {
      const {
        firstMatch = [],
        alwaysMatch = {}
      } = w3cCapabilities;

      for (const [defaultCapKey, defaultCapValue] of _lodash.default.toPairs(defaultCapabilities)) {
        let isCapAlreadySet = false;

        for (const firstMatchEntry of firstMatch) {
          if (_lodash.default.has(removeW3CPrefixes(firstMatchEntry), removeW3CPrefix(defaultCapKey))) {
            isCapAlreadySet = true;
            break;
          }
        }

        isCapAlreadySet = isCapAlreadySet || _lodash.default.has(removeW3CPrefixes(alwaysMatch), removeW3CPrefix(defaultCapKey));

        if (isCapAlreadySet) {
          continue;
        }

        if (_lodash.default.isEmpty(firstMatch)) {
          w3cCapabilities.firstMatch = [{
            [defaultCapKey]: defaultCapValue
          }];
        } else {
          firstMatch[0][defaultCapKey] = defaultCapValue;
        }
      }
    }

    if (hasJSONWPCaps) {
      jsonwpCapabilities = Object.assign({}, removeW3CPrefixes(defaultCapabilities), jsonwpCapabilities);
    }
  }

  if (hasJSONWPCaps) {
    protocol = MJSONWP;
    desiredCaps = jsonwpCapabilities;
    processedJsonwpCapabilities = removeW3CPrefixes((0, _objectSpread2.default)({}, desiredCaps));
  }

  if (hasW3CCaps) {
    protocol = W3C;
    let isFixingNeededForW3cCaps = false;

    try {
      desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
    } catch (error) {
      if (!hasJSONWPCaps) {
        return {
          desiredCaps,
          processedJsonwpCapabilities,
          processedW3CCapabilities,
          protocol,
          error
        };
      }

      _logger.default.info(`Could not parse W3C capabilities: ${error.message}`);

      isFixingNeededForW3cCaps = true;
    }

    if (hasJSONWPCaps && !isFixingNeededForW3cCaps) {
      const differingKeys = _lodash.default.difference(_lodash.default.keys(processedJsonwpCapabilities), _lodash.default.keys(removeW3CPrefixes(desiredCaps)));

      if (!_lodash.default.isEmpty(differingKeys)) {
        _logger.default.info(`The following capabilities were provided in the JSONWP desired capabilities that are missing ` + `in W3C capabilities: ${JSON.stringify(differingKeys)}`);

        isFixingNeededForW3cCaps = true;
      }
    }

    if (isFixingNeededForW3cCaps && hasJSONWPCaps) {
      _logger.default.info('Trying to fix W3C capabilities by merging them with JSONWP caps');

      w3cCapabilities = fixW3cCapabilities(w3cCapabilities, jsonwpCapabilities);

      try {
        desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
      } catch (error) {
        _logger.default.warn(`Could not parse fixed W3C capabilities: ${error.message}. Falling back to JSONWP protocol`);

        return {
          desiredCaps: processedJsonwpCapabilities,
          processedJsonwpCapabilities,
          processedW3CCapabilities: null,
          protocol: MJSONWP
        };
      }
    }

    processedW3CCapabilities = {
      alwaysMatch: (0, _objectSpread2.default)({}, insertAppiumPrefixes(desiredCaps)),
      firstMatch: [{}]
    };
  }

  return {
    desiredCaps,
    processedJsonwpCapabilities,
    processedW3CCapabilities,
    protocol
  };
}

function fixW3cCapabilities(w3cCaps, jsonwpCaps) {
  const result = {
    firstMatch: w3cCaps.firstMatch || [],
    alwaysMatch: w3cCaps.alwaysMatch || {}
  };

  const keysToInsert = _lodash.default.keys(jsonwpCaps);

  const removeMatchingKeys = match => {
    _lodash.default.pull(keysToInsert, match);

    const colonIndex = match.indexOf(':');

    if (colonIndex >= 0 && match.length > colonIndex) {
      _lodash.default.pull(keysToInsert, match.substring(colonIndex + 1));
    }

    if (keysToInsert.includes(`${W3C_APPIUM_PREFIX}:${match}`)) {
      _lodash.default.pull(keysToInsert, `${W3C_APPIUM_PREFIX}:${match}`);
    }
  };

  for (const firstMatchEntry of result.firstMatch) {
    for (const pair of _lodash.default.toPairs(firstMatchEntry)) {
      removeMatchingKeys(pair[0]);
    }
  }

  for (const pair of _lodash.default.toPairs(result.alwaysMatch)) {
    removeMatchingKeys(pair[0]);
  }

  for (const key of keysToInsert) {
    result.alwaysMatch[key] = jsonwpCaps[key];
  }

  return result;
}

function insertAppiumPrefixes(caps) {
  const STANDARD_CAPS = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];
  let prefixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    if (STANDARD_CAPS.includes(name) || name.includes(':')) {
      prefixedCaps[name] = value;
    } else {
      prefixedCaps[`${W3C_APPIUM_PREFIX}:${name}`] = value;
    }
  }

  return prefixedCaps;
}

function removeW3CPrefixes(caps) {
  if (!_lodash.default.isPlainObject(caps)) {
    return caps;
  }

  const fixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    fixedCaps[removeW3CPrefix(name)] = value;
  }

  return fixedCaps;
}

function removeW3CPrefix(key) {
  const colonPos = key.indexOf(':');
  return colonPos > 0 && key.length > colonPos ? key.substring(colonPos + 1) : key;
}

function getPackageVersion(pkgName) {
  const pkgInfo = require(`${pkgName}/package.json`) || {};
  return pkgInfo.version;
}

function pullSettings(caps) {
  if (!_lodash.default.isPlainObject(caps) || _lodash.default.isEmpty(caps)) {
    return {};
  }

  const result = {};

  for (const [key, value] of _lodash.default.toPairs(caps)) {
    const match = /\bsettings\[(\S+)\]$/.exec(key);

    if (!match) {
      continue;
    }

    result[match[1]] = value;
    delete caps[key];
  }

  return result;
}

const rootDir = (0, _findRoot.default)(__dirname);
exports.rootDir = rootDir;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJXM0NfQVBQSVVNX1BSRUZJWCIsImluc3BlY3RPYmplY3QiLCJhcmdzIiwiZ2V0VmFsdWVBcnJheSIsIm9iaiIsImluZGVudCIsIl8iLCJpc09iamVjdCIsInN0ckFyciIsImFyZyIsInZhbHVlIiwidG9QYWlycyIsInB1c2giLCJzaGlmdCIsImxvZ2dlciIsImluZm8iLCJ2YWwiLCJwYXJzZUNhcHNGb3JJbm5lckRyaXZlciIsImpzb253cENhcGFiaWxpdGllcyIsInczY0NhcGFiaWxpdGllcyIsImNvbnN0cmFpbnRzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImhhc1czQ0NhcHMiLCJpc1BsYWluT2JqZWN0IiwiaGFzIiwiaGFzSlNPTldQQ2FwcyIsInByb3RvY29sIiwiZGVzaXJlZENhcHMiLCJwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMiLCJwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMiLCJCYXNlRHJpdmVyIiwiRFJJVkVSX1BST1RPQ09MIiwiVzNDIiwiZXJyb3IiLCJFcnJvciIsIk1KU09OV1AiLCJjbG9uZURlZXAiLCJpc0VtcHR5IiwiZmlyc3RNYXRjaCIsImFsd2F5c01hdGNoIiwiZGVmYXVsdENhcEtleSIsImRlZmF1bHRDYXBWYWx1ZSIsImlzQ2FwQWxyZWFkeVNldCIsImZpcnN0TWF0Y2hFbnRyeSIsInJlbW92ZVczQ1ByZWZpeGVzIiwicmVtb3ZlVzNDUHJlZml4IiwiT2JqZWN0IiwiYXNzaWduIiwiaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzIiwibWVzc2FnZSIsImRpZmZlcmluZ0tleXMiLCJkaWZmZXJlbmNlIiwia2V5cyIsIkpTT04iLCJzdHJpbmdpZnkiLCJmaXhXM2NDYXBhYmlsaXRpZXMiLCJ3YXJuIiwiaW5zZXJ0QXBwaXVtUHJlZml4ZXMiLCJ3M2NDYXBzIiwianNvbndwQ2FwcyIsInJlc3VsdCIsImtleXNUb0luc2VydCIsInJlbW92ZU1hdGNoaW5nS2V5cyIsIm1hdGNoIiwicHVsbCIsImNvbG9uSW5kZXgiLCJpbmRleE9mIiwibGVuZ3RoIiwic3Vic3RyaW5nIiwiaW5jbHVkZXMiLCJwYWlyIiwia2V5IiwiY2FwcyIsIlNUQU5EQVJEX0NBUFMiLCJwcmVmaXhlZENhcHMiLCJuYW1lIiwiZml4ZWRDYXBzIiwiY29sb25Qb3MiLCJnZXRQYWNrYWdlVmVyc2lvbiIsInBrZ05hbWUiLCJwa2dJbmZvIiwicmVxdWlyZSIsInZlcnNpb24iLCJwdWxsU2V0dGluZ3MiLCJleGVjIiwicm9vdERpciIsIl9fZGlybmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsaUJBQWlCLEdBQUcsUUFBMUI7O0FBRUEsU0FBU0MsYUFBVCxDQUF3QkMsSUFBeEIsRUFBOEI7QUFDNUIsV0FBU0MsYUFBVCxDQUF3QkMsR0FBeEIsRUFBNkJDLE1BQU0sR0FBRyxJQUF0QyxFQUE0QztBQUMxQyxRQUFJLENBQUNDLGdCQUFFQyxRQUFGLENBQVdILEdBQVgsQ0FBTCxFQUFzQjtBQUNwQixhQUFPLENBQUNBLEdBQUQsQ0FBUDtBQUNEOztBQUVELFFBQUlJLE1BQU0sR0FBRyxDQUFDLEdBQUQsQ0FBYjs7QUFDQSxTQUFLLElBQUksQ0FBQ0MsR0FBRCxFQUFNQyxLQUFOLENBQVQsSUFBeUJKLGdCQUFFSyxPQUFGLENBQVVQLEdBQVYsQ0FBekIsRUFBeUM7QUFDdkMsVUFBSSxDQUFDRSxnQkFBRUMsUUFBRixDQUFXRyxLQUFYLENBQUwsRUFBd0I7QUFDdEJGLFFBQUFBLE1BQU0sQ0FBQ0ksSUFBUCxDQUFhLEdBQUVQLE1BQU8sS0FBSUksR0FBSSxLQUFJQyxLQUFNLEVBQXhDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xBLFFBQUFBLEtBQUssR0FBR1AsYUFBYSxDQUFDTyxLQUFELEVBQVMsR0FBRUwsTUFBTyxJQUFsQixDQUFyQjtBQUNBRyxRQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBYSxHQUFFUCxNQUFPLEtBQUlJLEdBQUksS0FBSUMsS0FB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K0M7QUFDN0MsV0FBTyxFQUFQO0FBQ0Q7O0FBRUQsUUFBTVosTUFBTSxHQUFHLEVBQWY7O0FBQ0EsT0FBSyxNQUFNLENBQUNXLEdBQUQsRUFBTTdELEtBQU4sQ0FBWCxJQUEyQkosZ0JBQUVLLE9BQUYsQ0FBVTZELElBQVYsQ0FBM0IsRUFBNEM7QUFDMUMsVUFBTVQsS0FBSyxHQUFHLHVCQUF1QnFCLElBQXZCLENBQTRCYixHQUE1QixDQUFkOztBQUNBLFFBQUksQ0FBQ1IsS0FBTCxFQUFZO0FBQ1Y7QUFDRDs7QUFFREgsSUFBQUEsTUFBTSxDQUFDRyxLQUFLLENBQUMsQ0FBRCxDQUFOLENBQU4sR0FBbUJyRCxLQUFuQjtBQUNBLFdBQU84RCxJQUFJLENBQUNELEdBQUQsQ0FBWDtBQUNEOztBQUNELFNBQU9YLE1BQVA7QUFDRDs7QUFFRCxNQUFNeUIsT0FBTyxHQUFHLHVCQUFTQyxTQUFULENBQWhCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgcHJvY2Vzc0NhcGFiaWxpdGllcywgQmFzZURyaXZlciB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgZmluZFJvb3QgZnJvbSAnZmluZC1yb290JztcblxuY29uc3QgVzNDX0FQUElVTV9QUkVGSVggPSAnYXBwaXVtJztcblxuZnVuY3Rpb24gaW5zcGVjdE9iamVjdCAoYXJncykge1xuICBmdW5jdGlvbiBnZXRWYWx1ZUFycmF5IChvYmosIGluZGVudCA9ICcgICcpIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkge1xuICAgICAgcmV0dXJuIFtvYmpdO1xuICAgIH1cblxuICAgIGxldCBzdHJBcnIgPSBbJ3snXTtcbiAgICBmb3IgKGxldCBbYXJnLCB2YWx1ZV0gb2YgXy50b1BhaXJzKG9iaikpIHtcbiAgICAgIGlmICghXy5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBnZXRWYWx1ZUFycmF5KHZhbHVlLCBgJHtpbmRlbnR9ICBgKTtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlLnNoaWZ0KCl9YCk7XG4gICAgICAgIHN0ckFyci5wdXNoKC4uLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fX1gKTtcbiAgICByZXR1cm4gc3RyQXJyO1xuICB9XG4gIGZvciAobGV0IFthcmcsIHZhbHVlXSBvZiBfLnRvUGFpcnMoYXJncykpIHtcbiAgICB2YWx1ZSA9IGdldFZhbHVlQXJyYXkodmFsdWUpO1xuICAgIGxvZ2dlci5pbmZvKGAgICR7YXJnfTogJHt2YWx1ZS5zaGlmdCgpfWApO1xuICAgIGZvciAobGV0IHZhbCBvZiB2YWx1ZSkge1xuICAgICAgbG9nZ2VyLmluZm8odmFsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyB0aGUgY2FwcyB0aGF0IHdlcmUgcHJvdmlkZWQgaW4gdGhlIHJlcXVlc3QgYW5kIHRyYW5zbGF0ZXMgdGhlbVxuICogaW50byBjYXBzIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIGlubmVyIGRyaXZlcnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGpzb253cENhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IHczY0NhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IGNvbnN0cmFpbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmYXVsdENhcGFiaWxpdGllc1xuICovXG5mdW5jdGlvbiBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciAoanNvbndwQ2FwYWJpbGl0aWVzLCB3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzID0ge30sIGRlZmF1bHRDYXBhYmlsaXRpZXMgPSB7fSkge1xuICAvLyBDaGVjayBpZiB0aGUgY2FsbGVyIHNlbnQgSlNPTldQIGNhcHMsIFczQyBjYXBzLCBvciBib3RoXG4gIGNvbnN0IGhhc1czQ0NhcHMgPSBfLmlzUGxhaW5PYmplY3QodzNjQ2FwYWJpbGl0aWVzKSAmJlxuICAgIChfLmhhcyh3M2NDYXBhYmlsaXRpZXMsICdhbHdheXNNYXRjaCcpIHx8IF8uaGFzKHczY0NhcGFiaWxpdGllcywgJ2ZpcnN0TWF0Y2gnKSk7XG4gIGNvbnN0IGhhc0pTT05XUENhcHMgPSBfLmlzUGxhaW5PYmplY3QoanNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgbGV0IHByb3RvY29sID0gbnVsbDtcbiAgbGV0IGRlc2lyZWRDYXBzID0ge307XG4gIGxldCBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMgPSBudWxsO1xuICBsZXQgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzID0gbnVsbDtcblxuICBpZiAoIWhhc0pTT05XUENhcHMgJiYgIWhhc1czQ0NhcHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdG9jb2w6IEJhc2VEcml2ZXIuRFJJVkVSX1BST1RPQ09MLlczQyxcbiAgICAgIGVycm9yOiBuZXcgRXJyb3IoJ0VpdGhlciBKU09OV1Agb3IgVzNDIGNhcGFiaWxpdGllcyBzaG91bGQgYmUgcHJvdmlkZWQnKSxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qge1czQywgTUpTT05XUH0gPSBCYXNlRHJpdmVyLkRSSVZFUl9QUk9UT0NPTDtcblxuICAvLyBNYWtlIHN1cmUgd2UgZG9uJ3QgbXV0YXRlIHRoZSBvcmlnaW5hbCBhcmd1bWVudHNcbiAganNvbndwQ2FwYWJpbGl0aWVzID0gXy5jbG9uZURlZXAoanNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgdzNjQ2FwYWJpbGl0aWVzID0gXy5jbG9uZURlZXAodzNjQ2FwYWJpbGl0aWVzKTtcbiAgZGVmYXVsdENhcGFiaWxpdGllcyA9IF8uY2xvbmVEZWVwKGRlZmF1bHRDYXBhYmlsaXRpZXMpO1xuXG4gIGlmICghXy5pc0VtcHR5KGRlZmF1bHRDYXBhYmlsaXRpZXMpKSB7XG4gICAgaWYgKGhhc1czQ0NhcHMpIHtcbiAgICAgIGNvbnN0IHtmaXJzdE1hdGNoID0gW10sIGFsd2F5c01hdGNoID0ge319ID0gdzNjQ2FwYWJpbGl0aWVzO1xuICAgICAgZm9yIChjb25zdCBbZGVmYXVsdENhcEtleSwgZGVmYXVsdENhcFZhbHVlXSBvZiBfLnRvUGFpcnMoZGVmYXVsdENhcGFiaWxpdGllcykpIHtcbiAgICAgICAgbGV0IGlzQ2FwQWxyZWFkeVNldCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGZpcnN0TWF0Y2hFbnRyeSBvZiBmaXJzdE1hdGNoKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKHJlbW92ZVczQ1ByZWZpeGVzKGZpcnN0TWF0Y2hFbnRyeSksIHJlbW92ZVczQ1ByZWZpeChkZWZhdWx0Q2FwS2V5KSkpIHtcbiAgICAgICAgICAgIGlzQ2FwQWxyZWFkeVNldCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaXNDYXBBbHJlYWR5U2V0ID0gaXNDYXBBbHJlYWR5U2V0IHx8IF8uaGFzKHJlbW92ZVczQ1ByZWZpeGVzKGFsd2F5c01hdGNoKSwgcmVtb3ZlVzNDUHJlZml4KGRlZmF1bHRDYXBLZXkpKTtcbiAgICAgICAgaWYgKGlzQ2FwQWxyZWFkeVNldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT25seSBhZGQgdGhlIGRlZmF1bHQgY2FwYWJpbGl0eSBpZiBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICAgICAgICBpZiAoXy5pc0VtcHR5KGZpcnN0TWF0Y2gpKSB7XG4gICAgICAgICAgdzNjQ2FwYWJpbGl0aWVzLmZpcnN0TWF0Y2ggPSBbe1tkZWZhdWx0Q2FwS2V5XTogZGVmYXVsdENhcFZhbHVlfV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZmlyc3RNYXRjaFswXVtkZWZhdWx0Q2FwS2V5XSA9IGRlZmF1bHRDYXBWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaGFzSlNPTldQQ2Fwcykge1xuICAgICAganNvbndwQ2FwYWJpbGl0aWVzID0gT2JqZWN0LmFzc2lnbih7fSwgcmVtb3ZlVzNDUHJlZml4ZXMoZGVmYXVsdENhcGFiaWxpdGllcyksIGpzb253cENhcGFiaWxpdGllcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IE1KU09OV1AgY2Fwc1xuICBpZiAoaGFzSlNPTldQQ2Fwcykge1xuICAgIHByb3RvY29sID0gTUpTT05XUDtcbiAgICBkZXNpcmVkQ2FwcyA9IGpzb253cENhcGFiaWxpdGllcztcbiAgICBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMgPSByZW1vdmVXM0NQcmVmaXhlcyh7Li4uZGVzaXJlZENhcHN9KTtcbiAgfVxuXG4gIC8vIEdldCBXM0MgY2Fwc1xuICBpZiAoaGFzVzNDQ2Fwcykge1xuICAgIHByb3RvY29sID0gVzNDO1xuICAgIC8vIENhbGwgdGhlIHByb2Nlc3MgY2FwYWJpbGl0aWVzIGFsZ29yaXRobSB0byBmaW5kIG1hdGNoaW5nIGNhcHMgb24gdGhlIFczQ1xuICAgIC8vIChzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qbGlwcHMvc2ltcGxlLXdkLXNwZWMjcHJvY2Vzc2luZy1jYXBhYmlsaXRpZXMpXG4gICAgbGV0IGlzRml4aW5nTmVlZGVkRm9yVzNjQ2FwcyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBkZXNpcmVkQ2FwcyA9IHByb2Nlc3NDYXBhYmlsaXRpZXModzNjQ2FwYWJpbGl0aWVzLCBjb25zdHJhaW50cywgdHJ1ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghaGFzSlNPTldQQ2Fwcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRlc2lyZWRDYXBzLFxuICAgICAgICAgIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyxcbiAgICAgICAgICBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgcHJvdG9jb2wsXG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBsb2dnZXIuaW5mbyhgQ291bGQgbm90IHBhcnNlIFczQyBjYXBhYmlsaXRpZXM6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIGlzRml4aW5nTmVlZGVkRm9yVzNjQ2FwcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGhhc0pTT05XUENhcHMgJiYgIWlzRml4aW5nTmVlZGVkRm9yVzNjQ2Fwcykge1xuICAgICAgY29uc3QgZGlmZmVyaW5nS2V5cyA9IF8uZGlmZmVyZW5jZShfLmtleXMocHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzKSwgXy5rZXlzKHJlbW92ZVczQ1ByZWZpeGVzKGRlc2lyZWRDYXBzKSkpO1xuICAgICAgaWYgKCFfLmlzRW1wdHkoZGlmZmVyaW5nS2V5cykpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oYFRoZSBmb2xsb3dpbmcgY2FwYWJpbGl0aWVzIHdlcmUgcHJvdmlkZWQgaW4gdGhlIEpTT05XUCBkZXNpcmVkIGNhcGFiaWxpdGllcyB0aGF0IGFyZSBtaXNzaW5nIGAgK1xuICAgICAgICAgIGBpbiBXM0MgY2FwYWJpbGl0aWVzOiAke0pTT04uc3RyaW5naWZ5KGRpZmZlcmluZ0tleXMpfWApO1xuICAgICAgICBpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgJiYgaGFzSlNPTldQQ2Fwcykge1xuICAgICAgbG9nZ2VyLmluZm8oJ1RyeWluZyB0byBmaXggVzNDIGNhcGFiaWxpdGllcyBieSBtZXJnaW5nIHRoZW0gd2l0aCBKU09OV1AgY2FwcycpO1xuICAgICAgdzNjQ2FwYWJpbGl0aWVzID0gZml4VzNjQ2FwYWJpbGl0aWVzKHczY0NhcGFiaWxpdGllcywganNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlc2lyZWRDYXBzID0gcHJvY2Vzc0NhcGFiaWxpdGllcyh3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzLCB0cnVlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgcGFyc2UgZml4ZWQgVzNDIGNhcGFiaWxpdGllczogJHtlcnJvci5tZXNzYWdlfS4gRmFsbGluZyBiYWNrIHRvIEpTT05XUCBwcm90b2NvbGApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRlc2lyZWRDYXBzOiBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllczogbnVsbCxcbiAgICAgICAgICBwcm90b2NvbDogTUpTT05XUCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgdzNjIGNhcGFiaWxpdGllcyBwYXlsb2FkIHRoYXQgY29udGFpbnMgb25seSB0aGUgbWF0Y2hpbmcgY2FwcyBpbiBgYWx3YXlzTWF0Y2hgXG4gICAgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzID0ge1xuICAgICAgYWx3YXlzTWF0Y2g6IHsuLi5pbnNlcnRBcHBpdW1QcmVmaXhlcyhkZXNpcmVkQ2Fwcyl9LFxuICAgICAgZmlyc3RNYXRjaDogW3t9XSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtkZXNpcmVkQ2FwcywgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLCBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMsIHByb3RvY29sfTtcbn1cblxuLyoqXG4gKiBUaGlzIGhlbHBlciBtZXRob2QgdHJpZXMgdG8gZml4IGNvcnJ1cHRlZCBXM0MgY2FwYWJpbGl0aWVzIGJ5XG4gKiBtZXJnaW5nIHRoZW0gdG8gZXhpc3RpbmcgSlNPTldQIGNhcGFiaWxpdGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdzNjQ2FwcyBXM0MgY2FwYWJpbGl0aWVzXG4gKiBAcGFyYW0ge09iamVjdH0ganNvbndwQ2FwcyBKU09OV1AgY2FwYWJpbGl0aWVzXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBGaXhlZCBXM0MgY2FwYWJpbGl0aWVzXG4gKi9cbmZ1bmN0aW9uIGZpeFczY0NhcGFiaWxpdGllcyAodzNjQ2FwcywganNvbndwQ2Fwcykge1xuICBjb25zdCByZXN1bHQgPSB7XG4gICAgZmlyc3RNYXRjaDogdzNjQ2Fwcy5maXJzdE1hdGNoIHx8IFtdLFxuICAgIGFsd2F5c01hdGNoOiB3M2NDYXBzLmFsd2F5c01hdGNoIHx8IHt9LFxuICB9O1xuICBjb25zdCBrZXlzVG9JbnNlcnQgPSBfLmtleXMoanNvbndwQ2Fwcyk7XG4gIGNvbnN0IHJlbW92ZU1hdGNoaW5nS2V5cyA9IChtYXRjaCkgPT4ge1xuICAgIF8ucHVsbChrZXlzVG9JbnNlcnQsIG1hdGNoKTtcbiAgICBjb25zdCBjb2xvbkluZGV4ID0gbWF0Y2guaW5kZXhPZignOicpO1xuICAgIGlmIChjb2xvbkluZGV4ID49IDAgJiYgbWF0Y2gubGVuZ3RoID4gY29sb25JbmRleCkge1xuICAgICAgXy5wdWxsKGtleXNUb0luc2VydCwgbWF0Y2guc3Vic3RyaW5nKGNvbG9uSW5kZXggKyAxKSk7XG4gICAgfVxuICAgIGlmIChrZXlzVG9JbnNlcnQuaW5jbHVkZXMoYCR7VzNDX0FQUElVTV9QUkVGSVh9OiR7bWF0Y2h9YCkpIHtcbiAgICAgIF8ucHVsbChrZXlzVG9JbnNlcnQsIGAke1czQ19BUFBJVU1fUFJFRklYfToke21hdGNofWApO1xuICAgIH1cbiAgfTtcblxuICBmb3IgKGNvbnN0IGZpcnN0TWF0Y2hFbnRyeSBvZiByZXN1bHQuZmlyc3RNYXRjaCkge1xuICAgIGZvciAoY29uc3QgcGFpciBvZiBfLnRvUGFpcnMoZmlyc3RNYXRjaEVudHJ5KSkge1xuICAgICAgcmVtb3ZlTWF0Y2hpbmdLZXlzKHBhaXJbMF0pO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcGFpciBvZiBfLnRvUGFpcnMocmVzdWx0LmFsd2F5c01hdGNoKSkge1xuICAgIHJlbW92ZU1hdGNoaW5nS2V5cyhwYWlyWzBdKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXNUb0luc2VydCkge1xuICAgIHJlc3VsdC5hbHdheXNNYXRjaFtrZXldID0ganNvbndwQ2Fwc1trZXldO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVGFrZXMgYSBjYXBhYmlsaXRpZXMgb2JqZWN0cyBhbmQgcHJlZml4ZXMgY2FwYWJpbGl0aWVzIHdpdGggYGFwcGl1bTpgXG4gKiBAcGFyYW0ge09iamVjdH0gY2FwcyBEZXNpcmVkIGNhcGFiaWxpdGllcyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QXBwaXVtUHJlZml4ZXMgKGNhcHMpIHtcbiAgLy8gU3RhbmRhcmQsIG5vbi1wcmVmaXhlZCBjYXBhYmlsaXRpZXMgKHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvd2ViZHJpdmVyLyNkZm4tdGFibGUtb2Ytc3RhbmRhcmQtY2FwYWJpbGl0aWVzKVxuICBjb25zdCBTVEFOREFSRF9DQVBTID0gW1xuICAgICdicm93c2VyTmFtZScsXG4gICAgJ2Jyb3dzZXJWZXJzaW9uJyxcbiAgICAncGxhdGZvcm1OYW1lJyxcbiAgICAnYWNjZXB0SW5zZWN1cmVDZXJ0cycsXG4gICAgJ3BhZ2VMb2FkU3RyYXRlZ3knLFxuICAgICdwcm94eScsXG4gICAgJ3NldFdpbmRvd1JlY3QnLFxuICAgICd0aW1lb3V0cycsXG4gICAgJ3VuaGFuZGxlZFByb21wdEJlaGF2aW9yJ1xuICBdO1xuXG4gIGxldCBwcmVmaXhlZENhcHMgPSB7fTtcbiAgZm9yIChsZXQgW25hbWUsIHZhbHVlXSBvZiBfLnRvUGFpcnMoY2FwcykpIHtcbiAgICBpZiAoU1RBTkRBUkRfQ0FQUy5pbmNsdWRlcyhuYW1lKSB8fCBuYW1lLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgIHByZWZpeGVkQ2Fwc1tuYW1lXSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmaXhlZENhcHNbYCR7VzNDX0FQUElVTV9QUkVGSVh9OiR7bmFtZX1gXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJlZml4ZWRDYXBzO1xufVxuXG5mdW5jdGlvbiByZW1vdmVXM0NQcmVmaXhlcyAoY2Fwcykge1xuICBpZiAoIV8uaXNQbGFpbk9iamVjdChjYXBzKSkge1xuICAgIHJldHVybiBjYXBzO1xuICB9XG5cbiAgY29uc3QgZml4ZWRDYXBzID0ge307XG4gIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgXy50b1BhaXJzKGNhcHMpKSB7XG4gICAgZml4ZWRDYXBzW3JlbW92ZVczQ1ByZWZpeChuYW1lKV0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gZml4ZWRDYXBzO1xufVxuXG5mdW5jdGlvbiByZW1vdmVXM0NQcmVmaXggKGtleSkge1xuICBjb25zdCBjb2xvblBvcyA9IGtleS5pbmRleE9mKCc6Jyk7XG4gIHJldHVybiBjb2xvblBvcyA+IDAgJiYga2V5Lmxlbmd0aCA+IGNvbG9uUG9zID8ga2V5LnN1YnN0cmluZyhjb2xvblBvcyArIDEpIDoga2V5O1xufVxuXG5mdW5jdGlvbiBnZXRQYWNrYWdlVmVyc2lvbiAocGtnTmFtZSkge1xuICBjb25zdCBwa2dJbmZvID0gcmVxdWlyZShgJHtwa2dOYW1lfS9wYWNrYWdlLmpzb25gKSB8fCB7fTtcbiAgcmV0dXJuIHBrZ0luZm8udmVyc2lvbjtcbn1cblxuLyoqXG4gKiBQdWxscyB0aGUgaW5pdGlhbCB2YWx1ZXMgb2YgQXBwaXVtIHNldHRpbmdzIGZyb20gdGhlIGdpdmVuIGNhcGFiaWxpdGllcyBhcmd1bWVudC5cbiAqIEVhY2ggc2V0dGluZyBpdGVtIG11c3Qgc2F0aXNmeSB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAqIGBzZXR0aW5nW3NldHRpbmdfbmFtZV06IHNldHRpbmdfdmFsdWVgXG4gKiBUaGUgY2FwYWJpbGl0aWVzIGFyZ3VtZW50IGl0c2VsZiBnZXRzIG11dGF0ZWQsIHNvIGl0IGRvZXMgbm90IGNvbnRhaW4gcGFyc2VkXG4gKiBzZXR0aW5ncyBhbnltb3JlIHRvIGF2b2lkIGZ1cnRoZXIgcGFyc2luZyBpc3N1ZXMuXG4gKiBDaGVja1xuICogaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vYmxvYi9tYXN0ZXIvZG9jcy9lbi9hZHZhbmNlZC1jb25jZXB0cy9zZXR0aW5ncy5tZFxuICogZm9yIG1vcmUgZGV0YWlscyBvbiB0aGUgYXZhaWxhYmxlIHNldHRpbmdzLlxuICpcbiAqIEBwYXJhbSB7P09iamVjdH0gY2FwcyAtIENhcGFiaWxpdGllcyBkaWN0aW9uYXJ5LiBJdCBpcyBtdXRhdGVkIGlmXG4gKiBvbmUgb3IgbW9yZSBzZXR0aW5ncyBoYXZlIGJlZW4gcHVsbGVkIGZyb20gaXRcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gQW4gZW1wdHkgZGljdGlvbmFyeSBpZiB0aGUgZ2l2ZW4gY2FwcyBjb250YWlucyBub1xuICogc2V0dGluZyBpdGVtcyBvciBhIGRpY3Rpb25hcnkgY29udGFpbmluZyBwYXJzZWQgQXBwaXVtIHNldHRpbmcgbmFtZXMgYWxvbmcgd2l0aFxuICogdGhlaXIgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBwdWxsU2V0dGluZ3MgKGNhcHMpIHtcbiAgaWYgKCFfLmlzUGxhaW5PYmplY3QoY2FwcykgfHwgXy5pc0VtcHR5KGNhcHMpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIF8udG9QYWlycyhjYXBzKSkge1xuICAgIGNvbnN0IG1hdGNoID0gL1xcYnNldHRpbmdzXFxbKFxcUyspXFxdJC8uZXhlYyhrZXkpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc3VsdFttYXRjaFsxXV0gPSB2YWx1ZTtcbiAgICBkZWxldGUgY2Fwc1trZXldO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IHJvb3REaXIgPSBmaW5kUm9vdChfX2Rpcm5hbWUpO1xuXG5leHBvcnQge1xuICBpbnNwZWN0T2JqZWN0LCBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciwgaW5zZXJ0QXBwaXVtUHJlZml4ZXMsIHJvb3REaXIsXG4gIGdldFBhY2thZ2VWZXJzaW9uLCBwdWxsU2V0dGluZ3MsXG59O1xuIl0sImZpbGUiOiJsaWIvdXRpbHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==