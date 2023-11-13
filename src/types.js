// @ts-nocheck

/**
 * @template Value
 * @typedef {import("./Reply.js").Result<Value>} Result
 */

/**
 * @template V
 * @typedef {import("./parser/Parser.js").default<V>} Parser
 */

/**
 * @template T
 * @typedef {new (...args: any) => T} ConstructorType
 */

/**
 * @template T
 * @typedef {import("./Regexer.js").default<T>} Regexer
 */

/**
 * @template T
 * @typedef {T extends [infer A] ? A
 *     : T extends [infer A, ...infer B] ? (A | UnionFromArray<B>)
 *     : any
 * } UnionFromArray
 **/

/**
 * @template T
 * @typedef {T extends [infer A] ? new (...args: any) => A
 *     : T extends [infer A, ...infer B] ? [new (...args: any) => A, ...ConstructorsFromArrayTypes<B>]
 *     : any
 * } ConstructorsFromArrayTypes
 **/

/**
 * @typedef {{
 *     input: String,
 *     parser: Regexer,
 * }} Context
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [infer First, ...infer Rest] ? [ParserValue<First>, ...ParserValue<Rest>]
 *     : T extends import("./parser/RegExpParser.js").default<-1> ? RegExpExecArray
 *     : T extends import("./parser/SequenceParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/StringParser.js").default<infer S> ? S
 *     : T extends import("./parser/TimesParser.js").default<infer P> ? ParserValue<P>[]
 *     : T extends import("./parser/MapParser.js").default<any, infer R> ? R
 *     : T extends import("./parser/AlternativeParser.js").default<infer P> ? UnionFromArray<ParserValue<P>>
 *     : T extends import("./parser/LazyParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/RegExpParser.js").default<any> ? String
 *     : T extends import("./parser/Parser.js").default<infer V> ? V
 *     : T extends import("./parser/LookaroundParser.js/index.js").LookaroundParser ? ""
 *     : never
 * } ParserValue
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [import("./Regexer.js").default<infer P>] ? [P]
 *     : T extends [import("./Regexer.js").default<infer P>, ...infer Rest] ? [P, ...UnwrapParser<Rest>]
 *     : T extends import("./Regexer.js").default<infer P> ? P
 *     : any
 * } UnwrapParser
 */
