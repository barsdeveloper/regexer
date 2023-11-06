import Parser from "../src/parser/Parser.js"
import Regexer from "../src/Regexer.js"

const R = Regexer

export default class JsonGrammar {

    static #null = R.string("null").map(() => null)
    static #true = R.string("true").map(() => true)
    static #false = R.string("false").map(() => false)
    static #string = R.doubleQuotedString
    static #number = R.numberExponential.map(v => Number(v))
    /** @type {Regexer<Parser<any[]>>} */
    static #array = R.seq(
        R.regexp(/\[\s*/),
        R.lazy(() => this.json).sepBy(R.regexp(/\s*,\s*/)),
        R.regexp(/\s*\]/)
    ).map(([_0, values, _2]) => values)
    /** @type {Regexer<Parser<Object>>} */
    static #object = R.seq(
        R.regexp(/\{\s*/),
        R.seq(
            this.#string,
            R.regexp(/\s*:\s*/),
            R.lazy(() => this.json),
        )
            .map(([k, _1, v]) => ({ [k]: v }))
            .sepBy(R.regexp(/\s*,\s*/))
            .map(v => v.reduce((acc, cur) => ({ ...acc, ...cur }), ({}))),
        R.regexp(/\s*}/)
    ).map(([_0, object, _2]) => object)

    static json = R.alt(
        this.#string,
        this.#number,
        this.#object,
        this.#array,
        this.#true,
        this.#false,
        this.#null,
    )

}
