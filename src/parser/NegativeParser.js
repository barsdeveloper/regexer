import Reply from "../Reply.js"
import Parser from "./Parser.js"

/**
 * @template {Parser<any>} P
 * @extends Parser<"">
 */
export default class NegativeParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    /** @param {P} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const result = this.#parser.parse(context, position)
        return result.status ? Reply.makeFailure(position) : Reply.makeSuccess(position, "")
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
        }
        return this === other || other instanceof NegativeParser && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return "NOT<" + this.#parser.toString(indent) + ">"
    }
}
