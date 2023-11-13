import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import TimesParser from "../parser/TimesParser.js"

/** @extends ParentChildTransformer<LookaroundParser<any>, MapParser<any>> */
export default class UselessMapTransformer extends ParentChildTransformer {

    constructor() {
        super(LookaroundParser, MapParser)
    }

    /**
     * @param {LookaroundParser<Parser<any>>} parser
     * @param {MapParser<Parser<any>>} child
     * @returns {Parser<any>}
     */
    doTransformParentChild(parser, child) {
        let result = child.unwrap()
        if (parser.parser !== child) {
            result = parser.parser.withActualParser(result)
        }
        result = new TimesParser(result, )
        return result
    }
}
