import AlternativeParser from "../parser/AlternativeParser.js"
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
        const parentTerminalList = parent.terminalList(Parser.TerminalType.ENDING, [child])
        const childTerminalList = child.terminalList(Parser.TerminalType.ONLY, [parent])
        if (parentTerminalList[0] === child && childTerminalList.includes(parent)) {
            const R = /** @type {new (p: Parser<any>) => Regexer<typeof p>} */(context.regexer.constructor)
            const asR = p => new R(p)
            const repeated = asR(parent.wrap(...parent.parsers.slice(0, index)))
            const result = repeated.atLeast(1).chain(v =>
                asR(v.reduceRight(
                    (acc, cur) => {
                        const p = parent.unwrap()[index].withActualParser(
                            acc,
                            [AlternativeParser],
                            [parent],
                            parent
                        )
                        return (new R(p)).map(v => [cur, v]).getParser()
                    },
                    null // null as the first argument of withActualParser will produce an AlternativeParser without the parent alternative (last argument)
                ))
            ).getParser()
            return result
        }
        return parent
    }
}
