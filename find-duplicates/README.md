# find-duplicates
[Spicetify](https://github.com/spicetify/spicetify-cli) extension to view all releases of a song. 
* Right click a song and select "View Duplicates" to see a list of all it's releases.
## ⚙️ Install
Copy `find-duplicates/dist/find-duplicates.js` into your [Spicetify](https://github.com/spicetify/spicetify-cli) extensions directory:
| **Platform** | **Path**                                                                               |
|------------|------------------------------------------------------------------------------------------|
| **Linux**      | `~/.config/spicetify/Extensions` or `$XDG_CONFIG_HOME/.config/spicetify/Extensions/` |
| **MacOS**      | `~/.config/spicetify/Extensions` or `$SPICETIFY_CONFIG/Extensions`                   |
| **Windows**    | `%appdata%/spicetify/Extensions/`                                               |

After putting the extension file into the correct folder, run the following command to install the extension:
```
spicetify config extensions find-duplicates.js
spicetify apply
```
Note: Using the `config` command to add the extension will always append the file name to the existing extensions list. It does not replace the whole key's value.

Or you can manually edit your `config-xpui.ini` file. Add your desired extension filenames in the extensions key, separated them by the | character.
Example:

```ini
[AdditionalOptions]
...
extensions = shuffle+.js|trashbin.js|find-duplicates.js
```

Then run:

```
spicetify apply
```

## 🪄  Usage
- Right click a song and select "View Duplicates".

[![Screenshot](screenshot.png)](https://raw.githubusercontent.com/Konsl/spicetify-extensions/main/find-duplicates/screenshot.png)

##  More
🌟 Like it? Gimme some love!    
[![Github Stars badge](https://img.shields.io/github/stars/Konsl/spicetify-extensions?logo=github&style=social)](https://github.com/Konsl/spicetify-extensions/)

If you find any bugs or places where podcasts are still showing up, please [create a new issue](https://github.com/Konsl/spicetify-extensions/issues/new/choose) on the GitHub repo.    
![https://github.com/Konsl/spicetify-extensions/issues](https://img.shields.io/github/issues/Konsl/spicetify-extensions?logo=github)
