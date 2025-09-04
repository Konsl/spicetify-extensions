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
	Heart.loaded = true;

	const webpack = (window as any).webpackChunkclient_web ?? (window as any).webpackChunkopen;
	const require = webpack.push([[Symbol()], {}, (re: any) => re]);
	const cache = Object.keys(require.m).map(id => require(id));

	const modules = cache
		.filter(module => typeof module === "object")
		.map(module => {
			try {
				return Object.values(module);
			} catch {}
		})
		.flat();

	const acCandidates = modules.filter((m: any) => {
		if (!m?.type) return false;
		if (m["$$typeof"] !== Symbol.for("react.memo")) return false;
		if (typeof m.type !== "function") return false;

		const fnstr = m.type.toString();
		return (
			fnstr.includes("defaultCurationContextUri") &&
			fnstr.includes("web-player.aligned-curation") &&
			fnstr.includes("isCurated") &&
			fnstr.includes("default-curation")
		);
	});

	const acCandidatesDedup = [...new Set(acCandidates)];

	if (acCandidatesDedup.length == 1) {
		Heart.heartRendererEntry = acCandidatesDedup[0] as HeartRendererEntry;
		Heart.heartRenderer = Heart.heartRendererEntry.type;

		return;
	}

	const heartCandidates = modules.filter((m: any) => {
		if (!m?.type) return false;
		if (typeof m.type !== "function") return false;

		const fnstr = m.type.toString();
		return (
			fnstr.includes("remove-from-library") && fnstr.includes("add-to-library") && fnstr.includes("className") && !fnstr.includes("isEpisode")
		);
	});

	if (heartCandidates.length == 1) {
		Heart.heartRendererEntry = heartCandidates[0] as HeartRendererEntry;
		Heart.heartRenderer = Heart.heartRendererEntry.type;

		return;
	}
}
