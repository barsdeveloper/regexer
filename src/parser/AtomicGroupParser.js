import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class AtomicGroupParser extends Parser {

    #parser

    #type
    get type() {
        return this.#type
    }

    /** @param {T} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    unwrap() {
        return this.#parser
    }

    /**
     * @template {Parser<any>} P
     * @param {P} parser
     */
    wrap(parser) {
        return new AtomicGroupParser(parser)
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
        return other instanceof AtomicGroupParser && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return "(?>" + this.#parser.toString(indent) + ")"
    }
}
