# @u4/stringify-object ✨

Stringify an object/array like JSON.stringify—just without all the double-quotes. A zero-dependency, TypeScript-first fork of `stringify-object@6.0.0`. The implementation is copied locally (no runtime deps) while preserving the original behavior: handles objects, arrays, Maps/Sets, Dates, Symbols, circular references, and supports `transform`, `filter`, `indent`, `singleQuotes`, and `inlineCharacterLimit` options. 🧰

## Install

```bash
npm install @u4/stringify-object
```

## Usage

```ts
import stringifyObject from '@u4/stringify-object';

const input = {foo: 'bar', baz: [1, 2, 3]};
console.log(stringifyObject(input));
// {
//   foo: 'bar',
//   baz: [
//     1,
//     2,
//     3
//   ]
// }
```

With options:

```ts
stringifyObject(new Map([['x', 1]]), {singleQuotes: false, indent: '  '});
// new Map([
//   ["x", 1]
// ])
```

### More examples

Masking fields with `transform`:

```ts
const object = {user: 'becky', password: 'secret'};

const pretty = stringifyObject(object, {
	transform: (obj, property, originalResult) => {
		if (property === 'password') {
			return originalResult.replace(/\w/g, '*');
		}

		return originalResult;
	},
});

console.log(pretty);
/*
{
	user: 'becky',
	password: '******'
}
*/
```

Inlining small values with `inlineCharacterLimit`:

```ts
const pretty = stringifyObject({
	foo: 'bar',
	arr: [1, 2, 3],
	nested: {hello: 'world'},
}, {
	indent: '  ',
	singleQuotes: false,
	inlineCharacterLimit: 12,
});

console.log(pretty);
/*
{
  foo: "bar",
  arr: [1, 2, 3],
  nested: {
    hello: "world"
  }
}
*/
```

Circular references are replaced with `"[Circular]"`, and object keys are only quoted when necessary (e.g. `{'foo-bar': true}`).

## Scripts

- `bun run build` — emit `dist/index.js` and `dist/index.d.ts` for publishing. 📦
- `bun test` — run the test suite. ✅

## Comparison

| Package | node_modules size | File count | Reduction vs original |
| --- | --- | --- | --- |
| `stringify-object` | ~1.2 MB | ~276 files | baseline 🐘 |
| `@u4/stringify-object` | ~32 KB | ~13 files | ~37x smaller, ~21x fewer files 🪶 |
