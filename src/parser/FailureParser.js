import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @extends Parser<String> */
export default class FailureParser extends Parser {

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeFailure(position)
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof FailureParser
    }

    toString(indent = 0) {
        return "<FAILURE>"
    }
}
