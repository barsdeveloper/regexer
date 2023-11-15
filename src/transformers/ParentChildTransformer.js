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
        this.opaque = [...new Set([...this.opaque, ...this.#parentTypes, ...this.#childTypes])]
    }

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser) {
        let changed = false
        let children = parser.unwrap()
        if (this.#parentTypes.find(t => parser instanceof t)) {
            for (let i = 0; i < children.length; ++i) {
                const current = children[i].actualParser(this.traverse, this.opaque)
                if (this.#childTypes.find(t => current instanceof t)) {
                    const replacement = this.doTransformParentChild(
                    /** @type {UnionFromArray<ParentTypes>} */(parser),
                    /** @type {UnionFromArray<ChildTypes>} */(current)
                    )
                    if (replacement !== parser) {
                        return this.doTransform(replacement)
                    }
                } else {
                    const transformed = this.doTransform(current)
                    if (children[i] !== transformed) {
                        children[i] = children[i].withActualParser(transformed, this.traverse, this.opaque)
                        changed = true
                    }
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

    /**
     * @param {UnionFromArray<ParentTypes>} parent
     * @param {UnionFromArray<ChildTypes>} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parent, child) {
        return parent
    }
}
