# Technical changes and fixes — Stremio Downloader

This repository is a community-maintained fork of [BurningSands70/stremio-downloader](https://github.com/BurningSands70/stremio-downloader). It contains compatibility changes, a redesigned interface, and experimental media inspection.

**Current source version:** `1.1.0` (defined in [package.json](package.json)). A version number does **not** guarantee that a Windows executable has been successfully built or published. See [GitHub Actions](https://github.com/xbeatriz/stremio-downloader-fixed/actions/workflows/windows-release.yml) and [Releases](https://github.com/xbeatriz/stremio-downloader-fixed/releases) for actual availability.

## Networking and Stremio integration

- Preferred local server port: `8189`, with a fallback to an available port.
- Local server listens on `127.0.0.1`.
- HTTPS proxy to the Stremio web application.
- Binary HTTP responses are preserved instead of being incorrectly manipulated as text.
- CSS font URL rewriting was corrected to preserve valid quoting.
- Better proxy error reporting for troubleshooting.

When running locally, check the console for the actual listening port and open `http://127.0.0.1:<port>/downloader/` if required.

## Dashboard redesign

The original Material Design/jQuery-dependent interface was replaced with a dark, responsive dashboard using browser-native JavaScript and local CSS.

- Search, status filters, transfer cards, and aggregate download counts.
- Progress bars, download speed and estimated time remaining for supported downloads.
- Actions to stop, restart, remove, locate, and open downloaded files.
- Dialog handling adjusted for the legacy Electron runtime (including avoiding `replaceChildren()`, which the old Chromium version does not support).

## Video, audio, and subtitle metadata (experimental)

`lib/mediaMetadata.js` invokes the local **FFprobe executable** to inspect downloaded video files. The transfer API includes detected metadata when available:

- Video codec and resolution (e.g., HEVC/H.265).
- Embedded audio tracks, codecs, channels, and language metadata.
- Embedded subtitle tracks and language metadata.

### FFprobe requirement

Install FFmpeg/FFprobe separately. It is **not included** in the Windows release archive.

```powershell
ffprobe -version
```

Ensure `ffprobe.exe` is available on the system `PATH`, or set `FFPROBE_PATH` to the full executable path before launching the app. Windows builds are available from providers linked by [ffmpeg.org](https://ffmpeg.org/download.html).

The scanner reads local file metadata only. It does not transcode videos, perform speech recognition, or change how downloads are transferred.

### Known limitations

- An incomplete MKV/MP4 may not contain enough data to inspect, particularly if metadata is stored at the end.
- Files are inspected asynchronously and retried; metadata may only become available after download completion.
- Language labels are based on metadata tags. Missing or incorrect tags cannot be reliably determined from the file header alone.
- External subtitle files (such as separate `.srt` files) are not scanned.
- FFprobe is an external dependency, and absent/unreadable files are reported as unavailable.
- The original download and streaming code still uses old libraries, including Electron 6, `request`, and `easy-ffmpeg`. These require continued maintenance and testing.

## Windows packaging and releases

The workflow at [`.github/workflows/windows-release.yml`](.github/workflows/windows-release.yml) builds a **portable Windows x64 application** using `electron-packager`.

- Runs on pushes to `main` or manual dispatch, producing a temporary GitHub Actions artifact.
- Reads the application version from `package.json`.
- On tags matching `v*`, validates that the tag matches the `package.json` version, then uploads the portable ZIP to a GitHub Release.
- The release ZIP includes `StremioDownloader.exe` **and supporting runtime files**. It is not a standalone executable and is not an installer.
- No code signing or Windows installer is configured.

To run locally:

```powershell
npm install
npm start
```

To package on Windows:

```powershell
npm run build:win
```

Before publishing a stable release, verify the workflow completes, launch the extracted application on a clean Windows system, test Stremio login/source selection, inspect HTTP and torrent transfers, and test Windows SmartScreen behavior. Building the package does not prove runtime compatibility.

## Attribution

Original source: [BurningSands70/stremio-downloader](https://github.com/BurningSands70/stremio-downloader).

This is an independent community fork, not an official Stremio release. Please respect applicable licensing, copyright, and usage permissions.
