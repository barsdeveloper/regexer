import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"

/** @extends ParentChildTransformer<LookaroundParser<Parser<any>>, MapParser<Parser<any>>> */
export default class RemoveDiscardedMapTransformer extends ParentChildTransformer {

    constructor() {
        super(LookaroundParser, MapParser)
    }

    /**
     * @param {LookaroundParser<Parser<any>>} parent
     * @param {MapParser<Parser<any>>} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parent, child) {
        return parent.withActualParser(child.unwrap(), this.traverse, this.opaque)
    }
}
