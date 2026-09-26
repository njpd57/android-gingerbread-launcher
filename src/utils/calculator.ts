// The calculator widget's arithmetic, without eval: numbers, + − × ÷, precedence and a leading minus.

export type Operator = '+' | '−' | '×' | '÷';
const OPERATORS: Operator[] = ['+', '−', '×', '÷'];
const PRECEDENCE: Record<Operator, number> = { '+': 1, '−': 1, '×': 2, '÷': 2 };

export function isOperator(c: string): c is Operator
{
    return (OPERATORS as string[]).includes(c);
}

/** Splits "12.5×−3+4" into numbers and operators; a minus at the start or after an operator is a sign. */
function tokenize(expr: string): (number | Operator)[] | null
{
    const tokens: (number | Operator)[] = [];
    let i = 0;
    while (i < expr.length)
    {
        const c = expr[i];
        const expectsNumber = tokens.length === 0 || isOperator(String(tokens[tokens.length - 1]));
        if (/[\d.]/.test(c) || (c === '−' && expectsNumber))
        {
            let j = i + 1;
            while (j < expr.length && /[\d.]/.test(expr[j])) j++;
            const text = expr.slice(i, j).replace('−', '-');
            const n = Number(text);
            if (!isFinite(n) || text === '-' || text === '.') return null;
            tokens.push(n);
            i = j;
        }
        else if (isOperator(c) && !expectsNumber)
        {
            tokens.push(c);
            i++;
        }
        else return null;
    }
    return tokens;
}

function apply(a: number, op: Operator, b: number)
{
    switch (op)
    {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return a / b;
    }
}

/** The value of the expression, or null if it's incomplete or invalid (a trailing operator, "1..2"). */
export function evaluate(expr: string): number | null
{
    const tokens = tokenize(expr);
    if (!tokens || tokens.length === 0 || typeof tokens[tokens.length - 1] !== 'number') return null;

    // shunting-yard, evaluating as it goes
    const values: number[] = [];
    const ops: Operator[] = [];
    const reduce = () =>
    {
        const b = values.pop()!, a = values.pop()!;
        values.push(apply(a, ops.pop()!, b));
    };
    for (const t of tokens)
    {
        if (typeof t === 'number')
        {
            values.push(t);
            continue;
        }
        while (ops.length > 0 && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[t])
            reduce();
        ops.push(t);
    }
    while (ops.length > 0)
        reduce();
    return values[0];
}

/** A result for the display: up to 10 significant digits, "Error" for division by zero. */
export function formatResult(n: number): string
{
    if (!isFinite(n)) return 'Error';
    const rounded = Number(n.toPrecision(10));
    return String(rounded).replace('-', '−');
}
