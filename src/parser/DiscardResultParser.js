import MapParser from "./MapParser.js"

/**
 * @template {Parser<any>} P
 * @extends MapParser<P, "">
 */
export default class DiscardResultParser extends MapParser {

    /** @type {() => ""} */
    static #discarder = () => ""

    /** @param {P} parser */
    constructor(parser) {
        super(parser, DiscardResultParser.#discarder)
    }
}
