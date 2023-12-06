import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"
import RemoveEmptyTransformer from "./RemoveEmptyTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"
import SuccessParser from "../parser/SuccessParser.js"
import OptionalParser from "../parser/OptionalParser.js"

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
            const result = repeated.atLeast(1).chain(v =>
                v.reduceRight(
                    (acc, cur) => {
                        const p = parent.unwrap()[index].withActualParser(
                            acc[0].getParser(),
                            [OptionalParser],
                            [acc[1].getParser?.() ?? acc[1]]
                        )
                        acc[1] = acc[0]
                        acc[0] = (new R(p)).map(v => [cur, v])
                        return acc
                    },
                    [R.success(), OptionalParser]
                )[0]
            ).getParser()
            return result
        }
        return parent
    }
}
