import Parser from "./Parser.js"

/**
 * @template {Parser<any>} P
 * @template R
 * @extends Parser<R>
 */
export default class MapParser extends Parser {

    static isActualParser = false

    #parser
    get parser() {
        return this.#parser
    }

    #mapper
    get mapper() {
        return this.#mapper
    }

    /**
     * @param {P} parser
     * @param {(v: ParserValue<P>) => R} mapper
     */
    constructor(parser, mapper) {
        super()
        this.#parser = parser
        this.#mapper = mapper
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new MapParser(parsers[0], this.#mapper)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<R>}
     */
    parse(context, position) {
        const result = this.#parser.parse(context, position)
        if (result.status) {
            result.value = this.#mapper(result.value)
        }
        return result
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        let self = /** @type {Parser<any>} */(this)
        if (!strict) {
            other = other.actualParser()
        }
        return this === other || (
            strict
                ? other instanceof MapParser
                && this.#mapper === other.#mapper
                && this.#parser.equals(other.#parser, strict)
                : this.actualParser().equals(other, strict)
        )
    }

    toString(indent = 0) {
        let serializedMapper = this.#mapper.toString()
        if (serializedMapper.length > 80 || serializedMapper.includes("\n")) {
            serializedMapper = "( ... ) => { ... }"
        }
        return this.#parser.toString(indent) + ` -> map<${serializedMapper}>`
    }
}
