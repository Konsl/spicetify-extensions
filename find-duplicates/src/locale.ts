export type SpicetifyWithLocale = typeof Spicetify & {
	Locale: {
		_locale:
			| "af"
			| "am"
			| "ar-EG"
			| "ar-MA"
			| "ar-SA"
			| "ar"
			| "az"
			| "bg"
			| "bho"
			| "bn"
			| "bs"
			| "ca"
			| "cs"
			| "da"
			| "de"
			| "el"
			| "en-GB"
			| "en"
			| "es-419"
			| "es-AR"
			| "es-MX"
			| "es"
			| "et"
			| "eu"
			| "fa"
			| "fi"
			| "fil"
			| "fr-CA"
			| "fr"
			| "gl"
			| "gu"
			| "he"
			| "hi"
			| "hr"
			| "hu"
			| "id"
			| "is"
			| "it"
			| "ja"
			| "kn"
			| "ko"
			| "lt"
			| "lv"
			| "mk"
			| "ml"
			| "mr"
			| "ms"
			| "nb"
			| "ne"
			| "nl"
			| "or"
			| "pa-IN"
			| "pa-PK"
			| "pl"
			| "pt-BR"
			| "pt-PT"
			| "ro"
			| "ru"
			| "sk"
			| "sl"
			| "sr"
			| "sv"
			| "sw"
			| "ta"
			| "te"
			| "th"
			| "tr"
			| "uk"
			| "ur"
			| "vi"
			| "zh-CN"
			| "zh-HK"
			| "zh-TW"
			| "zu";
	};
};

const translationTable = {
	af: undefined,
	am: undefined,
	"ar-EG": undefined,
	"ar-MA": undefined,
	"ar-SA": undefined,
	ar: undefined,
	az: undefined,
	bg: undefined,
	bho: undefined,
	bn: undefined,
	bs: undefined,
	ca: undefined,
	cs: undefined,
	da: undefined,
	de: {
		contextMenuText: "Duplikate anzeigen",
		errorCouldNotRetrieveISRC: "Felher: ISRC konnte nicht abgerufen werden"
	},
	el: undefined,
	"en-GB": undefined,
	en: {
		contextMenuText: "View Duplicates",
		errorCouldNotRetrieveISRC: "Error: Could not retrieve ISRC"
	},
	"es-419": undefined,
	"es-AR": undefined,
	"es-MX": undefined,
	es: undefined,
	et: undefined,
	eu: undefined,
	fa: undefined,
	fi: undefined,
	fil: undefined,
	"fr-CA": undefined,
	fr: undefined,
	gl: undefined,
	gu: undefined,
	he: undefined,
	hi: undefined,
	hr: undefined,
	hu: undefined,
	id: undefined,
	is: undefined,
	it: undefined,
	ja: undefined,
	kn: undefined,
	ko: undefined,
	lt: undefined,
	lv: undefined,
	mk: undefined,
	ml: undefined,
	mr: undefined,
	ms: undefined,
	nb: undefined,
	ne: undefined,
	nl: undefined,
	or: undefined,
	"pa-IN": undefined,
	"pa-PK": undefined,
	pl: undefined,
	"pt-BR": undefined,
	"pt-PT": undefined,
	ro: undefined,
	ru: undefined,
	sk: undefined,
	sl: undefined,
	sr: undefined,
	sv: undefined,
	sw: undefined,
	ta: undefined,
	te: undefined,
	th: undefined,
	tr: undefined,
	uk: undefined,
	ur: undefined,
	vi: undefined,
	"zh-CN": undefined,
	"zh-HK": undefined,
	"zh-TW": undefined,
	zu: undefined
};

export function getTranslation() {
	return translationTable[(Spicetify as SpicetifyWithLocale).Locale._locale] ?? translationTable["en"];
}
