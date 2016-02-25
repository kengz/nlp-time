// dependencies
var _ = require('lodash');

/**
 * Return the name of a symbol: {op,c,r,n,T,f}
 * @param  {Symbol} symbol A CFG symbol.
 * @return {string}        name of the symbol.
 */
function sName(symbol) {
  return symbol ? symbol.constructor.name : null;
}

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
 * Convenient method to get current time in T format.
 * @return {string} T format string.
 */
function nowT() {
  var dateStr = new Date().toISOString();
  return ISOtoT(dateStr)
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
  sName: sName,
  ISOtoT: ISOtoT,
  nowT: nowT,
  splitByArr: splitByArr
}
