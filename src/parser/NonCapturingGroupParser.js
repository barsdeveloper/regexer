import Parser from "./Parser.js"

/**
 * @readonly
 * @enum {number}
 */
export const GroupType = {
    ATOMIC: -1,
    NON_CAPTURING: 0,
    CAPTURING: 1,
}

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class NonCapturingGroupParser extends Parser {

    #parser

    /** @param {T} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    /** @returns {Parser<any>} */
    actualParser() {
        return this.#parser.actualParser()
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        return new NonCapturingGroupParser(this.#parser.withActualParser(other))
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
        return strict
            ? other instanceof NonCapturingGroupParser && this.#parser.equals(other.#parser, strict)
            : this.actualParser().equals(other, strict)
    }

    toString(indent = 0) {
        let group = ""
        return "(?:" + this.#parser.toString(indent) + ")"
    }
}