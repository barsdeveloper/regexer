import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import Regexer from "../Regexer.js"
import Reply from "../Reply.js"

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
     * @param {Regexer<T> | T} g
     * @return {Regexer<T>}
     */
    run(g, context = Reply.makeContext(g instanceof Regexer ? g : undefined)) {
        const regexer = g instanceof Regexer ? g : context.regexer
        const RegexerType = /** @type {typeof Regexer} */(regexer.constructor)
        const parser = g instanceof Regexer ? g.getParser() : g
        const actualParser = parser.actualParser(this.traverse, this.opaque)
        let transformed = this.transform(context, actualParser)
        if (transformed !== parser) {
            transformed = /** @type {T} */(parser.withActualParser(transformed, this.traverse, this.opaque))
            return new RegexerType(/** @type {T} */(transformed))
        }
        return g instanceof Regexer ? g : new RegexerType(g)
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {Context} context
     * @param {T} parser
     * @return {T}
     */
    transform(context, parser) {
        let result = /** @type {T} */(context.visited.get(parser))
        if (result !== undefined) {
            return result
        }
        context.visited.set(parser, parser)
        result = this.doTransform(context, parser)
        context.visited.set(parser, result)
        return result
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {Context} context
     * @param {T} parser
     * @return {T}
     */
    doTransform(context, parser) {
        return parser
    }
}
