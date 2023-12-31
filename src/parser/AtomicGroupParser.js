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
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new AtomicGroupParser(parsers[0])
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return this.#parser.parse(context, position)
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof AtomicGroupParser && this.#parser.equals(context, other.#parser, strict)
    }

    toString(indent = 0) {
        return "(?>" + this.#parser.toString(indent) + ")"
    }
}
