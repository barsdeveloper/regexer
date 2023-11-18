import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @template {Parser<any>} T */
export default class LookaroundParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #type
    get type() {
        return this.#type
    }

    /**
     * @readonly
     * @enum {String}
     */
    static Type = {
        NEGATIVE_AHEAD: "?!",
        NEGATIVE_BEHIND: "?<!",
        POSITIVE_AHEAD: "?=",
        POSITIVE_BEHIND: "?<=",
    }

    /**
     * @param {T} parser
     * @param {Type} type
     */
    constructor(parser, type) {
        super()
        this.#parser = parser
        this.#type = type
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new LookaroundParser(parsers[0], this.#type)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        if (
            this.#type === LookaroundParser.Type.NEGATIVE_BEHIND
            || this.#type === LookaroundParser.Type.POSITIVE_BEHIND
        ) {
            throw new Error("Lookbehind is not implemented yet")
        } else {
            const result = this.#parser.parse(context, position)
            return result.status == (this.#type === LookaroundParser.Type.POSITIVE_AHEAD)
                ? Reply.makeSuccess(position, "")
                : Reply.makeFailure(position)
        }
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return this === other
            || other instanceof LookaroundParser
            && this.#type === other.#type
            && this.#parser.equals(context, other.#parser, strict)
    }

    toString(indent = 0) {
        return "(" + this.#type + this.#parser.toString(indent) + ")"
    }
}
