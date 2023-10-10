export type HeartRenderer = (params: { uri: string; className: string; onClick: any; size: string }) => any;
export type HeartRendererEntry = { type: HeartRenderer };

class Heart {
	static loaded: boolean = false;
	static heartRenderer?: HeartRenderer;
	static heartRendererEntry?: HeartRendererEntry;
}

export function getHeartRendererEntry(): HeartRendererEntry | undefined {
	if (!Heart.loaded) loadHeartRenderer();
	return Heart.heartRendererEntry;
}

export function getHeartRenderer(): HeartRenderer | undefined {
	if (!Heart.loaded) loadHeartRenderer();
	return Heart.heartRenderer;
}

function loadHeartRenderer() {
	const require = (window as any).webpackChunkopen.push([[Symbol()], {}, (re: any) => re]);
	const cache = Object.keys(require.m).map(id => require(id));

	const modules = cache
		.filter(module => typeof module === "object")
		.map(module => {
			try {
				return Object.values(module);
			} catch {}
		})
		.flat();

	const potentialRenderers = modules.filter((m: any) => {
		if (!m?.type) return false;
		if (typeof m.type !== "function") return false;
		let fnstr = m.type.toString();
		return (
			fnstr.includes("remove-from-library") && fnstr.includes("add-to-library") && fnstr.includes("className") && !fnstr.includes("isEpisode")
		);
	});

	if (potentialRenderers.length == 1) {
		Heart.heartRendererEntry = potentialRenderers[0] as HeartRendererEntry;
		Heart.heartRenderer = Heart.heartRendererEntry.type;
	} else {
		Heart.heartRendererEntry = undefined;
		Heart.heartRenderer = undefined;
	}

	Heart.loaded = true;
}
