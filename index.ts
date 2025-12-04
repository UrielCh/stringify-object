type Key = string | symbol | number;

export type TransformFunction = (input: unknown, key: Key, value: string) => string;
export type FilterFunction = (input: unknown, key: string | symbol) => boolean;

export interface StringifyOptions {
	indent?: string;
	singleQuotes?: boolean;
	inlineCharacterLimit?: number;
	transform?: TransformFunction;
	filter?: FilterFunction;
}

const CHARACTER_ESCAPES: Record<string, string> = {
	'\n': String.raw`\n`,
	'\r': String.raw`\r`,
	'\t': String.raw`\t`,
	'\b': String.raw`\b`,
	'\f': String.raw`\f`,
	'\v': String.raw`\v`,
	'\0': String.raw`\0`,
};

// Copied from node_modules/is-regexp
function isRegexp(value: unknown): value is RegExp {
	const {toString} = Object.prototype;
	return toString.call(value) === '[object RegExp]';
}

// Copied from node_modules/is-obj
function isObject(value: unknown): value is object {
	const type = typeof value;
	return value !== null && (type === 'object' || type === 'function');
}

// Copied from node_modules/get-own-enumerable-keys
function getOwnEnumerableKeys(object: object): Array<string | symbol> {
	const {propertyIsEnumerable} = Object.prototype;
	return [
		...Object.keys(object),
		...Object.getOwnPropertySymbols(object).filter(key => propertyIsEnumerable.call(object, key)),
	];
}

// Copied from node_modules/reserved-identifiers and identifier-regex
function reservedIdentifiers({includeGlobalProperties = false}: {includeGlobalProperties?: boolean} = {}) {
	const identifiers = [
		'await',
		'break',
		'case',
		'catch',
		'class',
		'const',
		'continue',
		'debugger',
		'default',
		'delete',
		'do',
		'else',
		'enum',
		'export',
		'extends',
		'false',
		'finally',
		'for',
		'function',
		'if',
		'import',
		'in',
		'instanceof',
		'new',
		'null',
		'return',
		'super',
		'switch',
		'this',
		'throw',
		'true',
		'try',
		'typeof',
		'var',
		'void',
		'while',
		'with',
		'yield',
		'implements',
		'interface',
		'let',
		'package',
		'private',
		'protected',
		'public',
		'static',
		'arguments',
		'eval',
	];

	const globalProperties = [
		'globalThis',
		'Infinity',
		'NaN',
		'undefined',
	];

	return new Set([
		...identifiers,
		...(includeGlobalProperties ? globalProperties : []),
	]);
}

function identifierRegex({exact = true}: {exact?: boolean} = {}) {
	const baseRegex = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*/u;
	const basePattern = `(?<![@#$_\\p{ID_Continue}\\p{ID_Start}])(?!(?:${[...reservedIdentifiers({includeGlobalProperties: true})].join('|')})(?![$_\\p{ID_Continue}]))${baseRegex.source}`;
	const regex = new RegExp(basePattern, 'u');
	const regexExact = new RegExp(`^${basePattern}$`, 'u');
	return exact ? regexExact : regex;
}

// Adapted from node_modules/is-identifier but using the copied regex directly.
function isIdentifier(value: unknown): value is string {
	if (typeof value !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof value}\`.`);
	}

	if (value.length > 100_000) {
		return false;
	}

	return identifierRegex().test(value);
}

