import Regexer from "../Regexer.js"

export default class Transformer {

    #next = null

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
        const actualParser = regexer.getParser().actualParser(true)
        let transformed = this.doTransform(actualParser)
        if (actualParser !== transformed) {
            transformed = regexer.getParser().withActualParser(transformed)
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
