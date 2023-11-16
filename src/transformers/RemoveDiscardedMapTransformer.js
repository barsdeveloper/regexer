import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"

/** @extends {ParentChildTransformer<[LookaroundParser, MapParser], [LookaroundParser, MapParser]>} */
export default class RemoveDiscardedMapTransformer extends ParentChildTransformer {

    constructor() {
        super([LookaroundParser, MapParser], [LookaroundParser, MapParser])
    }

    /**
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @returns {Parser<any>}
     */
    doTransformParent(parent, child) {
        if (parent instanceof MapParser && child instanceof LookaroundParser) {
            return parent.parser.withActualParser(child, this.traverse, this.opaque)
        }
    }

    /**
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @returns {Parser<any>[]}
     */
    doTransformChild(parent, child) {
        if (parent instanceof LookaroundParser && child instanceof MapParser) {
            return [child.parser]
        }
    }
}
