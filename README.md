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

> Note: I created this project because the original package pulled in 17 extra modules and even crashed my Bun runtime with unused code. This fork keeps everything inline and dependency-free.

## Comparison

| Metric | `@u4/stringify-object` | `stringify-object` |
| --- | --- | --- |
| node_modules size | ~32 KB | ~1.2 MB |
| Entries (files + folders) | ~12 | ~275 |
| Reduction vs original | ~37x smaller, ~21x fewer files 🪶 | baseline 🐘 |
| Typings | ✅ built-in | ⚠️ needs `@types/stringify-object` |
