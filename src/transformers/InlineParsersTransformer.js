import AlternativeParser from "../parser/AlternativeParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"

/** @extends {ParentChildTransformer<[AlternativeParser, SequenceParser], [AlternativeParser, SequenceParser]>} */
export default class InlineParsersTransformer extends ParentChildTransformer {

    constructor() {
        super([AlternativeParser, SequenceParser], [AlternativeParser, SequenceParser])
    }

    /**
     * @protected
     * @param {AlternativeParser<Parser<any>[]> | SequenceParser<Parser<any>[]>} parent
     * @param {AlternativeParser<Parser<any>[]> | SequenceParser<Parser<any>[]>} child
     * @param {Number} index
     * @returns {Parser<any>[]}
     */
    doTransformChild(parent, child, index) {
        return parent instanceof AlternativeParser && child instanceof AlternativeParser
            || parent instanceof SequenceParser && child instanceof SequenceParser
            ? child.unwrap()
            : null
    }

}
