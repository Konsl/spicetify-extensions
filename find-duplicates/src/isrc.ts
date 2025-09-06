import { getISRCCache, getISRCCacheMaxSize, getLibraryISRCCache, setISRCCache } from "./cache";
import { isLibraryUpdateRunning } from "./library";

export async function getISRC(uri: string): Promise<string | undefined> {
	const cache = getISRCCache();
	let cacheEntry = cache.find(e => e[0] == uri);
	if (cacheEntry) return cacheEntry[1];

	const libraryCache = getLibraryISRCCache();
	cacheEntry = libraryCache.find(e => e[0] == uri);
	if (cacheEntry) return cacheEntry[1];

	if (isLibraryUpdateRunning()) return;

	const uriObj = Spicetify.URI.from(uri);
	const trackId = uriObj?.id;
	if (!trackId) return;

	const trackMetadata = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`);
	const isrc = trackMetadata?.external_ids?.isrc;
	if (!isrc) return;

	cache.push([uri, isrc]);
	if (cache.length > getISRCCacheMaxSize()) cache.splice(0, cache.length - getISRCCacheMaxSize());
	setISRCCache(cache);

	return isrc;
}

export async function cacheTracks(uris: string[]): Promise<[string, string][]> {
	const cache = getISRCCache();
	const libraryCache = getLibraryISRCCache();
	const output = cache.filter(entry => uris.includes(entry[0]));
	output.push(...libraryCache.filter(entry => uris.includes(entry[0])));

	const neededTracks = uris.filter(uri => !output.find(entry => entry[0] == uri));

	for (let i = 0; i < neededTracks.length; i += 50) {
		const requestTracks = neededTracks
			.slice(i, Math.min(i + 50, neededTracks.length))
			.map(uri => Spicetify.URI.from(uri)?.id)
			.filter(id => !!id);
		if (!requestTracks.length) continue;

		const metadataArray = (
			await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks?ids=${encodeURIComponent(requestTracks.join(","))}`)
		).tracks;

		const entries = metadataArray
			.filter((metadata: any) => metadata?.external_ids?.isrc)
			.map((metadata: any) => [metadata.uri, metadata.external_ids.isrc]);

		output.push(...entries);
		cache.push(...entries);
	}

	if (cache.length > getISRCCacheMaxSize()) cache.splice(0, cache.length - getISRCCacheMaxSize());
	setISRCCache(cache);

	return output;
}
