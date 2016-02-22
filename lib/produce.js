// progressive filter:
// take on array, drop null, operate on an op, (like * / first, then + -)
// after finite step = depth of CFG tree, is done
// yess yess, binary ops, can progress atomically. exactly like arithmetic
//ok operator precedence: 

// dependencies
var _ = require('lodash');
var util = require('./util')
var tokenize = require('./tokenize')
var symbol = require('./symbols')
  // var maps = require('./maps.json')

// ok new production rules, binary op like arithmetics:
// 1. <n><n> ~ <n>
// 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
// 3. <T><T> ~ <T>
// 4. <T><r><T> ~ <rT>
// 5. [<f>]<c><T|rT> ~ <cT>

// var str = "05 October 2011 14:48 UTC 08/11 2020 2012/12 event is at tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 1730pm 5pm 1 st"
var str = "half an hour and quarter from 7pm"
var tok = tokenize(str)
var syms = tok.symbols;
console.log(syms)

// reduce adjacent symbols of the same symbol name
// check for optional ops too. use plus as default
function reduce(syms, varArr) {
  // the operator arrays
  var opArr = ['op', 'c', 'r'];
  // endmark for handling last symbol
  syms.push('null');
  // the result, past-pointer, default-op, current-op, and whether current-op is inter-symbol op, i.e. will not be used up
  var res = [],
    past = null,
    defOp = symbol('plus'),
    op = defOp,
    interOp = false;
  _.each(syms, function(s, i) {
    if (!past || !s) {
      if (i == 0) { past = s; }
    } else if (_.includes(opArr, util.sName(s))) {
      // mark op as won't be used yet
      op = s;
      interOp = true;
    } else if (_.includes(varArr, util.sName(s)) && _.includes(varArr, util.sName(past))) {
      // when past & s can operate together
      past = execOp(past, op, s);
      // reset after op is used
      op = defOp;
      interOp = false;
    } else {
      // change of class, past is finalized, push to res
      res.push(past);
      // if inter-op (not used), push a clone (prevent overwrite later)
      if (interOp) { res.push(symbol(op.value)) };
      // reset
      op = defOp;
      interOp = false;
      past = s;
    }
  })
  return res;
}

console.log(reduce(syms, ['n']))
  // console.log("cons", 'meh'.constructor)

// to be written later
function execOp(L, op, R) {
  // ok def ops between:
  // 1. <n><n> ~ <n>
  // 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
  // 3. <T><T> ~ <T>
  // 4. <T><r><T> ~ <rT>
  // 5. [<f>]<c><T|rT> ~ <cT>
  // if () {}

  // console.log('args', L, op, R)
  // console.log("exec", L.value + R.value)
  return symbol(L.value + R.value)
}

// console.log("symbol", symbol('one').constructor == symbol('two').constructor)
// console.log("symbol", symbol('two'))
