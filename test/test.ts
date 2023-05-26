/// <reference path="../src/parse.ts"/>

const assert = require('assert');

describe('Crystals', () => {
    it('Recognises Partitions', () => {
        assert(isPartition([]))
        assert(isPartition([1]))
        assert(isPartition([1,1]))
        assert(isPartition([2,1]))

        assert(!isPartition([-1]))
        assert(!isPartition([1,2]))
    })

    it('Recognises lattice words', () => {
        assert(isLatticeWord([]))
        assert(isLatticeWord([1]))
        assert(!isLatticeWord([2]))

        assert(isLatticeWord([1,1,2,3,1,2]))
        assert(!isLatticeWord([1,2,2]))
    })

    it('Converts highest weights to partitions', () => {
        assert.deepEqual(hwToPartition([1,1,2,2,1]), [3, 2])
        assert.deepEqual(hwToPartition([1,1,2,1,2,3]), [3, 2, 1])
    })

    // Assert equality of two lists of lists of numbers after sorting them.
    function assertMultisetEq(first: number[][], second: number[][]) {
        const firstSorted = first.slice(0).sort(compareLists);
        const secondSorted = second.slice(0).sort(compareLists);
        assert.deepEqual(firstSorted, secondSorted)
    }

    it('Expands crystals from highest weights', () => {
        assertMultisetEq(expandInGL(3, [1]), [[1], [2], [3]])
        assertMultisetEq(expandInGL(3, [1, 2]), [[1, 2], [1, 3], [2, 3]])
        assertMultisetEq(expandInGL(3, [1, 1]), [[1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3]])
        assertMultisetEq(expandInGL(3, [1, 1, 2]),
            [[1, 1, 2], [2, 1, 2], [1, 1, 3], [3, 1, 2], [2, 1, 3], [3, 1, 3], [2, 2, 3], [3, 2, 3]])
            assertMultisetEq(expandInGL(3, [1, 2, 3]), [[1, 2, 3]])
    })

    it('Computes dimensions of crystals', () => {
        assert.deepEqual(dimensionInGL(1, [1]), 1)
        assert.deepEqual(dimensionInGL(10, [1]), 10)
        assert.deepEqual(dimensionInGL(3, [3]), 10)
        assert.deepEqual(dimensionInGL(3, [2, 1]), 8)
        assert.deepEqual(dimensionInGL(3, [1, 1, 1]), 1)

        assert.deepEqual(expandInGL(4, [1, 1, 1, 2, 2, 3]).length, dimensionInGL(4, [3, 2, 1]))
    })

    it('Tensors partitions', () => {
        //assert.deepEqual(0, tensorPartitions([1], [1]), [[2], [1, 1]])
        //assert.deepEqual(0, tensorPartitions([1, 1], [1, 1]), [[2, 2], [2, 1, 1], [1, 1, 1, 1]])
    })
})

