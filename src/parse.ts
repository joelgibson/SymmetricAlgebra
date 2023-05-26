/// <reference path="algebra.ts"/>

const precedence: {[s: string]: number} = {'+': 0, '*': 1, '^': 2}

class ParseError {
    constructor(
        readonly pos: number,
        readonly extent: number,
        readonly msg: string
    ) {}
}
class Item {
    constructor(
        readonly item: number | number[] | string,
        readonly pos: number
    ) {}
}

function evaluate(type: AlgebraType, str: string): ParseError | Linear {
    const rpnResult = toRPN(str);
    if (rpnResult instanceof ParseError)
        return rpnResult;

    const items = <Item[]>rpnResult;
    const stack: Linear[] = []
    for (const {item, pos} of items) {
        if (typeof item == 'number')
            stack.push(algebraUnit(item))
        else if (item instanceof Array)
            stack.push(type.restrict(algebraPart(item)))
        else {
            if (stack.length < 2)
                return new ParseError(pos, 1, `Not enough arguments to ${item}`);
            const right = stack.pop()!;
            const left = stack.pop()!;
            if (item == '+')
                stack.push(algebraAdd(left, right));
            else if (item == '*')
                stack.push(algebraMul(type, left, right));
            else if (item == '^') {
                if (right.length != 1 || right[0].part.length > 0)
                    return new ParseError(pos, 1, `Exponent must be a number in ${item}`);
                const exponent = right[0].mult;
                stack.push(algebraPow(type, left, exponent));
            }
        }
    }
    if (stack.length != 1)
        return new ParseError(0, str.length, `Missing operations`);
    return stack[0];
}

function toRPN(str: string): ParseError | Item[] {
    // Parser state: we mimic a shunting-yard type thing, and have a stack of
    // operators.
    type opStackItem = {['tok']: string, ['pos']: number}
    const opStack: opStackItem[] = [];
    const outQueue: Item[] = [];

    const re = /\s+|\d+|[+*^()]|\[\s*\]|\[\s*\d+\s*(,\s*\d+\s*)*\]/g;
    let matchArray: RegExpExecArray | null;
    let lastToken: string = "";
    let nextIndex = 0;
    let currentPos = 0;
    let pushOp = (tok: string) => opStack.push({tok: tok, pos: currentPos});
    let itemFromOp = ({tok, pos}: opStackItem) => new Item(tok, pos);
    while ((matchArray = re.exec(str)) != null) {
        const token = matchArray[0];
        currentPos = matchArray.index;

        if (matchArray.index != nextIndex) {
            const pos = nextIndex;
            const extent = currentPos - pos;
            const bad = str.slice(pos, pos + extent);
            return new ParseError(pos, extent, `Unrecognised token "${bad}"`);
        }
        nextIndex = currentPos + token.length;

        if (token[0] == '[') {
            const nums = extractNums(token);
            if (!isPartition(nums))
                return new ParseError(currentPos, token.length, `Partitions are weakly decreasing sequences of positive integers: ${token} is not a partition.`);

            // Hackery so I can write 2[3, 1]
            if (lastToken.match(/\d+/))
                pushOp('*');

            outQueue.push(new Item(nums, currentPos));
        }
        else if (token.match(/^\s+/) != null) {
            // Skip whitespace
        } else if (token.match(/\d+/))
            outQueue.push(new Item(parseInt(token, 10), currentPos));
        else if (token == '(')
            pushOp('(');
        else if (token.match(/[+*^]/) != null) {
            while (opStack.length != 0 && precedence[opStack[opStack.length - 1].tok] >= precedence[token])
                outQueue.push(itemFromOp(opStack.pop()!));
            pushOp(token);
        } else if (token == ')') {
            while (opStack.length != 0 && opStack[opStack.length - 1].tok != '(') {
                outQueue.push(itemFromOp(opStack.pop()!));
            }
            if (opStack.length == 0 || opStack.pop()!.tok != '(')
                return new ParseError(matchArray.index, 1, 'Unmatched closing parenthesis');
        } else {
            assertOrCrash(false);
        }

        lastToken = token;
    }

    if (nextIndex != str.length)
        return new ParseError(nextIndex, str.length - nextIndex, `Unrecognised token.`)

    while (opStack.length != 0) {
        const {tok, pos} = opStack.pop()!;
        if (tok == '(')
            return new ParseError(pos, 1, 'Unmatched opening parenthesis.');
        outQueue.push(new Item(tok, pos));
    }

    return outQueue;
}

// Extract all contiguous strings of digits from a string.
function extractNums(str: string) {
    const matches = str.match(/\d+/g)
    if (matches == null)
        return [];
    return matches.map(s => parseInt(s, 10));
}