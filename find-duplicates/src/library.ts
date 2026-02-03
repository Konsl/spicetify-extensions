import { getLibraryISRCCache, setLibraryISRCCache } from "./cache";
import { requestTrackISRCs } from "./isrc";
import { refreshSaveCounts } from "./save-count";

export function initLibraryISRCCache() {
	Spicetify.Platform.LibraryAPI.getEvents().addListener("update", updateLibraryISRCCache);
	updateLibraryISRCCache();
}

class LibraryISRCCache {
	static updateRunning: boolean = false;
	static reUpdate: boolean = false;
}

export function updateLibraryISRCCache() {
	if (LibraryISRCCache.updateRunning) LibraryISRCCache.reUpdate = true;
	else updateLibraryCacheInternal();
}

async function updateLibraryCacheInternal() {
	LibraryISRCCache.updateRunning = true;

	const tracks: string[] = (await Spicetify.Platform.LibraryAPI.getTracks({ limit: -1 })).items.map((item: any) => item.uri);
	let cache = getLibraryISRCCache();

	const newTracks = tracks.filter(uri => !cache.find(entry => entry[0] == uri));
	const outdatedTracks = cache.filter(entry => !tracks.includes(entry[0])).map(entry => entry[0]);

	cache = cache.filter(entry => !outdatedTracks.includes(entry[0]));

	for (let i = 0; i < newTracks.length; i += 50) {
		const requestTracks = newTracks.slice(i, Math.min(i + 50, newTracks.length));
		if (!requestTracks.length) continue;

		cache.push(...(await requestTrackISRCs(requestTracks)));
	}

	setLibraryISRCCache(cache);

	if (LibraryISRCCache.reUpdate) {
		LibraryISRCCache.reUpdate = false;
		updateLibraryCacheInternal();
	} else {
		refreshSaveCounts();
	}
	LibraryISRCCache.updateRunning = false;
}

export function isLibraryUpdateRunning(): boolean {
	return LibraryISRCCache.updateRunning;
}
