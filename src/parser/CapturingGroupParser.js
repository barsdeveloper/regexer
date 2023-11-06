import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class CapturingGroupParser extends Parser {

    #parser

    #id
    get id() {
        return this.#id
    }

    /** @param {T} parser */
    constructor(parser, id = Symbol()) {
        super()
        this.#parser = parser
        this.#id = id
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return this.#parser.parse(context, position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
        }
        return other instanceof CapturingGroupParser && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return "(" + this.#parser.toString(indent) + ")"
    }
}
