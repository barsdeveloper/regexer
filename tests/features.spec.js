import { R } from "../src/grammars/RegExpGrammar.js"
import { test, expect } from "@playwright/test"
import Reply from "../src/Reply.js"
import SequenceParser from "../src/parser/SequenceParser.js"

/**
 * @param {Parser<any>[]} a
 * @param {Parser<any>[]} b
 */
const compareArrays = (a, b) => {
    expect(a.length).toEqual(b.length)
    for (let i = 0; i < a.length; ++i) {
        expect(R.equals(a[i], b[i])).toBeTruthy()
    }
}

test("Test 1", async ({ page }) => {
    let p = /** @type {Regexer<Parser<any>>} */(R.str("a"))
    expect(p.getParser().matchesEmpty()).toBeFalsy()
    compareArrays(p.getParser().starterList(), [R.str("a").getParser()])
    p = p.opt()
    expect(p.getParser().matchesEmpty()).toBeTruthy()
    compareArrays(p.getParser().starterList(), [R.str("a").getParser(), R.success().getParser()])
})

test("Test 2", async ({ page }) => {
    const p = R.str("").getParser()
    expect(p.matchesEmpty()).toBeTruthy()
    compareArrays(p.starterList(), [R.success().getParser()])
})

test("Test 3", async ({ page }) => {
    const p = R.alt(
        R.nonGrp(R.str("alpha")),
        R.str("beta"),
        R.lazy(() => R.grp(R.str(""))),
        R.regexp(/gamma/),
    ).getParser()
    expect(p.matchesEmpty()).toBeTruthy()
    compareArrays(
        p.starterList(),
        [
            R.str("alpha").getParser(),
            R.str("beta").getParser(),
            R.success().getParser(),
            R.regexp(/gamma/).getParser(),
        ]
    )
})

test("Test 4", async ({ page }) => {
    const p = R.alt(
        R.str("first"),
        R.seq(R.str("second").map(() => ""), R.grp(R.lazy(() => R.str("third")))),
        R.lazy(() => R.seq(R.str(""), R.success(), R.alt(
            R.grp(R.str("").map(() => "hello")),
            R.lazy(() => R.nonGrp(R.success()))
        ))),
        R.number.map(() => 123)
    )
        .getParser()
    expect(p.matchesEmpty()).toBeTruthy()
    compareArrays(
        p.starterList(),
        [
            R.str("first").getParser(),
            R.str("second").getParser(),
            R.success().getParser(),
            R.number.getParser(),
        ]
    )
})

test("Test 5", async ({ page }) => {
    const p = R.lazy(() => R.seq(
        R.regexp(/a/).opt(),
        R.lazy(() => R.str("").map(() => [1, 2, 3, 4])).map(() => ""),
    )).map(() => "some string")
        .getParser()
    expect(p.matchesEmpty()).toBeTruthy()
    compareArrays(
        p.starterList(),
        [
            R.regexp(/a/).getParser(),
            R.success().getParser(),
        ]
    )
})

test("Test 6", async ({ page }) => {
    const p = R.lazy(() => R.seq(
        R.lazy(() => R.str("").map(() => [1, 2, 3, 4])),
        R.grp(R.str(" ").map(() => 987)),
    )).map(() => "")
    expect(p.getParser().matchesEmpty()).toBeFalsy()
    compareArrays(
        p.getParser().starterList(),
        [
            R.success().getParser(),
            R.str(" ").getParser(),
        ]
    )
    expect(p.many().getParser().matchesEmpty()).toBeTruthy()
    compareArrays(
        p.many().getParser().starterList(),
        [
            R.success().getParser(),
            R.str(" ").getParser(),
        ]
    )

})

test("Test 7", async ({ page }) => {
    const p = R.seq(
        R.str(""),
        R.lookahead(R.alt(
            R.str("apple"),
            R.lazy(() => R.grp(R.str("")))
        )),
        R.success().map(() => "xyz"),
        R.nonGrp(R.lazy(() => R.str("abc").atMost(2)).map(() => [1])),
    )
        .getParser()
    expect(p.matchesEmpty()).toBeTruthy()
    compareArrays(
        p.starterList(),
        [
            R.success().getParser(),
            R.str("apple").getParser(),
            R.str("abc").getParser(),
        ]
    )
})

test("Test 8", async ({ page }) => {
    class Grammar {
        static a = R.str("a")
        /** @type {Regexer<SequenceParser<[Parser<any>, Parser<any>, Parser<any>]>>} */
        static r1 = R.seq(Grammar.a, Grammar.a, R.lazy(() => Grammar.r1).opt())
        /** @type {Regexer<SequenceParser<[Parser<any>, Parser<any>, Parser<any>]>>} */
        static r2 = R.seq(Grammar.a, Grammar.a, R.lazy(() => Grammar.r2.opt()))
        /** @type {Regexer<SequenceParser<[Parser<any>, Parser<any>, Parser<any>]>>} */
        static r3 = R.seq(Grammar.a, Grammar.a, R.lazy(() => Grammar.r2.many()))
    }
    const r1 = Grammar.r1.getParser().parsers[2]
    const r2 = Grammar.r2.getParser().parsers[2]
    const r3 = Grammar.r3.getParser().parsers[2]
    const context = Reply.makeContext(null, "")
    expect(Grammar.r1.getParser().matchesEmpty()).toBeFalsy()
    compareArrays(
        r1.starterList(),
        [
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
    compareArrays(
        r2.starterList(),
        [
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
    compareArrays(
        r3.starterList(),
        [
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
    compareArrays(
        r1.starterList(context, [r1]),
        [
            r1,
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
    compareArrays(
        r2.starterList(context, [r2]),
        [
            r2,
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
    compareArrays(
        r3.starterList(context, [r3]),
        [
            r3,
            R.str("a").getParser(),
            R.success().getParser(),
        ]
    )
})
