import Parser from "./Parser.js"
import Reply from "../Reply.js"
import StringParser from "./StringParser.js"

/**
 * @template {StringParser<String>} A
 * @template {StringParser<String>} B
 * @extends {Parser<String>}
 */
export default class RangeParser extends Parser {

    #from
    get from() {
        return this.#from
    }

    #to
    get to() {
        return this.#to
    }

    /**
     * @param {A} from
     * @param {B} to
     */
    constructor(from, to) {
        super()
        this.#from = from
        this.#to = to
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const c = context.input.codePointAt(position)
        return this.#from.value.codePointAt(0) <= c && c < this.#from.value.codePointAt(0)
            ? Reply.makeSuccess(position + 1, context.input[position])
            : Reply.makeFailure(position)
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof RangeParser
            && this.#from.equals(context, other.#from, strict)
            && this.#to.equals(context, other.#to, strict)
    }

    toString(indent = 0) {
        return this.#from.toString(indent) + "-" + this.#to.toString(indent)
    }
}
