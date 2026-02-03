import { PBMessage, make, PBString, PBRepeated } from "./defs";

const ExternalId = PBMessage({
	type: make(1, PBString),
	id: make(2, PBString)
});

export const Track = PBMessage({
	externalId: make(10, PBRepeated(ExternalId))
	// ... (this is obviously not complete)
});
