/// <reference path="../src/algebra.ts"/>

const Benchmark = require('benchmark');

let suitey = new Benchmark.Suite("N Queens");
suitey
.add('[2, 2] * [2, 2] in Sym', () => {
    algebraMul(AlgebraType.Sym, algebraPart([2, 2]), algebraPart([2, 2]))
})
.add('[3, 2, 1] * [3, 2, 1] in Sym', () => {
    algebraMul(AlgebraType.Sym, algebraPart([3, 2, 1]), algebraPart([3, 2, 1]))
})
.add('[4, 3, 3] * [4, 3, 3] in Sym', () => {
    algebraMul(AlgebraType.Sym, algebraPart([4, 3, 3]), algebraPart([4, 3, 3]))
})
.add('[4, 3, 2, 1] * [4, 3, 2, 1] in Sym', () => {
    algebraMul(AlgebraType.Sym, algebraPart([4, 3, 2, 1]), algebraPart([4, 3, 2, 1]))
})
.on('cycle', function(event: any) {
  console.log(String(event.target));
}).run()