import Reply from "../Reply.js"
import AlternativeParser from "./AlternativeParser.js"
import Parser from "./Parser.js"

/**
 * @template {[Parser<any>, ...Parser<any>[]]} T
 * @extends AlternativeParser<T>
 */
export default class ClassParser extends AlternativeParser {

    #negative
    get negative() {
        return this.#negative
    }

    /**
     * @param {T} parsers
     * @param {Boolean} negative
     */
    constructor(negative, ...parsers) {
        super(...parsers)
        this.#negative = negative
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result = super.parse(context, position)
        if (this.#negative) {
            result = !result.status && position < context.input.length
                ? Reply.makeSuccess(position + 1, context.input[position])
                : Reply.makeFailure(position)
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
        }
        return (!strict || other instanceof ClassParser && this.#negative === other.#negative)
            && super.equals(other, strict)
    }

    toString(indent = 0) {
        return "["
            + this.parsers.map(p => p.toString(indent)).join("")
            + "]"
    }
}
