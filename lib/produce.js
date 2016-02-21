// progressive filter:
// take on array, drop null, operate on an op, (like * / first, then + -)
// after finite step = depth of CFG tree, is done
// yess yess, binary ops, can progress atomically. exactly like arithmetic
//ok operator precedence: 

// dependencies
var _ = require('lodash');
var util = require('./util')
var tokenize = require('./tokenize')
// var symbol = require('./symbols')
// var maps = require('./maps.json')

var str = "05 October 2011 14:48 UTC 08/11 2020 2012/12 event is at tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 1730pm 5pm 1 st"
var tok = tokenize(str)
console.log(tok)

// ok new production rules, binary op like arithmetics:
// 1. <n><n> ~ <n>
// 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
// 3. <T><T> ~ <T>
// 4. <T><r><T> ~ <rT>
// 5. [<f>]<c><T|rT> ~ <cT>

