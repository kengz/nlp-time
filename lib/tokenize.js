// #### algorithm Parse:
// Given an input string `s`,

// 1. Apply **Token parsing**,
// 2. Apply **Production rules**,
// 3. Apply **Interpretation**,
// 4. Return a sentence of **terminal symbols** in `{t, ct, rt}`

// dependencies
var _ = require('lodash');
var maps = require('./maps.json')
var symbol = require('./symbols')

var re = {
  // 12/20 - 12/21
  MMsDDdMMsDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})\/(\d{1,4})/g,
  // 12/22 - 23
  MMsDDdDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})/g,
  // 12/24
  MMsDD: /(?!\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})/g,
  // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
  hhcmm: /(\s+\d{1,2}|^\d{1,2})\:?(\d{2})\s*(\S+)*/g
}

// 1. parse normal forms
// 2. parse subnormal forms
// 3. parse english forms
// 3. split <n> away from words, e.g. 9pm, 1st, 2nd, 2hr
// 2. split out map values from opMap, cMap, rMap (careful with clashses, e.g. "to", singulars, and composite words. Okay maybe just split a few chosen ones that people tend to stick together, like )
// 3. parse tokens into symbols: from 
function tokenize(str) {
  return []
}


/**
 * Try to parse and return a normal Date, parseable from new Date(str), by continuously trimming off its tail and retry until either get a valid date, or string runs out.
 * @param  {string} str The input string.
 * @return {string}     A Date in ISO string, or null.
 */
function parseNormal(str) {
  // keep chopping off tail until either get a valid date, or string runs out
  // array of parsed date and the string consumed
  var dateArr = [],
    dateStrArr = [];
  // ensure single spacing
  str = str.replace(/\s+/g, ' ');
  // tokenize by space
  var strArr = str.split(/\s+/g);

  // init the normalDate and head string used
  var normalDate = null,
    head = '';
  // do while there's still string to go
  while (!_.isEmpty(strArr)) {
    head = _.trim(head + ' ' + strArr.shift());
    try {
      normalDate = new Date(head).toISOString();
      // Extend head: if parse successful, extend continuously until failure, then that's the longest parseable head string, ...<date>
      var advanceHead = head + ' ' + strArr[0]
      while (1) {
        try {
          var advanceDate = new Date(advanceHead).toISOString();
          if (advanceDate != 'Invalid Date') {
            // if advanceDate is parseable, set to current, update heads
            var normalDate = advanceDate;
            head = head + ' ' + strArr.shift()
            advanceHead = advanceHead + ' ' + strArr[0]
          } else {
            break;
          }
        } catch (e) {
          // when fail, just break
          break;
        }
      }
      dateArr.push(normalDate);
      // Shrink head: from the whole parseable head ...<date>, trim front till we get <date>
      while (1) {
        try {
          if (new Date(head.replace(/^\s*\S+\s*/, '')).toISOString() != normalDate) {
            // front token eaten causes change, dont update head
            break;
          } else {
            // update head
            head = head.replace(/^\s*\S+\s*/, '');
          }
        } catch (e) {
          break;
        }
      }
      // get head = <date> only, then reset
      dateStrArr.push(head)
      head = ''
    } catch (e) {}
  }
  return { dateArr: dateArr, dateStrArr: dateStrArr };
}

/**
 * Parse the subnormal form after parseNormal. Gradually replace tokens of the input string while parseable.
 * @param  {string} str The input string.
 * @return {string}     The parsed string.
 */
