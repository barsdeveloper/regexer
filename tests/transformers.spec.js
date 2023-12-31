import { test, expect } from "@playwright/test"
import InlineParsersTransformer from "../src/transformers/InlineParsersTransformer.js"
import LookaroundParser from "../src/parser/LookaroundParser.js"
import MergeStringsTransformer from "../src/transformers/MergeStringsTransformer.js"
import RegExpGrammar, { R } from "../src/grammars/RegExpGrammar.js"
import RemoveDiscardedMapTransformer from "../src/transformers/RemoveDiscardedMapTransformer.js"
import RemoveLazyTransformer from "../src/transformers/RemoveLazyTransformer.js"
import RemoveTrivialParsersTransformer from "../src/transformers/RemoveTrivialParsersTransformer.js"

const f1 = v => "f1"
const f2 = v => "f2"
const f3 = v => "f3"
const fp = v => R.str("a string")

test("Inline parsers 1", ({ page }) => {
    const inlineParsers = new InlineParsersTransformer()
    expect(R.equals(
        inlineParsers.run(
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
        inlineParsers.run(
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
                                            R.grp(R.grp(R.str("3"), "charlie").map(f2), "delta"),
                                            R.success(),
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
                            ),
                            R.failure(),
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
                    R.lazy(() => R.str("2")),
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
                                R.grp(R.grp(R.str("3"), "charlie").map(f2), "delta").map(f3),
                                "echo"
                            ).map(f1),
                            "foxtrot"
                        ).map(f2).map(f2),
                        "hotel"
                    ),
                    R.grp(
                        R.grp(
                            R.grp(
                                R.success().map(f3),
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
                        R.nonGrp(R.lazy(() => R.str("london"))),
                        R.nonGrp(R.lazy(() => R.str("paris"))),
                        R.nonGrp(R.lazy(() => R.str("madrid"))),
                        R.nonGrp(R.lazy(() => R.str("milan"))),
                        R.failure(),
                    )
                ).map(f1),
                "india"
            )
        ),
        true
    )).toBeTruthy()
})

test("Inline parsers 3", ({ page }) => {
    const inlineParsers = new InlineParsersTransformer()
    expect(
        R.equals(
            inlineParsers.run(
                R.lazy(() => R.grp(
                    R.seq(
                        R.anyChar().times(20),
                        R.lookaround(
                            R.seq(
                                R.str("a"),
                                R.seq(R.str("b"), R.str("c")),
                                R.alt(
                                    R.str("A"),
                                    R.alt(
                                        R.alt(
                                            R.str("B"),
                                            R.str("C"),
                                        ),
                                        R.alt(
                                            R.str("D"),
                                            R.str("E"),
                                            R.alt(
                                                R.str("F"),
                                                R.str("G"),
                                            )
                                        ),
                                        R.str("H"),
                                    ),
                                ),
                                R.str("d"),
                                R.seq(
                                    R.seq(R.seq(R.str("e"), R.str("f")), R.str("g")),
                                    R.str("h"),
                                    R.alt(
                                        R.alt(
                                            R.regexp(/1/),
                                            R.regexp(/2/),
                                            R.alt(
                                                R.alt(
                                                    R.regexp(/3/),
                                                    R.regexp(/4/),
                                                ),
                                                R.regexp(/5/),
                                                R.alt(
                                                    R.regexp(/6/),
                                                    R.alt(
                                                        R.regexp(/7/),
                                                        R.regexp(/8/),
                                                    )
                                                ),
                                            ),
                                        ),
                                        R.regexp(/9/),
                                    ),
                                ),
                            ),
                            LookaroundParser.Type.NEGATIVE_BEHIND
                        ),
                    ),
                    "aaa"
                ))
            ),
            R.lazy(() => R.grp(
                R.seq(
                    R.anyChar().times(20),
                    R.lookaround(
                        R.seq(
                            R.str("a"),
                            R.str("b"),
                            R.str("c"),
                            R.alt(
                                R.str("A"),
                                R.str("B"),
                                R.str("C"),
                                R.str("D"),
                                R.str("E"),
                                R.str("F"),
                                R.str("G"),
                                R.str("H"),
                            ),
                            R.str("d"),
                            R.str("e"),
                            R.str("f"),
                            R.str("g"),
                            R.str("h"),
                            R.alt(
                                R.regexp(/1/),
                                R.regexp(/2/),
                                R.regexp(/3/),
                                R.regexp(/4/),
                                R.regexp(/5/),
                                R.regexp(/6/),
                                R.regexp(/7/),
                                R.regexp(/8/),
                                R.regexp(/9/),
                            ),
                        ),
                        LookaroundParser.Type.NEGATIVE_BEHIND
                    ),
                ),
                "aaa"
            )),
            true
        )
    ).toBeTruthy()
})

