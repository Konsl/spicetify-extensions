async function main() {
	while (!Spicetify?.Platform?.PlayerAPI || !Spicetify.ContextMenu || !Spicetify.URI) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	const { URI, Platform, ContextMenu } = Spicetify;
	const player = Platform.PlayerAPI;

	const menuItem = new ContextMenu.Item(
		"Switch Context",
		uris => {
			const uri = URI.fromString(uris[0]);
			if (!uri) return;

			if (uri.type === URI.Type.COLLECTION) {
				uri.username = Platform.username;
				if (uri.category === "tracks") {
					delete uri.category;
				}
			}

			const sessionId = player.getState().sessionId;
			const uriString = uri.toURI();
			const url = `context://${uriString}`;

			player.updateContext(sessionId, {
				uri: uriString,
				url
			});
		},
		uris => {
			if (uris.length !== 1) return false;
			const uri = URI.fromString(uris[0]);

			if (
				[
					URI.Type.ALBUM,
					URI.Type.ARTIST,
					URI.Type.EPISODE,
					URI.Type.PLAYLIST,
					URI.Type.PLAYLIST_V2,
					URI.Type.SHOW,
					URI.Type.TRACK
				].includes(uri.type)
			)
				return true;

			if (uri.type === URI.Type.COLLECTION && ["tracks", "your-episodes"].includes(uri.category!))
				return true;

			return false;
		}
	);
	menuItem.register();
}

export default main;
