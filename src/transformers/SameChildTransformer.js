import Transformer from "./Transformer.js"

/**
 * @template {Parser<any>} ParentT
 * @template {Parser<any>} ChildT
 */
export default class ParentChildTransformer extends Transformer {

    #parentType
    #childType

    /**
     * @param {new (...args: any) => ParentT} parentType
     * @param {new (...args: any) => ChildT} childType
     */
    constructor(parentType, childType) {
        super()
        this.#parentType = parentType
        this.#childType = childType
    }

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        if (parser instanceof this.#parentType) {
            const child = parser.unwrap().actualParser(true)
            if (child instanceof this.#childType) {
                let replacement = this.doTransformParentChild(parser, child)
                return replacement
            }
        }
        return parser
    }

    /**
     * @param {ParentT} parser
     * @param {ChildT} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parser, child) {
        return parser
    }
}
