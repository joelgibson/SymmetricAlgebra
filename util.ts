// Compare two lists of numbers in lex order.
function compareLists(a: number[], b: number[]): number {
    let i = 0;
    for (; i < a.length && i < b.length; i++) {
        if (a[i] < b[i])
            return -1;
        if (a[i] > b[i])
            return 1;
    }
    if (i == a.length && i < b.length)
        return -1;
    if (i < a.length && i == b.length)
        return 1;
    return 0;
}

function assertOrCrash(cond: boolean, msg?: string) {
    if (!cond) {
        const message = "Assertion failed" + ((msg == undefined) ? "." : ": " + msg);
        throw new Error(message);
    }
}