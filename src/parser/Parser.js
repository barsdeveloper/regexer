import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    /**
     * @readonly
     * @enum {Number}
     */
    static TerminalType = {
        STARTING: -1,
        ONLY: 0,
        ENDING: 1,
    }

    static isTerminal = false
    static indentation = "    "

    /** @type {Boolean?} */
    #matchesEmptyFlag

    /** @type {{[k: TerminalType]: Parser<any>[]}} */
    #starterList = {}

    /** Calling parse() can make it change the overall parsing outcome */
    isActualParser = true

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

    matchesEmpty() {
        if (this.#matchesEmptyFlag === undefined) {
            return this.#matchesEmptyFlag = this.doMatchesEmpty()
        }
        return this.#matchesEmptyFlag
    }

    /**
     * @protected
     * @returns {Boolean}
     */
    doMatchesEmpty() {
        const children = this.unwrap()
        if (children.length === 1) {
            return children[0].doMatchesEmpty()
        }
        return false
    }

    /**
     * List of starting terminal parsers
     * @param {TerminalType} type
     * @param {Parser<any>[]} additional Additional non terminal parsers that will be considered part of the starter list when encounter even though non terminals
     */
    terminalList(type, context = Reply.makeContext(null, ""), additional = []) {
        if (!this.#starterList[type]) {
            if (context.visited.has(this)) {
                return [] // Break the infinite recursion, this.#starterList[type] will be set elsewhere in the call stack
            }
            context.visited.set(this, null)
            this.#starterList[type] = this.doTerminalList(type, context, additional)
            if (additional.length) {
                this.#starterList[type] = this.#starterList[type]
                    .filter(v => !/** @type {typeof Parser} */(v.constructor).isTerminal && additional.includes(v))
            }
        }
        let result = this.#starterList[type]
        if (!/** @type {typeof Parser} */(this.constructor).isTerminal && additional.includes(this)) {
            result = [this, ...result]
        }
        return result
    }

    /**
     * @protected
     * @param {TerminalType} type
     * @param {Context} context
     */
    doTerminalList(type, context, additional = /** @type {Parser<any>[]} */([])) {
        let unwrapped = this.unwrap()
        return unwrapped?.length === 1
            ? unwrapped[0].terminalList(type, context, additional)
            : []
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        //return this.equals(context, parser, false)
    }

    /** @returns {Parser<T>[]} */
    unwrap() {
        return []
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
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
     * @param {ConstructorType<Parser<any>>[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {ConstructorType<Parser<any>>[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    actualParser(traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.find(type => this instanceof type))
            && !opaque.find(type => this instanceof type)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? unwrapped[0].actualParser(traverse, opaque) : this
    }

    /**
     * @param {Parser<any>} other
     * @param {ConstructorType<Parser<any>>[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {ConstructorType<Parser<any>>[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    withActualParser(other, traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.some(type => this instanceof type))
            && !opaque.some(type => this instanceof type)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable
            ? this.wrap(unwrapped[0].withActualParser(other, traverse, opaque))
            : other
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} rhs
     * @param {Boolean} strict
     */
    equals(context, rhs, strict) {
        let lhs = /** @type {Parser<any>} */(this)
        if (lhs === rhs) {
            return true
        }
        if (!strict) {
            lhs = this.actualParser()
            rhs = rhs.actualParser()
        }
        if (
            rhs instanceof lhs.constructor && !(lhs instanceof rhs.constructor)
            // @ts-expect-error
            || rhs.resolve && !lhs.resolve
        ) {
            // Take advantage of polymorphism or compare a lazy against a non lazy (not the other way around)
            const temp = lhs
            lhs = rhs
            rhs = temp
        }
        let memoized = context.equals.get(lhs, rhs)
        if (memoized !== undefined) {
            return memoized
        } else if (memoized === undefined) {
            context.equals.set(lhs, rhs, true)
            memoized = lhs.doEquals(context, rhs, strict)
            context.equals.set(lhs, rhs, memoized)
        }
        return memoized
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return false
    }

    toString(context = Reply.makeContext(null, ""), indent = 0) {
        if (context.visited.has(this)) {
            return "<...>" // Recursive parser
        }
        context.visited.set(this, null)
        return this.doToString(context, indent)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return `${this.constructor.name} does not implement toString()`
    }
}
