import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import Regexer from "../Regexer.js"

export default class Transformer {

    #next = null

    /** @type {(new (...args: any) => Parser<any>)[]} */
    traverse = [CapturingGroupParser]

    /** @type {(new (...args: any) => Parser<any>)[]} */
    opaque = []

    constructor() {
    }

    chain(transformer) {
        this.#next = transformer
        return transformer
    }

    /**
     * @template {Parser<any>} T
     * @param {Regexer<T>} regexer
     * @return {Regexer<T>}
     */
    transform(regexer) {
        const actualParser = regexer.getParser().actualParser(this.traverse, this.opaque)
        let transformed = this.doTransform(actualParser)
        if (actualParser !== transformed) {
            transformed = regexer.getParser().withActualParser(transformed, this.traverse, this.opaque)
            // @ts-expect-error
            return new Regexer(transformed, true)
        }
        return regexer
    }

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        return parser
    }
}
