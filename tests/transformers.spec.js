import { R } from "../src/grammars/RegExpGrammar.js"
import { test, expect } from "@playwright/test"
import DeadParserElimination from "../src/transformers/DeadParserElimination.js"

const transformer = new DeadParserElimination()

/** @param {String} v */
const f1 = v => "123"

/** @param {String} v */
const f2 = v => v + "alpha"

/** @param {String} v */
const f3 = v => `Value: ${v}`

test("Test 1", ({ page }) => {
    expect(R.equals(
        transformer.transform(
            R.alt(
                R.string("a"),
                R.string("b"),
                R.success(),
                R.string("c"),
                R.string("d"),
                R.string("e")
            )
        ),
        R.alt(R.string("a"), R.string("b"), R.success()),
        true,
    )).toBeTruthy()
})

test("Test 2", ({ page }) => {
    expect(R.equals(
        transformer.transform(
            R.alt(
                R.string("a"),
                R.string("b"),
                R.string("c").map(f1),
                R.success().map(f2).map(f3),
                R.string("d"),
                R.string("e")
            )),
        R.alt(
            R.string("a"),
            R.string("b"),
            R.string("c").map(f1),
            R.success().map(f2).map(f3)
        ),
        true,
    )).toBeTruthy()
})

test("Test 3", ({ page }) => {
    expect(R.equals(
        transformer.transform(
            R.alt(
                R.string("a"),
                R.alt(
                    R.string("b").map(f3),
                    R.string("c"),
                    R.success().map(f1)
                ).map(f2).map(f1),
                R.string("d")
            )
        ),
        R.alt(
            R.string("a"),
            R.string("b").map(f3).map(f2).map(f1),
            R.string("c").map(f2).map(f1),
            R.success().map(f1).map(f2).map(f1)
        ),
        true,
    )).toBeTruthy()
})

test("Test 4", ({ page }) => {
    expect(R.equals(
        transformer.transform(
            R.alt(
                R.string("a"),
                R.group(R.alt(
                    R.group(R.string("b").map(f1)),
                    R.string("c"),
                    R.success()
                )),
                R.string("d")
            )
        ),
        R.alt(R.string("a"), R.group(R.string("b").map(f1)), R.string("c"), R.success()),
        true,
    )).toBeTruthy()
})

test("Test 5", ({ page }) => {
    expect(R.equals(
        transformer.transform(
            R.alt(
                R.string("a"),
                R.failure(),
                R.string("b"),
                R.string("c"),
                R.string("d"),
                R.string("e")
            )),
        R.string("a"),
        true,
    )).toBeTruthy()
})

// test("Test 1", ({ page }) => {
//     expect(
//         transformer.transform(
//             P.negative(P.negative(P.string("alpha")))
//         ).equals(
//             P.string("alpha")
//         )
//     ).toBeTruthy()
// })

// test("Test 2", ({ page }) => {
//     let value = transformer.transform(
//         P.negative(
//             P.negative(
//                 P.string("a").map(v => v.repeat(2))
//             ).map(v => "b")
//         ).map(v => "c").map(v => v.repeat(4))
//     )
//     expect(value.equals(P.string("a"))).toBeTruthy()
//     expect(value.toString(2, true)).toEqual(`
//         a => map<v => "c"> => map<v => v.repeat(4)>`
//     )
// })

// test("Test 3", ({ page }) => {
//     let value = transformer.transform(
//         P.negative(
//             P.negative(
//                 P.string("a").map(v => v.repeat(2))
//             ).map(v => "b")
//         ).map(v => "c").map(v => v.repeat(4))
//     )
//     expect(value.equals(P.string("a"))).toBeTruthy()
//     expect(value.toString(2, true)).toEqual(`
//         a => map<v => "c"> => map<v => v.repeat(4)>`
//     )
// })
