const ANIMATION_DURATION = 160;
const WAVEFORM_HEIGHT = 24;
const MASK_ID = "progress_bar_waveform_mask";

export class PlaybackBarManager {
	private playbackBar: HTMLElement | null = null;
	private progressBar: HTMLElement | null = null;
	private progressBarBg: HTMLElement | null = null;
	private progressBarSliderAreas: HTMLElement[] = [];
	private progressBarSlider: HTMLElement | null = null;

	private maskSvgImageElement: SVGElement | null = null;
	private maskSvgRectElement: SVGElement | null = null;

	private animations: Animation[] = [];
	private resizeObserver = new ResizeObserver(() => this.resizeHandler?.());
	private resizeHandler: (() => void) | null = null;

	private htmlElementsUpdateLock: Promise<void> | null = null;

	private maskEnabled: boolean = false;
	private trackDuration: number = 0;

	constructor() {}

	public async init() {
		CSS.registerProperty({
			name: "--progress-bar-height",
			syntax: "<length>",
			initialValue: "4px",
			inherits: true
		});
		CSS.registerProperty({
			name: "--progress-bar-radius",
			syntax: "<length>",
			initialValue: "2px",
			inherits: true
		});

		await this.updateHTMLElements();

		const styleElement = document.createElement("style");
		styleElement.innerHTML = `
.main-nowPlayingBar-center .playback-bar .x-progressBar-progressBar {
    .x-progressBar-background {
        background: none;
    }

    .x-progressBar-foregroundWrapper {
        background: var(--bg-color);
    }
}

.x-progressBar-progressBar:hover .x-progressBar-handle[data-timestamp]::before {
    visibility: visible;
}

.x-progressBar-progressBar:hover .x-progressBar-handle::before {
    visibility: hidden;
    
    background: var(--spice-card);
    border-radius: 2px;
    padding: 1px 3px;
    position: absolute;
    
    font-size: 10px;
    bottom: 20px;
    left: 1px;
    transform: translate(-50%, -50%);
    
    content: attr(data-timestamp);
}
		`;
		document.head.appendChild(styleElement);

		const maskSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		maskSvgElement.style.position = "absolute";
		maskSvgElement.style.width = "0";
		maskSvgElement.style.height = "0";

		const defsElement = document.createElementNS("http://www.w3.org/2000/svg", "defs");

		const maskElement = document.createElementNS("http://www.w3.org/2000/svg", "mask");
		maskElement.id = MASK_ID;
		maskElement.setAttribute("maskUnits", "objectBoundingBox");
		maskElement.setAttribute("maskContentUnits", "objectBoundingBox");

		const rectElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rectElement.setAttribute("fill", "white");
		rectElement.setAttribute("x", "0");
		rectElement.setAttribute("y", "0");
		rectElement.setAttribute("width", "1");
		rectElement.setAttribute("height", "1");
		maskElement.appendChild(rectElement);

		const imageElement = document.createElementNS("http://www.w3.org/2000/svg", "image");
		imageElement.setAttribute("x", "0");
		imageElement.setAttribute("y", "0");
		imageElement.setAttribute("width", "1");
		imageElement.setAttribute("height", "1");
		imageElement.setAttribute("preserveAspectRatio", "none");
		imageElement.setAttribute("decoding", "sync");
		imageElement.setAttribute("href", "");
		maskElement.appendChild(imageElement);

		defsElement.appendChild(maskElement);
		maskSvgElement.appendChild(defsElement);
		document.body.appendChild(maskSvgElement);

		this.maskSvgImageElement = imageElement;
		this.maskSvgRectElement = rectElement;
	}

	private hasHTMLElements(): boolean {
		if (!this.playbackBar || !this.playbackBar.isConnected) return false;
		if (!this.progressBar || !this.progressBar.isConnected) return false;
		if (!this.progressBarBg || !this.progressBarBg.isConnected) return false;
		if (!this.progressBarSliderAreas.length || !this.progressBarSliderAreas.every(e => e.isConnected)) return false;
		if (!this.progressBarSlider || !this.progressBarSlider.isConnected) return false;

		return true;
	}

	private tryUpdateHTMLElementsSync(): boolean {
		this.resizeObserver.disconnect();

		this.playbackBar = document.querySelector(".main-nowPlayingBar-center .playback-bar");
		this.progressBar = this.playbackBar?.querySelector(".x-progressBar-progressBar") ?? null;
		this.progressBarBg = this.progressBar?.querySelector(".x-progressBar-background") ?? null;
		this.progressBarSliderAreas = [
			...(this.progressBarBg?.querySelectorAll(".x-progressBar-foregroundWrapper") ?? [])
		] as HTMLElement[];
		this.progressBarSlider = this.progressBarBg?.querySelector(".x-progressBar-handle") ?? null;

		if (this.hasHTMLElements()) {
			this.setupHTMLElements();
			return true;
		}
		return false;
	}

	private updateHTMLElements(): Promise<void> {
		if (this.htmlElementsUpdateLock) return this.htmlElementsUpdateLock;

		this.htmlElementsUpdateLock = this._updateHTMLElements();
		this.htmlElementsUpdateLock.then(() => (this.htmlElementsUpdateLock = null));

		return this.htmlElementsUpdateLock;
	}

