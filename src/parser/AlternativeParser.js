import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {[Parser<any>, ...Parser<any>[]]} T
 * @extends Parser<ParserValue<T>>
 */
export default class AlternativeParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
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
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        return "ALT<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(indent + 1))
                .join("\n" + deeperIndentation + "|\n")
            + "\n" + indentation + ">"
    }
}
