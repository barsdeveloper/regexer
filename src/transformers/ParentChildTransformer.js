import Parser from "../parser/Parser.js"
import Transformer from "./Transformer.js"

/**
 * @template {Parser<any>[]} ParentTypes
 * @template {Parser<any>[]} ChildTypes
 */
export default class ParentChildTransformer extends Transformer {

    /** @type {ConstructorType<Parser<any>>[]} */
    #parentTypes
    /** @type {ConstructorType<Parser<any>>[]} */
    #childTypes
    static replaceBothChildren = false

    /**
     * @param {ConstructorsFromArrayTypes<ParentTypes>} parentTypes
     * @param {ConstructorsFromArrayTypes<ChildTypes>} childTypes
     */
    constructor(parentTypes, childTypes = /** @type {ConstructorsFromArrayTypes<ChildTypes>} */([])) {
        super()
        this.#parentTypes = parentTypes
        this.#childTypes = childTypes
        this.opaque = [...new Set([...this.opaque, ...this.#parentTypes, ...this.#childTypes])]
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {T} parser
     * @param {Map<Parser<any>, Parser<any>>} visited
     * @return {T}
     */
    doTransform(parser, visited) {
        const Self = /** @type {typeof ParentChildTransformer} */(this.constructor)
        let changed = false
        let children = parser.unwrap()
        if (this.#parentTypes.find(t => parser instanceof t)) {
            let previous = null
            let current = previous
            if (this.#childTypes.length === 0) {
                const newParent = this.doTransformParent(parser, null, -1, null)
                if (newParent && newParent != parser) {
                    return /** @type {T} */(this.transform(newParent, visited))
                }
            } else {
                for (let i = 0; i < children.length; previous = current, ++i) {
                    current = children[i].actualParser(this.traverse, this.opaque)
                    if (this.#childTypes.find(t => current instanceof t)) {
                        const newParent = this.doTransformParent(parser, current, i, previous)
                        if (newParent && newParent != parser) {
                            return /** @type {T} */(this.transform(newParent, visited))
                        }
                        const newChildren = this.doTransformChild(parser, current, i, previous)
                        if (newChildren && (newChildren.length !== 1 || newChildren[0] !== current)) {
                            const offset = Self.replaceBothChildren ? 1 : 0
                            current = newChildren[0]
                            children.splice(
                                i - offset,
                                offset + 1,
                                ...newChildren.map(c => children[i].withActualParser(c, this.traverse, this.opaque))
                            )
                            changed = true
                            i -= 1
                            continue
                        }
                    }
                    const transformed = this.transform(current, visited)
                    if (current !== transformed) {
                        children[i] = children[i].withActualParser(transformed, this.traverse, this.opaque)
                        changed = true
                    }
                }
            }
        } else {
            children = children.map(child => {
                const transformed = this.transform(child, visited)
                changed ||= child !== transformed
                return transformed
            })
        }
        if (changed) {
            return /** @type {T} */(this.transform(parser.wrap(...children), visited))
        }
        return parser
    }

    /**
     * Replace the parent parser with another parser
     * @protected
     * @param {Parser<any>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>?}
     */
    doTransformParent(parent, child, index, previousChild) {
        return null
    }

    /**
     * Replace the given child with other children
     * @protected
     * @param {Parser<any>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]?}
     */
    doTransformChild(parent, child, index, previousChild) {
        return null
    }
}
