import Parser, { ArgumentParserResult } from '../types/Parser'
import StringReader from '../utils/StringReader'
import Config from '../types/Config'

/**
 * Base class of argument parsers.
 */
export default abstract class ArgumentParser<T> implements Parser<T> {
    /**
     * Identity of the parser.
     */
    abstract readonly identity: string

    /**
     * Parse.
     * @param reader Input reader.
     * @param parsedArgs All parsed data of args before this argument.
     */
    abstract parse(reader: StringReader, parsedArgs?: unknown[], config?: Config): ArgumentParserResult<T>

    /**
     * Default implements to return something like `<id: string>`
     */
    toHint(name: string, optional: boolean): string {
        const prefix = optional ? '[' : '<'
        const suffix = optional ? ']' : '>'
        return `${prefix}${name}: ${this.identity}${suffix}`
    }

    /**
     * Get examples of this argument.
     * 
     * @example
     * return ['true', 'false']
     */
    abstract getExamples(): string[]
}