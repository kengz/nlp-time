// #### algorithm Parse:
// Given an input string `s`,

// 1. Apply **Token parsing**,
// 2. Apply **Production rules**,
// 3. Apply **Interpretation**,
// 4. Return a sentence of **terminal symbols** in `{t, ct, rt}`

// dependencies
var _ = require('lodash');


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
    } catch (e) {
      str = str.replace(/\s*\S+$/, '')
    }
  }
  return normalDate;
}

var str = "event is at Wed, Aug 9 1995 bla bla bla"
console.log(parseNormal(str))
var str = "event is at 12/13"
var str = "event is at 05 October 2011 14:48 UTC"
var res = new Date(str);
res = res.toISOString()
  // console.log(_.keys(Date))
console.log(res)
  // split numbers from words.
  // - hour ~ `<t> ~ 1h`
  // - 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
  // - pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
  // - 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
  // - 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
  // - evening ~ `(12+6)*h`
