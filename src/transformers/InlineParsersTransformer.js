import AlternativeParser from "../parser/AlternativeParser.js"
import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import SequenceParser from "../parser/SequenceParser.js"
import Transformer from "./Transformer.js"

export default class InlineParsersTransformer extends Transformer {

    static #None = class { }

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        /**
         * @type {(new (...args: any) => AlternativeParser<[Parser<any>, ...Parser<any>[]]>)
         *     | (new (...args: any) => SequenceParser<[Parser<any>, ...Parser<any>[]]>)}
         */
        const type = parser instanceof AlternativeParser ? AlternativeParser : SequenceParser
        let changed = false
        /** @type {Parser<any>[]} */
        let children = parser.unwrap()
        if (parser instanceof type) {
            for (let i = 0; i < children.length; ++i) {
                let current = children[i].actualParser([CapturingGroupParser])
                if (current instanceof type) {
                    children.splice(
                        i,
                        1,
                        ...current.parsers.map(p => children[i].withActualParser(p, [CapturingGroupParser]))
                    )
                    changed = true
                    --i
                    continue
                }
                const transformed = this.doTransform(current)
                if (current != transformed) {
                    children[i] = children[i].withActualParser(transformed, [CapturingGroupParser])
                    changed = true
                }
            }
        } else {
            children = children.map(child => {
                const transformed = this.doTransform(child)
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
