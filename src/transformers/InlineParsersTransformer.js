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
        const type = parser instanceof AlternativeParser
            ? AlternativeParser
            : parser instanceof SequenceParser
                ? SequenceParser
                : InlineParsersTransformer.#None
        if (parser instanceof type) {
            /** @type {[Parser<any>, ...Parser<any>[]]} */
            let children = parser.parsers
            const writableChildren = () => children === parser.parsers
                ? children = [...children]
                : children
            for (let i = 0; i < children.length; ++i) {
                let current = children[i].actualParser([CapturingGroupParser])
                if (current instanceof type) {
                    writableChildren().splice(
                        i,
                        1,
                        ...current.parsers.map(p => children[i].withActualParser(p, [CapturingGroupParser]))
                    )
                    --i
                    continue
                }
                current = this.doTransform(current)
                if (children[i] != current) {
                    writableChildren()[i] = children[i].withActualParser(current, [CapturingGroupParser])
                }
            }
            if (children !== parser.parsers) {
                // @ts-expect-error
                return new type(...children)
            }
            return parser
        }
        const unwrapped = parser.unwrap()
        if (unwrapped) {
            const transformed = this.doTransform(unwrapped)
            if (transformed !== unwrapped) {
                return parser.wrap(transformed)
            }
        }
        return parser
    }
}
