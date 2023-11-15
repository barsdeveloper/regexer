/** @template T */
export default class Parser {

    static indentation = "    "

    /** Calling parse() can make it change the overall parsing outcome */
    static isActualParser = true

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

    /** @returns {Parser<T>[]} */
    unwrap() {
        return []
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {Parser<any>}
     */
    wrap(...parsers) {
        return null
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<T>}
     */
    parse(context, position) {
        return null
    }

    /**
     * @param {(new (...args: any) => Parser<any>)[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {(new (...args: any) => Parser<any>)[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    actualParser(traverse = [], opaque = []) {
        const self = /** @type {typeof Parser<any>} */(this.constructor)
        let isTraversable = (!self.isActualParser || traverse.find(type => this instanceof type))
            && !opaque.find(type => this instanceof type)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? unwrapped[0].actualParser(traverse, opaque) : this
    }

    /**
     * @param {Parser<any>} other
     * @param {(new (...args: any) => Parser<any>)[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {(new (...args: any) => Parser<any>)[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    withActualParser(other, traverse = [], opaque = []) {
        const self = /** @type {typeof Parser<any>} */(this.constructor)
        let isTraversable = (!self.isActualParser || traverse.some(type => this instanceof type))
            && !opaque.some(type => this instanceof type)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable
            ? this.wrap(unwrapped[0].withActualParser(other, traverse, opaque))
            : other
    }

    /**
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    equals(other, strict) {
        return strict ? this.actualParser() === other.actualParser() : this === other
    }

    toString(indent = 0) {
        return `${this.constructor.name} does not implement toString()`
    }
}
