import LazyParser from "../parser/LazyParser.js"
import Transformer from "./Transformer.js"

export default class RemoveLazyTransformer extends Transformer {

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {T} parser
     * @param {Map<Parser<any>, Parser<any>>} visited
     * @return {T}
     */
    doTransform(parser, visited) {
        let changed = false
        let children = parser.unwrap()
        if (parser instanceof LazyParser) {
            return /** @type {T} */(this.transform(children[0], visited))
        } else {
            children = children.map(child => {
                const transformed = this.transform(child, visited)
                changed ||= child !== transformed
                return transformed
            })
        }
        if (changed) {
            return /** @type {T} */(parser.wrap(...children))
        }
        return parser
    }
}
