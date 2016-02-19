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

var res = new Date('Wed, Aug 9, 1995');
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
