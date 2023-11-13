import { test, expect } from "@playwright/test"
import DeadParserElimination from "../src/transformers/DeadParserElimination.js"
import InlineParsersTransformer from "../src/transformers/InlineParsersTransformer.js"
import RegExpGrammar, { R } from "../src/grammars/RegExpGrammar.js"
import RemoveDiscardedMapTransformer from "../src/transformers/RemoveDiscardedMapTransformer.js"

const transformer = new DeadParserElimination()

const f1 = v => "f1"
const f2 = v => "f2"
const f3 = v => "f3"

test("Inline parsers 1", ({ page }) => {
    const inlineParsers = new InlineParsersTransformer()
    expect(R.equals(
        inlineParsers.transform(
            R.alt(
                R.grp(
                    R.grp(
                        R.str("a"),
                        "alpha"
                    ).map(f1),
                    "bravo"
                ),
                R.str("b"),
                R.alt(
                    R.grp(
                        R.alt(
                            R.str("c"),
                            R.str("d"),
                            R.str("e"),
                        ).map(f2),
                        "charlie"
                    ).map(f3),
                    R.str("f").map(f1),
                    R.alt(
                        R.str("g"),
                        R.grp(
                            R.alt(
                                R.str("h").map(f1).map(f2).map(f3),
                                R.grp(R.str("i"), "delta"),
                                R.str("j"),
                                R.alt(
                                    R.str("k"),
                                    R.alt(
                                        R.str("l"),
                                        R.str("m").map(f2),
                                    ),
                                    R.str("n"),
                                ),
                            ).map(f3),
                            "echo"
                        ),
                    ),
                ).map(f1)
            )
        ),
        R.alt(
            R.grp(R.grp(R.str("a"), "alpha").map(f1), "bravo"),
            R.str("b"),
            R.grp(R.str("c").map(f2), "charlie").map(f3).map(f1),
            R.grp(R.str("d").map(f2), "charlie").map(f3).map(f1),
            R.grp(R.str("e").map(f2), "charlie").map(f3).map(f1),
            R.str("f").map(f1).map(f1),
            R.str("g").map(f1),
            R.grp(R.str("h").map(f1).map(f2).map(f3).map(f3), "echo").map(f1),
            R.grp(R.grp(R.str("i"), "delta").map(f3), "echo").map(f1),
            R.grp(R.str("j").map(f3), "echo").map(f1),
            R.grp(R.str("k").map(f3), "echo").map(f1),
            R.grp(R.str("l").map(f3), "echo").map(f1),
            R.grp(R.str("m").map(f2).map(f3), "echo").map(f1),
            R.grp(R.str("n").map(f3), "echo").map(f1),
        ),
        true
    )).toBeTruthy()
})

test("Inline parsers 2", ({ page }) => {
    const inlineParsers = new InlineParsersTransformer()
    expect(R.equals(
        inlineParsers.transform(
            R.nonGrp(
                R.grp(
                    R.seq(
                        R.str("1").map(f1),
                        R.lazy(() => R.str("2")),
                        R.success(),
                        R.grp(
                            R.seq(
                                R.alt(
                                    R.str("a"),
                                    R.alt(
                                        RegExpGrammar.regexp.parse(/(?<alpha>(?<bravo>[bcd]))/.source).map(f3),
                                        R.str("e"),
                                    ).map(f2),
                                ),
                                R.grp(
                                    R.grp(
                                        R.seq(
                                            R.grp(R.grp(R.str("3"), "charlie").map(f2), "delta")
                                        ).map(f3),
                                        "echo"
                                    ).map(f1),
                                    "foxtrot"
                                ).map(f2),
                                R.seq(
                                    R.str("4"),
                                    R.str("5").map(f2).map(f1),
                                    R.grp(R.str("6"), "golf"),
                                ).map(f3)
                            ).map(f2),
                            "hotel"
                        ),
                        R.alt(
                            R.nonGrp(
                                R.lazy(() => RegExpGrammar.regexp.parse(/london|paris|madrid|milan/.source))
                            )
                        )
                    ).map(f1),
                    "india"
                )
            )
        ),
        R.nonGrp(
            R.grp(
                R.seq(
                    R.str("1").map(f1),
                    R.str("2"),
                    R.success(),
                    R.grp(
                        R.alt(
                            R.str("a"),
                            R.grp(R.grp(R.str("b"), "bravo"), "alpha").map(f3).map(f2),
                            R.grp(R.grp(R.str("c"), "bravo"), "alpha").map(f3).map(f2),
                            R.grp(R.grp(R.str("d"), "bravo"), "alpha").map(f3).map(f2),
                            R.str("e").map(f2),
                        ).map(f2),
                        "hotel"
                    ),
                    R.grp(
                        R.grp(
                            R.grp(
                                R.grp(
                                    R.grp(
                                        R.str("3"),
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
                    R.grp(
                        R.str("4").map(f3).map(f2),
                        "hotel"
                    ),
                    R.grp(
                        R.str("5").map(f2).map(f1).map(f3).map(f2),
                        "hotel"
                    ),
                    R.grp(
                        R.grp(R.str("6"), "golf").map(f3).map(f2),
                        "hotel"
                    ),
                    R.alt(
                        R.nonGrp(R.str("london")),
                        R.nonGrp(R.str("paris")),
                        R.nonGrp(R.str("madrid")),
                        R.nonGrp(R.str("milan")),
                    )
                ).map(f1),
                "india"
            )
        ),
        true
    )).toBeTruthy()
})

test("Remove discarded map", ({ page }) => {
    const removeDiscardedMap = new RemoveDiscardedMapTransformer()
    expect(
        R.equals(
            transformer.transform(
                R.seq(R.str("alpha"), R.lookahead(R.nonGrp(R.str("beta").map(f1)).map(f2)))
            ),
            R.seq(R.str("alpha"), R.lookahead(R.nonGrp(R.str("beta")))),
            true
        )
    ).toBeTruthy
})

// test("Test 1", ({ page }) => {
//     expect(R.equals(
//         transformer.transform(
//             R.alt(
//                 R.str("a"),
//                 R.str("b"),
//                 R.success(),
//                 R.str("c"),
//                 R.str("d"),
//                 R.str("e")
//             )
//         ),
//         R.alt(R.str("a"), R.str("b"), R.success()),
//         true,
//     )).toBeTruthy()
// })

// test("Test 2", ({ page }) => {
//     expect(R.equals(
//         transformer.transform(
//             R.alt(
//                 R.str("a"),
//                 R.failure(),
//                 R.str("b"),
//                 R.failure(),
//                 R.str("c").map(f1),
//                 R.success().map(f2).map(f3),
//                 R.str("d"),
//                 R.str("e")
//             )),
//         R.alt(
//             R.str("a"),
//             R.str("b"),
//             R.str("c").map(f1),
//             R.success().map(f2).map(f3)
//         ),
//         true,
//     )).toBeTruthy()
// })

// test("Test 3", ({ page }) => {
//     expect(R.equals(
//         transformer.transform(
//             R.alt(
//                 R.str("a"),
//                 R.alt(
//                     R.str("b").map(f3),
//                     R.str("c"),
//                     R.success().map(f1)
//                 ).map(f2).map(f1),
//                 R.str("d")
//             )
//         ),
//         R.alt(
//             R.str("a"),
//             R.str("b").map(f3).map(f2).map(f1),
//             R.str("c").map(f2).map(f1),
//             R.success().map(f1).map(f2).map(f1)
//         ),
//         true,
//     )).toBeTruthy()
// })

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
