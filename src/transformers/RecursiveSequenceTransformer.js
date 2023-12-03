import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"
import RemoveEmptyTransformer from "./RemoveEmptyTransformer.js"
import Reply from "../Reply.js"
import SequenceParser from "../parser/SequenceParser.js"

/** @extends {ParentChildTransformer<[SequenceParser], [Parser]>} */
export default class RecursiveSequenceTransformer extends ParentChildTransformer {

    static #removeEmpty = new RemoveEmptyTransformer()
    static replaceBothChildren = true

    constructor() {
        super([SequenceParser], [Parser])
    }

    /**
     * @protected
     * @param {Context} context
     * @param {SequenceParser<Parser<any>[]>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>?}
     */
    doTransformParent(context, parent, child, index, previousChild) {
        const newContext = Reply.makeContext(null, "")
        if (
            child
                .terminalList(Parser.TerminalType.ONLY, newContext, [parent])
                .some(starter => starter.equals(newContext, parent, false))
        ) {
            if (!child.matchesEmpty()) {
                console.error(
                    "The following parser expects an infinite string\n"
                    + parent.toString(newContext)
                )
                throw new Error("The parser expects an infinite string")
            }
            const R = /** @type {new (...args: any) => Regexer<any>} */(context.regexer.constructor)
            const repeated = RecursiveSequenceTransformer.#removeEmpty.run(
                new R(parent.wrap(...parent.parsers.slice(0, index)))
            )
            return repeated.atLeast(1).getParser()
        }
        return parent
    }
}
