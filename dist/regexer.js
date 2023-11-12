/** @template Value */
class Parser {

    static indentation = "    "

    /**
     * @param {Result<any>} a
     * @param {Result<any>} b
     */
    static mergeResults(a, b) {
        if (!b) {
            return a
        }
        return /** @type {typeof a} */({
            status: a.status,
            position: a.position,
            value: a.value,
        })
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        return this.equals(parser, false)
    }

    /** @returns {Parser<Value>} */
    unwrap() {
        return null
    }

    canStartWith() {

    }

    /**
     * @template {Parser<any>} T
     * @param {T} parser
     * @returns {Parser<Value>}
     */
    wrap(parser) {
        throw new Error("Not implemented")
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<Value>}
     */
    parse(context, position) {
        return null
    }

    /** @returns {Parser<any>} */
    actualParser(ignoreGroup = false) {
        return this
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        const unwrapped = other.unwrap();
        if (unwrapped)
        return other
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        return strict ? this.actualParser() === other.actualParser() : this === other
    }

    toString(indent) {
        return `${this.constructor.name} does not implement toString()`
    }
}

/**
 * @template Value
 * @typedef {{
 *     status: Boolean,
 *     value: Value,
 *     position: Number,
 * }} Result
 */

class Reply {

    /**
     * @template Value
     * @param {Number} position
     * @param {Value} value
     */
    static makeSuccess(position, value) {
        return /** @type {Result<Value>} */({
            status: true,
            value: value,
            position: position,
        })
    }

    /**
     * @template Value
     * @param {Number} position
     */
    static makeFailure(position) {
        return /** @type {Result<Value>} */({
            status: false,
            value: null,
            position: position,
        })
    }

    /** @param {String} input */
    static makeContext(input) {
        return /** @type {Context} */(
            {
                input: input
            }
        )
    }
}

/**
 * @template {[Parser<any>, ...Parser<any>[]]} T
 * @extends Parser<ParserValue<T>>
 */
class AlternativeParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result;
        for (let i = 0; i < this.#parsers.length; ++i) {
            result = this.#parsers[i].parse(context, position);
            if (result.status) {
                return result
            }
        }
        return Reply.makeFailure(position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        if (this === other) {
            return true
        }
        if (!(other instanceof AlternativeParser) || this.#parsers.length != other.#parsers.length) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(other.#parsers[i], strict)) {
                return false
            }
        }
        return true
    }

    toString(indent = 0) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        return "ALT<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(indent + 1))
                .join("\n" + deeperIndentation + "|\n")
            + "\n" + indentation + ">"
    }
}

/**
 * @template {Parser<any>} T
 * @template {(v: ParserValue<T>, input: String, position: Number) => Regexer<Parser<any>>} C
 * @extends Parser<ReturnType<C>>
 */
class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {T} parser
     * @param {C} chained
     */
    constructor(parser, chained) {
        super();
        this.#parser = parser;
        this.#fn = chained;
    }

    unwrap() {
        return this.#parser
    }

    /**
     * @template {Parser<ParserValue<T>>} P
     * @param {P} parser
     */
    wrap(parser) {
        return new ChainedParser(parser, this.#fn)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result = this.#parser.parse(context, position);
        if (!result.status) {
            return result
        }
        result = this.#fn(result.value, context.input, result.position)?.getParser().parse(context, result.position)
            ?? Reply.makeFailure(result.position);
        return result
    }

    toString(indent = 0) {
        return this.#parser.toString(indent) + " => chained<f()>"
    }
}

/** @extends Parser<String> */
class FailureParser extends Parser {

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeFailure(position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return other instanceof FailureParser
    }

    toString(indent = 0) {
        return "<FAILURE>"
    }
}

/**
 * @template {Parser<any>} P
 * @extends Parser<ParserValue<P>>
 */
class LazyParser extends Parser {

    #parser

    /** @type {P} */
    #resolvedPraser

