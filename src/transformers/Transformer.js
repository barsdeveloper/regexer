import Regexer from "../Regexer.js"

export default class Transformer {

    /**
     * @template {Parser<any>} T
     * @param {Regexer<T>} regexer
     * @return {Regexer<T>}
     */
    transform(regexer) {
        const parser = regexer.getParser()
        const actualParser = parser.actualParser()
        let transformed = this.doTransform(actualParser)
        if (actualParser !== parser) {
            transformed = parser.withActualParser(transformed)
        }
        // @ts-expect-error
        return transformed !== regexer.getParser() ? new Regexer(transformed, true) : regexer
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
