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

    /**
     * @param {T} parser
     * @param {String | Symbol} id
     */
    constructor(parser, id) {
        super()
        this.#parser = parser
        this.#id = id
    }

    unwrap() {
        return this.#parser
    }

    /**
     * @template {Parser<any>} P
     * @param {P} parser
     */
    wrap(parser) {
        return new CapturingGroupParser(parser, this.#id)
    }

    /** @returns {Parser<any>} */
    actualParser(ignoreGroup = false) {
        return ignoreGroup ? this.#parser.actualParser(ignoreGroup) : this
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        return new CapturingGroupParser(this.#parser.withActualParser(other), this.#id)
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
        return other instanceof CapturingGroupParser
            && this.#id == other.#id
            && this.#parser.equals(other.#parser, strict)
    }

    toString(indent = 0) {
        return "(" + this.#parser.toString(indent) + ")"
    }
}
