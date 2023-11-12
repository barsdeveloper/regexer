import { R } from "../src/grammars/RegExpGrammar.js"
import { test, expect } from "@playwright/test"
import EscapedCharParser from "../src/parser/EscapedCharParser.js"

/** @param {String} v */
const f1 = v => v.repeat(2)

/** @param {String} v */
const f2 = v => v.trim()

/** @param {String} v */
const f3 = v => v.trimStart()

test("Test 1", async ({ page }) => {
    expect(
        R.equals(
            R.str("a"),
            R.str("a"),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(x => x.charAt(0)).map(x => x.trimEnd()),
            R.nonGrp(R.str("a")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.nonGrp(R.str("a").map(x => x.charAt(0))).map(x => x.trimEnd()),
            R.nonGrp(R.nonGrp(R.str("a"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a"),
            R.str("a").map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.str("a").map(x => x.concat("aaa")),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.grp(R.str("a").map(x => x.concat("aaa"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.grp(R.str("a")).map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a"),
            R.atomicGrp(R.str("a").map(x => x.concat("aaa"))),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.str("a"),
            R.str("a"),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1),
            R.str("a").map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.atomicGrp(R.str("a")).map(f1),
            R.str("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.atomicGrp(R.str("a")).map(f1),
            R.atomicGrp(R.str("a")).map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1).map(f2),
            R.str("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.str("a").map(f1).map(f2),
            R.str("a").map(f1).map(f2),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1).map(v => v.trim()),
            R.str("a").map(f1).map(f2),
            true,
        )
    ).toBeFalsy()
})

test("Test 2", async ({ page }) => {
    expect(R.equals(R.str("a"), R.str("b"))).toBeFalsy()
    expect(R.equals(R.str("a"), R.str("b"), true)).toBeFalsy()
})

test("Test 3", async ({ page }) => {
    const lhs = R.seq(R.number, R.nonGrp(R.whitespaceInline), R.alt(R.str("a").map(v => 123), R.str("b")))
    const rhs = R.seq(R.number, /******************/ R.whitespaceInline, R.alt(R.str("a"), /***********/ R.str("b")))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 4", async ({ page }) => {
    const lhs = R.seq(R.number, R.number, R.alt(R.str("a"), R.str("b")))
    const rhs = R.seq(R.number, R.number, R.alt(R.str("b"), R.str("a")))
    expect(R.equals(lhs, rhs)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 5", async ({ page }) => {
    const lhs = R.alt(
        R.str("a").map(() => "alpha")
            .many(),
        R.lazy(() => R.seq(
            R.str("b").map(v => 123).opt(),
            R.lookahead(R.str("c")),
            R.str("c")
        )),
    )
        .many()
    const rhs = R.alt(
        R.str("a")
            .many(),
        R.seq(
            R.str("b").map(v => v).opt(),
            R.lookahead(R.str("c")),
            R.str("c")
        ),
    )
        .many()
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 6", async ({ page }) => {
    const lhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.grp(R.str("alpha").map(f2).opt().map(f1))).sepBy(R.str(","))
    const rhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.grp(R.str("alpha").map(f2).opt().map(f1))).sepBy(R.str(","))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()
})

test("Test 7", async ({ page }) => {
    const lhs = R.seq(
        R.grp(R.class(
            R.escapedChar("\b"),
            R.negClass(R.range(R.str("a"), R.escapedChar("\0")))
        )),
        R.nonGrp(R.escapedChar("\x48", EscapedCharParser.Type.HEX)),
    )
    const rhs = R.seq(
        R.grp(R.alt(
            R.str("\b"),
            R.negClass(R.range(R.str("a"), R.str("\0")))
        )),
        R.str("\x48"),
    )
    const rhs2 = R.seq(
        R.grp(R.alt(
            R.str("\b"),
            R.range(R.str("a"), R.str("\0"))
        )),
        R.str("\x48"),
    )
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(lhs, rhs2)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(rhs2, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 8", async ({ page }) => {
    const lhs = R.seq(
        R.regexp(/(Paris|Milan|Amsterdam)/),
        R.alt(
            R.lazy(() => R.str("City")),
            R.str("Town"),
        )
    )
    const rhs = R.seq(
        R.regexp(/(Paris|Milan|Amsterdam)/),
        R.alt(
            R.lazy(() => R.str("City").map(() => "")),
            R.str("Town"),
        )
    )
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})
