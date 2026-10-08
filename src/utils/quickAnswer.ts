// Answers the search panel shows above the apps: arithmetic ("15% de 48.000", "(3+4)*2") and unit
// conversions ("3 km en millas", "100 f en c"). No eval: a small recursive-descent parser.
//
// Numbers are written the Chilean way: a comma is the decimal separator ("2,5"), and a dot followed by
// exactly three digits groups thousands ("48.000"); any other dot is a decimal point ("3.5").

export interface QuickAnswer
{
    /** What was understood, e.g. "15 % de 48.000" or "3 km → mi". */
    question: string;
    value: number;
    /** The value formatted with its unit, e.g. "7.200" or "1,864 mi". */
    text: string;
}

const NUMBER_FORMAT = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 6 });

export function formatAnswerNumber(n: number): string
{
    // avoid "-0" and float noise such as 0.1 + 0.2 = 0.30000000000000004
    const clean = Number(n.toPrecision(12)) || 0;
    return NUMBER_FORMAT.format(clean);
}

/** The number a token like "48.000", "2,5" or "3.5" stands for, or null. */
export function parseLocaleNumber(text: string): number | null
{
    if (!/^\d[\d.,]*$|^[.,]\d+$/.test(text)) return null;
    let t = text;
    if (t.includes(','))
        t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t))
        t = t.replace(/\./g, '');
    if ((t.match(/\./g) ?? []).length > 1 || t.includes(',')) return null;
    const n = Number(t);
    return isFinite(n) ? n : null;
}

// --- arithmetic ---

type Token = { kind: 'num'; value: number } | { kind: 'op'; op: string };

function tokenize(input: string): Token[] | null
{
    const tokens: Token[] = [];
    const s = input.toLowerCase()
        .replace(/[×x]/g, '*')
        .replace(/÷/g, '/')
        .replace(/[−–]/g, '-');
    let i = 0;
    while (i < s.length)
    {
        const c = s[i];
        if (c === ' ')
        {
            i++;
            continue;
        }
        const num = /^\d[\d.,]*|^[.,]\d+/.exec(s.slice(i));
        if (num)
        {
            // a trailing comma or dot belongs to the sentence, not the number
            const text = num[0].replace(/[.,]$/, '');
            const value = parseLocaleNumber(text);
            if (value === null) return null;
            tokens.push({ kind: 'num', value });
            i += text.length;
            continue;
        }
        const word = /^(de|of)\b/.exec(s.slice(i));
        if (word)
        {
            tokens.push({ kind: 'op', op: 'of' });
            i += word[0].length;
            continue;
        }
        if ('+-*/^()%'.includes(c))
        {
            tokens.push({ kind: 'op', op: c });
            i++;
            continue;
        }
        return null;
    }
    return tokens;
}

/** A parsed value; `percent` marks "19%" so "100 + 19%" can mean 19 % of 100. */
interface Value
{
    n: number;
    percent: boolean;
}

class Parser
{
    private i = 0;
    constructor(private tokens: Token[]) { }

    private peek(): string | null
    {
        const t = this.tokens[this.i];
        return t?.kind === 'op' ? t.op : null;
    }

    parse(): number | null
    {
        const v = this.additive();
        if (v === null || this.i !== this.tokens.length) return null;
        return v.percent ? v.n / 100 : v.n;
    }

    // a + b, a - b; "a + b%" adds b percent of a, like a pocket calculator
    private additive(): Value | null
    {
        let left = this.multiplicative();
        while (left && (this.peek() === '+' || this.peek() === '-'))
        {
            const op = this.peek();
            this.i++;
            const right = this.multiplicative();
            if (!right) return null;
            const a = left.percent ? left.n / 100 : left.n;
            const b = right.percent ? a * right.n / 100 : right.n;
            left = { n: op === '+' ? a + b : a - b, percent: false };
        }
        return left;
    }

    // a * b, a / b, and "15 % de 200"
    private multiplicative(): Value | null
    {
        let left = this.power();
        while (left && (this.peek() === '*' || this.peek() === '/' || this.peek() === 'of'))
        {
            const op = this.peek();
            this.i++;
            if (op === 'of' && !left.percent) return null;
            const right = this.power();
            if (!right) return null;
            const a = left.percent ? left.n / 100 : left.n;
            const b = right.percent ? right.n / 100 : right.n;
            left = { n: op === '/' ? a / b : a * b, percent: false };
        }
        return left;
    }

