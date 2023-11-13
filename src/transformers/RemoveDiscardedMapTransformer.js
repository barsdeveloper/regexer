import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import StringParser from "../parser/StringParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"

/** @extends {ParentChildTransformer<[LookaroundParser, MapParser], [LookaroundParser, MapParser]>} */
export default class RemoveDiscardedMapTransformer extends ParentChildTransformer {

    constructor() {
        super([LookaroundParser, MapParser], [LookaroundParser, MapParser])
    }

    /**
     * @param {LookaroundParser | MapParser} parent
     * @param {LookaroundParser | MapParser} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parent, child) {
        return parent.withActualParser(child.unwrap(), this.traverse, this.opaque)
    }
}
