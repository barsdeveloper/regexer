import AlternativeParser from "../parser/AlternativeParser.js"
import FailureParser from "../parser/FailureParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"
import SuccessParser from "../parser/SuccessParser.js"

/** @extends {ParentChildTransformer<[AlternativeParser, SequenceParser], [SuccessParser, FailureParser]>} */
export default class RemoveTrivialParsersTransformer extends ParentChildTransformer {

    constructor() {
        super([AlternativeParser, SequenceParser], [SuccessParser, FailureParser])
    }

    /**
     * @protected
     * @param {AlternativeParser<Parser<any>[]> | SequenceParser<Parser<any>[]>} parent
     * @param {SuccessParser | FailureParser} child
     * @param {Number} index
     * @returns {Parser<any>?}
     */
    doTransformParent(parent, child, index) {
        if (parent instanceof AlternativeParser && child instanceof SuccessParser) {
            return parent.wrap(...parent.parsers.slice(0, index))
        }
        if (
            parent instanceof AlternativeParser && child instanceof FailureParser
            || parent instanceof SequenceParser && child instanceof SuccessParser
        ) {
            const children = parent.unwrap()
            children.splice(index, 1)
            return parent.wrap(...children)
        }
        if (parent instanceof SequenceParser && child instanceof FailureParser) {
            return new FailureParser()
        }
    }

    /**
     * @protected
     * @param {AlternativeParser<Parser<any>[]> | SequenceParser<Parser<any>[]>} parent
     * @param {SuccessParser | FailureParser} child
     * @param {Number} index
     * @returns {Parser<any>[]}
     */
    doTransformChild(parent, child, index) {
        if (parent instanceof AlternativeParser && child instanceof FailureParser) {
            return []
        }
        if (parent instanceof SequenceParser && child instanceof SuccessParser) {
            return []
        }
    }

}