    private power(): Value | null
    {
        const base = this.unary();
        if (!base || this.peek() !== '^') return base;
        this.i++;
        const exp = this.power();
        if (!exp) return null;
        return { n: Math.pow(base.percent ? base.n / 100 : base.n, exp.n), percent: false };
    }

    private unary(): Value | null
    {
        if (this.peek() === '-')
        {
            this.i++;
            const v = this.unary();
            return v && { n: -v.n, percent: v.percent };
        }
        if (this.peek() === '+')
        {
            this.i++;
            return this.unary();
        }
        return this.postfix();
    }

    private postfix(): Value | null
    {
        const v = this.primary();
        if (v && this.peek() === '%')
        {
            this.i++;
            return { n: v.n, percent: true };
        }
        return v;
    }

    private primary(): Value | null
    {
        const t = this.tokens[this.i];
        if (!t) return null;
        if (t.kind === 'num')
        {
            this.i++;
            return { n: t.value, percent: false };
        }
        if (t.op === '(')
        {
            this.i++;
            const v = this.additive();
            if (!v || this.peek() !== ')') return null;
            this.i++;
            return v;
        }
        return null;
    }
}

/** The value of an arithmetic expression, or null if it isn't one (or is just a number). */
export function evaluateExpression(input: string): number | null
{
    const tokens = tokenize(input);
    if (!tokens || tokens.length === 0) return null;
    // a bare number isn't a question
    if (!tokens.some(t => t.kind === 'op' && t.op !== '(' && t.op !== ')')) return null;
    const value = new Parser(tokens).parse();
    return value !== null && isFinite(value) ? value : null;
}

// --- units ---

interface Unit
{
    symbol: string;
    category: 'length' | 'mass' | 'volume' | 'temperature' | 'speed' | 'data' | 'time' | 'area';
    /** Factor to the category's base unit (for temperature, handled apart). */
    factor: number;
    names: string[];
}

