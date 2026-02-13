export class WaveformGenerator {
	private width: number = -1;
	private height: number = -1;
	private urls: string[] = [];
	private canvas: OffscreenCanvas | null = null;
	private lock: Promise<string> | null = null;

	constructor() {}

	public async createWaveform(width: number, height: number, audioAnalysis: SpotifyAudioAnalysis): Promise<string> {
		if (this.lock) await this.lock;
		this.lock = this._createWaveform(width, height, audioAnalysis);
		return await this.lock;
	}

	public isSize(size: { width: number; height: number }): boolean {
		return this.width === size.width && this.height === size.height;
	}

	private async _createWaveform(width: number, height: number, audioAnalysis: SpotifyAudioAnalysis): Promise<string> {
		if (this.canvas == null || width !== this.width || height !== this.height) {
			this.width = width;
			this.height = height;
			this.canvas = new OffscreenCanvas(width, height);
		}

		const trackDuration = audioAnalysis.track.duration;
		const centerBarHeight = 2 * window.devicePixelRatio;
		const center = height / 2;
		const waveformHeightSingle = height / 2 - centerBarHeight / 2;

		const loudnessToHeightTop = (loudness: number) => {
			return center - (this.convertLoudness(loudness) * waveformHeightSingle + centerBarHeight / 2);
		};

		const loudnessToHeightBottom = (loudness: number) => {
			return center + (this.convertLoudness(loudness) * waveformHeightSingle + centerBarHeight / 2);
		};

		const ctx = this.canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2D context");

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.moveTo(0, height / 2);

		for (const segment of audioAnalysis.segments) {
			ctx.lineTo((segment.start / trackDuration) * width, loudnessToHeightTop(segment.loudness_start));
			ctx.lineTo(
				((segment.start + segment.loudness_max_time) / trackDuration) * width,
				loudnessToHeightTop(segment.loudness_max)
			);
		}

		const lastSegment = audioAnalysis.segments[audioAnalysis.segments.length - 1];

		ctx.lineTo(
			((lastSegment.start + lastSegment.duration) / trackDuration) * width,
			loudnessToHeightTop(lastSegment.loudness_end)
		);
		ctx.lineTo(
			((lastSegment.start + lastSegment.duration) / trackDuration) * width,
			loudnessToHeightBottom(lastSegment.loudness_end)
		);

		for (let i = audioAnalysis.segments.length - 1; i >= 0; i--) {
			const segment = audioAnalysis.segments[i];
			ctx.lineTo(
				((segment.start + segment.loudness_max_time) / trackDuration) * width,
				loudnessToHeightBottom(segment.loudness_max)
			);
			ctx.lineTo((segment.start / trackDuration) * width, loudnessToHeightBottom(segment.loudness_start));
		}

		ctx.closePath();
		ctx.fill();

		const blob = await this.canvas.convertToBlob();
		const url = URL.createObjectURL(blob);
		this.urls.push(url);

		if (this.urls.length > 2) URL.revokeObjectURL(this.urls.shift()!);

		return url;
	}

	private convertLoudness(loudness: number): number {
		const normalized = Math.pow(10, loudness / 20);
		return Math.min(Math.max(normalized, 0), 1);
	}
}
