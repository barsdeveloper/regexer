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
                    const newParent = this.doTransformParent(
                        /** @type {UnionFromArray<ParentTypes>} */(parser),
                        /** @type {UnionFromArray<ChildTypes>} */(current)
                    )
                    if (newParent) {
                        return this.doTransform(newParent)
                    }
                    const newChildren = this.doTransformChild(
                        /** @type {UnionFromArray<ParentTypes>} */(parser),
                        /** @type {UnionFromArray<ChildTypes>} */(current)
                    )
                    if (newChildren) {
                        children.splice(
                            i,
                            1,
                            ...newChildren.map(c => children[i].withActualParser(c, this.traverse, this.opaque))
                        )
                        changed = true
                        --i
                        continue
                    }
                }
                const transformed = this.doTransform(current)
                if (current !== transformed) {
                    children[i] = children[i].withActualParser(transformed, this.traverse, this.opaque)
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

    /**
     * @param {UnionFromArray<ParentTypes>} parent
     * @param {UnionFromArray<ChildTypes>} child
     * @returns {Parser<any>?}
     */
    doTransformParent(parent, child) {
        return null
    }

    /**
     * @param {UnionFromArray<ParentTypes>} parent
     * @param {UnionFromArray<ChildTypes>} child
     * @returns {Parser<any>[]?}
     */
    doTransformChild(parent, child) {
        return null
    }
}
