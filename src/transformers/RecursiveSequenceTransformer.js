import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"
import RemoveEmptyTransformer from "./RemoveEmptyTransformer.js"
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
        if (
            child.matchesEmpty()
            && parent.terminalList(Parser.TerminalType.ENDING, [child])[0] === child
            && child.terminalList(Parser.TerminalType.ONLY, [parent])[0] === parent
        ) {
            const R = /** @type {new (...args: any) => Regexer<any>} */(context.regexer.constructor)
            const repeated = new R(parent.wrap(...parent.parsers.slice(0, index)))
            return repeated.atLeast(1).getParser()
        }
        return parent
    }
}
