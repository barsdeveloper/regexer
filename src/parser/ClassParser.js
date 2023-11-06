import AlternativeParser from "./AlternativeParser.js"
import Parser from "./Parser.js"

/**
 * @template {[Parser<any>, ...Parser<any>[]]} T
 * @extends AlternativeParser<T>
 */
export default class ClassParser extends AlternativeParser {

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        if (!strict) {
            other = other.actualParser()
        }
        return (!strict || other instanceof ClassParser) && super.equals(other, strict)
    }

    toString(indent = 0) {
        return "["
            + this.parsers.map(p => p.toString(indent)).join("")
            + "]"
    }
}
