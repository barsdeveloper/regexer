import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"
import RemoveEmptyTransformer from "./RemoveEmptyTransformer.js"
import Reply from "../Reply.js"
import SequenceParser from "../parser/SequenceParser.js"
import TimesParser from "../parser/TimesParser.js"

/** @extends {ParentChildTransformer<[SequenceParser], [Parser]>} */
export default class RecursiveSequenceTransformer extends ParentChildTransformer {

    static #removeEmpty = new RemoveEmptyTransformer()
    static replaceBothChildren = true

    constructor() {
        super([SequenceParser], [Parser])
    }

    /**
     * @protected
     * @param {SequenceParser<Parser<any>[]>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>?}
     */
    doTransformParent(parent, child, index, previousChild) {
        const context = Reply.makeContext(null, "")
        if (
            child
                .terminalList(Parser.TerminalType.ONLY, context, [parent])
                .some(starter => starter.equals(context, parent, false))
        ) {
            if (!child.matchesEmpty()) {
                console.error(
                    "The following parser expects an infinite string\n"
                    + parent.toString(context)
                )
                throw new Error("The parser expects an infinite string")
            }
            const repeated = RecursiveSequenceTransformer.#removeEmpty.run(
                parent.wrap(...parent.parsers.slice(0, index))
            )
            return new TimesParser(repeated, 1)
        }
        return parent
    }
}
