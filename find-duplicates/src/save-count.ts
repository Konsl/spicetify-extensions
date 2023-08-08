import { getLibraryISRCCache } from "./cache";
import { getHeartRenderer, getHeartRendererEntry } from "./heart-renderer";
import { cacheTracks } from "./isrc";
import { isLibraryUpdateRunning } from "./library";

interface RegisteredEntry {
    uri: string;
    setCount: any;
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
        entry.setCount(count(isrcEntries.find(e => e[0] == entry.uri)?.[1] as string));
        entry.setup = true;
    }

    SaveCount.started = false;
}

function count(isrc: string): number {
    const list = getLibraryISRCCache();
    return list.filter(entry => entry[1] == isrc).length;
}

function register(entry: RegisteredEntry) {
    SaveCount.registeredEntries.push(entry);
    if (!SaveCount.started) {
        SaveCount.started = true;

        setTimeout(async () => {
            if (isLibraryUpdateRunning()) return;

            const uninitializedEntries = SaveCount.registeredEntries.filter(entry => !entry.setup);

            const neededTracks = [...new Set(uninitializedEntries.map(entry => entry.uri))];
            const isrcEntries = await cacheTracks(neededTracks);

            for (const entry of uninitializedEntries) {
                entry.setCount(count(isrcEntries.find(e => e[0] == entry.uri)?.[1] as string));
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

        const [count, setCount] = Spicetify.React.useState(0);

        Spicetify.React.useEffect(() => {
            const entry = { uri, setCount, setup: false };
            register(entry);

            return () => deregister(entry);
        }, []);

        const returned = (getHeartRenderer() as Function).apply(this, arguments);
        return Spicetify.React.createElement(Spicetify.React.Fragment, {
            children: [
                count ? Spicetify.React.createElement("span", {
                    class: "TypeElement-mesto-textSubdued-type"
                }, count.toString()) : undefined,
                returned
            ]
        });
    };

    // reload page
    Spicetify.Platform.History.replace(Spicetify.Platform.History.location);
}