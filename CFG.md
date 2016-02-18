# Human CFG language for time
**author**: *kengz kengzwl@gmail.com Feb 2016*

This is a model of the human language for time using CFG and Euclidean transformations. Below we outline the CFG construction, short proofs, and [algorithm](#algo).

## Human CFG for time

The timeline is a 1-dimentional Euclidean number line, and thus obeys all the Euclidean transformations (in 1D they happen to be scalar arithmetics). Arithmetics `{∅,n,+,-,*,/}` by itself is a Context-Free Grammar (CFG). 

The human language used to describe the timeline and its transformations is the arithmetics CFG plus two extra operators: `cron` (for repeated pattern) and `range` (to specify two points in time). Observe that these two operators obey the same production rules as the arithmetical functions. We can define the human language for time as a CFG extended from the arithmetics CFG with extra symbols obeying the same production rule structures, yielding `{∅,n,t,dt,f,ct,rt;+,-,*,/,c,r}`. The **terminal symbols** are `∅, t, ct, rt`. 

Note `t + dt ~ t`, and if one gets `dt` at the end, add it to `t = current time` to get `~ t` to give a valid terminal string. Apart from this, we treat `t, dt` as interchangeable symbols below due to them being covariant tensors.

| variable | detail | operator | detail |
|---|---|---|---|
|`n`| a number |`+`| add |
|`t`| a point in time, with units. <br> `t: {ms, s, m, h, d, w, M, y}` |`-`| subtract |
|`dt`| a displacement in time, with units. <br>Indistinguishable from `t`. |`*`| multiply |
|`f`| frequency, specifying repetition in time. |`/`| divide |
|`ct`| cron-time, a repetition of points in time. |`c`| cron |
|`rt`| range-time, specifies a time interval <br>with two points. |`r`| range |


## CFG production rules

The set above obeys the a set of CFG production rules (in precedence) which yield its CFG parse tree. 

#### Convention

| symbol | convention |
|---|---|
| `< >` | placeholder |
| `[ ]` | optional |
| `=` | set default |
| `<op>` | the arithmetic ops `+,-,*,/` |
| `<t:v>` | the unit of time, `t: {ms, s, m, h, d, w, M, y}` |
| `~` | next step in the production rule. |

#### <a name="tokenize"></a>Token parsing
An input string will be tokenized, with each valid token mapped into a valid CFG symbol, and invalid token maps into the null CFG symbol `∅`. This is done via a provided map. The keys are always parsed into `<t> or <n> <t>` conforming to the production rules (next section), with values and units are determined in the map. Some examples:

- hour ~ `<t> ~ 1h`
- 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
- pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
- 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
- 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
- evening ~ `(12+6)*h`

We distinguish between 3 different types of token parsing, done in order. CFG symbols map onto themselves.

| | type | detail |
|---|---|---|
|1.| normal forms | Readily parseable by the builtin `Date()` constructor |
|2.| subnormal forms | almost normal, but not english. e.g. `12/1-3, 2300hr, 23:00` |
|3.| english forms | words in english, e.g. `tonight, evening, half an hour` |

#### <a name="produce"></a>Production rules

| | production rule | name | example |
|---|---|---|---|
|1.| `<n1>[<op>=]<n2>`<br>`~ {<n1>*<n2> if <n1> ≤ <n2>, <n1>+<n2> otherwise}`<br>` ~ <n>` | english arithmetic | half an ~ `0.5*1`;<br>two [and] half ~ `2+0.5` |
|2.| `<n><t>`<br>`~ <n>*<t>`<br>`~ <t>` | scalar-time resolution | 2 hours ~ `2*<t:h> = <t:2h>` |
|3.| `<n1><t>[<op>]<n2>`<br>`~ <n1>[<op>]<n2> <t>`<br>`~ <n><t>`<br>`~ <t>` | scalar-time distributivity | 2 hours [and] half ~ `(2+0.5)*<t:h> = <t:2.5h>` |
|4.| `[<f>=1]<c><t>`<br>`~ <ct>` | cron-time | [once] a week ~ `<cr:weekly>` |
|5.1| `<t1:v=><t2:v>`<br>`~ <t1:v=(t2:v)><t2:v>`, where `<t1>` default units are overridden if they are specified in `<t2>`. | default override (time units) | tonight at 7 ~ `(<t:12h>+<t:=9h>)+<t:7> = (<t:12h>+<t:=9h>)+<t:7h> = <t:12h>+<t:7h>`, where tonight is defaulted to 9pm |
|5.2| `[<t1>=op_identity][<op>=+]<t2>`<br>`~ [<t1>]<t2>`<br>`~ <t>` | unit arithmetic | 2 hour 30min ~ `2*<t:h> + 30*<t:m> = <t:2h30m>` |
|5.3| `<t:≥24h>`<br>`~ <t:≥24-12h>` | auto-hour-modding | tonight at 19 ~ `(<t:12h>+<t:=9h>)+<t:19h> = <t:12h>+<t:19h> = <t:31> = <t:19h>` |
|5.4| `<t1:?><t2:v><t3:?>`<br>`~ <t1:u><t2:v><t3:w> or <t1:w><t2:v><t3:v>`,<br>where `u < v < w`, which ever is valid. | ambiguity resolution (time units) | 12 Aug 2015 ~ `<t:d><t:M><t:y>`<br>2015 Aug 12 ~ ` <t:y><t:M><t:d>` |
|6.1| `<t1><r><t2>, <t1:h> ≥ <t2:h>`<br>`~ <t1><r><t2+12h>` | auto-range-ordering | 10-2 ~ `{<t:10h>, <t:2h>} ~ {<t:10h>, <t:12+2h>}` |
|6.2| `<t1><r><t2:v> or <t1:v><r><t2>`<br>`~ <t1:v><r><t2:v>` | range-time distributivity | tonight 8-10 ~ `<t:12h>+{<t:8h>, <t:10h>}` or 8-10pm ~ `{<t:8h>, <t:10h>}+<t:12h>` |
|6.3| `<t1:≥24h><r><t2>`<br>`~ <t1:≥24-12h><r><t2:≥24-12h>` | range-auto-hour-modding | tonight 20-22 or 20-22pm ~ `<t:12h>+{<t:20h>, <t:22h>} ~ {<t:32h>, <t:34h>} ~ {<t:20h>, <t:22h>}`  |
|6.4| `[<t>=time_origin]<r><t>`<br>`~ <rt>` | range-time | 4-6 ~ `{<t:4h>, <t:6h>}` |


#### <a name="interpret"></a>Interpretation rules
At the end of parsing, the parse tree sentence should have only the **terminal symbols** `{t, ct, rt}`, with all the invalid symbols discarded. They should describe a transformation from the origin (current time).

| sentence | interpretation |
|---|---|
| `<t>` | A point in time from now |
| `<ct>` | cron-time, starting from now |
| `<rt>` | range-time, default to starting from now |
| `<t><ct>` | cron-time starting from a point from now |
| `<t><rt>` | range-time, both points translated |
| `<ct><rt>` | cron-time with start, end by the range |
| `<t><ct><rt>` | cron-time with start, end, starting from a point from now |



## <a name="algo"></a>Algorithm

#### algorithm Parse:
Given an input string `s`,

1. Apply [**Token parsing**](#tokenize),
2. Apply [**Production rules**](#produce),
3. Apply [**Interpretation**](#interpret),
4. Return a sentence of **terminal symbols** in `{t, ct, rt}`


#### Example parse tree

| step | algorithm/rule | parse tree result |
|---|---|---|
|input| raw | '... at 2pm every week from tmr till next week.' |
|0.| token parsing | `∅ <op> <n><n><t> <c> <t> <op> <t> <r> <op> <t>` |
|1.| english arithmetic | `<op> (<n><t>) <c> <t> <op> <t> <r> <op> <t>` |
|2.| scalar-time resolution | `<op> <t> <c> <t> <op> <t> <r> <op> <t>` |
|3.| scalar-time distributivity | `<op> <t> (<c> <t>) <op> <t> <r> <op> <t>` |
|4.| `<c>` rules | `(<op> <t>) <ct> (<op> <t>) <r> (<op> <t>)` |
|5.| `<t>` rules | `<t> <ct> (<t> <r> <t>)` |
|6.| `<r>` rules | `<t> <ct> <rt>` |
|7.| interpretation | `<daily-cron at 2pm, starts tmr, ends 7 days from tmr>` |