    /** @param {() => Regexer<P>} parser */
    constructor(parser) {
        super();
        this.#parser = parser;
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser();
        }
        return this.#resolvedPraser
    }

    unwrap() {
        return this.resolve()
    }

    /**
     * @template {Parser<any>} P
     * @param {P} parser
     */
    wrap(parser) {
        const regexerConstructor = this.#parser().constructor;
        // @ts-expect-error
        return new LazyParser(() => new regexerConstructor(parser))
    }

    actualParser(ignoreGroup = false) {
        return this.resolve().actualParser(ignoreGroup)
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        const regexerConstructor = this.#parser().constructor;
        // @ts-expect-error
        return new LazyParser(() => new regexerConstructor(this.#resolvedPraser.withActualParser(other)))
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        this.resolve();
        return this.#resolvedPraser.parse(context, position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (other instanceof LazyParser && this.#parser === other.#parser) {
            return true
        }
        this.resolve();
        if (!strict) {
            other = other.actualParser();
        } else if (other instanceof LazyParser) {
            other = other.resolve();
        }
        return this.#resolvedPraser === other || this.#resolvedPraser.equals(other, strict)
    }

    toString(indent = 0) {
        return this.resolve().toString(indent)
    }
}

/** @template {Parser<any>} T */
class LookaroundParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #type
    get type() {
        return this.#type
    }

    /**
     * @readonly
     * @enum {String}
     */
    static Type = {
        NEGATIVE_AHEAD: "?!",
        NEGATIVE_BEHIND: "?<!",
        POSITIVE_AHEAD: "?=",
        POSITIVE_BEHIND: "?<=",
    }

    /**
     * @param {T} parser
     * @param {Type} type
     */
    constructor(parser, type) {
        super();
        this.#parser = parser;
        this.#type = type;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        if (
            this.#type === LookaroundParser.Type.NEGATIVE_BEHIND
            || this.#type === LookaroundParser.Type.POSITIVE_BEHIND
        ) {
            throw new Error("Lookbehind is not implemented yet")
        } else {
            const result = this.#parser.parse(context, position);
            return result.status == (this.#type === LookaroundParser.Type.POSITIVE_AHEAD)
                ? Reply.makeSuccess(position, "")
                : Reply.makeFailure(position)
        }
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return this === other
            || other instanceof LookaroundParser
            && this.#type === other.#type
            && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return "(" + this.#type + this.#parser.toString(indent) + ")"
    }
}

/**
 * @template {Parser<any>} P
 * @template R
 * @extends Parser<R>
 */
class MapParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #mapper
    get mapper() {
        return this.#mapper
    }

    /**
     * @param {P} parser
     * @param {(v: ParserValue<P>) => R} mapper
     */
    constructor(parser, mapper) {
        super();
        this.#parser = parser;
        this.#mapper = mapper;
    }

    unwrap() {
        return this.#parser
    }

    /** @param {Parser<any>} parser */
    wrap(parser) {
        return new MapParser(parser, this.#mapper)
    }

    actualParser(ignoreGroup = false) {
        return this.#parser.actualParser(ignoreGroup)
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        return new MapParser(this.#parser.withActualParser(other), this.#mapper)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<R>}
     */
    parse(context, position) {
        const result = this.#parser.parse(context, position);
        if (result.status) {
            result.value = this.#mapper(result.value);
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return this === other || (
            strict
                ? other instanceof MapParser
                && this.#mapper === other.#mapper
                && this.#parser.equals(other.#parser, strict)
                : this.actualParser().equals(other, strict)
        )
    }

    toString(indent = 0) {
        let serializedMapper = this.#mapper.toString();
        if (serializedMapper.length > 80 || serializedMapper.includes("\n")) {
            serializedMapper = "( ... ) => { ... }";
        }
        return this.#parser.toString(indent) + ` -> map<${serializedMapper}>`
    }
}

/**
 * @template {Number} Group
 * @extends {Parser<Group extends -1 ? RegExpExecArray : String>}
 */
class RegExpParser extends Parser {

    /** @type {RegExp} */
    #regexp
    get regexp() {
        return this.#regexp
    }
    /** @type {RegExp} */
    #anchoredRegexp
    #group

    regexpGenerated = false // This regexp was generated by the optimizer to replace other parsers
    regexpFullyGenerated = true // This regexp is fully generated (does not have any user provided regexp in its tree)
    cyclomaticComplexity = 1


    /**
     * @param {RegExp | RegExpParser} regexp
     * @param {Group} group
     */
    constructor(regexp, group) {
        super();
        if (regexp instanceof RegExp) {
            this.#regexp = regexp;
            this.#anchoredRegexp = new RegExp(`^(?:${regexp.source})`, regexp.flags);
        } else if (regexp instanceof RegExpParser) {
            this.#regexp = regexp.#regexp;
            this.#anchoredRegexp = regexp.#anchoredRegexp;
            this.regexpGenerated = regexp.regexpGenerated;
            this.regexpFullyGenerated = regexp.regexpFullyGenerated;
            this.cyclomaticComplexity = regexp.cyclomaticComplexity;
        }
        this.#group = group;
    }

    isFullyGenerated() {
        return this.regexpFullyGenerated
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const match = this.#anchoredRegexp.exec(context.input.substring(position));
        return match
            ? Reply.makeSuccess(position + match[0].length, this.#group >= 0 ? match[this.#group] : match)
            : Reply.makeFailure(position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return other instanceof RegExpParser && this.#regexp.source === other.#regexp.source
    }
}

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
class SequenceParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param  {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = new Array(this.#parsers.length);
        const result = /** @type {Result<ParserValue<T>>} */(Reply.makeSuccess(position, value));
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position);
            if (!outcome.status) {
                return outcome
            }
            result.value[i] = outcome.value;
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        if (this === other) {
            return true
        }
        if (!(other instanceof SequenceParser) || this.#parsers.length != other.#parsers.length) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(other.#parsers[i], strict)) {
                return false
            }
        }
        return true
    }

    toString(indent = 0) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        return "SEQ<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(indent + 1))
                .join("\n")
            + "\n" + indentation + ">"
    }
}

/**
 * @template {String} T
 * @extends {Parser<T>}
 */
class StringParser extends Parser {

    #value
    get value() {
        return this.#value
    }

    /** @param {T} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        parser = parser.actualParser();
        if (parser instanceof StringParser) {
            const otherValue = /** @type {String} */(parser.#value);
            return otherValue.startsWith(this.#value)
        }
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const end = position + this.#value.length;
        const value = context.input.substring(position, end);
        return this.#value === value
            ? Reply.makeSuccess(end, this.#value)
            : /** @type {Result<T>} */(Reply.makeFailure(position))
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return other instanceof StringParser && this.#value === other.#value
    }

    toString(indent = 0) {
        const inlined = this.value.replaceAll("\n", "\\n");
        return this.value.length > 1 || this.value[0] === " "
            ? `"${inlined.replaceAll('"', '\\"')}"`
            : inlined
    }
}

/**
 * @template T
 * @extends Parser<T>
 */
class SuccessParser extends Parser {

    #value

    /** @param {T} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeSuccess(position, this.#value)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return other instanceof SuccessParser
    }

    toString(indent = 0) {
        return "<SUCCESS>"
    }
}

/**
 * @template {Parser<any>} P
 * @extends Parser<ParserValue<P>[]>
 */
class TimesParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #min
    get min() {
        return this.#min
    }

    #max
    get max() {
        return this.#max
    }

    /** @param {P} parser */
    constructor(parser, min = 0, max = Number.POSITIVE_INFINITY) {
        super();
        if (min > max) {
            throw new Error("Min is more than max")
        }
        this.#parser = parser;
        this.#min = min;
        this.#max = max;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = [];
        const result = /** @type {Result<ParserValue<P>[]>} */(
            Reply.makeSuccess(position, value)
        );
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position);
            if (!outcome.status) {
                return i >= this.#min ? result : outcome
            }
            result.value.push(outcome.value);
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser();
        }
        return this === other
            || other instanceof TimesParser
            && this.#min === other.#min
            && this.#max === other.#max
            && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return this.parser.toString(indent)
            + (
                this.#min === 0 && this.#max === 1 ? "?"
                    : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                        : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                            : "{"
                            + this.#min
                            + (this.#min !== this.#max ? "," : this.#max !== Number.POSITIVE_INFINITY ? this.#max : "")
                            + "}"
            )
    }
}

/** @template {Parser<any>} T */
class Regexer {

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
        this.#parser = parser;
        this.#optimized = optimized;
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
        return lhs.getParser().equals(rhs.getParser(), strict)
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(input), 0);
        return result.status && result.position === input.length ? result : Reply.makeFailure(result.position)
    }

    /** @param {String} input */
    parse(input) {
        const result = this.run(input);
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
     * @template {Regexer<any>[]} P
     * @param {P} parsers
     * @returns {Regexer<SequenceParser<UnwrapParser<P>>>}
     */
    static seq(...parsers) {
        const results = new Regexer(new SequenceParser(...parsers.map(p => p.getParser())));
        // @ts-expect-error
        return results
    }

    /**
     * @template {Regexer<any>[]} P
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

    /** @returns {Regexer<T | undefined>} */
    opt() {
        // @ts-expect-error
        return Regexer.alt(
            this,
            Regexer.success(undefined)
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
            .map(Regexer.#arrayFlatter);
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

export { Regexer as default };
