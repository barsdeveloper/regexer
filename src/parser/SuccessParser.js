import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template T
 * @extends Parser<T>
 */
export default class SuccessParser extends Parser {

    #value

    /** @param {T} value */
    constructor(value) {
        super()
        this.#value = value
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeSuccess(position, this.#value)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
        }
        return other instanceof SuccessParser
    }

    toString(indent = 0) {
        return "<SUCCESS>"
    }
}
