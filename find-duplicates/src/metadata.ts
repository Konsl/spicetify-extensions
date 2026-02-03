import { SpotifyModules } from "./modules";

export enum ExtensionKind {
	UNKNOWN_EXTENSION = 0,
	TRACK_V4 = 10 // type.googleapis.com/spotify.metadata.Track
}

export enum CacheStatus {
	UNKNOWN = 0,
	OK = 1,
	NOT_RESOLVED = 2,
	NOT_FOUND = 3,
	UNAVAILABLE_FOR_LEGAL_REASONS = 4
}

export class MetadataService {
	service: any;
	serviceDescriptor: any;

	public constructor() {
		const metadataService = SpotifyModules.getMetadataService();
		const createTransport = SpotifyModules.getCreateTransport();

		if (!metadataService) return;
		if (!createTransport) return;

		this.serviceDescriptor = metadataService as any;
		this.service = new this.serviceDescriptor((createTransport as any)());
	}

	public fetch(kind: ExtensionKind, entityUri: string): Promise<{ typeUrl: string; value: Uint8Array }> {
		return new Promise((resolve, reject) => {
			if (!this.service || !this.serviceDescriptor) {
				reject(CacheStatus.UNKNOWN);
				return;
			}

			const cancel = this.service.observe(
				this.serviceDescriptor.METHODS.observe.requestType.fromPartial({
					extensionQuery: [
						{
							entityUri: entityUri,
							extensionKind: kind
						}
					]
				}),
				(response: any) => {
					if (response.pendingResponse) return;
					cancel.cancel();

					const success = response.extensionResult[0].status === 1;
					if (!success) {
						const cacheStatus: CacheStatus = response.extensionResult[0].details.cacheStatus;
						reject(cacheStatus);
						return;
					}

					const data = response.extensionResult[0].extensionData;
					resolve(data);
				}
			);
		});
	}

	public fetchAll(
		query: {
			uri: string;
			kind: ExtensionKind;
		}[]
	): Promise<
		({ uri: string; kind: ExtensionKind } & ({ success: false; status: CacheStatus } | { success: true; typeUrl: string; value: Uint8Array }))[]
	> {
		return new Promise((resolve, reject) => {
			if (!this.service || !this.serviceDescriptor) {
				reject();
				return;
			}

			const cancel = this.service.observe(
				this.serviceDescriptor.METHODS.observe.requestType.fromPartial({
					extensionQuery: query.map(q => ({ entityUri: q.uri, extensionKind: q.kind }))
				}),
				(response: any) => {
					if (response.pendingResponse) return;
					cancel.cancel();

					resolve(
						response.extensionResult.map((r: any) => {
							const success = r.status === 1;
							const result = {
								uri: r.entityUri,
								kind: r.extensionKind,
								success
							};

							if (success) {
								return {
									...result,
									typeUrl: r.extensionData.typeUrl,
									value: r.extensionData.value
								};
							} else {
								return {
									...result,
									status: r.details.cacheStatus
								};
							}
						})
					);
				}
			);
		});
	}
}
