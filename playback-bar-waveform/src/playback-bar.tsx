const ANIMATION_DURATION = 160;
const WAVEFORM_HEIGHT_PROP = "--progress-bar-waveform-height";
const WAVEFORM_HEIGHT_CSS = `var(${WAVEFORM_HEIGHT_PROP}, 24px)`;
const MASK_ID = "progress_bar_waveform_mask";
const PLAYBACK_BAR_SELECTOR = ".main-nowPlayingBar-center .playback-bar";
const PROGRESS_BAR_SELECTOR =
	"[data-testid='progress-bar'], [data-testid='playback-progressbar'], .playback-progressbar-container, .x-progressBar-progressBar, .progress-bar";
const PROGRESS_BAR_BG_SELECTOR = ".x-progressBar-background, .x-progressBar-progressBarBg";
const PROGRESS_BAR_SLIDER_AREA_SELECTOR = ".x-progressBar-foregroundWrapper, .x-progressBar-sliderArea";
const PROGRESS_BAR_SLIDER_SELECTOR = ".x-progressBar-handle, .progress-bar__slider";
const PROGRESS_BAR_FILL_SELECTOR = ".x-progressBar-fillColor, .x-progressBar-progressFillColor";

export class PlaybackBarManager {
	private playbackBar: HTMLElement | null = null;
	private progressBar: HTMLElement | null = null;
	private progressBarBg: HTMLElement | null = null;
	private progressBarSliderAreas: HTMLElement[] = [];
	private progressBarSlider: HTMLElement | null = null;

