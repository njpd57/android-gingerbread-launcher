<script setup lang="ts">
import { computed, ref } from 'vue';
import { evaluate, formatResult, isOperator } from '@/utils/calculator';

// A basic calculator (4x3) with Gingerbread's calculator look: black keys that turn orange when pressed.
// The expression is evaluated by utils/calculator.ts (no eval); the result previews as you type.

const expr = ref('');
// after "=", typing a digit starts over while an operator continues from the result
const justEvaluated = ref(false);

const preview = computed(() =>
{
    const v = evaluate(expr.value);
    return v === null || String(v) === expr.value ? '' : formatResult(v);
});

const KEYS = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '−'],
    ['.', '0', '=', '+'],
];

function press(key: string)
{
    if (key === '=')
    {
        const v = evaluate(expr.value);
        if (v !== null)
        {
            const r = formatResult(v);
            expr.value = r === 'Error' ? '' : r;
            justEvaluated.value = r !== 'Error';
        }
        return;
    }

    const last = expr.value.slice(-1);
    if (isOperator(key))
    {
        // swap a trailing operator, except a minus after × or ÷ (a negative number)
        if (isOperator(last) && !(key === '−' && (last === '×' || last === '÷')))
            expr.value = expr.value.slice(0, -1);
        if (expr.value === '' && key !== '−') return;
        expr.value += key;
    }
    else
    {
        if (justEvaluated.value) expr.value = '';
        // one decimal point per number
        if (key === '.' && /\.\d*$/.test(expr.value)) return;
        expr.value += key;
    }
    justEvaluated.value = false;
}

function backspace()
{
    expr.value = expr.value.slice(0, -1);
    justEvaluated.value = false;
}

function clear()
{
    expr.value = '';
    justEvaluated.value = false;
}
</script>

<template>
    <div class="calculator-widget">
        <div class="screen">
            <div class="expr">{{ expr || '0' }}</div>
            <div class="preview">{{ preview }}</div>
        </div>
        <div class="keys">
            <button class="fn" @click="clear">C</button>
            <button class="fn" aria-label="Borrar" @click="backspace">⌫</button>
            <template v-for="row in KEYS" :key="row.join()">
                <button
                    v-for="key in row"
                    :key="key"
                    :class="{ op: isOperator(key) || key === '=' }"
                    @click="press(key)">
                    {{ key }}
                </button>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
.calculator-widget {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid #555;
    border-radius: 6px;
    background: #111;
    box-shadow: 0 3px 8px rgba(#000, 0.5);

    // a light LCD-like display, like Gingerbread's
    > .screen {
        padding: 4px 10px;
        background: linear-gradient(to bottom, #f4f4f4, #cfcfcf);
        color: #111;
        text-align: right;

        // long expressions keep their end in view: they overflow (and are cut) on the left
        > .expr {
            display: flex;
            justify-content: flex-end;
            overflow: hidden;
            font-size: 24px;
            line-height: 1.2;
            white-space: nowrap;
        }

        > .preview {
            height: 16px;
            font-size: 13px;
            opacity: 0.55;
        }
    }

    > .keys {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: 1fr;
        gap: 1px;
        background: #000;

        > button {
            appearance: none;
            min-height: 0;
            border: none;
            background: linear-gradient(to bottom, #3c3c3c, #1c1c1c);
            color: #f2f2f2;
            font: inherit;
            font-size: 20px;
            cursor: pointer;

            &.op {
                background: linear-gradient(to bottom, #555, #2e2e2e);
                color: #ffc64d;
            }

            &.fn {
                grid-column: span 2;
                font-size: 16px;
                color: #bbb;
            }

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }
    }
}
</style>