function parseSubnormal(str) {
  var m, res;
  if (m = re.MMsDDdMMsDD.exec(str)) {
    // 12/20 - 12/21
    var yMd1 = yMdParse(m[1], m[2]);
    var yMd2 = yMdParse(m[3], m[4]);
    res = `t:${yMd1},dt: - t:${yMd2},dt: `
  } else if (m = re.MMsDDdDD.exec(str)) {
    // 12/22 - 23
    var yMd1 = yMdParse(m[1], m[2]);
    var yMd2 = yMdParse(m[1], m[3]);
    res = `t:${yMd1},dt: - t:${yMd2},dt: `
  } else if (m = re.MMsDD.exec(str)) {
    // if year
    var yMd = yMdParse(m[1], m[2])
    // 12/24
    res = `t:${yMd},dt: `
  } else if (m = re.hhcmm.exec(str)) {
    // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
    var sym = symbol(m[3]) || '';
    // if symbol is a time, to set its unit if exist
    var unit = _.includes(['t', 'dt', 'T'], sym.constructor.name) ? _.findKey(sym) : '';
    // exception: 4-digit spec using 'h' is redundant
    unit = (unit == 'h') ? '' : unit;
    res = " t:" + _.trim(m[1]) + "h" + m[2] + "m,dt: " + unit
  } else {
    // exit recursion if hits here
    return str
  }
  // recurse down till no more substitution (CFG is not cyclic, so ok)
  str = parseSubnormal(str.replace(m[0], res))
  return str
}

function parseNormalSubnormal(str) {
  var p1 = parseNormal(str);
  var ntokens = _.filter(p1.dateStrArr, notSubnormal)
    // the proper, 1st parsed normal string
  var p1Str = injectNormal(str, ntokens)
  var p2Str = parseSubnormal(p1Str)
  return p2Str
}



//////////////////////
// Helper functions //
//////////////////////

/**
 * Try to parse two tokens for T form into MM/dd, or MM/yyyy if either token hsa length 4.
 * @private
 * @param  {string} token1 
 * @param  {string} token2 
 * @return {string}        in the form <y><M><d>
 */
function yMdParse(token1, token2) {
  var part = _.partition([token1, token2], function(token) {
    return token.length == 4
  })
  var y = part[0][0] ? part[0][0] + 'y' : '';
  var M = part[1][0] + 'M';
  var d = part[1][1] ? part[1][1] + 'd' : '';
  return `${y}${M}${d}`
}
/**
 * Check if the dateStr is strictly normal and not subnormal. Used to extract parseSubnormal overrides.
 * @private
 * @param  {string} dateStr 
 * @return {Boolean}         
 */
function notSubnormal(dateStr) {
  var subnormalStr = parseSubnormal(dateStr)
    // remove T and see if still has words
  var noT = subnormalStr.replace(/t\:\S*,dt\:\S*(\s*-\s*t\:\S*,dt\:\S*)?/, '')
  return /\w+/g.exec(noT) != null
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
 * Given a string and array of its parsed phrases, convert them into T ISO UTC then T format, and inject into the original string, return.
 * @private
 * @param  {string} str       The original string.
 * @param  {Array} parsedArr The parsed phrases from the string.
 * @return {string}           The string with parsed phrases replaced in T format.
 * 
 * @example
 * injectNormal('05 October 2011 14:48 UTC 08/11 2020', [ '05 October 2011 14:48 UTC', '08/11 2020' ])
 * // => 't:2011y10M05d14h48m00.000s,dt: t:2020y08M11d04h00m00.000s,dt: '
 */
function injectNormal(str, parsedArr) {
  _.each(parsedArr, function(parsed) {
    var T = ISOtoT(new Date(parsed).toISOString())
    str = str.replace(parsed, T)
  })
  return str;
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


// do a capturing and remove from raw string, 
// or replace with new standard parseable expression
var str = "05 October 2011 14:48 UTC 08/11 2020 2012/12 event is at tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 "
  // var str = "12/31/2012"
  // var d1 = parseNormal(str)
  // console.log("d1", d1)

// var newtoken = _.filter(d1.dateStrArr, notSubnormal)
// console.log(str)
// console.log(newtoken)
// var str2 = injectNormal(str, newtoken)
// console.log(str2)
// console.log(parseSubnormal(str2))
// console.log(parseSubnormal("at 12/31"))

console.log(parseNormalSubnormal(str))

// console.log("wt",parseSubnormal("t:2011y10M05d14h48m00.000s,dt:"))
// reparse n resub

// console.log(subParseable("t:08M11d,dt:  - t:08M11d,dt:  - "))
// split numbers from words.
// - hour ~ `<t> ~ 1h`
// - 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
// - pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
// - 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
// - 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
// - evening ~ `(12+6)*h`
