import Parser from "./Parser.js"
import Reply from "../Reply.js"
import StringParser from "./StringParser.js"
import SuccessParser from "./SuccessParser.js"

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
        if (this.#parsers.length === 1) {
            this.isActualParser = false
        }
    }

    /** @protected */
    doMatchesEmpty() {
        return this.#parsers.some(p => p.matchesEmpty())
    }

    /**
     * @protected
     * @param {Parser<any>[]} additional
     * @param {Context} context
     */
    doTerminalList(type, additional, context) {
        return this.#parsers
            .flatMap(p => p.terminalList(type, additional, context))
            .reduce(
                (acc, cur) => acc.some(p => p.equals(Reply.makeContext(), cur, true)) ? acc : (acc.push(cur), acc),
                /** @type {Parser<any>[]} */([])
            )
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
     * @protected
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

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indent)
            if (!(this.#parsers[0] instanceof StringParser) && !context.visited.has(this.#parsers[0])) {
                result = "<" + result + ">"
            }
            result += "?"
            return result
        }
        return "ALT<\n"
            + deeperIndentation + this.#parsers
                .map(p => p.toString(context, indent + 1))
                .join("\n" + deeperIndentation + "| ")
            + "\n" + indentation + ">"
    }
}
