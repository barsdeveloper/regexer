import AnchorParser, { AnchorType } from "../parser/AnchorParser.js"
import AnyCharParser from "../parser/AnyCharParser.js"
import AtomicGroupParser from "../parser/AtomicGroupParser.js"
import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import ClassParser from "../parser/ClassParser.js"
import ClassShorthandParser, { ClassMetacharacter } from "../parser/ClassShorthandParser.js"
import EscapedCharParser from "../parser/EscapedCharParser.js"
import LookaroundParser from "../parser/LookaroundParser.js"
import NegativeParser from "../parser/NegativeParser.js"
import NonCapturingGroupParser from "../parser/NonCapturingGroupParser.js"
import Parser from "../parser/Parser.js"
import Regexer from "../Regexer.js"
import RangeParser from "../parser/RangeParser.js"
import StringParser from "../parser/StringParser.js"

export const R = class extends Regexer {

    /**
     * @template {String} S
     * @param {S} char
     */
    static escapedChar(char, type = EscapedCharParser.Type.NORMAL) {
        return new Regexer(new EscapedCharParser(char, type))
    }

    /** @param {keyof typeof ClassMetacharacter} type */
    static classShorthand(type) {
        return new Regexer(new ClassShorthandParser(type))
    }

    /**
     * @template {Regexer<any>[]} P
     * @param {P} parsers
     * @returns {Regexer<ClassParser<UnwrapParser<P>>>}
     */
    static class(...parsers) {
        // @ts-expect-error
        return new Regexer(new ClassParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Regexer<Parser<any>>} P
     * @param {P} parser
     */
    static lookaround(parser, type = LookaroundParser.Type.POSITIVE_AHEAD) {
        return new Regexer(new LookaroundParser(parser.getParser(), type))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static group(parser) {
        return new Regexer(new CapturingGroupParser(parser.getParser()))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static nonCapturingGroup(parser) {
        return new Regexer(new NonCapturingGroupParser(parser.getParser()))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static atomicGroup(parser) {
        return new Regexer(new AtomicGroupParser(parser.getParser()))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static negative(parser) {
        return new Regexer(new NegativeParser(parser.getParser()))
    }

    static lineStart() {
        return new Regexer(new AnchorParser(AnchorType.LINE_START))
    }

    static lineEnd() {
        return new Regexer(new AnchorParser(AnchorType.LINE_END))
    }

    static wordBoundary() {
        return new Regexer(new AnchorParser(AnchorType.WORD_BOUNDARY))
    }

    static anyChar() {
        return new Regexer(new AnyCharParser())
    }

    /**
     * @template {String} A
     * @template {String} B
     * @param {Regexer<StringParser<A>>} from
     * @param {Regexer<StringParser<B>>} to
     */
    static range(from, to) {
        return new Regexer(new RangeParser(from.getParser(), to.getParser()))
    }
}

/**
 * Grammar used to parse a regular expression.
 * Many thanks to Robert Elder: https://blog.robertelder.org/regular-expression-parser-grammar/
 */
export default class RegExpGrammar {

    static #decimalNumber = R.regexp(/\d+/)

    static #hexDigit = R.regexp(/[0-9A-Fa-f]/)

    static #anchor = R.alt(
        R.string("^").map(() => R.lineStart()),
        R.string("$").map(() => R.lineEnd()),
        R.string("\\b").map(() => R.wordBoundary()),
    )

    static #escapedHexChar = R.seq(
        R.string("\\"),
        R.alt(
            R.seq(R.string("x").map(() => EscapedCharParser.Type.HEX), this.#hexDigit.times(2)),
            R.seq(R.string("u").map(() => EscapedCharParser.Type.UNICODE), this.#hexDigit.times(4)),
            R.seq(R.string("u{").map(() => EscapedCharParser.Type.UNICODE_FULL), this.#hexDigit.times(4, 5), R.string("}")),
        )
    ).map(([_0, [type, hexValues, _3]]) =>
        R.escapedChar(String.fromCodePoint(Number(`0x${hexValues.join("")}`)), type)
    )

    static #escapedCharLiteral = R.seq(R.string("\\"), R.regexp(/./).assert(v => v != 'x')).map(([_, c]) =>
        ClassMetacharacter[c]
            // @ts-expect-error
            ? R.classShorthand(c)
            : R.escapedChar(EscapedCharParser.specialEscapedCharacters[c] ?? c)
    )

    static #nonClassEscapedChar = R.alt(this.#escapedHexChar, this.#escapedCharLiteral)

    static #classCharLiteral = R.regexp(/./)
        .assert(c => !["]", "\\"].includes(c))
        .map(c => R.string(c))

    static #nonClassCharLiteral = R.regexp(/./)
        .assert(c => !["^", "$", "*", "+", "?", ".", "(", ")", "[", "\\", "|"].includes(c))
        .map(c => R.string(c))

    static #nonClassCharacter = R.alt(
        R.string(".").map(() => R.anyChar()),
        this.#nonClassCharLiteral,
        this.#nonClassEscapedChar,
    )

    static #classChar = R.alt(
        this.#classCharLiteral,
        this.#escapedHexChar,
        this.#escapedCharLiteral,
    )

    static #rangeEndpoint = R.alt(
        this.#classCharLiteral,
        this.#escapedHexChar,
        this.#escapedCharLiteral.assert(v => !(v.getParser() instanceof ClassShorthandParser)),
    )

    static #range = R.seq(this.#rangeEndpoint, R.string("-"), this.#rangeEndpoint)
        .map(([from, _, to]) => R.range(from, to))

    static #class = R.seq(
        R.string("["),
        R.string("^").opt(),
        R.alt(this.#range, this.#classChar).atLeast(1),
        R.string("]")
    ).map(([l, invert, values, r]) =>
        invert ? R.negative(R.class(...values)) : R.class(...values)
    )


    static #quantifier = R.alt(
        R.seq(
            R.string("{"),
            this.#decimalNumber.map(v => Number(v)),
            R.seq(R.string(","), this.#decimalNumber.map(v => Number(v)).opt()).opt(),
            R.string("}"),
        ).map(([lp, from, maxTimes, rp]) => /** @param {Regexer<Parser<any>>} p */ p => p.times(
            from,
            maxTimes
                ? maxTimes[1] ? maxTimes[1] : Number.POSITIVE_INFINITY
                : from
        )),
        R.string("+").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.atLeast(1)),
        R.string("?").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.opt()),
        R.string("*").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.many()),
    )

    static #subExpression = R.alt(
        // Capturing group
        R.seq(R.string("("), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.group(value)),
        // Non capturing group
        R.seq(R.string("(?:"), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.nonCapturingGroup(value)),
        // Positive lookahead
        R.seq(R.string("(?="), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.POSITIVE_AHEAD)),
        // Negative lookahead
        R.seq(R.string("(?!"), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.NEGATIVE_AHEAD)),
        // Positive lookbehind
        R.seq(R.string("(?<="), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.POSITIVE_BEHIND)),
        // Negative lookbehind
        R.seq(R.string("(?<!"), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.NEGATIVE_BEHIND)),
        // Atomic group
        R.seq(R.string("(?>"), R.lazy(() => this.regexp), R.string(")"))
            .map(([l, value, r]) => R.atomicGroup(value)),
    )

    static #expression = R.alt(
        this.#anchor,
        R.seq(
            R.alt(this.#subExpression, this.#class, this.#nonClassCharacter),
            this.#quantifier.opt(),
        ).map(([value, quantifier]) => quantifier ? quantifier(value) : value),
    )

    static #sequence = this.#expression.many().map(v => {
        v = v.reduce(
            (acc, cur) => {
                const last = acc[acc.length - 1]?.getParser()
                const current = cur.getParser()
                if (last?.constructor === StringParser && current?.constructor === StringParser) {
                    // @ts-expect-error
                    acc[acc.length - 1] = R.string(last.value + current.value)
                } else {
                    acc.push(cur)
                }
                return acc
            },
            /** @type {Regexer<Parser<any>>[]} */([]),
        )
        if (v.length === 0) {
            return R.success()
        }
        if (v.length === 1) {
            return v[0]
        }
        return R.seq(...v)
    })

    static #alternation = R.seq(
        this.#sequence,
        R.seq(R.string("|"), this.#sequence).map(([pipe, seq]) => seq).many()
    ).map(([first, rest]) => rest.length === 0 ? first : R.alt(first, ...rest))

    /** @type {Regexer<Parser<Regexer<Parser<any>>>>} */
    static regexp = this.#alternation
}
