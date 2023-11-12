import Reply from "../Reply.js"
import RegExpParser from "./RegExpParser.js"

/** @extends RegExpParser<0> */
export default class AnyCharParser extends RegExpParser {

    #dotAll

    /** @param {Boolean} dotAll */
    constructor(dotAll) {
        super(/./, 0)
        this.#dotAll = dotAll
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        return this.#dotAll || !parser.actualParser(true).parse(Reply.makeContext("\n"), 0).status
    }

    toString(indent = 0) {
        return "."
    }
}
