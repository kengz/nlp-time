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
  return { dateArr: dateArr, strArr: splitByArr(str, dateStrArr), dateStrArr: dateStrArr };
}

// split a string by an array of targets: replace their occurences with a delimiter, then split by it
function splitByArr(str, targetArr) {
  var delim = '#{REPLACE}';
  // inject into targets
  _.each(targetArr, function(target) {
    str = str.replace(target, delim)
  });
  // split into arr
  return str.split(delim)
}

// oh wait you dont build the parse tree here yet
// var ss = splitByArr(str, d1.dateStrArr)
// console.log(ss)

// ok use the custom string format as a standard to rep <t> <dt>
// add to CFG.md
// use for conversion

// regexes, use capturing groups
// ok fix the slashes conflict
// then free up to capture 2-4 digits
var re = {
  // 12/20 - 12/21
  MMsDDdMMsDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})\/(\d{1,4})/g,
  // 12/22 - 23
  MMsDDdDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})/g,
  // 12/24
  MMsDD: /(?!\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})/g,
  // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
  hhcmm: /(\d{1,2})\:?(\d{2})\s*(\S+)*/g
}

// var reT = /t\:\S*,dt\:\S*/g
// var str = "08/11 2020 12/31 event is at  tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 "
// _.each(re, function(r) {
//   console.log(r.exec(str))
// })

// var re1 = /(\d{1,4})\/(\d{1,4})/g
// var re1 = /(\d{1,2})\:?(\d{2})\s*(\S+)*/g
// var str = '/1200'
// var str2 = 'at asd 12 12 asd 12/24'
// console.log(re1.exec(str))
// console.log(re2.exec(str2))

// parse the subnormal form, careful might need to fix conflict
function parseSubnormal(str) {
  var m, res;
  if (m = re.MMsDDdMMsDD.exec(str)) {
    console.log("1")
    // 12/20 - 12/21
    res = "t:" + m[1] + "M" + m[2] + "d,dt: - " + "t:" + m[3] + "M" + m[4] + "d,dt: "
  } else if (m = re.MMsDDdDD.exec(str)) {
    console.log("2")
    // 12/22 - 23
    res = "t:" + m[1] + "M" + m[2] + "d,dt: - " + "t:" + m[1] + "M" + m[3] + "d,dt: "
  } else if (m = re.MMsDD.exec(str)) {
    console.log("3")
    // 12/24
    res = "t:" + m[1] + "M" + m[2] + "d,dt: "
  } else if (m = re.hhcmm.exec(str)) {
    console.log("4")
    // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
    var sym = symbol(m[3]);
    // if symbol is a time, to set its unit if exist
    var unit = _.includes(['t', 'dt', 'T'], sym.constructor.name) ? _.findKey(sym) : '';
    // exception: 4-digit spec using 'h' is redundant
    unit = (unit == 'h') ? '' : unit;
    res = "t:" + m[1] + "h" + m[2] + "m,dt: " + unit
  } else {
    console.log("just exit")
    // exit recursion if hits here
    return str
  }
  // recurse down till no more substitution (CFG is not cyclic, so ok)
  str = parseSubnormal(str.replace(m[0], res))
  console.log("m0", m[0])
  console.log("res", res)
  console.log("str", str)
  return str
}

// perhaps can force "on <t>", and "in <dt>"

// do a capturing and remove from raw string, 
// or replace with new standard parseable expression
var str = "05 October 2011 14:48 UTC 08/11 2020 12/31 event is at  tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 "
// var str = "12/31/2012"
// var d1 = parseNormal(str)
// console.log("d1", d1)
var d2 = parseSubnormal(str)
// var d2 = parseSubnormal("at 12/31")
console.log("d2", d2)

// Check if the dateStr is strictly normal and not subnormal
function notSubnormal(dateStr) {
  var subnormalStr = parseSubnormal(dateStr)
  // remove T and see if still has words
  var noT = subnormalStr.replace(/t\:\S*,dt\:\S*/g, '')
  return /\w+/g.exec(noT) != null
}

// convert ISO UTC string to T format
function ISOtoT(str) {
  // '2011-10-05T14:48:00.000Z'
  var datetime = str.replace('Z', '').split('T')
  var date = datetime[0].split('-'), time = datetime[1].split(':');
  // t:08M11d,dt:
  return `t:${date[0]}y${date[1]}M${date[2]}d${time[0]}h${time[1]}m${time[2]}s,dt:`
}


// console.log(ISOtoT('2011-10-05T14:48:00.000Z'))

// var newtoken = _.filter(d1.dateStrArr, notSubnormal)
// reparse into T format and replace
function renormal(str, targetArr) {
  _.each(targetArr, function(target) {
    var T = ISOtoT(new Date(target).toISOString())
    str = str.replace(target, T)
  })
  return str;
}
// console.log(str)
// console.log(newtoken)
// var str2 = renormal(str, newtoken)
// console.log(str2)
// // console.log(parseSubnormal(str2))
// console.log(parseSubnormal("at 12/31"))

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
