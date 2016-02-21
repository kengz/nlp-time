// dependencies
var _ = require('lodash');

/**
 * Convert ISO UTC string to T format.
 * @param {string} str ISO UTC date string
 * 
 * @example
 * ISOtoT('2011-10-05T14:48:00.000Z')
 * // => 't:08M11d,dt:'
 */
function ISOtoT(str) {
  var datetime = str.replace('Z', '').split('T')
  var date = datetime[0].split('-'),
    time = datetime[1].split(':');
  return `t:${date[0]}y${date[1]}M${date[2]}d${time[0]}h${time[1]}m${time[2]}s,dt:`
}

/**
 * Split a string by an array of tokens.
 * @param  {string} str       The input string.
 * @param  {Array} tokenArr Array of tokens to split the string by.
 * @return {Array}           The split string array.
 */
function splitByArr(str, tokenArr) {
  var delim = '#{REPLACE}';
  // inject into tokens
  _.each(tokenArr, function(token) {
    str = str.replace(target, delim)
  });
  // split into arr
  return str.split(delim)
}


module.exports = {
  ISOtoT: ISOtoT,
  splitByArr: splitByArr
}