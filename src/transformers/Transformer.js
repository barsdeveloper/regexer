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
    run(regexer) {
        const parser = regexer.getParser().actualParser(this.traverse, this.opaque)
        let transformed = this.transform(parser, new Map())
        if (parser !== transformed) {
            transformed = regexer.getParser().withActualParser(transformed, this.traverse, this.opaque)
            // @ts-expect-error
            return new Regexer(transformed, true)
        }
        return regexer
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {T} parser
     * @param {Map<Parser<any>, Parser<any>>} visited
     * @return {T}
     */
    transform(parser, visited) {
        let result = /** @type {T} */(visited.get(parser))
        if (result) {
            return result
        }
        visited.set(parser, parser)
        result = this.doTransform(parser, visited)
        visited.set(parser, result)
        return result
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {T} parser
     * @param {Map<Parser<any>, Parser<any>>} visited
     * @return {T}
     */
    doTransform(parser, visited) {
        return parser
    }
}
