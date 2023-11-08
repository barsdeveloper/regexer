import { test, expect } from "@playwright/test"
import DeadParserElimination from "../src/transformers/DeadParserElimination.js"
import InlineParsers from "../src/transformers/InlineParsers.js"
import RegExpGrammar, { R } from "../src/grammars/RegExpGrammar.js"

const transformer = new DeadParserElimination()

const f1 = v => "f1"
const f2 = v => "f2"
const f3 = v => "f3"

test("Inline 1", ({ page }) => {
    const inlineParsers = new InlineParsers()
    expect(R.equals(
        inlineParsers.transform(
            R.alt(
                R.group(
                    R.group(
                        R.string("a"),
                        "alpha"
                    ).map(f1),
                    "bravo"
                ),
                R.string("b"),
                R.alt(
                    R.group(
                        R.alt(
                            R.string("c"),
                            R.string("d"),
                            R.string("e"),
                        ).map(f2),
                        "charlie"
                    ).map(f3),
                    R.string("f").map(f1),
                    R.alt(
                        R.string("g"),
                        R.group(
                            R.alt(
                                R.string("h").map(f1).map(f2).map(f3),
                                R.group(R.string("i"), "delta"),
                                R.string("j"),
                                R.alt(
                                    R.string("k"),
                                    R.alt(
                                        R.string("l"),
                                        R.string("m").map(f2),
                                    ),
                                    R.string("n"),
                                ),
                            ).map(f3),
                            "echo"
                        ),
                    ),
                ).map(f1)
            )
        ),
        R.alt(
            R.group(R.group(R.string("a"), "alpha").map(f1), "bravo"),
            R.string("b"),
            R.group(R.string("c").map(f2), "charlie").map(f3).map(f1),
            R.group(R.string("d").map(f2), "charlie").map(f3).map(f1),
            R.group(R.string("e").map(f2), "charlie").map(f3).map(f1),
            R.string("f").map(f1).map(f1),
            R.string("g").map(f1),
            R.group(R.string("h").map(f1).map(f2).map(f3).map(f3), "echo").map(f1),
            R.group(R.group(R.string("i"), "delta").map(f3), "echo").map(f1),
            R.group(R.string("j").map(f3), "echo").map(f1),
            R.group(R.string("k").map(f3), "echo").map(f1),
            R.group(R.string("l").map(f3), "echo").map(f1),
            R.group(R.string("m").map(f2).map(f3), "echo").map(f1),
            R.group(R.string("n").map(f3), "echo").map(f1),
        ),
        true
    )).toBeTruthy()
})

test("Inline 2", ({ page }) => {
    const inlineParsers = new InlineParsers()
    expect(R.equals(
        inlineParsers.transform(
            R.nonCapturingGroup(
                R.negative(
                    R.group(
                        R.seq(
                            R.string("1").map(f1),
                            R.lazy(() => R.string("2")),
                            R.success(),
                            R.group(
                                R.seq(
                                    R.alt(
                                        R.string("a"),
                                        R.alt(
                                            RegExpGrammar.regexp.parse(/(?<alpha>(?<bravo>[bcd]))/.source).map(f3),
                                            R.string("e"),
                                        ).map(f2),
                                    ),
                                    R.group(
                                        R.group(
                                            R.seq(
                                                R.group(R.group(R.string("3"), "charlie").map(f2), "delta")
                                            ).map(f3),
                                            "echo"
                                        ).map(f1),
                                        "foxtrot"
                                    ).map(f2),
                                    R.seq(
                                        R.string("4"),
                                        R.string("5").map(f2).map(f1),
                                        R.group(R.string("6"), "golf"),
                                    ).map(f3)
                                ).map(f2),
                                "hotel"
                            ),
                            R.alt(
                                R.nonCapturingGroup(
                                    R.lazy(() => RegExpGrammar.regexp.parse(/london|paris|madrid|milan/.source))
                                )
                            )
                        ).map(f1),
                        "india"
                    )
                )
            )
        ),
        R.nonCapturingGroup(
            R.negative(
                R.group(
                    R.seq(
                        R.string("1").map(f1),
                        R.string("2"),
                        R.success(),
                        R.group(
                            R.alt(
                                R.string("a"),
                                R.group(R.group(R.string("b"), "bravo"), "alpha").map(f3).map(f2),
                                R.group(R.group(R.string("c"), "bravo"), "alpha").map(f3).map(f2),
                                R.group(R.group(R.string("d"), "bravo"), "alpha").map(f3).map(f2),
                                R.string("e").map(f2),
                            ).map(f2),
                            "hotel"
                        ),
                        R.group(
                            R.group(
                                R.group(
                                    R.group(
                                        R.group(
                                            R.string("3"),
                                            "charlie"
                                        ).map(f2),
                                        "delta"
                                    ).map(f3),
                                    "echo"
                                ).map(f1),
                                "foxtrot"
                            ).map(f2).map(f2),
                            "hotel"
                        ),
                        R.group(
                            R.string("4").map(f3).map(f2),
                            "hotel"
                        ),
                        R.group(
                            R.string("5").map(f2).map(f1).map(f3).map(f2),
                            "hotel"
                        ),
                        R.group(
                            R.group(R.string("6"), "golf").map(f3).map(f2),
                            "hotel"
                        ),
                        R.alt(
                            R.nonCapturingGroup(R.string("london")),
                            R.nonCapturingGroup(R.string("paris")),
                            R.nonCapturingGroup(R.string("madrid")),
                            R.nonCapturingGroup(R.string("milan")),
                        )
                    ).map(f1),
                    "india"
                )
            )
        ),
        true
    )).toBeTruthy()
})

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
                R.failure(),
                R.string("b"),
                R.failure(),
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

// test("Test 4", ({ page }) => {
//     expect(R.equals(
//         transformer.transform(
//             R.alt(
//                 R.string("a"),
//                 R.group(R.alt(
//                     R.group(R.string("b").map(f1)),
//                     R.string("c"),
//                     R.success()
//                 )),
//                 R.string("d")
//             )
//         ),
//         R.alt(R.string("a"), R.group(R.string("b").map(f1)), R.string("c"), R.success()),
//         true,
//     )).toBeTruthy()
// })

// test("Test 5", ({ page }) => {
//     expect(R.equals(
//         transformer.transform(
//             R.alt(
//                 R.string("a"),
//                 R.failure(),
//                 R.string("b"),
//                 R.string("c"),
//                 R.string("d"),
//                 R.string("e")
//             )),
//         R.string("a"),
//         true,
//     )).toBeTruthy()
// })

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
