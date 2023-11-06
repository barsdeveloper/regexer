import { test, expect } from "@playwright/test"
import EscapedCharParser from "../src/parser/EscapedCharParser.js"
import JsonGrammar from "../src/grammars/JsonGrammar.js"
import LookaroundParser from "../src/parser/LookaroundParser.js"
import MathGrammar from "../src/grammars/MathGrammar.js"
import RegExpGrammar, { R } from "../src/grammars/RegExpGrammar.js"
import sample1 from "./sample1.js"
import sample2 from "./sample2.js"

test("Arithmetic", async ({ page }) => {
    const expression = MathGrammar.expression
    expect(expression.parse("1")).toEqual(1)
    expect(expression.parse("1 + 2")).toEqual(3)
    expect(expression.parse("2^3+4")).toEqual(12)
    expect(expression.parse("(500 * 2 - (600 + 100 / 20)  - 95) / 3")).toEqual(100)
    expect(expression.parse("(((-100 * 2 - 50 * 2 + 300) + 9 + 1 + 10) - 5) * 2")).toEqual(30)
    expect(() => expression.parse("Alpha")).toThrowError()
})

test("Json", async ({ page, browser }) => {
    expect(JsonGrammar.json.parse("123")).toEqual(123)
    expect(JsonGrammar.json.parse("[1, 2 ,  3]")).toEqual([1, 2, 3])
    expect(JsonGrammar.json.parse('["alpha", 1e4, "beta"]')).toEqual(["alpha", 10000, "beta"])
    expect(JsonGrammar.json.parse('{"a": 1}')).toEqual({ a: 1 })
    expect(JsonGrammar.json.parse('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 })
    expect(JsonGrammar.json.parse('{"a": 1, "b": 2, "c":["c", 3, null]}')).toEqual({ a: 1, b: 2, c: ["c", 3, null] })
    expect(JsonGrammar.json.parse('{"c": [+1e2,  "str", null, -6]}')).toEqual({ c: [100, "str", null, -6] })
    expect(JsonGrammar.json.parse(`{  "a"   :  20,   "b" : true,"c": [+1e2,  "str", null, -6]  }`))
        .toEqual({ "a": 20, "b": true, "c": [100, "str", null, -6] })
    expect(() => JsonGrammar.json.parse(`{ "alpha": true "beta": false }`)).toThrowError()
    expect(JsonGrammar.json.parse(sample1)).toEqual({
        "glossary": {
            "title": "example glossary",
            "GlossDiv": {
                "title": "S",
                "GlossList": {
                    "GlossEntry": {
                        "ID": "SGML",
                        "SortAs": "SGML",
                        "GlossTerm": "Standard Generalized Markup Language",
                        "Acronym": "SGML",
                        "Abbrev": "ISO 8879:1986",
                        "GlossDef": {
                            "para": "A meta-markup language, used to create markup languages such as DocBook.",
                            "GlossSeeAlso": [
                                "GML",
                                "XML"
                            ]
                        },
                        "GlossSee": "markup"
                    }
                }
            }
        }
    })
    let sample2Object
    expect(sample2Object = JsonGrammar.json.parse(sample2)).toBeDefined()
    expect(sample2Object[0]).toMatchObject({
        gender: "male",
        email: "gomezrocha@verbus.com"
    })
    expect(sample2Object[2]).toMatchObject({
        isActive: true,
        age: 30
    })
    expect(sample2Object[sample2Object.length - 1]).toMatchObject({
        name: "Soto Chase",
        company: "MONDICIL"
    })
})

test("Json remote", async ({ page, browser }) => {
    const obj = await page.evaluate(async () => {
        // The following file must be available, otherwise the test will fail
        const response = await fetch("https://raw.githubusercontent.com/barsdeveloper/regexer/master/tests/sample3.json")
        return await response.json()
    })
    expect(obj["abc"][0]["_id"]).toEqual("5573629c585502b20ad43643")
    expect(obj["abc"][obj["abc"].length - 1]["_id"]).toEqual("5573629dab3dfaad7b3e10cd")
})

test("RegExp", async ({ page }) => {
    const g = RegExpGrammar.regexp
    expect(R.equals(
        g.parse(/a/.source),
        R.string("a"),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/ab/.source),
        R.string("ab"),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/a|b/.source),
        R.alt(R.string("a"), R.string("b")),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/|||a/.source),
        R.alt(R.success(), R.success(), R.success(), R.string("a")),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/a||/.source),
        R.alt(R.string("a"), R.success(), R.success()),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/||a||/.source),
        R.alt(R.success(), R.success(), R.string("a"), R.success(), R.success()),
    )).toBeTruthy()
    expect(R.equals(
        g.parse(/(abc)/.source),
        R.group(R.string("abc")))).toBeTruthy()
    expect(R.equals(
        g.parse(/(?:a(b)c)/.source),
        R.nonCapturingGroup(
            R.seq(R.string("a"), R.group(R.string("b")), R.string("c"))
        ))).toBeTruthy()
    expect(R.equals(
        g.parse("(?>alpha|beta)"),
        R.atomicGroup(
            R.alt(R.string("alpha"), R.string("beta"))
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/[abc]/.source),
        R.class(R.string("a"), R.string("b"), R.string("c")))).toBeTruthy()
    expect(R.equals(
        g.parse(/[(a)(b)c]/.source),
        R.class(
            R.string("("),
            R.string("a"),
            R.string(")"),
            R.string("("),
            R.string("b"),
            R.string(")"),
            R.string("c"),
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/[\a-zA-\Z\[\]]/.source),
        R.class(
            R.range(R.escapedChar("a"), R.string("z")),
            R.range(R.string("A"), R.escapedChar("Z")),
            R.escapedChar("["),
            R.escapedChar("]"),
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/\s/.source),
        R.classShorthand("s"))).toBeTruthy()
    expect(R.equals(
        g.parse(/[\d]/.source),
        R.class(R.classShorthand("d")))).toBeTruthy()
    expect(R.equals(
        g.parse(/[^^\x64ab\s]/.source),
        R.negative(
            R.class(
                R.string("^"),
                R.escapedChar(String.fromCodePoint(0x64), EscapedCharParser.Type.HEX),
                R.string("a"),
                R.string("b"),
                R.classShorthand("s"),
            )
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/\b\||^a$|[\b]/.source),
        R.alt(
            R.seq(R.wordBoundary(), R.escapedChar("|")),
            R.seq(R.lineStart(), R.string("a"), R.lineEnd()),
            R.class(R.escapedChar("\b")),
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/a+/.source),
        R.string("a").atLeast(1))).toBeTruthy()
    expect(R.equals(
        g.parse(/(?:alpha){2,}beta{1}|^$/.source),
        R.alt(
            R.seq(
                R.nonCapturingGroup(R.string("alpha")).atLeast(2),
                R.string("bet"),
                R.string("a").times(1),
            ),
            R.seq(R.lineStart(), R.lineEnd())
        ))).toBeTruthy()
    expect(R.equals(
        g.parse(/\f{,2}/.source),
        R.seq(
            R.escapedChar("\f"),
            R.string("{,1}"), // Becomes characters because not a correct quantifier
        )))
    expect(R.equals(
        g.parse(/\0{,2}\\0?\?{3,}\./.source),
        R.seq(
            R.escapedChar("\0"),
            R.string("{,2}"),
            R.escapedChar("\\"),
            R.string("0").opt(),
            R.escapedChar("?").atLeast(3),
            R.escapedChar("."),
        ))).toBeTruthy()
})

