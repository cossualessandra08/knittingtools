import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCell } from './pattern-matrix.js';
import {
	defaultProject,
	deserializeProject,
	exportProjectJson,
	importProjectJson,
	loadFromLocalStorage,
	saveToLocalStorage,
	serializeProject
} from './project-storage.js';
import { AUTOSAVE_KEY } from './constants.js';

const store: Record<string, string> = {};

beforeEach(() => {
	for (const key of Object.keys(store)) delete store[key];
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => {
			store[k] = v;
		},
		removeItem: (k: string) => {
			delete store[k];
		}
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('project-storage', () => {
	describe('defaultProject', () => {
		it('creates empty matrix with default palette and settings', () => {
			const project = defaultProject(10, 5);
			expect(project.matrix.width).toBe(10);
			expect(project.matrix.height).toBe(5);
			expect(project.matrix.cells.length).toBe(50);
			expect(project.palette).toHaveLength(2);
			expect(project.palette[0]?.hex).toBe('#FFFFFF');
			expect(project.palette[1]?.hex).toBe('#000000');
			expect(project.position).toEqual({ row: 0, stitch: 0 });
			expect(project.settings).toMatchObject({
				projectName: 'Untitled',
				readingMode: 'zigzag',
				showRsWs: true,
				fabricView: false,
				stitchesPerCm: 4.5,
				rowsPerCm: 6.4,
				zoom: 100
			});
		});
	});

	describe('serializeProject / deserializeProject', () => {
		it('round-trips project state', () => {
			const project = defaultProject(4, 3);
			setCell(project.matrix, 1, 2, 1);
			project.position = { row: 2, stitch: 1 };
			project.settings.projectName = 'My pattern';

			const serialized = serializeProject(project);
			const restored = deserializeProject(serialized);

			expect(restored.version).toBe(project.version);
			expect(restored.matrix.width).toBe(4);
			expect(restored.matrix.height).toBe(3);
			expect(Array.from(restored.matrix.cells)).toEqual(Array.from(project.matrix.cells));
			expect(restored.palette).toEqual(project.palette);
			expect(restored.position).toEqual(project.position);
			expect(restored.settings).toEqual(project.settings);
		});

		it('throws on invalid JSON shape', () => {
			expect(() => deserializeProject(null)).toThrow();
			expect(() => deserializeProject({ version: 99 })).toThrow();
		});
	});

	describe('exportProjectJson / importProjectJson', () => {
		it('round-trips via JSON string', () => {
			const project = defaultProject(3, 2);
			project.settings.projectName = 'Export test';
			const json = exportProjectJson(project);
			const restored = importProjectJson(json);
			expect(restored.settings.projectName).toBe('Export test');
			expect(restored.matrix.width).toBe(3);
		});

		it('throws on invalid JSON text', () => {
			expect(() => importProjectJson('not json')).toThrow('Could not read project file.');
		});
	});

	describe('localStorage', () => {
		it('saves and loads project', () => {
			const project = defaultProject(5, 5);
			project.settings.projectName = 'Autosaved';
			saveToLocalStorage(project);
			expect(store[AUTOSAVE_KEY]).toBeDefined();
			const loaded = loadFromLocalStorage();
			expect(loaded?.settings.projectName).toBe('Autosaved');
		});

		it('returns null when nothing saved', () => {
			expect(loadFromLocalStorage()).toBeNull();
		});
	});
});