export default function stringifyObject(input: unknown, options: StringifyOptions = {}, pad = ''): string {
	const seen: unknown[] = [];

	const stringify = (value: unknown, localOptions: StringifyOptions = {}, padding = ''): string => {
		const indent = localOptions.indent || '\t';

		let tokens: {newline: string; newlineOrSpace: string; pad: string; indent: string};
		if (localOptions.inlineCharacterLimit === undefined) {
			tokens = {
				newline: '\n',
				newlineOrSpace: '\n',
				pad: padding,
				indent: padding + indent,
			};
		} else {
			tokens = {
				newline: '@@__STRINGIFY_OBJECT_NEW_LINE__@@',
				newlineOrSpace: '@@__STRINGIFY_OBJECT_NEW_LINE_OR_SPACE__@@',
				pad: '@@__STRINGIFY_OBJECT_PAD__@@',
				indent: '@@__STRINGIFY_OBJECT_INDENT__@@',
			};
		}

		const expandWhiteSpace = (text: string) => {
			if (localOptions.inlineCharacterLimit === undefined) {
				return text;
			}

			const oneLined = text
				.replaceAll(tokens.newline, '')
				.replaceAll(tokens.newlineOrSpace, ' ')
				.replaceAll(tokens.pad, '')
				.replaceAll(tokens.indent, '');

			if (oneLined.length <= localOptions.inlineCharacterLimit) {
				return oneLined;
			}

			return text
				.replaceAll(tokens.newline, '\n')
				.replaceAll(tokens.newlineOrSpace, '\n')
				.replaceAll(tokens.pad, padding)
				.replaceAll(tokens.indent, padding + indent);
		};

		if (seen.includes(value)) {
			return '"[Circular]"';
		}

		const type = typeof value;

		if (
			value === null
			|| value === undefined
			|| type === 'number'
			|| type === 'boolean'
			|| type === 'function'
			|| isRegexp(value)
		) {
			return String(value);
		}

		if (type === 'bigint') {
			return `${String(value)}n`;
		}

		if (type === 'symbol') {
			const symbolValue = value as symbol;
			const {description} = symbolValue;

			if (description === undefined) {
				return 'Symbol()';
			}

			if (description?.startsWith('Symbol.')) {
				const wellKnown = (Symbol as unknown as Record<string, symbol | undefined>)[description.slice(7)];
				if (wellKnown === symbolValue) {
					return description;
				}
			}

			const globalKey = Symbol.keyFor(symbolValue);
			if (globalKey !== undefined) {
				return `Symbol.for(${stringify(globalKey, localOptions)})`;
			}

			return `Symbol(${stringify(description, localOptions)})`;
		}

		if (value instanceof Date) {
			return Number.isNaN(value.getTime())
				? 'new Date(\'Invalid Date\')'
				: `new Date('${value.toISOString()}')`;
		}

		if (value instanceof Map || value instanceof Set) {
			const isMap = value instanceof Map;
			const name = isMap ? 'Map' : 'Set';

			if (value.size === 0) {
				return `new ${name}()`;
			}

			seen.push(value);

			const items = [...value].map(item => {
				if (isMap) {
					const [key, itemValue] = item as [unknown, unknown];
					return tokens.indent + `[${stringify(key, localOptions, padding + indent)}, ${stringify(itemValue, localOptions, padding + indent)}]`;
				}

				return tokens.indent + stringify(item, localOptions, padding + indent);
			}).join(',' + tokens.newlineOrSpace);

			seen.pop();

			return expandWhiteSpace(`new ${name}([${tokens.newline}${items}${tokens.newline}${tokens.pad}])`);
		}

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return '[]';
			}

			seen.push(value);

			const items = value.map((element, index) => {
				let stringified = stringify(element, localOptions, padding + indent);
				if (localOptions.transform) {
					stringified = localOptions.transform(value, index, stringified);
				}

				return tokens.indent + stringified;
			}).join(',' + tokens.newlineOrSpace);

			seen.pop();

			return expandWhiteSpace(`[${tokens.newline}${items}${tokens.newline}${tokens.pad}]`);
		}

		if (isObject(value)) {
			let objectKeys = getOwnEnumerableKeys(value);

			if (localOptions.filter) {
				objectKeys = objectKeys.filter(key => localOptions.filter!(value, key));
			}

			if (objectKeys.length === 0) {
				return '{}';
			}

			seen.push(value);

			const pairs = objectKeys.map(key => {
				const isSymbol = typeof key === 'symbol';

				let stringKey: string;
				if (isSymbol) {
					stringKey = `[${stringify(key, localOptions)}]`;
				} else if (isIdentifier(key)) {
					stringKey = key;
				} else {
					stringKey = stringify(key, localOptions);
				}

				let stringValue = stringify((value as Record<Key, unknown>)[key as Key], localOptions, padding + indent);
				if (localOptions.transform) {
					stringValue = localOptions.transform(value, key, stringValue);
				}

				return tokens.indent + stringKey + ': ' + stringValue;
			}).join(',' + tokens.newlineOrSpace);

			seen.pop();

			return expandWhiteSpace(`{${tokens.newline}${pairs}${tokens.newline}${tokens.pad}}`);
		}

		const stringified = String(value)
			.replaceAll('\\', '\\\\')
			.replaceAll(/[\u0000-\u001F\u007F]/g, x =>
				CHARACTER_ESCAPES[x] ?? `\\u${x.codePointAt(0)?.toString(16).padStart(4, '0')}`);

		if (localOptions.singleQuotes === false) {
			return `"${stringified.replaceAll('"', String.raw`\\"`)}"`;
		}

		return `'${stringified.replaceAll('\'', String.raw`\'`)}'`;
	};

	return stringify(input, options, pad);
}
