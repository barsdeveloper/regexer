import AlternativeParser from "../parser/AlternativeParser.js"
import FailureParser from "../parser/FailureParser.js"
import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import NegativeParser from "../parser/NegativeParser.js"
import SequenceParser from "../parser/SequenceParser.js"
import SuccessParser from "../parser/SuccessParser.js"
import Transformer from "./Transformer.js"

export default class DeadParserElimination extends Transformer {

    /**
     * @template T
     * @param {Parser<T>} parser
     * @return {Parser<T>}
     */
    doTransform(parser, removeMapParsers = false) {
        if (parser instanceof AlternativeParser) {
            /** @type {[Parser<any>, ...Parser<any>[]]} */
            let alternatives = parser.parsers
            const writiableAlternatives = () => alternatives === parser.parsers
                ? alternatives = [...alternatives]
                : alternatives
            for (let i = 0; i < alternatives.length; ++i) {
                let current = this.doTransform(alternatives[i].actualParser())
                if (current instanceof AlternativeParser) {
                    writiableAlternatives().splice(
                        i,
                        1,
                        ...current.parsers.map(p => alternatives[i].withActualParser(this.doTransform(p)))
                    )
                    --i
                    continue
                } else if (current instanceof SuccessParser) {
                    // After a SuccessParser no other match is possible
                    writiableAlternatives().splice(i + 1)
                } else if (current instanceof FailureParser) {
                    // FailureParser and following parsers would never match
                    writiableAlternatives().splice(i)
                    break
                } else {
                    // Check if this pattern appeared previously in the alternatives
                    for (let j = i - 1; j >= 0; --j) {
                        if (current.equals(alternatives[j], true)) {
                            writiableAlternatives().splice(i, 1)
                            --i
                            continue
                        }
                    }
                }
                if (alternatives[i] !== current) {
                    writiableAlternatives()[i] = alternatives[i].withActualParser(current)
                }
            }
            if (alternatives.length === 0) {
                return new FailureParser()
            }
            if (alternatives.length === 1) {
                return alternatives[0]
            }
            if (alternatives === parser.parsers) {
                return parser
            }
            return new AlternativeParser(...alternatives)
        }

        if (parser instanceof MapParser && removeMapParsers) {
            return this.doTransform(parser.parser, true)
        }

        if (parser instanceof NegativeParser) {
            /** @type {Parser<any>} */
            let immediate = parser.parser
            let actual = immediate.actualParser()
            const collect = result => actual !== immediate
                ? immediate.withActualParser(result)
                : result

            if (actual instanceof NegativeParser) {
                return this.doTransform(actual.parser, true)
            }

            if (actual instanceof SuccessParser) {
                return collect(new FailureParser())
            }

            if (actual instanceof FailureParser) {
                return collect(new SuccessParser(""))
            }

            if (actual instanceof LookaroundParser) {
                const create = type => collect(new LookaroundParser(
                    // @ts-expect-error
                    this.doTransform(actual.parser, true),
                    type
                ))
                switch (actual.type) {
                    case LookaroundParser.Type.NEGATIVE_AHEAD:
                        return create(LookaroundParser.Type.POSITIVE_AHEAD)
                    case LookaroundParser.Type.NEGATIVE_BEHIND:
                        return create(LookaroundParser.Type.POSITIVE_BEHIND)
                    case LookaroundParser.Type.POSITIVE_AHEAD:
                        return create(LookaroundParser.Type.NEGATIVE_AHEAD)
                    case LookaroundParser.Type.POSITIVE_BEHIND:
                        return create(LookaroundParser.Type.NEGATIVE_BEHIND)
                }
            }
        }

        if (parser instanceof SequenceParser) {
        }

        return parser
    }
}
