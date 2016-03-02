/**
 * Substitutes for lodash methods
 */

exports.includes = function(arr, item) {
  var found = false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == item) {
      found = true;
      break;
    }
  }
  return found;
}