test("Remove discarded map 1", ({ page }) => {
    const removeDiscardedMap = new RemoveDiscardedMapTransformer()
    expect(
        R.equals(
            removeDiscardedMap.run(
                R.seq(R.str("alpha"), R.lookahead(R.nonGrp(R.str("beta").map(f1)).map(f2)))
            ),
            R.seq(R.str("alpha"), R.lookahead(R.nonGrp(R.str("beta")))),
            true
        )
    ).toBeTruthy()
})

test("Remove discarded map 2", ({ page }) => {
    const removeDiscardedMap = new RemoveDiscardedMapTransformer()
    const numberWithoutMap = R.regexp(R.number.getParser().parser.regexp)
    expect(
        R.equals(
            removeDiscardedMap.run(
                R.grp(R.alt(
                    R.seq(
                        R.lookahead(R.nonGrp(R.str("Ireland").map(f1))).map(f2),
                        R.nonGrp(R.grp(
                            R.lookaround(R.grp(R.str("Germany")).map(f3), LookaroundParser.Type.NEGATIVE_AHEAD)
                        )),
                        R.lookahead(
                            R.lazy(() => R.grp(R.str("Italy"), "first").map(f1))
                                .chain(fp)
                                .map(f3)
                        ).map(f2)
                    ).map(f2),
                    R.class(R.str("a")),
                    R.anyChar(),
                    R.optWhitespace,
                    R.lookaround(R.lazy(() => R.grp(R.lazy(() => R.number), "second").map(f1)))
                ))
            ),
            R.grp(R.alt(
                R.seq(
                    R.lookahead(R.nonGrp(R.str("Ireland"))),
                    R.nonGrp(R.grp(
                        R.lookaround(R.grp(R.str("Germany")), LookaroundParser.Type.NEGATIVE_AHEAD)
                    )),
                    R.lookahead(
                        R.lazy(() => R.grp(R.str("Italy"), "first").map(f1))
                            .chain(fp)
                    )
                ).map(f2),
                R.class(R.str("a")),
                R.anyChar(),
                R.optWhitespace,
                R.lookaround(R.lazy(() => R.grp(R.lazy(() => numberWithoutMap), "second")))
            )),
            true
        )
    ).toBeTruthy()
})

test("Remove lazy", ({ page }) => {
    const removeLazy = new RemoveLazyTransformer()
    class Grammar {
        static a = R.str("a")
        static b = R.str("b").map(f1)
        static c = R.alt(R.lazy(() => Grammar.a), Grammar.b)
        /** @type {Regexer<Parser<any>>} */
        static d = R.lazy(() => R.seq(R.lazy(() => Grammar.c), Grammar.a, R.lazy(() => Grammar.root.map(f2))))
        static root = R.alt(R.lazy(() => Grammar.d), R.lazy(() => Grammar.b))
    }
    expect(
        R.equals(
            removeLazy.run(Grammar.root),
            R.alt(
                R.seq(
                    R.alt(Grammar.a, Grammar.b),
                    Grammar.a,
                    Grammar.root.map(f2)
                ),
                Grammar.b
            ),
            true
        )
    ).toBeTruthy()
})

