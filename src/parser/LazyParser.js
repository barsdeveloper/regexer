import Parser from "./Parser.js"

/**
 * @template {Parser<any>} P
 * @extends Parser<ParserValue<P>>
 */
export default class LazyParser extends Parser {

    #parser
    static isActualParser = false

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

    unwrap() {
        return this.resolve()
    }

    wrap(parser) {
        const regexerConstructor = /** @type {new (...args: any) => Regexer<P>} */(this.#parser().constructor)
        return new LazyParser(() => new regexerConstructor(parser))
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
        if (other instanceof LazyParser && this.#parser === other.#parser) {
            return true
        }
        this.resolve()
        if (!strict) {
            other = other.actualParser()
        } else if (other instanceof LazyParser) {
            other = other.resolve()
        }
        return this.#resolvedPraser === other || this.#resolvedPraser.equals(other, strict)
    }

    toString(indent = 0) {
        return this.resolve().toString(indent)
    }
}
