type SpicetifyWithLocale = typeof Spicetify & { Locale: { _locale: "en" | "de" } };

async function main() {
    while (!(Spicetify?.ContextMenu && Spicetify?.CosmosAsync && Spicetify?.Platform?.History && (Spicetify as SpicetifyWithLocale)?.Locale && Spicetify?.URI)) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    const { ContextMenu, CosmosAsync, Platform, Locale, URI } = (Spicetify as SpicetifyWithLocale);

    const translation = {
        "en": {
            "contextMenuText": "View Duplicates"
        },
        "de": {
            "contextMenuText": "Duplikate anzeigen"
        }
    };

    const currentTranslation = translation[Locale._locale] ?? translation["en"];

    const contextMenuItem = new ContextMenu.Item(
        currentTranslation.contextMenuText,
        async uris => {
            const uri = URI.from(uris[0]);
            const trackId = uri?.id;
            if(!trackId) return;

            const trackMetadata = await CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
            const isrc = trackMetadata?.external_ids?.isrc;
            if(!isrc) return;

            Platform.History.push(`/search/${encodeURIComponent(`isrc:${isrc}`)}/tracks`);
        },
        uris => uris.length == 1 && URI.from(uris[0])?.type == URI.Type.TRACK
    );

    contextMenuItem.register();
}

export default main;
