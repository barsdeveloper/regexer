import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @readonly
 * @enum {String}
 */
export const AnchorType = {
    LINE_START: "^",
    LINE_END: "$",
    WORD_BOUNDARY: "\\b",
}

/**
 * @template {AnchorType} T
 * @extends {Parser<"">}
 */
export default class AnchorParser extends Parser {

    #type

    /** @param {T} type */
    constructor(type) {
        super()
        this.#type = type
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let status = false
        switch (this.#type) {
            case AnchorType.LINE_START:
                status = position === 0 || context.input[position - 1] === "\n"
                break
            case AnchorType.LINE_END:
                status = position === context.input.length || context.input[position] === "\n"
                break
        }
        return status ? Reply.makeSuccess(position, "") : Reply.makeFailure(position)
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof AnchorParser && this.#type === other.#type
    }

    toString(indent = 0) {
        return this.#type
    }
}
