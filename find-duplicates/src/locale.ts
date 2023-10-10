type Translation = {
	contextMenuText: string;
	errorCouldNotRetrieveISRC: string;
};

const translationTable: { [language: string]: Translation } = {
	de: {
		contextMenuText: "Duplikate anzeigen",
		errorCouldNotRetrieveISRC: "Felher: ISRC konnte nicht abgerufen werden"
	},
	en: {
		contextMenuText: "View Duplicates",
		errorCouldNotRetrieveISRC: "Error: Could not retrieve ISRC"
	}
};

export function getTranslation() {
	return translationTable[Spicetify.Locale._locale] ?? translationTable["en"];
}
