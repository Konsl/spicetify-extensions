type ISRCCacheEntry = [string, string];

class ISRCCache {
	static isrcCache?: ISRCCacheEntry[];
	static loadedIsrcCache: boolean = false;
	static libraryIsrcCache?: ISRCCacheEntry[];
	static loadedLibraryIsrcCache: boolean = false;
}

export function getISRCCache(): ISRCCacheEntry[] {
	if (!ISRCCache.loadedIsrcCache) loadISRCCache();
	return ISRCCache.isrcCache as ISRCCacheEntry[];
}

function loadISRCCache() {
	ISRCCache.isrcCache = JSON.parse(localStorage.getItem("find-duplicates:isrc-cache") ?? "[]");
	ISRCCache.loadedIsrcCache = true;
}

export function setISRCCache(cache: ISRCCacheEntry[]) {
	ISRCCache.loadedIsrcCache = true;
	ISRCCache.isrcCache = cache;
}

export function getISRCCacheMaxSize() {
	return 2000;
}

export function getLibraryISRCCache(): ISRCCacheEntry[] {
	if (!ISRCCache.loadedLibraryIsrcCache) loadLibraryISRCCache();
	return ISRCCache.libraryIsrcCache as ISRCCacheEntry[];
}

function loadLibraryISRCCache() {
	ISRCCache.libraryIsrcCache = JSON.parse(localStorage.getItem("find-duplicates:library-isrc-cache") ?? "[]");
	ISRCCache.loadedLibraryIsrcCache = true;
}

export function setLibraryISRCCache(cache: ISRCCacheEntry[]) {
	ISRCCache.loadedLibraryIsrcCache = true;
	ISRCCache.libraryIsrcCache = cache;
}

export function saveCache() {
	localStorage.setItem("find-duplicates:isrc-cache", JSON.stringify(ISRCCache.isrcCache));
	localStorage.setItem("find-duplicates:library-isrc-cache", JSON.stringify(ISRCCache.libraryIsrcCache));
}
