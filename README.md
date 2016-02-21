# nlp-time
NLP time parser for time, range, and cron pattern. This is based on CFG and algorithm proven in [CFG.md](./CFG.md)

This is under still development.

## Todo

- ok if the dateStrArr parseable by subnormal, override
do it at preinjection

ok take the results of parseNormal, the dateStrArr, on each, parseSubnormal, if full result conforms to reT regex, replace

raw str -> parseNormal, save tokens, if overparsed, drop, restore into str, 
fix subnormal parsing first
fix subnormal digit number as years
MM/dd or MM/yyyy or yyyy/MM

symbol on taking T form shd construct a T