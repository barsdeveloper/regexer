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
            R.string("a"),
            R.string("a"),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a").map(x => x.charAt(0)).map(x => x.trimEnd()),
            R.nonCapturingGroup(R.string("a")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.nonCapturingGroup(R.string("a").map(x => x.charAt(0))).map(x => x.trimEnd()),
            R.nonCapturingGroup(R.nonCapturingGroup(R.string("a"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a"),
            R.string("a").map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.group(R.string("a")),
            R.string("a").map(x => x.concat("aaa")),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.group(R.string("a")),
            R.group(R.string("a").map(x => x.concat("aaa"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.group(R.string("a")),
            R.group(R.string("a")).map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a"),
            R.atomicGroup(R.string("a").map(x => x.concat("aaa"))),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.string("a"),
            R.string("a"),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a").map(f1),
            R.string("a").map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.atomicGroup(R.string("a")).map(f1),
            R.string("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.atomicGroup(R.string("a")).map(f1),
            R.atomicGroup(R.string("a")).map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a").map(f1).map(f2),
            R.string("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.string("a").map(f1).map(f2),
            R.string("a").map(f1).map(f2),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.string("a").map(f1).map(v => v.trim()),
            R.string("a").map(f1).map(f2),
            true,
        )
    ).toBeFalsy()
})

test("Test 2", async ({ page }) => {
    expect(R.equals(R.string("a"), R.string("b"))).toBeFalsy()
    expect(R.equals(R.string("a"), R.string("b"), true)).toBeFalsy()
})

test("Test 3", async ({ page }) => {
    const lhs = R.seq(R.number, R.nonCapturingGroup(R.whitespaceInline), R.alt(R.string("a").map(v => 123), R.string("b")))
    const rhs = R.seq(R.number, /******************/ R.whitespaceInline, R.alt(R.string("a"), /***********/ R.string("b")))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 4", async ({ page }) => {
    const lhs = R.seq(R.number, R.number, R.alt(R.string("a"), R.string("b")))
    const rhs = R.seq(R.number, R.number, R.alt(R.string("b"), R.string("a")))
    expect(R.equals(lhs, rhs)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 5", async ({ page }) => {
    const lhs = R.alt(
        R.string("a").map(() => "alpha")
            .many(),
        R.lazy(() => R.seq(
            R.string("b").map(v => 123).opt(),
            R.lookahead(R.string("c")),
            R.string("c")
        )),
    )
        .many()
    const rhs = R.alt(
        R.string("a")
            .many(),
        R.seq(
            R.string("b").map(v => v).opt(),
            R.lookahead(R.string("c")),
            R.string("c")
        ),
    )
        .many()
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 6", async ({ page }) => {
    const lhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.group(R.string("alpha").map(f2).opt().map(f1))).sepBy(R.string(","))
    const rhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.group(R.string("alpha").map(f2).opt().map(f1))).sepBy(R.string(","))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()
})

test("Test 7", async ({ page }) => {
    const lhs = R.seq(
        R.group(R.class(
            R.escapedChar("\b"),
            R.negative(R.range(R.string("a"), R.escapedChar("\0")))
        )),
        R.nonCapturingGroup(R.escapedChar("\x48", EscapedCharParser.Type.HEX)),
    )
    const rhs = R.seq(
        R.group(R.alt(
            R.string("\b"),
            R.negative(R.range(R.string("a"), R.string("\0")))
        )),
        R.string("\x48"),
    )
    const rhs2 = R.seq(
        R.group(R.alt(
            R.string("\b"),
            R.range(R.string("a"), R.string("\0"))
        )),
        R.string("\x48"),
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
            R.lazy(() => R.string("City")),
            R.string("Town"),
        )
    )
    const rhs = R.seq(
        R.regexp(/(Paris|Milan|Amsterdam)/),
        R.alt(
            R.lazy(() => R.string("City").map(() => "")),
            R.string("Town"),
        )
    )
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})
