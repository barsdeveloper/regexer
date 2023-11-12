/** @template Value */
export default class Parser {

    static indentation = "    "

    /**
     * @param {Result<any>} a
     * @param {Result<any>} b
     */
    static mergeResults(a, b) {
        if (!b) {
            return a
        }
        return /** @type {typeof a} */({
            status: a.status,
            position: a.position,
            value: a.value,
        })
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        return this.equals(parser, false)
    }

    /** @returns {Parser<Value>} */
    unwrap() {
        return null
    }

    canStartWith() {

    }

    /**
     * @template {Parser<any>} T
     * @param {T} parser
     * @returns {Parser<Value>}
     */
    wrap(parser) {
        throw new Error("Not implemented")
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<Value>}
     */
    parse(context, position) {
        return null
    }

    /** @returns {Parser<any>} */
    actualParser(ignoreGroup = false) {
        return this
    }

    /** @returns {Parser<any>} */
    withActualParser(other) {
        return other
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        return strict ? this.actualParser() === other.actualParser() : this === other
    }

    toString(indent) {
        return `${this.constructor.name} does not implement toString()`
    }
}
