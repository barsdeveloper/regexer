import LazyParser from "../parser/LazyParser.js"
import Transformer from "./Transformer.js"

export default class RemoveLazyTransformer extends Transformer {

    /**
     * @protected
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser, visited = new Set()) {
        if (visited.has(this)) {
            return parser
        }
        visited.add(this)
        let changed = false
        let children = parser.unwrap()
        if (parser instanceof LazyParser) {
            return this.doTransform(children[0], visited)
        } else {
            children = children.map(child => {
                const transformed = this.doTransform(child, visited)
                changed ||= child !== transformed
                return transformed
            })
        }
        if (changed) {
            return parser.wrap(...children)
        }
        return parser
    }
}
