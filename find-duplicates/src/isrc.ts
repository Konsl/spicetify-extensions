export async function getISRC(uri: string): Promise<string | undefined> {
    const cache: [string, string][] = JSON.parse(localStorage.getItem("find-duplicates:isrc-cache") ?? "[]");
    const cacheEntry = cache.find(e => e[0] == uri);
    if (cacheEntry) return cacheEntry[1];

    const uriObj = Spicetify.URI.from(uri);
    const trackId = uriObj?.id;
    if (!trackId) return;

    const trackMetadata = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
    const isrc = trackMetadata?.external_ids?.isrc;
    if (!isrc) return;

    cache.push([uri, isrc]);
    if(cache.length > 1000) cache.splice(0, cache.length - 1000);
    localStorage.setItem("find-duplicates:isrc-cache", JSON.stringify(cache));

    return isrc;
}