test("RegExp complex 1", async ({ page }) => {
    const regexpSource = String.raw`
        (?:
            ${"[a-z0-9!#$%&'*+/=?^_`{|}~-]+"}
            (?:
                \.
                ${"[a-z0-9!#$%&'*+/=?^_`{|}~-]+"}
            )*
            |
            "
            (?:
                [\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]
                |
                \\
                [\x01-\x09\x0b\x0c\x0e-\x7f]
            )*
            "
        )
        @
        (?:
            (?:
                [a-z0-9]
                (?:
                    [a-z0-9-]*
                    [a-z0-9]
                )?
                \.
            )+
            [a-z0-9]
            (?:
                [a-z0-9-]*
                [a-z0-9]
            )?
            |
            \[
            (?:
                (?:
                    25[0-5]
                    |
                    2[0-4][0-9]
                    |
                    [01]?
                    [0-9]
                    [0-9]?
                )
                \.
            ){3}
            (?:
                25[0-5]
                |
                2[0-4][0-9]
                |
                [01]?[0-9][0-9]?
                |
                [a-z0-9-]*
                [a-z0-9]
                :
                (?:
                    [\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]
                    |
                    \\
                    [\x01-\x09\x0b\x0c\x0e-\x7f]
                )+
            )
            \]
        )
    `.replaceAll(/\s+/g, "")
    const g = RegExpGrammar.regexp
    const alpha = R.range(R.string("a"), R.string("z"))
    const digit = R.range(R.string("0"), R.string("9"))
    const alphaDigitClass = R.class(R.range(R.string("a"), R.string("z")), R.range(R.string("0"), R.string("9")))
    const mainClass = R.class(
        alpha,
        digit,
        R.string("!"),
        R.string("#"),
        R.string("$"),
        R.string("%"),
        R.string("&"),
        R.string("'"),
        R.string("*"),
        R.string("+"),
        R.string("/"),
        R.string("="),
        R.string("?"),
        R.string("^"),
        R.string("_"),
        R.string("`"),
        R.string("{"),
        R.string("|"),
        R.string("}"),
        R.string("~"),
        R.string("-"),
    )
    expect(R.equals(
        g.parse(regexpSource),
        R.seq(
            R.nonCapturingGroup(
                R.alt(
                    R.seq(
                        mainClass.atLeast(1),
                        R.nonCapturingGroup(
                            R.seq(
                                R.escapedChar("."),
                                mainClass.atLeast(1),
                            )
                        ).many()
                    ),
                    R.seq(
                        R.string('"'),
                        R.nonCapturingGroup(
                            R.alt(
                                R.class(
                                    R.range(R.escapedChar("\x01", EscapedCharParser.Type.HEX), R.escapedChar("\x08", EscapedCharParser.Type.HEX)),
                                    R.escapedChar("\x0b", EscapedCharParser.Type.HEX),
                                    R.escapedChar("\x0c", EscapedCharParser.Type.HEX),
                                    R.range(R.escapedChar("\x0e", EscapedCharParser.Type.HEX), R.escapedChar("\x1f", EscapedCharParser.Type.HEX)),
                                    R.escapedChar("\x21", EscapedCharParser.Type.HEX),
                                    R.range(R.escapedChar("\x23", EscapedCharParser.Type.HEX), R.escapedChar("\x5b", EscapedCharParser.Type.HEX)),
                                    R.range(R.escapedChar("\x5d", EscapedCharParser.Type.HEX), R.escapedChar("\x7f", EscapedCharParser.Type.HEX)),
                                ),
                                R.seq(
                                    R.escapedChar("\\"),
                                    R.class(
                                        R.range(R.escapedChar("\x01", EscapedCharParser.Type.HEX), R.escapedChar("\x09", EscapedCharParser.Type.HEX)),
                                        R.escapedChar("\x0b", EscapedCharParser.Type.HEX),
                                        R.escapedChar("\x0c", EscapedCharParser.Type.HEX),
                                        R.range(R.escapedChar("\x0e", EscapedCharParser.Type.HEX), R.escapedChar("\x7f", EscapedCharParser.Type.HEX)),
                                    ),
                                ),
                            )
                        ).many(),
                        R.string('"'),
                    ),
                )
            ),
            R.string("@"),
            R.nonCapturingGroup(
                R.alt(
                    R.seq(
                        R.nonCapturingGroup(
                            R.seq(
                                alphaDigitClass,
                                R.nonCapturingGroup(
                                    R.seq(
                                        R.class(alpha, digit, R.string("-")).many(),
                                        alphaDigitClass
                                    )
                                ).opt(),
                                R.escapedChar(".")
                            )
                        ).atLeast(1),
                        alphaDigitClass,
                        R.nonCapturingGroup(
                            R.seq(
                                R.class(alpha, digit, R.string("-")).many(),
                                alphaDigitClass
                            )
                        ).opt()
                    ),
                    R.seq(
                        R.escapedChar("["),
                        R.nonCapturingGroup(
                            R.seq(
                                R.nonCapturingGroup(
                                    R.alt(
                                        R.seq(
                                            R.string("25"),
                                            R.class(R.range(R.string("0"), R.string("5"))),
                                        ),
                                        R.seq(
                                            R.string("2"),
                                            R.class(R.range(R.string("0"), R.string("4"))),
                                            R.class(digit),
                                        ),
                                        R.seq(
                                            R.class(R.string("0"), R.string("1")).opt(),
                                            R.class(digit),
                                            R.class(digit).opt(),
                                        ),
                                    )
                                ),
                                R.escapedChar("."),
                            )
                        ).times(3),
                        R.nonCapturingGroup(
                            R.alt(
                                R.seq(R.string("25"), R.class(R.range(R.string("0"), R.string("5")))),
                                R.seq(R.string("2"), R.class(R.range(R.string("0"), R.string("4"))), R.class(digit)),
                                R.seq(R.class(R.string("0"), R.string("1")).opt(), R.class(digit), R.class(digit).opt()),
                                R.seq(
                                    R.class(alpha, digit, R.string("-")).many(),
                                    alphaDigitClass,
                                    R.string(":"),
                                    R.nonCapturingGroup(
                                        R.alt(
                                            R.class(
                                                R.range(R.escapedChar("\x01", EscapedCharParser.Type.HEX), R.escapedChar("\x08", EscapedCharParser.Type.HEX)),
                                                R.escapedChar("\x0b", EscapedCharParser.Type.HEX),
                                                R.escapedChar("\x0c", EscapedCharParser.Type.HEX),
                                                R.range(R.escapedChar("\x0e", EscapedCharParser.Type.HEX), R.escapedChar("\x1f", EscapedCharParser.Type.HEX)),
                                                R.range(R.escapedChar("\x21", EscapedCharParser.Type.HEX), R.escapedChar("\x5a", EscapedCharParser.Type.HEX)),
                                                R.range(R.escapedChar("\x53", EscapedCharParser.Type.HEX), R.escapedChar("\x7f", EscapedCharParser.Type.HEX)),
                                            ),
                                            R.seq(
                                                R.escapedChar("\\"),
                                                R.class(
                                                    R.range(R.escapedChar("\x01", EscapedCharParser.Type.HEX), R.escapedChar("\x09", EscapedCharParser.Type.HEX)),
                                                    R.escapedChar("\x0b", EscapedCharParser.Type.HEX),
                                                    R.escapedChar("\x0c", EscapedCharParser.Type.HEX),
                                                    R.range(R.escapedChar("\x0e", EscapedCharParser.Type.HEX), R.escapedChar("\x7f", EscapedCharParser.Type.HEX)),
                                                ),
                                            )
                                        ),
                                    ).atLeast(1),
                                ),
                            ),
                        ),
                        R.escapedChar("]"),
                    )
                )
            ),
        ))).toBeTruthy()
})

