import Transformer from "./Transformer.js"

/**
 * @template {[Parser<any>, ...Parser<any>[]]} ParentTypes
 * @template {[Parser<any>, ...Parser<any>[]]} ChildTypes
 */
export default class ParentChildTransformer extends Transformer {

    #parentTypes
    #childTypes

    /**
     * @param {ConstructorsFromArrayTypes<ParentTypes>} parentTypes
     * @param {ConstructorsFromArrayTypes<ChildTypes>} childTypes
     */
    constructor(parentTypes, childTypes) {
        super()
        this.#parentTypes = parentTypes
        this.#childTypes = childTypes
        this.opaque = [...this.opaque, ...this.#parentTypes, ...this.#childTypes]
    }

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        let unwrapped = parser.unwrap()
        if (this.#parentTypes.find(t => parser instanceof t)) {
            const child = parser.unwrap().actualParser(this.traverse, this.opaque)
            if (this.#childTypes.find(t => child instanceof t)) {
                let replacement = this.doTransformParentChild(
                    /** @type {UnionFromArray<ParentTypes>} */(parser),
                    /** @type {UnionFromArray<ChildTypes>} */(child)
                )
                return replacement
            }
            unwrapped = child.unwrap()
        }
        if (unwrapped) {
            const transformed = this.doTransform(unwrapped)
            if (transformed !== unwrapped) {
                return parser.wrap(transformed)
            }
        }
        return parser
    }

    /**
     * @param {UnionFromArray<ParentTypes>} parent
     * @param {UnionFromArray<ChildTypes>} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parent, child) {
        return parent
    }
}
