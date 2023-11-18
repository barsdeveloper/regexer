import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
export default class SequenceParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param  {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new SequenceParser(...parsers)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = new Array(this.#parsers.length)
        const result = /** @type {Result<ParserValue<T>>} */(Reply.makeSuccess(position, value))
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position)
            if (!outcome.status) {
                return outcome
            }
            result.value[i] = outcome.value
            result.position = outcome.position
        }
        return result
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (!(other instanceof SequenceParser) || this.#parsers.length != other.#parsers.length) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(context, other.#parsers[i], strict)) {
                return false
            }
        }
        return true
    }

    toString(indent = 0) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        return "SEQ<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(indent + 1))
                .join("\n")
            + "\n" + indentation + ">"
    }
}
