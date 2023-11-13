import AlternativeParser from "../parser/AlternativeParser.js"
import Transformer from "./Transformer.js"

export default class AlternativesMergeTransformer extends Transformer {

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        if (parser instanceof AlternativeParser) {
            /** @type {[Parser<any>, ...Parser<any>[]]} */
            let children = parser.parsers
            const writableChildren = () => children === parser.parsers
                ? children = [...children]
                : children
            for (let i = 0; i < children.length; ++i) {
                for (let j = i + 1; j < children.length; ++j) {

                }
            }
        }
        return parser
    }
}
