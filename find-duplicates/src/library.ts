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
    let cache: [string, string][] = JSON.parse(localStorage.getItem("find-duplicates:library-isrc-cache") ?? "[]");

    const newTracks = tracks.filter(uri => !cache.find(entry => entry[0] == uri));
    const outdatedTracks = cache.filter(entry => !tracks.includes(entry[0])).map(entry => entry[0]);

    cache = cache.filter(entry => !outdatedTracks.includes(entry[0]));

    for (let i = 0; i < newTracks.length; i += 50) {
        const requestTracks = newTracks.slice(i, Math.min(i + 50, newTracks.length))
            .map(uri => Spicetify.URI.from(uri)?.id)
            .filter(id => !!id);
        const metadataArray = (await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks?ids=${encodeURIComponent(requestTracks.join(","))}`)).tracks;

        cache.push(...metadataArray
            .filter((metadata: any) => metadata?.external_ids?.isrc)
            .map((metadata: any) => [metadata.uri, metadata.external_ids.isrc]));
    }

    localStorage.setItem("find-duplicates:library-isrc-cache", JSON.stringify(cache));

    if (LibraryISRCCache.reUpdate) {
        LibraryISRCCache.reUpdate = false;
        updateLibraryCacheInternal();
    }
    LibraryISRCCache.updateRunning = false;
}