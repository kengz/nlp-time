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
  // consider ifelse cond precedence
  // also consider when optional arg
  // 1. <n><n> ~ <n>
  // 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
  // 3. <T><T> ~ <T>
  // 4. <T><r><T> ~ <rT>
  // 5. [<f>]<c><T|rT> ~ <cT>
  if (util.sName(L) == 'n' && util.sName(R) == 'n') {
    return symbol(L.value + R.value)
  } else if (util.sName(L) == 'n' && util.sName(R) == 'T') {
    return nTOp(L, op, R);
  } else if (util.sName(L) == 'T' && util.sName(op) == 'r' && util.sName(R) == 'T') {
    return rTOp(L, R);
  } else if (util.sName(L) == 'T' && util.sName(R) == 'T') {
    return TTOp(L, op, R);
  } else if (util.sName(L) == 'f' && util.sName(R) == 'T') {
    return cTOp(L, R);
  }

  // console.log('args', L, op, R)
  // console.log("exec", L.value + R.value)
  // return symbol(L.value + R.value)
}

function cTOp() {}

function rTOp() {}

function nTOp(nL, op, TR) {
  _.each(TR.t, function(v, k) {
    TR.t[k] = atomicOp(nL.value, op, TR.t[k])
  })
  _.each(TR.dt, function(v, k) {
    TR.dt[k] = atomicOp(nL.value, op, TR.dt[k])
  })
}

// distribute scalar L over tensor R, using atomicOp
// or override tensor L and tensor R, or R preceeds
// doesn't apply to t,dt yet
// return R entity, or ct, rt
function TTOp(TL, op, TR) {
  // util.sName
  // mutate into TR
  _.each(TL.t, function(v, k) {
    TR.t[k] = atomicOp(TL.t[k], op, TR.t[k])
  })
  _.each(TL.dt, function(v, k) {
    TR.dt[k] = atomicOp(TL.dt[k], op, TR.dt[k])
  })
  return TR
}

//q2 running atomic binary op, between numbers
// either side can be starting with '=', or null, then just drop em
function atomicOp(Lval, op, Rval) {
  var l = parseFloat(Lval),
    r = parseFloat(Rval),
    oName = op.value;
  if (Lval == undefined) {
    // if L is missing, R must exist tho
    return Rval
  } else if (Rval == undefined) {
    // if L exists, be it def or not, R missing
    return (oName == 'minus') ? Lval.replace(/(\d)/, '-$1') : Lval;
  } else {
    // or R exist or is default (parse to NaN), L can be default too but ignore then
    var def = _.isNaN(r) ? '=' : '';
    r = _.isNaN(r) ? parseFloat(Rval.replace('=', '')) : r;
    if (_.isNaN(l)) {
      // if L is default, just return R
      return Rval;
    } else if (oName == 'minus') {
      return def + (r - l)
    } else if (oName == 'plus') {
      return def + (r + l)
    } else if (oName == 'times') {
      return def + (r * l)
    } else if (oName == 'divide') {
      return def + (r / l)
    }
  }
}



var t1 = symbol('tonight')
var t2 = symbol('christmas')
console.log(t1)
console.log(t2)
TTOp(t1, symbol('plus'), t2)
console.log("post op")
console.log(t1)
console.log(t2)
console.log("postNTOp")
nTOp(symbol('two'), symbol('times'), t2)
console.log(t2)