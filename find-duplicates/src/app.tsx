import { saveCache } from "./cache";
import { getISRC } from "./isrc";
import { initLibraryISRCCache } from "./library";
import { SpicetifyWithLocale, getTranslation } from "./locale";
import { initSaveCount } from "./save-count";

async function main() {
	while (
		!(
			Spicetify?.ContextMenu &&
			Spicetify?.CosmosAsync &&
			Spicetify?.Platform?.History &&
			(Spicetify as SpicetifyWithLocale)?.Locale &&
			Spicetify?.URI
		)
	) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	const { ContextMenu, Platform, URI } = Spicetify;

	initLibraryISRCCache();
	initSaveCount();

	window.addEventListener("beforeunload", () => saveCache());

	const contextMenuItem = new ContextMenu.Item(
		getTranslation().contextMenuText,
		async uris => {
			const isrc = await getISRC(uris[0]);
			if (!isrc) {
				Spicetify.showNotification(getTranslation().errorCouldNotRetrieveISRC, true);
				return;
			}

			Platform.History.push(`/search/${encodeURIComponent(`isrc:${isrc}`)}/tracks`);
		},
		uris => uris.length == 1 && URI.from(uris[0])?.type == URI.Type.TRACK
	);

	contextMenuItem.register();
}

export default main;
