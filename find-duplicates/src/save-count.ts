import { getLibraryISRCCache } from "./cache";
import { getHeartRenderer, getHeartRendererEntry } from "./heart-renderer";
import { cacheTracks } from "./isrc";
import { isLibraryUpdateRunning } from "./library";

interface RegisteredEntry {
    uri: string;
    setState: any;
    setup: boolean;
}

class SaveCount {
    static registeredEntries: RegisteredEntry[] = [];
    static started: boolean = false;
}

export async function refreshSaveCounts() {
    const neededTracks = [...new Set(SaveCount.registeredEntries.map(entry => entry.uri))];
    const isrcEntries = await cacheTracks(neededTracks);

    for (const entry of SaveCount.registeredEntries) {
        entry.setState(getState(entry.uri, isrcEntries.find(e => e[0] == entry.uri)?.[1] as string));
        entry.setup = true;
    }

    SaveCount.started = false;
}

function getState(uri: string, isrc: string): { count: number; saved: boolean; nextEntry: string } {
    const list = getLibraryISRCCache();
    const isrcMatches = list.filter((entry) => entry[1] == isrc);
    const saved = isrcMatches.some((entry) => entry[0] == uri);

    let nextEntry = "";
    if (saved) {
        const index = isrcMatches.findIndex((entry) => entry[0] == uri);
        const nextIndex = (index + 1) % isrcMatches.length;

        nextEntry = isrcMatches[nextIndex][0];
    } else if (isrcMatches.length > 0) {
        nextEntry = isrcMatches[0][0];
    }

    return {
        count: isrcMatches.length,
        saved,
        nextEntry,
    };
}

function register(entry: RegisteredEntry) {
    SaveCount.registeredEntries.push(entry);
    if (!SaveCount.started) {
        SaveCount.started = true;

        setTimeout(async () => {
            if (isLibraryUpdateRunning()) return;

            const uninitializedEntries = SaveCount.registeredEntries.filter(entry => !entry.setup);

            const neededTracks = [...new Set(uninitializedEntries.map((entry) => entry.uri))];
            const isrcEntries = await cacheTracks(neededTracks);

            for (const entry of uninitializedEntries) {
                entry.setState(getState(entry.uri, isrcEntries.find(e => e[0] == entry.uri)?.[1] as string));
                entry.setup = true;
            }

            SaveCount.started = false;
        }, 0);
    }
}

function deregister(entry: RegisteredEntry) {
    const index = SaveCount.registeredEntries.indexOf(entry);
    if (index >= 0) SaveCount.registeredEntries.splice(index, 1);
}

export function initSaveCount() {
    const heartRendererEntry = getHeartRendererEntry();
    if (!heartRendererEntry) {
        Spicetify.showNotification("Error while attaching save count", true);
        return;
    }

    heartRendererEntry.type = function (params) {
        const uri = params.uri;

        const [state, setState] = Spicetify.React.useState({
            count: 0,
            saved: false,
            nextEntry: "",
        });

        Spicetify.React.useEffect(() => {
            const entry = { uri, setState, setup: false };
            register(entry);

            return () => deregister(entry);
        }, [uri]);

        const onLabelClick = Spicetify.React.useCallback(() => {
            const target = `/collection/tracks?uri=${encodeURIComponent(
                state.nextEntry
            )}`;

            const isOnTracksPage =
                Spicetify.Platform.History.location?.pathname ===
                "/collection/tracks";

            if (isOnTracksPage) Spicetify.Platform.History.replace(target);
            else Spicetify.Platform.History.push(target);

            return false;
        }, [state.nextEntry]);

        const returned = (getHeartRenderer() as Function).apply(this, arguments);

        const count = state.count - (state.saved ? 1 : 0);
        const countLabel = state.saved ? `+${count}` : count.toString();

        return Spicetify.React.createElement(Spicetify.React.Fragment, {
            children: [
                count
                    ? Spicetify.React.createElement(
                          "a",
                          {
                              class: "TypeElement-mesto-textSubdued-type",
                              href: "#",
                              onClick: onLabelClick,
                          },
                          countLabel
                      )
                    : undefined,
                returned,
            ],
        });
    };

    // reload page
    Spicetify.Platform.History.replace(Spicetify.Platform.History.location);
}
