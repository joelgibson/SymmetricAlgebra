/// <reference path="parse.ts"/>

// Read a configuration out of the config form.
function readConfig(): AlgebraType {
    let $checked = <HTMLInputElement>document.querySelector('input[name="algebra"]:checked');
    let $number = <HTMLInputElement>document.getElementById('gln');

    if ($number.valueAsNumber < 2)
        $number.value = '' + 2;

    if ($checked.value == 'sym')
        return AlgebraType.Sym;

    return AlgebraType.GL($number.valueAsNumber);
}

// Read the config and do a computation.
function doComputation() {
    let $computation = <HTMLInputElement>document.getElementById('computation');
    let $result = <HTMLSpanElement>document.getElementById('result');
    let $error = <HTMLParagraphElement>document.getElementById('error');
    let $errorMessage = <HTMLSpanElement>document.getElementById('errorMessage');
    let $errorInput = <HTMLSpanElement>document.getElementById('errorInput');

    let input = $computation.value;
    let algebraType = readConfig();

    let maybeResult = evaluate(algebraType, input);
    if (maybeResult instanceof ParseError) {
        $error.style.display = 'block';
        $errorMessage.innerText = maybeResult.msg;
        $errorInput.innerHTML = frameError(maybeResult, input);
    } else {
        $error.style.display = 'none'
    }

    const lin = (maybeResult instanceof ParseError) ? algebraUnit(0) : maybeResult;

    $result.innerText = algebraString(lin);
    writeTable(algebraType, lin);
}

// Write the table of details
function writeTable(algebraType: AlgebraType, lin: Linear) {
    let $table = <HTMLTableElement>document.getElementById('decomposition');
    let $td = () => document.createElement('td');
    let $th = () => document.createElement('th');
    let $row = (cellFn: () => HTMLTableHeaderCellElement | HTMLTableCellElement, ...cells: string[]) => {
        let row = document.createElement('tr');
        for (const val of cells) {
            let cell = cellFn();
            cell.innerText = val;
            row.appendChild(cell);
        }
        return row;
    };
    let rows = [$row($th, 'Partition', 'Multiplicity', 'Dimension')];
    for (const {part, mult} of lin) {
        rows.push($row($td,
            '[' + part.join(', ') + ']',
            '' + mult,
            '' + algebraType.dimension(part)));
    }

    $table.innerHTML = '';
    for (const row of rows)
        $table.appendChild(row);
}

// Return some nice pretty error code.
function frameError(err: ParseError, str: string) {
    const stringParts = [
        str.slice(0, err.pos),
        '<span class="error">',
        str.slice(err.pos, err.pos + err.extent),
        '</span>',
        str.slice(err.pos + err.extent),
    ];
    return stringParts.join("");
}

// Set up event handlers.
let $computationForm = <HTMLFormElement>document.getElementById('computationForm');
$computationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    doComputation();
});
$computationForm.addEventListener('change', (event) => {
    doComputation();
});

// Fire inital computation.
doComputation();