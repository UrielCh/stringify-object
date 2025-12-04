# @u4/stringify-object

A zero-dependency, TypeScript-first fork of `stringify-object@6.0.0`. The implementation is copied locally (no runtime deps) while preserving the original behavior: handles objects, arrays, Maps/Sets, Dates, Symbols, circular references, and supports `transform`, `filter`, `indent`, `singleQuotes`, and `inlineCharacterLimit` options.

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

## Scripts

- `bun run build` — emit `dist/index.js` and `dist/index.d.ts` for publishing.
- `bun test` — run the test suite.
