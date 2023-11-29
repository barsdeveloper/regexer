import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import Regexer from "../Regexer.js"

export default class Transformer {

    #next = null

    /** @type {ConstructorType<Parser<any>>[]} */
    traverse = [CapturingGroupParser]

    /** @type {ConstructorType<Parser<any>>[]} */
    opaque = []

    constructor() {
    }

    chain(transformer) {
        this.#next = transformer
        return transformer
    }

    /**
     * @template {Parser<any>} T
     * @param {T} regexer
     * @return {T}
     */
    run(regexer) {
        const parser = regexer.actualParser(this.traverse, this.opaque)
        let transformed = this.transform(parser, new Map())
        if (parser !== transformed) {
            transformed = regexer.withActualParser(transformed, this.traverse, this.opaque)
            return /** @type {T} */(transformed)
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
