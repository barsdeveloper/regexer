import AlternativeParser from "../parser/AlternativeParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"

/** @extends {ParentChildTransformer<[AlternativeParser], [Parser]>} */
export default class RemoveEmptyTransformer extends ParentChildTransformer {

    constructor() {
        super([AlternativeParser], [Parser])
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]?}
     */
    doTransformChild(context, parent, child, index, previousChild) {
        if (!parent.matchesEmpty() && child.matchesEmpty()) {
            return []
        }
    }
}
