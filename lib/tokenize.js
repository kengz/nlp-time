// #### algorithm Parse:
// Given an input string `s`,

// 1. Apply **Token parsing**,
// 2. Apply **Production rules**,
// 3. Apply **Interpretation**,
// 4. Return a sentence of **terminal symbols** in `{t, ct, rt}`

// dependencies
var _ = require('lodash');
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
  var normalDate = null;
  while (str) {
    try {
      normalDate = new Date(str).toISOString();
      break;
    } catch (e) {}
    str = str.replace(/\s*\S+\s*$/, '')
  }
  return normalDate;
}

// to be overidden by parseSubnormal, e.g. the case "12/13"

// var str = "event is at Wed, 05:30pm Aug 9 1995 bla bla bla "
// console.log(typeof new Date("Wed, 05:20pm Aug 9 1995"))
var str = "event is at 12/13"
console.log(parseNormal(str))
console.log(new Date().toISOString())
var str = "event is at 05 October 2011 14:48 UTC"
var res = new Date(str);
res = res.toISOString()
  // console.log(_.keys(Date))
console.log(res)


// ok use the custom string format as a standard to rep <t> <dt>
// add to CFG.md
// use for conversion

// subnormal forms:
// 12/20 /\s+\d{1,2}\/\d{1,2}\s+/g
// 12/20-23, 12/20 - 23 /\s+\d{1,2}\/\d{1,2}-\d{1,2}\s+/g
// 12/20-12/23 /\s+\d{1,2}\/\d{1,2}-\d{1,2}\/\d{1,2}\s+/g
// 05:30pm /\s+\d{1,2}\:\d{2}/g -> "t:5h30m", "pm"
// 05.30pm treated at 5+30/100 pm. Decimals are respect for mathematical soundness
// 17:30
// 17:30h
// 17:30hr
// 1730 /\s+\d{4}\s+/g
// does not entertain 17.30 as 17:30
var res = {
  reMMsDDdMMsDD: /\s+\d{1,2}\/\d{1,2}\s*-\s*\d{1,2}\/\d{1,2}\s+/g,
  reMMsDDdDD: /\s+\d{1,2}\/\d{1,2}\s*-\s*\d{1,2}\s+/g,
  reMMsDD: /\s+\d{1,2}\/\d{1,2}\s+/g,
  rehhcmm: /\s+\d{1,2}\:\d{2}/g,
  rehhmm: /\s+\d{4}\s+/g
}

function parseSubnormal(str) {
  return _.map(res, function(re) {
    var m = str.match(re)
    str = str.replace(m, ' ')
    return _.trim(m)
  })
}

// do a capturing and remove from raw string, 
// or replace with new standard parseable expression
var str = " 12/31 12/20- 23 12/22 - 12/23 05:30pm 17:30 1730 "
console.log(parseSubnormal(str))
// split numbers from words.
// - hour ~ `<t> ~ 1h`
// - 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
// - pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
// - 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
// - 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
// - evening ~ `(12+6)*h`
