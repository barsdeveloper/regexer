import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"

/** @extends {ParentChildTransformer<[LookaroundParser, MapParser], [LookaroundParser, MapParser]>} */
export default class RemoveDiscardedMapTransformer extends ParentChildTransformer {

    constructor() {
        super([LookaroundParser, MapParser], [LookaroundParser, MapParser])
    }

    /**
     * @protected
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @param {Number} index
     * @returns {Parser<any>}
     */
    doTransformParent(parent, child, index) {
        if (parent instanceof MapParser && child instanceof LookaroundParser) {
            return parent.parser.withActualParser(child, this.traverse, this.opaque)
        }
        return parent
    }

    /**
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @param {Number} index
     * @returns {Parser<any>[]}
     */
    doTransformChild(parent, child, index) {
        if (parent instanceof LookaroundParser && child instanceof MapParser) {
            return [child.parser]
        }
        return [child]
    }
}
