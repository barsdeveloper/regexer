import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>} P
 * @extends Parser<ParserValue<P>[]>
 */
export default class TimesParser extends Parser {

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
        super()
        if (min > max) {
            throw new Error("Min is more than max")
        }
        this.#parser = parser
        this.#min = min
        this.#max = max
    }

    unwrap() {
        return this.#parser
    }

    /**
     * @template {Parser<any>} T
     * @param {T} parser
     * @returns {TimesParser<T>}
     */
    wrap(parser) {
        return new TimesParser(parser, this.#min, this.#max)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = []
        const result = /** @type {Result<ParserValue<P>[]>} */(
            Reply.makeSuccess(position, value)
        )
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position)
            if (!outcome.status) {
                return i >= this.#min ? result : outcome
            }
            result.value.push(outcome.value)
            result.position = outcome.position
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
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
