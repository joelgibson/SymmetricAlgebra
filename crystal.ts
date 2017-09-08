/// <reference path="util.ts"/>

// Let B be the basic crystal of GL_n. An vertex of the mth tensor power of B is a
// word of length m on the letters [1, n]. Since we can always embed such a word into
// B^m by making the n in GL_n large enough, a vertex will not be associated with any
// particular GL_n.
type Vertex = number[]

// A partition is a weakly decreasing sequence of positive integers.
type Partition = number[];

function isPartition(nums: number[]): boolean {
    for (let i = 1; i < nums.length; i++)
        if (nums[i-1] < nums[i])
            return false;
    
    if (nums.length > 0 && nums[nums.length - 1] <= 0)
        return false;

    return true;
}

// A vertex is highest-weight if it is a lattice word, meaning that every prefix of
// the word has partition weight. This means that reading from the left to the right,
// partitions can be built by adding a cell in the row specified by the letter, for
// example the word 11231 has successive partitions [1], [2], [2, 1], [2, 1, 1], and
// [3, 1, 1], and so is a lattice word.

// Return the corresponding partition if v is highest weight, otherwise return null.
function hwToMaybePartition(v: Vertex): Partition | null {
    const partition: Partition = []

    for (let i = 0; i < v.length; i++) {
        const num = v[i];

        if (num - 1 == partition.length)
            partition.push(1);
        else if (num == 1)
            partition[0] += 1;
        else if (num - 1 > partition.length)
            return null;
        else {
            if (partition[num - 2] > partition[num - 1])
                partition[num - 1] += 1;
            else
                return null;
        }
    }

    return partition;
}

// Convert a highest-weight crystal vertex to its corresponding partition.
function hwToPartition(v: Vertex): Partition {
    const result = hwToMaybePartition(v)
    if (result == null)
        assertOrCrash(false, "Given vertex " + v + " was not a partition");
    return result!;
}

// Test whether a crystal element is highest-weight.
function isLatticeWord(v: Vertex): boolean {
    return hwToMaybePartition(v) != null;
}

// In order to take the tensor products AxB of two crystals A, B given by highest
// weights, we need to generate the crystal B. (All highest weight elements in A x B
// come from a highest-weight element of A, paired with some element of B satsifying
// extra conditions). For this we will implement the crystal f_i operator, from which
// we can build the crystal.

// f_i takes a crystal vertex, and either creates a new crystal vertex (with weight
// modified by alpha_i), or kills it. Inside the tensor power of the basic crystal, it
// has the following description. Think of each occurence of i as a (, and each i+1 as
// a ). Other letters are ignored. f_i then acts by changing the leftmost unmatched (
// into an i+1. We do this via a stack.
//   Scan the letters of the vertex from left to right, pushing the current index onto
// the stack when we see a (, and popping from the stack when we see a ). The leftmost
// unmatched (if any) will be found at the bottom of the stack.
function crystal_f(i: number, v: Vertex): null | Vertex {
    const stack = [];
    for (let j = 0; j < v.length; j++) {
        if (v[j] == i)
            stack.push(j);
        else if (v[j] == i + 1)
            stack.pop();
    }
    if (stack.length == 0)
        return null;

    const modify = stack[0];
    const newvert = v.slice(0);
    newvert[modify] = i + 1;
    return newvert
}

// We also need to make sure it makes sense to expand the vertex in the specified
// GL_n. For this, we introduce the "height" of a vertex, which is the maximum
// element it contains (it is the height of the longest column, seen as a partition).
function vertexHeight(v: Vertex): number {
    let max = 0;
    for (let i = 0; i < v.length; i++)
        max = Math.max(max, v[i])
    return max;
}

// This silly datastructure will keep track of which elements we have seen during
// the traversal of the crystal.
class NumsSet {
    elems: {[s: string]: null} = {}
    add(nums: number[]) { this.elems[nums.join("|")] = null; }
    has(nums: number[]) { return this.elems.hasOwnProperty(nums.join("|")); }
}

