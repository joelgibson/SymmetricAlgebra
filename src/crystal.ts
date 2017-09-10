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
//    This function takes an argument which should be the partition to start from, as
// if the function had already been run on a prefix of the word.
function latticeWordToMaybePartition(sofar: Partition, word: number[]): null | Partition {
    const partition = sofar.slice(0);
    for (let i = 0; i < word.length; i++) {
        const num = word[i];

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
    const result = latticeWordToMaybePartition([], v)
    if (result == null)
        assertOrCrash(false, "Given vertex " + v + " was not a partition");
    return result!;
}

// Test whether a crystal element is highest-weight.
function isLatticeWord(v: Vertex): boolean {
    return latticeWordToMaybePartition([], v) != null;
}

// In order to take the tensor products AxB of two crystals A, B given by highest
// weights, we need to generate the crystal B. (All highest weight elements in A x B
// come from a highest-weight element of A, paired with some element of B satsifying
// extra conditions). For this we will implement the crystal f_i operator, from which
// we can build the crystal.

// f_i takes a crystal vertex, and returns the index that would be modified by moving
// along the arrow f_i, or -1 if the vertex would be killed.

// Inside the tensor power of the basic crystal, we may describe f_i as follows.
// Think of each occurence of i as a (, and each i+1 as a ). Other letters are ignored.
// f_i then acts by changing the leftmost unmatched ( into an i+1. We do this via a stack.

//   Scan the letters of the vertex from left to right, pushing the current index onto
// the stack when we see a (, and popping from the stack when we see a ). The leftmost
// unmatched (if any) will be found at the bottom of the stack.

// Finally, for efficiency, we don't actually keep a stack, but just two numbers: what
// would be at the bottom of the stack, and the height of the stack.
function crystal_f(i: number, v: Vertex): number {
    let bottom = 0;
    let size = 0;

    for (let j = 0; j < v.length; j++) {
        if (v[j] == i) {
            if (size <= 0) {
                bottom = j;
                size = 0;
            }
            size++;
        } else if (v[j] == i + 1)
            size--;
    }

    return (size <= 0) ? -1 : bottom;
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

// Perform a depth-first-search of the crystal, calling the given visitor function
// on each vertex. The argument to the visitor function should not be modified: it
// belongs to the DFS search, and it will be modified after the visitor returns.
//   This approach means that the DFS search only allocates to grow its "seen vertices"
// set, and all other memory usage is linear in the depth of the crystal.
type CrystalVisitor = (v: Vertex) => void
function visitGLnCrystal(n: number, start: Vertex, visit: CrystalVisitor): void {
    assertOrCrash(isLatticeWord(start))
    assertOrCrash(vertexHeight(start) <= n)

    // Convert each array to a string and put it in this object to keep track of
    // what we have seen so far.
    const seen: {[s: string]: null} = {}

    // Initially, we have the top vertex.
    seen[start.toString()] = null;
    visit(start);

    // The state of the DFS will be a quadruple of the following:
    // A list giving the vertex we are currently at, modified as we move around the crystal.
    const mutVert = start.slice(0);

    // A stack of which index we modified on each step down the current path.
    const mutStack: number[] = [];

    // A stack telling us where to resume expanding when we move back up the current path.
    const expStack: number[] = [];

    // An integer in the range [1, n] telling us which crystal operator to try next.
    // If toExpand = n, then this triggers a backtrack.
    let toExpand = 1;

    for (;;) {
        // Backtrack step.
        if (toExpand == n) {
            // Are we done with the whole crystal?
            if (mutStack.length == 0)
                break;
            
            // Backtrack one vertex along the path.
            mutVert[mutStack.pop()!] -= 1;
            toExpand = expStack.pop()!;
            continue;
        }

        // Check along the edge f_i out of the current vertex.
        const maybeIdx = crystal_f(toExpand, mutVert);

        // If there was no edge, move onto the next.
        if (maybeIdx < 0) {
            toExpand += 1;
            continue;
        }

        // We did find an outgoing edge.
        mutVert[maybeIdx] += 1;
        
        // If we've seen it before, ignore it.
        const mutVertStr = mutVert.toString();
        if (seen.hasOwnProperty(mutVertStr)) {
            mutVert[maybeIdx] -=1;
            toExpand += 1;
            continue;
        }

        // Otherwise, visit it, add it to our seen set, and move to it.
        seen[mutVertStr] = null;
        visit(mutVert);

        mutStack.push(maybeIdx);
        expStack.push(toExpand + 1);
        toExpand = 1;
    }
}

// Return the whole crystal of GL_n below the given starting vertex.
function expandInGL(n: number, start: Vertex): Vertex[] {
    const crystal: Vertex[] = [];
    visitGLnCrystal(n, start, (v: Vertex) => crystal.push(v.slice(0)));
    return crystal;
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
function tensorPartitions(n: number, partLeft: Partition, partRight: Partition): Partition[] {
    assertOrCrash(n >= 2 && isPartition(partLeft) && isPartition(partRight))

    // Optimisation: check which one has smaller dimension, and put it on the right.
    const [dim1, dim2] = [dimensionInGL(n, partLeft), dimensionInGL(n, partRight)];
    if (dim1 < dim2)
        [partLeft, partRight] = [partRight, partLeft];

    // Now, traverse the crystal and accumulate those vertices which induce a highest-weight
    // in the tensor product.
    const partitions: Partition[] = [];
    visitGLnCrystal(n, partitionToHw(partRight), (v: Vertex) => {
        const maybePartition = latticeWordToMaybePartition(partLeft, v);
        if (maybePartition != null)
            partitions.push(maybePartition);
    });

    return partitions;
}