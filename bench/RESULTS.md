# DVE Engine Benchmark Results

## Environment
- Node.js v20.20.0, Linux x86_64
- Date: 2026-08-16
- Method: synthetic data generator (bench/gen-data.js) + bench/bench.js
- 3 runs per measurement, median reported

## Baseline (iter1 — original code)
size,build_ms,trace_ms,impact_ms,orphans_ms,search_ms,nodes,edges
100s_5g,19.0,0.0,0.6,0.0,0.6,800,250
500s_10g,126.5,0.1,0.0,0.1,1.5,7000,2000
1000s_10g,347.6,0.4,0.1,0.1,3.5,14000,4000
2000s_10g,786.4,0.6,0.1,0.2,11.7,28000,8000
4000s_10g,2973.1,0.7,0.2,0.4,16.5,56000,16000

## iter2 (builder.ts: Map/Set indexes, O(n²)→O(n))
size,build_ms,nodes
100s_5g,14.6,800
500s_10g,111.9,7000
1000s_10g,172.4,14000
2000s_10g,357.8,28000
4000s_10g,752.6,56000   ← 3.95x vs baseline

## iter3 (decision-parser.ts: single-pass line scan)
size,build_ms,nodes
100s_5g,15.4,800
500s_10g,80.7,7000
1000s_10g,176.3,14000
2000s_10g,338.8,28000
4000s_10g,661.5,56000   ← 4.5x vs baseline

## Profile (4000s_10g, iter3)
- parseSession (4000):   69.2ms (9%)
- parseDecision (40000): 374.8ms (51%) ← remaining bottleneck = readFileSync syscalls
- parseSpec (8000):       66.9ms (9%)
- buildGraph total:      735.0ms

## Remaining bottleneck
parseDecision dominated by synchronous readFileSync (40k syscalls).
Next hypothesis: parallel IO via worker_threads (architecture change → human gate).
