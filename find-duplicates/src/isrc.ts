import { getISRCCache, getISRCCacheMaxSize, getLibraryISRCCache, getMetadataService, setISRCCache } from "./cache";
import { isLibraryUpdateRunning } from "./library";
import { CacheStatus, ExtensionKind, parseProtobuf, Track } from "spicetify-utils";

export async function getISRC(uri: string): Promise<string | undefined> {
	const cache = getISRCCache();
	let cacheEntry = cache.find(e => e[0] == uri);
	if (cacheEntry) return cacheEntry[1];

	const libraryCache = getLibraryISRCCache();
	cacheEntry = libraryCache.find(e => e[0] == uri);
	if (cacheEntry) return cacheEntry[1];

	if (isLibraryUpdateRunning()) return;

	const response = await getMetadataService()
		.fetch(ExtensionKind.TRACK_V4, uri)
		.catch(s => console.error(`find-duplicates: Could not load track metadata. Status: ${CacheStatus[s]}`));
	if (!response || response.value.length === 0 || response.typeUrl !== "type.googleapis.com/spotify.metadata.Track") return;

	const decodedResponse = parseProtobuf(response.value, Track);
	const isrc = decodedResponse?.externalId?.find(eid => eid.type === "isrc" && eid.id)?.id;
	if (!isrc) return;

	cache.push([uri, isrc]);
	if (cache.length > getISRCCacheMaxSize()) cache.splice(0, cache.length - getISRCCacheMaxSize());
	setISRCCache(cache);

	return isrc;
}

export async function requestTrackISRCs(uris: string[]): Promise<[string, string][]> {
	const response = await getMetadataService()
		.fetchAll(uris.map(uri => ({ uri, kind: ExtensionKind.TRACK_V4 })))
		.catch(() => console.error(`find-duplicates: Could not load track metadata`));
	if (!response) return [];

	const result: [string, string][] = [];
	for (const entry of response) {
		if (!entry.success || entry.value.length === 0 || entry.typeUrl !== "type.googleapis.com/spotify.metadata.Track") continue;

		const decodedResponse = parseProtobuf(entry.value, Track);
		const isrc = decodedResponse?.externalId?.find(eid => eid.type === "isrc" && eid.id)?.id;
		if (!isrc) continue;

		result.push([entry.uri, isrc]);
	}

	return result;
}

export async function cacheTracks(uris: string[]): Promise<[string, string][]> {
	const cache = getISRCCache();
	const libraryCache = getLibraryISRCCache();
	const output = cache.filter(entry => uris.includes(entry[0]));
	output.push(...libraryCache.filter(entry => uris.includes(entry[0])));

	const neededTracks = uris.filter(uri => !output.find(entry => entry[0] == uri));

	for (let i = 0; i < neededTracks.length; i += 50) {
		const requestTracks = neededTracks.slice(i, Math.min(i + 50, neededTracks.length));
		if (!requestTracks.length) continue;

		const entries = await requestTrackISRCs(requestTracks);
		output.push(...entries);
		cache.push(...entries);
	}

	if (cache.length > getISRCCacheMaxSize()) cache.splice(0, cache.length - getISRCCacheMaxSize());
	setISRCCache(cache);

	return output;
}