test("RegExp complex 2", async ({ page }) => {
    const g = RegExpGrammar.regexp
    const regexpSource = String.raw`
        ^
        (
            (
                a
                |
                b
            )
            [0-9]{2,4}
            (?=[A-Z])
            (?<=\d)
            (
                \s
                |
                \S
            )
            \u{1F601}
            -
            \u{1F64F}
        )
        |
        (
            \d{3,5}
            [^\w\d]
            (?<=\D)
            \s*
            (?:
                [A-Za-z]{2}
                \s*
            ){1,3}
        )
    `.replaceAll(/\s+/g, "")
    expect(R.equals(
        g.parse(regexpSource),
        R.alt(
            R.seq(
                R.lineStart(),
                R.group(
                    R.seq(
                        R.group(R.alt(R.string("a"), R.string("b"))),
                        R.class(R.range(R.string("0"), R.string("9"))).times(2, 4),
                        R.lookahead(R.class(R.range(R.string("A"), R.string("Z")))),
                        R.lookaround(R.classShorthand("d"), LookaroundParser.Type.POSITIVE_BEHIND),
                        R.group(
                            R.alt(
                                R.classShorthand("s"),
                                R.classShorthand("S"),
                            )
                        ),
                        R.escapedChar("\u{1F601}", EscapedCharParser.Type.UNICODE_FULL),
                        R.string("-"),
                        R.escapedChar("\u{1F64F}", EscapedCharParser.Type.UNICODE_FULL),
                    )
                )
            ),
            R.group(
                R.seq(
                    R.classShorthand("d").times(3, 5),
                    R.negative(R.class(R.classShorthand("w"), R.classShorthand("d"))),
                    R.lookaround(R.classShorthand("D"), LookaroundParser.Type.POSITIVE_BEHIND),
                    R.classShorthand("s").many(),
                    R.nonCapturingGroup(
                        R.seq(
                            R.class(R.range(R.string("A"), R.string("Z")), R.range(R.string("a"), R.string("z"))).times(2),
                            R.classShorthand("s").many()
                        )
                    ).times(1, 3)
                )
            )
        ))).toBeTruthy()
})