describe('algebra', () => {
    it('Embeds units', () => {
        assert.deepEqual(algebraUnit(0), [{part: [], mult: 0}])
        assert.deepEqual(algebraUnit(1), [{part: [], mult: 1}])
    })

    it('Embeds partitions', () => {
        assert.deepEqual(algebraPart([]), algebraUnit(1))
        assert.deepEqual(algebraPart([1]), [{part: [1], mult: 1}])
    })

    it('Adds', () => {
        assert.deepEqual(
            addParts([], [], [2, 1], [], [1]),
            [{part: [2, 1], mult: 1}, {part: [1], mult: 1}, {part: [], mult: 3}])
    })

    it('Tensors respecting units', () => {
        assert.deepEqual(
            algebraMul(AlgebraType.Sym, algebraUnit(2), algebraPart([2, 2])),
            addParts([2, 2], [2, 2]))
        assert.deepEqual(
            algebraMul(AlgebraType.Sym, algebraPart([2, 2]), algebraUnit(2)),
            addParts([2, 2], [2, 2]))
    })

    it('Tensors in the Symmetric Algebra', () => {
        assert.deepEqual(
            algebraMul(AlgebraType.Sym, algebraPart([1]), algebraPart([1])),
            addParts([1, 1], [2]))

        assert.deepEqual(
            algebraMul(AlgebraType.Sym, algebraPart([1]), algebraPart([1]), algebraPart([1])),
            addParts([1, 1, 1], [2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraPow(AlgebraType.Sym, algebraPart([1]), 3),
            addParts([1, 1, 1], [2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraMul(AlgebraType.Sym, algebraPart([2, 1]), algebraPart([2, 1])),
            addParts(
                [2, 2, 1, 1],
                [2, 2, 2],
                [3, 1, 1, 1],
                [3, 2, 1], [3, 2, 1],
                [3, 3],
                [4, 1, 1],
                [4, 2]))

        assert.deepEqual(
            algebraPow(AlgebraType.Sym, algebraPart([2, 1]), 2),
            addParts(
                [2, 2, 1, 1],
                [2, 2, 2],
                [3, 1, 1, 1],
                [3, 2, 1], [3, 2, 1],
                [3, 3],
                [4, 1, 1],
                [4, 2]))
    })

    it('Tensors in the GL_2 representation ring', () => {
        assert.deepEqual(
            algebraMul(AlgebraType.GL(2), algebraPart([1]), algebraPart([1])),
            addParts([1, 1], [2]))

        assert.deepEqual(
            algebraMul(AlgebraType.GL(2), algebraPart([1]), algebraPart([1]), algebraPart([1])),
            addParts([2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraPow(AlgebraType.GL(2), algebraPart([1]), 3),
            addParts([2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraMul(AlgebraType.GL(2), algebraPart([2, 1]), algebraPart([2, 1])),
            addParts([3, 3], [4, 2]))

        assert.deepEqual(
            algebraPow(AlgebraType.GL(2), algebraPart([2, 1]), 2),
            addParts([3, 3], [4, 2]))
    })

    it('Tensors in the GL_3 representation ring', () => {
        assert.deepEqual(
            algebraMul(AlgebraType.GL(3), algebraPart([1]), algebraPart([1])),
            addParts([1, 1], [2]))

        assert.deepEqual(
            algebraMul(AlgebraType.GL(3), algebraPart([1]), algebraPart([1]), algebraPart([1])),
            addParts([1, 1, 1], [2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraPow(AlgebraType.GL(3), algebraPart([1]), 3),
            addParts([1, 1, 1], [2, 1], [2, 1], [3]))

        assert.deepEqual(
            algebraMul(AlgebraType.GL(3), algebraPart([2, 1]), algebraPart([2, 1])),
            addParts(
                [2, 2, 2],
                [3, 2, 1], [3, 2, 1],
                [3, 3],
                [4, 1, 1],
                [4, 2]))
        assert.deepEqual(
            algebraPow(AlgebraType.GL(3), algebraPart([2, 1]), 2),
            addParts(
                [2, 2, 2],
                [3, 2, 1], [3, 2, 1],
                [3, 3],
                [4, 1, 1],
                [4, 2]))
    })
})

describe('Parser', () => {
    // Filter RPN output down to just tokens.
    function stripRPN(result: ParseError | Item[]) {
        if (result instanceof ParseError)
            return result;
        return result.map(({item}) => item)
    }

    it('RPNs correct strings correctly', () => {
        assert.deepEqual(stripRPN(toRPN('3')), ['3'])
        assert.deepEqual(stripRPN(toRPN('3 + 4* 5')), [3, 4, 5, '*', '+'])
        assert.deepEqual(stripRPN(toRPN('(3 + 4)* 5')), [3, 4, '+', 5, '*'])
        assert.deepEqual(stripRPN(toRPN('2+ [2, 1]+ 3')), [2, [2, 1], '+', 3, '+'])
        assert.deepEqual(stripRPN(toRPN('2[1]')), [2, [1], '*'])
        assert.deepEqual(stripRPN(toRPN('[1]^2')), [[1], 2, '^'])
    })

    // Filter errors down to the pos and extent fields.
    function stripError(error: any) {
        if (error instanceof ParseError)
            return {pos: error.pos, extent: error.extent};
        assert.fail(error, null, "This should have been an error.");
    }

    it('Detects errors during RPN', () => {
        assert.deepEqual(stripError(toRPN(' [1, 2]')), {pos: 1, extent: 6})
        assert.deepEqual(stripError(toRPN(' x 2')), {pos: 1, extent: 1})
        assert.deepEqual(stripError(toRPN('1 + 2)')), {pos: 5, extent: 1})
        assert.deepEqual(stripError(toRPN('()(1 + 2')), {pos: 2, extent: 1})
        assert.deepEqual(stripError(toRPN('7]')), {pos: 1, extent: 1})
    })

    it('Detects errors during evaluation', () => {
        assert.deepEqual(stripError(evaluate(AlgebraType.Sym, '1 +')), {pos: 2, extent: 1});
        assert.deepEqual(stripError(evaluate(AlgebraType.Sym, '1 1')), {pos: 0, extent: 3});
    })

    it('Evaluates in the Symmetric Algebra', () => {
        assert.deepEqual(evaluate(AlgebraType.Sym, "1 + 2"), algebraUnit(3))
        assert.deepEqual(evaluate(AlgebraType.Sym, "[2, 1] * [1]"), addParts([3, 1], [2, 2], [2, 1, 1]))
        assert.deepEqual(evaluate(AlgebraType.Sym, "[1]^2"), addParts([2], [1, 1]))
    })

    it('Evaluates in GL_2', () => {
        assert.deepEqual(evaluate(AlgebraType.GL(2), "1 + 2"), algebraUnit(3))
        assert.deepEqual(evaluate(AlgebraType.GL(2), "[2, 1] * [1]"), addParts([3, 1], [2, 2]))
        assert.deepEqual(evaluate(AlgebraType.GL(2), "[3, 2, 1]"), algebraUnit(0))
        assert.deepEqual(evaluate(AlgebraType.GL(2), "[3, 2, 1] + 2[2, 1]"), addParts([2, 1], [2, 1]))
        assert.deepEqual(evaluate(AlgebraType.GL(2), "[2]^2"), addParts([4], [3, 1], [2, 2]))
    })
})

// Utility for some shorthand.
function addParts(...parts: Partition[]): Linear {
    return algebraAdd(...parts.map(algebraPart));
}