const UNITS: Unit[] = [
    { symbol: 'mm', category: 'length', factor: 0.001, names: ['mm', 'milimetro', 'milimetros'] },
    { symbol: 'cm', category: 'length', factor: 0.01, names: ['cm', 'centimetro', 'centimetros'] },
    { symbol: 'm', category: 'length', factor: 1, names: ['m', 'metro', 'metros'] },
    { symbol: 'km', category: 'length', factor: 1000, names: ['km', 'kilometro', 'kilometros'] },
    { symbol: 'in', category: 'length', factor: 0.0254, names: ['in', 'pulgada', 'pulgadas', 'inch', 'inches', '"'] },
    { symbol: 'ft', category: 'length', factor: 0.3048, names: ['ft', 'pie', 'pies', 'foot', 'feet'] },
    { symbol: 'yd', category: 'length', factor: 0.9144, names: ['yd', 'yarda', 'yardas'] },
    { symbol: 'mi', category: 'length', factor: 1609.344, names: ['mi', 'milla', 'millas', 'mile', 'miles'] },

    { symbol: 'mg', category: 'mass', factor: 0.001, names: ['mg', 'miligramo', 'miligramos'] },
    { symbol: 'g', category: 'mass', factor: 1, names: ['g', 'gr', 'gramo', 'gramos'] },
    { symbol: 'kg', category: 'mass', factor: 1000, names: ['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'] },
    { symbol: 't', category: 'mass', factor: 1e6, names: ['t', 'tonelada', 'toneladas'] },
    { symbol: 'oz', category: 'mass', factor: 28.349523125, names: ['oz', 'onza', 'onzas'] },
    { symbol: 'lb', category: 'mass', factor: 453.59237, names: ['lb', 'lbs', 'libra', 'libras'] },

    { symbol: 'ml', category: 'volume', factor: 0.001, names: ['ml', 'mililitro', 'mililitros', 'cc'] },
    { symbol: 'l', category: 'volume', factor: 1, names: ['l', 'lt', 'litro', 'litros'] },
    { symbol: 'gal', category: 'volume', factor: 3.785411784, names: ['gal', 'galon', 'galones'] },
    { symbol: 'taza', category: 'volume', factor: 0.24, names: ['taza', 'tazas', 'cup', 'cups'] },

    { symbol: 'm²', category: 'area', factor: 1, names: ['m2', 'm²', 'metro cuadrado', 'metros cuadrados'] },
    { symbol: 'km²', category: 'area', factor: 1e6, names: ['km2', 'km²', 'kilometro cuadrado', 'kilometros cuadrados'] },
    { symbol: 'ha', category: 'area', factor: 1e4, names: ['ha', 'hectarea', 'hectareas'] },
    { symbol: 'acre', category: 'area', factor: 4046.8564224, names: ['acre', 'acres'] },
    { symbol: 'ft²', category: 'area', factor: 0.09290304, names: ['ft2', 'ft²', 'pie cuadrado', 'pies cuadrados'] },

    { symbol: '°C', category: 'temperature', factor: 1, names: ['c', '°c', 'celsius', 'centigrados', 'grados celsius'] },
    { symbol: '°F', category: 'temperature', factor: 1, names: ['f', '°f', 'fahrenheit', 'grados fahrenheit'] },
    { symbol: 'K', category: 'temperature', factor: 1, names: ['k', 'kelvin'] },

    { symbol: 'km/h', category: 'speed', factor: 1 / 3.6, names: ['km/h', 'kmh', 'kph', 'kilometros por hora'] },
    { symbol: 'm/s', category: 'speed', factor: 1, names: ['m/s', 'metros por segundo'] },
    { symbol: 'mph', category: 'speed', factor: 0.44704, names: ['mph', 'millas por hora'] },
    { symbol: 'nudos', category: 'speed', factor: 1852 / 3600, names: ['nudo', 'nudos', 'kn', 'knots'] },

    { symbol: 'B', category: 'data', factor: 1, names: ['b', 'byte', 'bytes'] },
    { symbol: 'KB', category: 'data', factor: 1e3, names: ['kb', 'kilobyte', 'kilobytes'] },
    { symbol: 'MB', category: 'data', factor: 1e6, names: ['mb', 'megabyte', 'megabytes', 'megas'] },
    { symbol: 'GB', category: 'data', factor: 1e9, names: ['gb', 'gigabyte', 'gigabytes', 'gigas'] },
    { symbol: 'TB', category: 'data', factor: 1e12, names: ['tb', 'terabyte', 'terabytes'] },

    { symbol: 's', category: 'time', factor: 1, names: ['s', 'seg', 'segundo', 'segundos'] },
    { symbol: 'min', category: 'time', factor: 60, names: ['min', 'minuto', 'minutos'] },
    { symbol: 'h', category: 'time', factor: 3600, names: ['h', 'hr', 'hora', 'horas'] },
    { symbol: 'días', category: 'time', factor: 86400, names: ['dia', 'dias', 'day', 'days'] },
    { symbol: 'semanas', category: 'time', factor: 604800, names: ['semana', 'semanas', 'week', 'weeks'] },
];

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function findUnit(name: string): Unit | null
{
    const n = stripAccents(name.trim().toLowerCase()).replace(/^grados\s+/, '');
    return UNITS.find(u => u.names.includes(n)) ?? null;
}

function toCelsius(v: number, u: Unit)
{
    if (u.symbol === '°F') return (v - 32) * 5 / 9;
    if (u.symbol === 'K') return v - 273.15;
    return v;
}

function fromCelsius(c: number, u: Unit)
{
    if (u.symbol === '°F') return c * 9 / 5 + 32;
    if (u.symbol === 'K') return c + 273.15;
    return c;
}

/** "3 km en millas" → 1.864 mi; null if it isn't a conversion between units of the same kind. */
export function convertUnits(input: string): QuickAnswer | null
{
    const m = /^\s*(-?[\d.,]+)\s*(.+?)\s+(?:en|a|to|in|->|→)\s+(.+?)\s*$/i.exec(input);
    if (!m) return null;
    const amount = m[1].startsWith('-') ? -(parseLocaleNumber(m[1].slice(1)) ?? NaN) : parseLocaleNumber(m[1]);
    const from = findUnit(m[2]);
    const to = findUnit(m[3]);
    if (amount === null || isNaN(amount) || !from || !to || from.category !== to.category) return null;

    const value = from.category === 'temperature'
        ? fromCelsius(toCelsius(amount, from), to)
        : amount * from.factor / to.factor;
    return {
        question: `${formatAnswerNumber(amount)} ${from.symbol} → ${to.symbol}`,
        value,
        text: `${formatAnswerNumber(value)} ${to.symbol}`,
    };
}

/** What the search panel shows for the query: a conversion, a calculation, or null. */
export function quickAnswer(input: string): QuickAnswer | null
{
    const conversion = convertUnits(input);
    if (conversion) return conversion;

    const value = evaluateExpression(input);
    if (value === null) return null;
    return { question: input.trim(), value, text: formatAnswerNumber(value) };
}
