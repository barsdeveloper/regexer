import ParentChildTransformer from "./ParentChildTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"
import StringParser from "../parser/StringParser.js"

/** @extends {ParentChildTransformer<[SequenceParser], [StringParser]>} */
export default class MergeStringsTransformer extends ParentChildTransformer {

    static replaceBothChildren = true

    constructor() {
        super([SequenceParser], [StringParser])
    }

    /**
     * @protected
     * @param {Parser<any>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]?}
     */
    doTransformChild(parent, child, index, previousChild) {
        if (previousChild instanceof StringParser && child instanceof StringParser) {
            return [new StringParser(previousChild.value + child.value)]
        }
    }
}
