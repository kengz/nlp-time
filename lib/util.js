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

// The ordering of time units, small to large
var timeUnitOrder = ["ms", "s", "m", "h", "d", "w", "M", "y"]

/**
 * Delimit the array of timeChunk symbols by combining consecutive nulls (>3) into one, and dumping those shorter. Result is then delimited by 'trinull'.
 * @param  {Array} syms Of parsed symbols aka time chunks.
 * @return {Array}      symbols delimited by 'trinull'
 */
function delimSyms(syms) {
  // 1.
  // contract the nulls into trinulls in a single array
  var newSyms = []
  var count = 0;
  _.each(syms, function(s, i) {
    if (!s) {
      // increase null counter
      count++;
    } else {
      if (count > 2) {
        // push trinull if s is no longer pull, and count was big
        newSyms.push('trinull')
      };
      newSyms.push(s)
      count = 0;
    }
  })
  return newSyms
}


/**
 * Split an array of symbols by delimiter into matrix.
 * @param  {Array} syms      The input array
 * @param  {string|symbol} delimiter To split the array by
 * @return {matrix}           delimited arrays.
 */
function splitSyms(syms, delimiter) {
  // split the single array into matrix
  var matrix = [];
  var newRow = [];
  _.each(syms, function(s, i) {
    if (s == delimiter || sName(s) == delimiter) {
      // delimit and push to matrix
      matrix.push(newRow)
      newRow = [];
    } else if (i == syms.length - 1) {
      // if is last and not delim, push all
      newRow.push(s)
      matrix.push(newRow)
    } else {
      // accumulate in row
      newRow.push(s)
    }
  })
  return matrix
}

/**
 * Order time chunks by T-containing then length. for extraction: get the longest and T-containing chunks first. helper for getTimeChunk
 * @param  {[type]} matrix [description]
 * @return {[type]}        [description]
 */
function orderChunks(matrix) {
  // 2.
  var lengthSortedMat = _.sortBy(matrix, _.size)
  var partMatT = _.partition(lengthSortedMat, function(syms) {
    var partT = _.partition(syms, function(s) {
      return sName(s) == 'T'
    });
    // partT[0] = all chunks containing 'T'
    return partT[0].length
  });
  // 3.1 3.2 3.3
  var candidates = _.flatten([partMatT[1], partMatT[0]])
  return candidates
}


/**
 * Check if arr has the symbol name of s.
 * @param  {symbol}  s   symbol object
 * @param  {Array}  arr Of string symbol names
 * @return {Boolean}     
 */
function isSym(s, arr) {
  return _.includes(arr, sName(s))
}





module.exports = {
  sName: sName,
  ISOtoT: ISOtoT,
  nowT: nowT,
  splitByArr: splitByArr,
  timeUnitOrder: timeUnitOrder,
  delimSyms: delimSyms,
  splitSyms: splitSyms,
  orderChunks: orderChunks,
  isSym: isSym
}
