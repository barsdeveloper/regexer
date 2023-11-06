import RegExpParser from "./RegExpParser.js"

/** @extends RegExpParser<0> */
export default class AnyCharParser extends RegExpParser {

    constructor() {
        super(/./, 0)
    }

    toString(indent = 0) {
        return "."
    }
}
