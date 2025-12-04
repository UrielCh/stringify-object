import {describe, expect, test} from 'bun:test';
import stringifyObject from '../index';

describe('stringifyObject', () => {
	test('serializes plain objects', () => {
		const result = stringifyObject({foo: 'bar', baz: 1});
		expect(result).toBe("{\n\tfoo: 'bar',\n\tbaz: 1\n}");
	});

	test('handles maps and sets', () => {
		const mapResult = stringifyObject(new Map([['a', 1]]));
		expect(mapResult).toBe("new Map([\n\t['a', 1]\n])");

		const setResult = stringifyObject(new Set([2, 3]));
		expect(setResult).toBe('new Set([\n\t2,\n\t3\n])');
	});

	test('detects circular references', () => {
		const obj: any = {name: 'loop'};
		obj.self = obj;

		const result = stringifyObject(obj);
		expect(result).toBe("{\n\tname: 'loop',\n\tself: \"[Circular]\"\n}");
	});

	test('inlines when under character limit', () => {
		const result = stringifyObject(['a', 'b'], {inlineCharacterLimit: 20});
		expect(result).toBe("['a', 'b']");
	});
});