	private maskSvgImageElement: SVGElement | null = null;
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
.main-nowPlayingBar-center .playback-bar .x-progressBar-progressBar .x-progressBar-background,
.main-nowPlayingBar-center .playback-bar .x-progressBar-progressBar .x-progressBar-progressBarBg,
.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-background,
.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-progressBarBg,
.main-nowPlayingBar-center .playback-bar .progress-bar .x-progressBar-background,
.main-nowPlayingBar-center .playback-bar .progress-bar .x-progressBar-progressBarBg {
    background: none;
}

.main-nowPlayingBar-center .playback-bar .x-progressBar-progressBar .x-progressBar-foregroundWrapper,
.main-nowPlayingBar-center .playback-bar .x-progressBar-progressBar .x-progressBar-sliderArea,
.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-foregroundWrapper,
.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-sliderArea,
.main-nowPlayingBar-center .playback-bar .progress-bar .x-progressBar-foregroundWrapper,
.main-nowPlayingBar-center .playback-bar .progress-bar .x-progressBar-sliderArea {
    background: var(--bg-color);
}

.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-progressFillColor,
.main-nowPlayingBar-center .playback-bar [data-testid='progress-bar'] .x-progressBar-fillColor {
    height: 100%;
}

.x-progressBar-progressBar:hover .x-progressBar-handle[data-timestamp]::before,
.x-progressBar-progressBar:hover .progress-bar__slider[data-timestamp]::before,
[data-testid='progress-bar']:hover .x-progressBar-handle[data-timestamp]::before,
[data-testid='progress-bar']:hover .progress-bar__slider[data-timestamp]::before,
.progress-bar:hover .x-progressBar-handle[data-timestamp]::before,
.progress-bar:hover .progress-bar__slider[data-timestamp]::before {
    visibility: visible;
}

.x-progressBar-progressBar:hover .x-progressBar-handle::before,
.x-progressBar-progressBar:hover .progress-bar__slider::before,
[data-testid='progress-bar']:hover .x-progressBar-handle::before,
[data-testid='progress-bar']:hover .progress-bar__slider::before,
.progress-bar:hover .x-progressBar-handle::before,
.progress-bar:hover .progress-bar__slider::before {
    visibility: hidden;
    
    background: var(--spice-card);
    border-radius: 2px;
    padding: 1px 3px;
    position: absolute;
    
    font-size: 10px;
    bottom: calc(${WAVEFORM_HEIGHT_CSS} - 4px);
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

		this.playbackBar = document.querySelector(PLAYBACK_BAR_SELECTOR);
		this.progressBar = this.playbackBar?.querySelector(PROGRESS_BAR_SELECTOR) ?? null;
		this.progressBarBg =
			(this.progressBar?.querySelector(PROGRESS_BAR_BG_SELECTOR) as HTMLElement | null) ?? this.progressBar;
		this.progressBarSliderAreas = this.resolveProgressBarSliderAreas();
		this.progressBarSlider =
			this.progressBar?.querySelector(PROGRESS_BAR_SLIDER_SELECTOR) ??
			this.progressBarBg?.querySelector(PROGRESS_BAR_SLIDER_SELECTOR) ??
			null;

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

		while (!(this.playbackBar = document.querySelector(PLAYBACK_BAR_SELECTOR))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (!(this.progressBar = this.playbackBar.querySelector(PROGRESS_BAR_SELECTOR))) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		this.progressBarBg =
			(this.progressBar.querySelector(PROGRESS_BAR_BG_SELECTOR) as HTMLElement | null) ?? this.progressBar;

		while ((this.progressBarSliderAreas = this.resolveProgressBarSliderAreas()).length === 0) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		while (
			!(this.progressBarSlider =
				this.progressBar.querySelector(PROGRESS_BAR_SLIDER_SELECTOR) ??
				this.progressBarBg?.querySelector(PROGRESS_BAR_SLIDER_SELECTOR) ??
				null)
		) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		this.setupHTMLElements();
	}

	private resolveProgressBarSliderAreas(): HTMLElement[] {
		const sliderAreas = [
			...(this.progressBar?.querySelectorAll(PROGRESS_BAR_SLIDER_AREA_SELECTOR) ?? [])
		] as HTMLElement[];
		const fillSliderAreas = sliderAreas.filter(e => e.querySelector(PROGRESS_BAR_FILL_SELECTOR));

		if (fillSliderAreas.length) return fillSliderAreas;
		return sliderAreas;
	}

	private getMaskTargets(): HTMLElement[] {
		return this.progressBarSliderAreas;
	}

	private setupHTMLElements() {
		this.resizeObserver.observe(this.progressBarSliderAreas[0]);
		this.applyMaskToTargets();
	}

	private applyMaskToTargets() {
		this.getMaskTargets().forEach(e => {
			e.style.mask = `url(#${MASK_ID})`;
			e.style.webkitMask = `url(#${MASK_ID})`;
		});
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
		this.applyMaskToTargets();

		if (this.progressBar) this.progressBar.style.height = WAVEFORM_HEIGHT_CSS;
		if (this.progressBarBg) {
			this.progressBarBg.style.height = WAVEFORM_HEIGHT_CSS;
			this.progressBarBg.style.overflow = "hidden";
		}
		this.progressBarSliderAreas.forEach(e => {
			e.style.height = "100%";
		});

		this.animations.push(
			...[
				this.playbackBar?.animate(
					[
						{
							height: WAVEFORM_HEIGHT_CSS
						}
					],
					options
				),
				this.progressBar?.animate(
					[
						{
							"--progress-bar-height": WAVEFORM_HEIGHT_CSS,
							"--progress-bar-radius": "0px"
						}
					],
					options
				),
				this.progressBarSlider?.animate(
					[
						{
							height: WAVEFORM_HEIGHT_CSS,
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
		this.getMaskTargets().forEach(e => {
			e.style.removeProperty("mask");
			e.style.removeProperty("-webkit-mask");
			e.style.removeProperty("height");
		});
		this.progressBarBg?.style.removeProperty("height");
		this.progressBarBg?.style.removeProperty("overflow");
		this.progressBar?.style.removeProperty("height");

		if (this.progressBarSlider) {
			this.progressBarSlider.style.transition = "";
			this.progressBarSlider.style.removeProperty("--progress-bar-transform");
			delete this.progressBarSlider.dataset["timestamp"];
		}

		this.maskEnabled = false;
	}

	public async getMaskSize(): Promise<{ width: number; height: number }> {
		await this.ensureHasHTMLElementsPromise();
		const areaElement = this.progressBarSliderAreas[0];
		if (!areaElement) return { width: 1, height: 1 };

		const rect = areaElement.getBoundingClientRect();
		const waveformHeight = areaElement.computedStyleMap().get(WAVEFORM_HEIGHT_PROP)?.toString();
		const waveformHeightPx = parseInt(/(\d+)px/.exec(waveformHeight ?? "")?.[1] ?? "") || 24;

		return {
			width: rect.width * window.devicePixelRatio,
			height: waveformHeightPx * window.devicePixelRatio
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
		const interactionElement = this.progressBarSliderAreas[0] ?? this.progressBarBg;
		if (!interactionElement) return;
		const rect = interactionElement.getBoundingClientRect();

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
