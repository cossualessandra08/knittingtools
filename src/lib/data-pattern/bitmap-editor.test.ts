import { describe, expect, it } from 'vitest';
import { BitmapEditor } from './bitmap-editor.js';

describe('BitmapEditor', () => {
	it('toggles, brushes, and erases', () => {
		const editor = new BitmapEditor(new Uint8Array([0, 0, 0, 0]), 2, 2);
		editor.toggle(0, 0);
		expect(editor.bitmap[0]).toBe(1);
		editor.brush(1, 0);
		expect(editor.bitmap[1]).toBe(1);
		editor.eraser(0, 0);
		expect(editor.bitmap[0]).toBe(0);
	});

	it('supports undo and redo', () => {
		const editor = new BitmapEditor(new Uint8Array([0, 0]), 1, 2);
		editor.toggle(0, 0);
		editor.undo();
		expect(editor.bitmap[0]).toBe(0);
		editor.redo();
		expect(editor.bitmap[0]).toBe(1);
	});
});
