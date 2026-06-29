import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PatternGrid from './PatternGrid.svelte';
import { defaultProject } from '$lib/intarsia/project-storage.js';

const baseProps = () => {
	const project = defaultProject(10, 5);
	return {
		matrix: project.matrix,
		palette: project.palette,
		positionRow: 0,
		positionStitch: 0,
		zoom: 100 as const,
		fabricView: false,
		stitchesPerCm: 4.5,
		rowsPerCm: 6.4
	};
};

describe('PatternGrid editor interaction', () => {
	it('calls onStitchPaint when editing with brush', async () => {
		const onStitchPaint = vi.fn();
		const screen = await render(PatternGrid, {
			...baseProps(),
			editing: true,
			editorTool: 'brush',
			onStitchPaint
		});

		const canvas = screen.container.querySelector('canvas');
		expect(canvas).not.toBeNull();
		await userEvent.click(canvas!);

		expect(onStitchPaint).toHaveBeenCalledTimes(1);
		expect(onStitchPaint).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			{ strokeStart: true }
		);
	});

	it('calls onStitchTap on fill tool pointer down', async () => {
		const onStitchTap = vi.fn();
		const screen = await render(PatternGrid, {
			...baseProps(),
			editing: true,
			editorTool: 'fill',
			onStitchTap
		});

		const canvas = screen.container.querySelector('canvas');
		expect(canvas).not.toBeNull();
		await userEvent.click(canvas!);

		expect(onStitchTap).toHaveBeenCalledTimes(1);
	});

	it('fires onStitchPaint on repeated brush clicks', async () => {
		const onStitchPaint = vi.fn();
		const screen = await render(PatternGrid, {
			...baseProps(),
			editing: true,
			editorTool: 'brush',
			onStitchPaint
		});

		const canvas = screen.container.querySelector('canvas');
		expect(canvas).not.toBeNull();
		await userEvent.click(canvas!);
		await userEvent.click(canvas!);

		expect(onStitchPaint).toHaveBeenCalledTimes(2);
	});
});