	private async _updateHTMLElements() {
		this.resizeObserver.disconnect();

		while (!(this.playbackBar = document.querySelector(".main-nowPlayingBar-center .playback-bar"))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (!(this.progressBar = this.playbackBar.querySelector(".x-progressBar-progressBar"))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (!(this.progressBarBg = this.progressBar.querySelector(".x-progressBar-background"))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (
			(this.progressBarSliderAreas = [
				...this.progressBarBg.querySelectorAll(".x-progressBar-foregroundWrapper")
			] as HTMLElement[]).length === 0
		) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (!(this.progressBarSlider = this.progressBarBg.querySelector(".x-progressBar-handle"))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		this.setupHTMLElements();
	}

	private setupHTMLElements() {
		this.resizeObserver.observe(this.progressBarSliderAreas[0]);

		this.progressBarSliderAreas.forEach(e =>
			e.animate(
				[
					{
						mask: `url(#${MASK_ID})`
					}
				],
				{
					duration: 0,
					iterations: 1,
					fill: "forwards"
				}
			)
		);
	}

	private ensureHasHTMLElements(cb: () => void): boolean {
		if (!this.hasHTMLElements()) {
			this.maskEnabled = false;

			if (this.htmlElementsUpdateLock || !this.tryUpdateHTMLElementsSync()) {
				this.updateHTMLElements().then(cb);
				return true;
			}
		}

		return false;
	}

	private ensureHasHTMLElementsPromise(): Promise<void> {
		return new Promise((res, rej) => {
			if (this.ensureHasHTMLElements(res)) return;
			res();
		});
	}

	public setResizeHandler(handler: (() => void) | null) {
		this.resizeHandler = handler;
	}

	public setMask(url: string, trackDuration: number) {
		if (this.ensureHasHTMLElements(() => this.setMask(url, trackDuration))) return;

		this.trackDuration = trackDuration;

		const options: KeyframeAnimationOptions = {
			duration: ANIMATION_DURATION,
			iterations: 1,
			fill: "forwards",
			easing: "ease-in-out"
		};

		this.maskSvgImageElement?.setAttribute("href", url);
		if (this.maskEnabled) return;

		this.animations.push(
			...[
				this.maskSvgRectElement?.animate(
					[
						{
							height: 0,
							y: 0.5
						}
					],
					options
				),
				this.playbackBar?.animate(
					[
						{
							height: `${WAVEFORM_HEIGHT}px`
						}
					],
					options
				),
				this.progressBar?.animate(
					[
						{
							"--progress-bar-height": `${WAVEFORM_HEIGHT}px`,
							"--progress-bar-radius": "0px"
						}
					],
					options
				),
				this.progressBarSlider?.animate(
					[
						{
							height: `${WAVEFORM_HEIGHT}px`,
							width: "2px",
							borderRadius: "1px",
							marginLeft: "-1px",
							boxShadow: "none"
						}
					],
					options
				)
			].filter(a => !!a)
		);

		this.trackDuration = trackDuration;

		this.progressBarBg?.addEventListener("mouseenter", this.onBarMouseEnter);
		this.progressBarBg?.addEventListener("mouseleave", this.onBarMouseLeave);
		this.progressBarBg?.addEventListener("mousemove", this.onBarMouseMove);

		if (this.progressBarSlider) this.progressBarSlider.style.transition = "none";

		this.maskEnabled = true;
	}

	public unsetMask() {
		if (!this.maskEnabled) return;

		this.animations.forEach(a => a.reverse());
		this.animations = [];

		this.progressBarBg?.removeEventListener("mouseenter", this.onBarMouseEnter);
		this.progressBarBg?.removeEventListener("mouseleave", this.onBarMouseLeave);
		this.progressBarBg?.removeEventListener("mousemove", this.onBarMouseMove);

		if (this.progressBarSlider) {
			this.progressBarSlider.style.transition = "";
			this.progressBarSlider.style.removeProperty("--progress-bar-transform");
			delete this.progressBarSlider.dataset["timestamp"];
		}

		this.maskEnabled = false;
	}

	public async getMaskSize(): Promise<{ width: number; height: number }> {
		await this.ensureHasHTMLElementsPromise();
		if (!this.progressBarSliderAreas[0]) return { width: 1, height: 1 };

		const rect = this.progressBarSliderAreas[0].getBoundingClientRect();
		return {
			width: rect.width * window.devicePixelRatio,
			height: WAVEFORM_HEIGHT * window.devicePixelRatio
		};
	}

	private onBarMouseEnter = ((event: MouseEvent) => {
		this.updateSliderTimestamp(event);
		event.stopPropagation();
	}).bind(this);

	private onBarMouseLeave = ((event: MouseEvent) => {
		delete this.progressBarSlider?.dataset["timestamp"];
		event.stopPropagation();
	}).bind(this);

	private onBarMouseMove = ((event: MouseEvent) => {
		this.updateSliderTimestamp(event);
		event.stopPropagation();
	}).bind(this);

	private updateSliderTimestamp(event: MouseEvent) {
		if (!this.progressBarBg) return;
		const rect = this.progressBarBg.getBoundingClientRect();

		let relativeX = (event.clientX - rect.left) / rect.width;
		relativeX = Math.max(0, Math.min(1, relativeX));
		const timestamp = this.trackDuration * relativeX;

		if (this.progressBarSlider) {
			this.progressBarSlider.dataset["timestamp"] = this.formatTimestamp(timestamp);
			this.progressBarSlider.style.setProperty("--progress-bar-transform", `${relativeX * 100}%`);
		}
	}

	private formatTimestamp(timestamp: number) {
		const hasHours = timestamp >= 3600;

		const hours = Math.floor(timestamp / 3600);
		const minutes = Math.floor((timestamp % 3600) / 60);
		const seconds = Math.floor(timestamp % 60);

		if (hasHours) {
			return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
		} else {
			return `${minutes}:${String(seconds).padStart(2, "0")}`;
		}
	}
}
