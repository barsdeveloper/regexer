import { test, expect } from "@playwright/test"
import EscapedCharParser from "../src/parser/EscapedCharParser.js"
import RegExpGrammar, { R } from "../src/grammars/RegExpGrammar.js"

test("Test 1", async ({ page }) => {
    expect(R.escapedChar("\x41", EscapedCharParser.Type.HEX).toString()).toEqual(String.raw`\x41`)
})

test("Test 2", async ({ page }) => {
    expect(R.escapedChar("\n", EscapedCharParser.Type.NORMAL).toString()).toEqual(String.raw`\n`)
})

test("Test 3", async ({ page }) => {
    expect(R.escapedChar("\u0042", EscapedCharParser.Type.UNICODE).toString()).toEqual(String.raw`\u0042`)
})

test("Test 4", async ({ page }) => {
    expect(R.class(R.range(R.escapedChar("\b"), R.str("z"))).toString()).toEqual(String.raw`[\b-z]`)
})

test("Test 5", async ({ page }) => {
    expect(R.class(R.range(R.escapedChar("\b"), R.str("z"))).toString()).toEqual(String.raw`[\b-z]`)
})

test("Test 6", async ({ page }) => {
    expect(RegExpGrammar.regexp.parse(/^(?:[A-Z][a-z]+\ )+/.source).toString(2, true)).toEqual(String.raw`
        SEQ<
            ^
            (?:SEQ<
                [A-Z]
                [a-z]+
                \" "
            >)+
        >`
    )
})

// test("Test 7", async ({ page }) => {
//     expect(R.seq(R.str("a"), R.neg(R.str("b")), R.str("c")).toString(2, true)).toEqual(`
//         SEQ<
//             a
//             NOT<b>
//             c
//         >`
//     )
// })

test("Test 8", async ({ page }) => {
    expect(R.alt(R.str("alpha"), R.seq(R.str("beta"), R.str("gamma").many()).atLeast(1)).toString(2, true)).toEqual(`
        ALT<
            "alpha"
            |
            SEQ<
                "beta"
                "gamma"*
            >+
        >`
    )
})

test("Test 9", async ({ page }) => {
    expect(RegExpGrammar.regexp.parse(/[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.source).toString()).toEqual(
        /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.source
    )
})
