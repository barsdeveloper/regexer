import AlternativeParser from "./parser/AlternativeParser.js"
import ChainedParser from "./parser/ChainedParser.js"
import FailureParser from "./parser/FailureParser.js"
import LazyParser from "./parser/LazyParser.js"
import LookaroundParser from "./parser/LookaroundParser.js"
import MapParser from "./parser/MapParser.js"
import Parser from "./parser/Parser.js"
import RegExpParser from "./parser/RegExpParser.js"
import Reply from "./Reply.js"
import SequenceParser from "./parser/SequenceParser.js"
import StringParser from "./parser/StringParser.js"
import SuccessParser from "./parser/SuccessParser.js"
import TimesParser from "./parser/TimesParser.js"

/** @template {Parser<any>} T */
export default class Regexer {

    #parser
    #optimized
    #groups = new Map()

    static #numberTransformer = v => Number(v)
    /** @param {[any, ...any]|RegExpExecArray} param0 */
    static #firstElementGetter = ([v, _]) => v
    /** @param {[any, any, ...any]|RegExpExecArray} param0 */
    static #secondElementGetter = ([_, v]) => v
    static #arrayFlatter = ([first, rest]) => [first, ...rest]
    static #joiner =
        /** @param {any} v */
        v =>
            v instanceof Array
                ? v.join("")
                : v
    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`
    static #numberRegex = /[-\+]?(?:\d*\.)?\d+/

    // Prefedined parsers

    /** Parser accepting any valid decimal, possibly signed number */
    static number = Regexer.regexp(new RegExp(Regexer.#numberRegex.source + String.raw`(?!\.)`))
        .map(Regexer.#numberTransformer)

    /** Parser accepting any digits only number */
    static numberNatural = Regexer.regexp(/\d+/).map(Regexer.#numberTransformer)

    /** Parser accepting any valid decimal, possibly signed, possibly in the exponential form number */
    static numberExponential = Regexer.regexp(new RegExp(
        Regexer.#numberRegex.source
        + String.raw`(?:[eE][\+\-]?\d+)?(?!\.)`)
    ).map(Regexer.#numberTransformer)

    /** Parser accepting any valid decimal number between 0 and 1 */
    static numberUnit = Regexer.regexp(/\+?(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\.\d])/)
        .map(Regexer.#numberTransformer)

    /** Parser accepting whitespace */
    static whitespace = Regexer.regexp(/\s+/)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInline = Regexer.regexp(/[^\S\n]+/)

    /** Parser accepting whitespace that contains a list a newline */
    static whitespaceMultiline = Regexer.regexp(/\s*?\n\s*/)

    /** Parser accepting whitespace */
    static optWhitespace = Regexer.regexp(/\s*/)

    /** Parser accepting a double quoted string and returns the content */
    static doubleQuotedString = Regexer.regexpGroups(new RegExp(`"(${Regexer.#createEscapeable('"')})"`))
        .map(Regexer.#secondElementGetter)

    /** Parser accepting a single quoted string and returns the content */
    static singleQuotedString = Regexer.regexpGroups(new RegExp(`'(${Regexer.#createEscapeable("'")})'`))
        .map(Regexer.#secondElementGetter)

    /** Parser accepting a backtick quoted string and returns the content */
    static backtickQuotedString = Regexer.regexpGroups(new RegExp(`\`(${Regexer.#createEscapeable("`")})\``))
        .map(Regexer.#secondElementGetter)

    /** @param {T} parser */
    constructor(parser, optimized = false) {
        this.#parser = parser
        this.#optimized = optimized
    }

    /**
     * @template {Parser<any>} T
     * @param {T} parser
     */
    static optimize(parser) {

    }

    /**
     * @param {Regexer<Parser<any>>} lhs
     * @param {Regexer<Parser<any>>} rhs
     */
    static equals(lhs, rhs, strict = false) {
        const a = lhs.getParser()
        const b = rhs.getParser()
        if (b instanceof a.constructor && !(a instanceof b.constructor)) {
            // typeof b extends typeof a, invert to take advantage of polymorphism
            return b.equals(a, strict)
        }
        return a.equals(b, strict)
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(input), 0)
        return result.status && result.position === input.length ? result : Reply.makeFailure(result.position)
    }

    /** @param {String} input */
    parse(input) {
        const result = this.run(input)
        if (!result.status) {
            throw new Error("Parsing error")
        }
        return result.value
    }

    // Parsers

    /**
     * @template {String} S
     * @param {S} value
     */
    static str(value) {
        return new Regexer(new StringParser(value))
    }

    /** @param {RegExp} value */
    static regexp(value, group = 0) {
        return new Regexer(new RegExpParser(value, group))
    }

    /** @param {RegExp} value */
    static regexpGroups(value) {
        return new Regexer(new RegExpParser(value, -1))
    }

    static success(value = undefined) {
        return new Regexer(new SuccessParser(value))
    }

    static failure() {
        return new Regexer(new FailureParser())
    }

    // Combinators

    /**
     * @template {[Regexer<any>, Regexer<any>, ...Regexer<any>[]]} P
     * @param {P} parsers
     * @returns {Regexer<SequenceParser<UnwrapParser<P>>>}
     */
    static seq(...parsers) {
        const results = new Regexer(new SequenceParser(...parsers.map(p => p.getParser())))
        // @ts-expect-error
        return results
    }

    /**
     * @template {[Regexer<any>, Regexer<any>, ...Regexer<any>[]]} P
     * @param {P} parsers
     * @returns {Regexer<AlternativeParser<UnwrapParser<P>>>}
     */
    static alt(...parsers) {
        // @ts-expect-error
        return new Regexer(new AlternativeParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Regexer<any>} P
     * @param {P} parser
     */
    static lookahead(parser) {
        return new Regexer(new LookaroundParser(parser.getParser(), LookaroundParser.Type.POSITIVE_AHEAD))
    }

    /**
     * @template {Regexer<Parser<any>>} P
     * @param {() => P} parser
     * @returns {Regexer<LazyParser<UnwrapParser<P>>>}
     */
    static lazy(parser) {
        // @ts-expect-error
        return new Regexer(new LazyParser(parser))
    }

    /** @param {Number} min */
    times(min, max = min) {
        return new Regexer(new TimesParser(this.#parser, min, max))
    }

    many() {
        return this.times(0, Number.POSITIVE_INFINITY)
    }

    /** @param {Number} n */
    atLeast(n) {
        return this.times(n, Number.POSITIVE_INFINITY)
    }

    /** @param {Number} n */
    atMost(n) {
        return this.times(0, n)
    }

    /** @returns {Regexer<T?>} */
    opt() {
        // @ts-expect-error
        return Regexer.alt(
            this,
            Regexer.success(null)
        )
    }

    /**
     * @template {Regexer<Parser<any>>} P
     * @param {P} separator
     */
    sepBy(separator, allowTrailing = false) {
        const results = Regexer.seq(
            this,
            // @ts-expect-error
            Regexer.seq(separator, this).map(Regexer.#secondElementGetter).many()
        )
            .map(Regexer.#arrayFlatter)
        return results
    }

    skipSpace() {
        return Regexer.seq(this, Regexer.optWhitespace).map(Regexer.#firstElementGetter)
    }

    /**
     * @template R
     * @param {(v: ParserValue<T>) => R} fn
     * @returns {Regexer<MapParser<T, R>>}
     */
    map(fn) {
        return new Regexer(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Regexer<any>} R
     * @param {(v: ParserValue<T>, input: String, position: Number) => R} fn
     */
    chain(fn) {
        return new Regexer(new ChainedParser(this.#parser, fn))
    }

    /**
     * @param {(v: ParserValue<T>, input: String, position: Number) => boolean} fn
     * @return {Regexer<T>}
     */
    assert(fn) {
        // @ts-expect-error
        return this.chain((v, input, position) => fn(v, input, position)
            ? Regexer.success(v)
            : Regexer.failure()
        )
    }

    join(value = "") {
        return this.map(Regexer.#joiner)
    }

    toString(indent = 0, newline = false) {
        return (newline ? "\n" + Parser.indentation.repeat(indent) : "") + this.#parser.toString(indent)
    }
}
