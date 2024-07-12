import { PlaybackBarManager } from "./playback-bar";
import { WaveformGenerator } from "./waveform";

async function main() {
	while (!Spicetify?.CosmosAsync || !Spicetify?.Player?.data) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	const playbackBarManager = new PlaybackBarManager();
	await playbackBarManager.init();
	const waveformGenerator = new WaveformGenerator();

	let audioAnalysis: SpotifyAudioAnalysis | null = null;

	const updateWaveform = async (itemUri?: string) => {
		if (!audioAnalysis) return;

		const size = playbackBarManager.getMaskSize();
		const waveformUrl = await waveformGenerator.createWaveform(size.width, size.height, audioAnalysis);
		if (Spicetify.Player.data?.item?.uri !== itemUri) return;

		playbackBarManager.setMask(waveformUrl, audioAnalysis.track.duration);
	};

	const updatePlayerState = async (newState: Spicetify.PlayerState) => {
		playbackBarManager.unsetMask();
		audioAnalysis = null;

		const item = newState?.item;
		if (!item) return;

		const uri = Spicetify.URI.fromString(item.uri);
		if (uri.type !== Spicetify.URI.Type.TRACK) return;

		const analysisRequestUrl = `https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/${uri.id}?format=json`;
		const response = (await Spicetify.CosmosAsync.get(analysisRequestUrl).catch(err =>
			console.error("[Waveform Playback Bar] Error while loading audio analysis data", err)
		)) as SpotifyAudioAnalysis | undefined;

		if (!response) {
			console.error("[Waveform Playback Bar] Error while loading audio analysis data");
			return;
		}
		if (typeof response !== "object" || !("track" in response) || !("segments" in response)) {
			console.error("[Waveform Playback Bar] Invalid audio analysis data", response);
			return;
		}

		if (Spicetify.Player.data?.item?.uri !== item.uri) return;

		audioAnalysis = response;
		updateWaveform(item.uri);
	};

	playbackBarManager.setResizeHandler(() => {
		if (!waveformGenerator.isSize(playbackBarManager.getMaskSize()))
			updateWaveform(Spicetify.Player.data?.item?.uri);
	});

	const songChangeListener = (event?: Event & { data: Spicetify.PlayerState }) => {
		if (event?.data) updatePlayerState(event.data);
	};

	Spicetify.Player.addEventListener("songchange", songChangeListener);
	updatePlayerState(Spicetify.Player.data);
}

export default main;