test("RegExp complex 3", async ({ page }) => {
    const g = RegExpGrammar.regexp
    const regexpSource = String.raw`
        (?=(
            .*
            [0-9]
        ))
        (?=
            .*
            ${/[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.source}
        )
        (?=
            .*
            [a-z]
        )
        (?=(
            .*
            [A-Z]
        ))
        (?=(
            .*
        ))
        .{8,}
    `.replaceAll(/\s+/g, "")
    expect(R.equals(
        g.parse(regexpSource),
        R.seq(
            R.lookahead(
                R.group(
                    R.seq(R.anyChar().many(), R.class(R.range(R.string("0"), R.string("9"))))
                )
            ),
            R.lookahead(
                R.seq(
                    R.anyChar().many(),
                    R.class(
                        R.escapedChar("!"),
                        R.string("@"),
                        R.string("#"),
                        R.string("$"),
                        R.string("%"),
                        R.string("^"),
                        R.string("&"),
                        R.string("*"),
                        R.string("("),
                        R.string(")"),
                        R.escapedChar("\\"),
                        R.string("["),
                        R.escapedChar("]"),
                        R.string("{"),
                        R.string("}"),
                        R.escapedChar("-"),
                        R.string("_"),
                        R.string("+"),
                        R.string("="),
                        R.string("~"),
                        R.string("`"),
                        R.string("|"),
                        R.string(":"),
                        R.string(";"),
                        R.string('"'),
                        R.string("'"),
                        R.string("<"),
                        R.string(">"),
                        R.string(","),
                        R.string("."),
                        R.string("/"),
                        R.string("?"),
                    )
                )
            ),
            R.lookahead(
                R.seq(R.anyChar().many(), R.class(R.range(R.string("a"), R.string("z"))))
            ),
            R.lookahead(
                R.group(
                    R.seq(R.anyChar().many(), R.class(R.range(R.string("A"), R.string("Z"))))
                )
            ),
            R.lookahead(
                R.group(R.anyChar().many())
            ),
            R.anyChar().atLeast(8)
        ))).toBeTruthy()
})
