import { describe, expect, it } from 'vitest';
import { validateImageFile } from './canvas.js';
import { MAX_FILE_BYTES } from './constants.js';

describe('validateImageFile', () => {
	it('accepts a small png file', () => {
		const file = new File([new Uint8Array(100)], 'test.png', { type: 'image/png' });
		expect(validateImageFile(file)).toEqual({ ok: true });
	});

	it('rejects unsupported type', () => {
		const file = new File([new Uint8Array(100)], 'test.gif', { type: 'image/gif' });
		expect(validateImageFile(file)).toEqual({ ok: false, code: 'unsupported_type' });
	});

	it('rejects oversized file', () => {
		const file = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.png', {
			type: 'image/png'
		});
		expect(validateImageFile(file)).toEqual({ ok: false, code: 'file_too_large' });
	});
});