test("Remove trivial parsers 1", ({ page }) => {
    const removeTrivialParsers = new RemoveTrivialParsersTransformer()
    expect(
        R.equals(
            removeTrivialParsers.run(
                R.alt(R.grp(R.str("a").map(f2)), R.nonGrp(R.str("b")), R.success(), R.regexp(/c/).many(), R.regexp(/d/))
            ),
            R.alt(R.grp(R.str("a").map(f2)), R.nonGrp(R.str("b"))),
            true
        )
    ).toBeTruthy()
})

test("Remove trivial parsers 2", ({ page }) => {
    const removeTrivialParsers = new RemoveTrivialParsersTransformer()
    expect(
        R.equals(
            removeTrivialParsers.run(
                R.alt(R.str("a"), R.failure(), R.str("b"), R.failure(), R.str("c"), R.str("d"), R.failure())
            ),
            R.alt(R.str("a"), R.str("b"), R.str("c"), R.str("d")),
            true
        )
    ).toBeTruthy()
})

test("Remove trivial parsers 3", ({ page }) => {
    const removeTrivialParsers = new RemoveTrivialParsersTransformer()
    expect(
        R.equals(
            removeTrivialParsers.run(
                R.seq(R.str("a"), R.success(), R.str("b"), R.success(), R.str("c"))
            ),
            R.seq(R.str("a"), R.str("b"), R.str("c")),
            true
        )
    ).toBeTruthy()
})

test("Remove trivial parsers 4", ({ page }) => {
    const removeTrivialParsers = new RemoveTrivialParsersTransformer()
    expect(
        R.equals(
            removeTrivialParsers.run(
                R.seq(R.str("a"), R.str("b"), R.failure(), R.str("c"))
            ),
            R.failure(),
            true
        )
    ).toBeTruthy()
})

test("Remove trivial parsers 5", ({ page }) => {
    const removeTrivialParsers = new RemoveTrivialParsersTransformer()
    expect(
        R.equals(
            removeTrivialParsers.run(
                R.seq(R.number, R.grp(R.nonGrp(R.success()).map(f1).atLeast(20)).map(f3), R.str("a"))
            ),
            R.seq(R.number, R.str("a"))
        )
    ).toBeTruthy()
})

test("Merge strings 1", ({ page }) => {
    const mergeStrings = new MergeStringsTransformer()
    expect(
        R.equals(
            mergeStrings.run(
                R.seq(
                    R.str("a"),
                    R.str("b"),
                    R.str("c"),
                    R.str("d"),
                    R.grp(
                        R.alt(
                            R.lazy(() => R.seq(R.regexp(/#/), R.str("0"), R.str("1"), R.str("2"), R.str("3"))),
                            R.nonGrp(R.seq(R.str("A"), R.str("B"), R.failure()))
                        )
                    ),
                    R.str("e"),
                    R.str("f"),
                    R.str("g"),
                )
            ),
            R.seq(
                R.str("abcd"),
                R.grp(
                    R.alt(
                        R.lazy(() => R.seq(R.regexp(/#/), R.str("0123"))),
                        R.nonGrp(R.seq(R.str("AB"), R.failure())),
                    )
                ),
                R.str("efg"),
            )
        )
    ).toBeTruthy()
})

test("Merge strings 2", ({ page }) => {
    const mergeStrings = new MergeStringsTransformer()
    let a, b, c
    expect(
        R.equals(
            mergeStrings.run(
                R.seq(
                    R.success(),
                    R.str("a").map(v => a = `1${v}`),
                    R.str("b").map(v => b = `2${v}`),
                    R.str("c").map(v => c = `3${v}`),
                )
            ),
            R.seq(R.success(), R.str("abc")),
        )
    ).toBeTruthy()
})

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
