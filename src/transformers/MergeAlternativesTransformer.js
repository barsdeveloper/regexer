import LazyParser from "../parser/LazyParser.js"
import Transformer from "./Transformer.js"

export default class MergeAlternativesTransformer extends Transformer {

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
