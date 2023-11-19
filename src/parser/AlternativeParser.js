import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
export default class AlternativeParser extends Parser {

    #backtracking = false
    get backtracking() {
        return this.#backtracking
    }

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        const result = new AlternativeParser(...parsers)
        if (this.#backtracking) {
            result.#backtracking = true
        }
        return result
    }

    asBacktracking() {
        const result = this.wrap(...this.#parsers)
        result.#backtracking = true
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result
        for (let i = 0; i < this.#parsers.length; ++i) {
            result = this.#parsers[i].parse(context, position)
            if (result.status) {
                return result
            }
        }
        return Reply.makeFailure(position)
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (
            !(other instanceof AlternativeParser)
            || this.#parsers.length != other.#parsers.length
            || this.#backtracking !== other.#backtracking
        ) {
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
        return "ALT<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(indent + 1))
                .join("\n" + deeperIndentation + "|\n")
            + "\n" + indentation + ">"
    }
}
