import Parser from "./Parser.js"

/**
 * @template {Parser<any>} P
 * @extends Parser<ParserValue<P>>
 */
export default class LazyParser extends Parser {

    #parser

    /** @type {P} */
    #resolvedPraser

    /** @param {() => Regexer<P>} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser()
        }
        return this.#resolvedPraser
    }

    actualParser() {
        return this.resolve().actualParser()
    }


    /** @returns {Parser<any>} */
    withActualParser(other) {
        const regexerConstructor = this.#parser().constructor
        // @ts-expect-error
        return new LazyParser(() => new regexerConstructor(this.#resolvedPraser.withActualParser(other)))
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        this.resolve()
        return this.#resolvedPraser.parse(context, position)
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        this.resolve()
        return this.#resolvedPraser.equals(other, strict)
    }

    toString(indent = 0) {
        return this.resolve().toString(indent)
    }
}
