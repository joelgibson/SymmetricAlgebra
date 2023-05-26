/// <reference path="crystal.ts"/>

// A Z-linear combination of partitions will be a nonempty sorted list of pairs of this form.
type Linear = {['part']: Partition, ['mult']: number}[]

// The unit inclusion Z -> Algebra.
function algebraUnit(num: number): Linear {
    return [{part: [], mult: num}];
}

// Place a partition into the algebra.
function algebraPart(part: Partition): Linear {
    assertOrCrash(isPartition(part))
    return [{part: part, mult: 1}]
}

// Normalise to sorted form, without duplicates or items of multiplicity 0.
function algebraNormalise(lin: Linear): Linear {
    const sorted = lin.slice(0).sort(({part: part1}, {part: part2}) => -compareLists(part1, part2));
    const result: Linear = [];
    for (let {part, mult} of sorted) {
        if (mult == 0)
            continue;
        if (result.length == 0 || compareLists(result[result.length - 1].part, part) != 0)
            result.push({part: part, mult: mult})
        else {
            const newMult = result[result.length - 1].mult + mult;
            if (newMult == 0)
                result.pop()
            else
                result[result.length - 1].mult = newMult;
        }
    }
    return result;
}

// Addition of linear combinations.
function algebraAdd(...lins: Linear[]): Linear {
    return algebraNormalise((<Linear>[]).concat(...lins));
}

// The next few operations are dependent on which algebra we are working in. We also
// need a way to restricted injected partitions to the given algebra.
class AlgebraType {
    private constructor(readonly algebra: string, readonly n: number) {}
    static Sym = new AlgebraType('sym', 0);
    static GL(n: number) {
        assertOrCrash(n >= 2);
        return new AlgebraType('gl', n);
    }

    restrict(lin: Linear): Linear {
        if (this.algebra == 'gl') {
            const restricted = lin.filter(elem => elem.part.length <= this.n);
            return (restricted.length == 0) ? algebraUnit(0) : restricted;
        }
        return lin;
    }

    // Return in which GL_n the two partitions should be tensored.
    tensorIn(part1: Partition, part2: Partition) {
        return (this.algebra == 'gl') ? this.n : part1.length + part2.length;
    }

    // Dimension of the irreducible corresponding to the given partition.
    dimension(part: Partition): number {
        return (this == AlgebraType.Sym) ? dimensionSymmetric(part) : dimensionInGL(this.n, part);
    }
}

// Multiplication of linear combinations, given which algebra we are working over.
function algebraMul(type: AlgebraType, ...lins: Linear[]) {
    if (lins.length == 0)
        return algebraUnit(1);

    let sofar = lins[0];
    for (let i = 1; i < lins.length; i++) {
        let product: Linear = [];
        for (const {part: part1, mult: mult1} of sofar)
            for (const {part: part2, mult: mult2} of lins[i]) {
                if (part1.length == 0) {
                    product.push({part: part2, mult: mult1 * mult2});
                    continue;
                }
                if (part2.length == 0) {
                    product.push({part: part1, mult: mult1 * mult2});
                    continue;
                }
                for (const part of tensorPartitions(type.tensorIn(part1, part2), part1, part2))
                    product.push({part: part, mult: mult1 * mult2});
            }

        sofar = algebraNormalise(product);
    }

    return sofar;
}

// Exponentiation of linear combination, given which algebra we are working over.
function algebraPow(type: AlgebraType, lin: Linear, pow: number) {
    if (pow == 0)
        return algebraUnit(1);

    return algebraMul(type, ...(Array(pow).fill(lin)));
}

// Represent a linear combination as a string.
function algebraString(lin: Linear): string {
    const output: string[] = [];
    for (const {part, mult} of lin) {
        let multStr = "" + mult;
        let partStr = "[" + part.join(", ") + "]";

        if (partStr == "[]") {
            output.push(multStr);
            continue;
        }
        if (multStr == "1")
            multStr = "";

        output.push(multStr + partStr)
    }
    if (output.length == 0)
        return "0";
    return output.join(" + ");
}