// Generate the whole crystal of sl_n below the given starting vertex, which must
// be highest-weight.
function expandInGL(n: number, start: Vertex): Vertex[] {
    assertOrCrash(isLatticeWord(start))
    assertOrCrash(vertexHeight(start) <= n)

    // Keep a list of elements seen in the crystal, backed by a set for fast
    // testing of whether we have come across it before.
    const crystal = [start];
    const seen = new NumsSet();
    seen.add(start)

    // Perform a breadth-first search of the crystal.
    let frontier = [start];
    while (frontier.length != 0) {
        const new_frontier: Vertex[] = [];
        for (let j = 0; j < frontier.length; j++) {
            const v = frontier[j];
            for (let i = 1; i < n; i++) {
                const result = crystal_f(i, v);
                if (result != null && !seen.has(result)) {
                    seen.add(result);
                    new_frontier.push(result);
                }
            }
        }

        for (let i = 0; i < new_frontier.length; i++)
            crystal.push(new_frontier[i])

        frontier = new_frontier;
    }

    return crystal;
}

// The tensor product of a highest-weight vertex with an expanded crystal
// is now easy to write. This function returns a list of the highest-weight
// elements in the tensor product.
function tensorHwWithCrystal(v: Vertex, crystal: Vertex[]): Vertex[] {
    const result: Vertex[] = []
    for (let i = 0; i < crystal.length; i++) {
        const tensorElem = v.concat(crystal[i]);
        if (isLatticeWord(tensorElem))
            result.push(tensorElem)
    }
    return result;
}

// Return the hook length of the cell (i, j) of a partition. (i, j) are 
// 0-indexed.
function hookLength(part: Partition, i: number, j: number): number {
    let k = 0;
    while (i + k + 1 < part.length && part[i + k + 1] > j)
        k++;
    return k + part[i] - j
}

// Compute quickly the dimension of a representation of the symmetric group.
function dimensionSymmetric(partition: Partition) {
    assertOrCrash(isPartition(partition));

    let product = 1;
    let count = 1;
    for (let i = 0; i < partition.length; i++)
        for (let j = 1; j <= partition[i]; j++)
            product *= (count++) / hookLength(partition, i, j - 1);

    // Lol these dank floating points
    return Math.round(product);
}

// Compute quickly the dimension of a representation of GL_n.
function dimensionInGL(n: number, partition: Partition): number {
    assertOrCrash(isPartition(partition));

    let product = 1;
    for (let i = 0; i < partition.length; i++)
        for (let j = 1; j <= partition[i]; j++)
            product *= (n + j - (i + 1)) / hookLength(partition, i, j - 1);

    // Lol these dank floating points
    return Math.round(product);
}

// Produce some highest-weight vector of the given weight from a partition. There are many such
// embeddings, we use the one which sends [4, 2, 1] to [1, 1, 1, 1, 2, 2, 3].
function partitionToHw(part: Partition): Vertex {
    assertOrCrash(isPartition(part))

    const v: Vertex = []
    for (let i = 0; i < part.length; i++)
        for (let j = 0; j < part[i]; j++)
            v.push(i + 1);

    return v;
}

// Tensor partitions as if in the representation ring of GL_n.
function tensorPartitions(n: number, part1: Partition, part2: Partition): Partition[] {
    assertOrCrash(n >= 2 && isPartition(part1) && isPartition(part2))

    // Optimisation: check which one has smaller dimension, and put it on the right.
    const [dim1, dim2] = [dimensionInGL(n, part1), dimensionInGL(n, part2)];
    if (dim1 < dim2)
        [part1, part2] = [part2, part1];

    const [v1, v2] = [partitionToHw(part1), partitionToHw(part2)];
    const crystal2 = expandInGL(n, v2);
    const newHws = tensorHwWithCrystal(v1, crystal2);
    return newHws.map(hwToPartition);
}