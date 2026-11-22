# Stremio Downloader — Community Edition

[![Windows executable](https://github.com/xbeatriz/stremio-downloader-fixed/actions/workflows/windows-release.yml/badge.svg)](https://github.com/xbeatriz/stremio-downloader-fixed/actions/workflows/windows-release.yml)
[![Latest release](https://img.shields.io/github/v/release/xbeatriz/stremio-downloader-fixed?display_name=tag)](https://github.com/xbeatriz/stremio-downloader-fixed/releases/latest)

A community-maintained fork of [BurningSands70/stremio-downloader](https://github.com/BurningSands70/stremio-downloader), with a redesigned desktop interface, live download tracking, and experimental video metadata detection.

> **Project version:** `1.1.0` — see [package.json](package.json) for the authoritative application version. The [Releases page](https://github.com/xbeatriz/stremio-downloader-fixed/releases) lists published builds. A release is available only after its workflow finishes successfully.

## Download for Windows

**[Get the latest Windows release (.zip)](https://github.com/xbeatriz/stremio-downloader-fixed/releases/latest)**

1. Open **Releases**, choose a published version, and download `StremioDownloader-<version>-windows-x64.zip`.
2. Extract **all** the contents into a folder.
3. Launch **StremioDownloader.exe** inside the extracted folder. This is a **portable Windows x64 application**, not an installer. Keep the accompanying files and folders.
4. Click **Open Stremio** and select a stream to download.

The application is community-maintained and **not code-signed**. Windows SmartScreen may display a warning. Download only from the repository's own Releases page, and review the source code if you need to assess the application before running it.

**No release available yet?** The GitHub Actions workflow also produces a temporary build artifact from `main`: go to [Actions → Windows executable](https://github.com/xbeatriz/stremio-downloader-fixed/actions/workflows/windows-release.yml), open a successful run, and download its artifact. You need to be signed in to GitHub to download Actions artifacts. The artifact expires after 30 days. The versioned ZIP inside the artifact contains the portable app.

## Features

- Modern dark desktop dashboard with search and download status filters.
- Real-time progress, transfer speed, estimated time remaining (ETA), and downloaded size for supported HTTP streams.
- Open the download folder; stop, restart, or remove downloads; open completed videos.
- Experimental detection of video codec (including HEVC/H.265), resolution, embedded audio languages, audio codecs, channels, and embedded subtitle languages through **FFprobe**.
- Stremio integration and a downloader add-on from the original project.

> **Limitations:** Torrent downloads require the Stremio desktop application and its streaming server to be running. Speed and ETA may not be available for HLS streams. Some partially downloaded files cannot be probed until the download has finished. Audio language depends on file metadata and may be missing or incorrect. External subtitle files are not scanned.

## Optional FFprobe setup (media information)

FFprobe is **not bundled** in the portable ZIP. To display audio-language, subtitle, and codec information, install FFmpeg/FFprobe separately.

1. Download a Windows FFmpeg build containing `ffprobe.exe` from [FFmpeg's download page](https://ffmpeg.org/download.html) (which links to Windows build providers).
2. Add the folder containing `ffprobe.exe` to your Windows user `PATH`, then restart Stremio Downloader.
3. Check in a new PowerShell window:

   ```powershell
   ffprobe -version
   ```

Alternatively, set the environment variable `FFPROBE_PATH` to the full path of `ffprobe.exe` before launching the application. No media conversion is performed by the metadata scanner.

## Run from source (Windows)

Install Node.js and Git. The project is based on **legacy Electron 6** and older Node.js dependencies, so current Node versions may need compatibility workarounds.

```powershell
git clone https://github.com/xbeatriz/stremio-downloader-fixed.git
cd stremio-downloader-fixed
npm install
npm start
```

When running from source, you can create a Windows x64 portable directory with:

```powershell
npm run build:win
```

The executable will be under `packages/StremioDownloader-win32-x64/`.

## Versioning and GitHub Actions

The [Windows executable workflow](.github/workflows/windows-release.yml) runs for pushes to `main` and via **Run workflow**. It reads the version from `package.json`, builds a Windows x64 portable directory, and uploads a downloadable ZIP as an **Actions artifact**.

To publish a **permanent GitHub Release**, update `package.json` to the intended version, then push a matching tag:

```powershell
git tag v1.1.0
git push origin v1.1.0
```

Only tag a commit containing that same version in `package.json`. When the tag build succeeds, its ZIP is attached automatically to a GitHub Release. Do not create a tag or claim the EXE works until its build has been verified.

## Troubleshooting

- **Can't download torrents:** Start Stremio desktop and verify its streaming server is available.
- **HEVC/H.265 won't play:** Try a player that supports HEVC, such as [VLC](https://www.videolan.org/vlc/). Downloading and decoding are separate operations.
- **Audio language unknown:** Install FFprobe, wait for the file to become readable, and check whether it includes language tags.
- **No executable in Releases:** Check [Windows build runs](https://github.com/xbeatriz/stremio-downloader-fixed/actions/workflows/windows-release.yml). There must be a successful tagged build before a Release ZIP appears.

More details: [Technical changes and known limitations](README-CORRECAO.md).

## Credits and legal notes

Original project by [BurningSands70](https://github.com/BurningSands70/stremio-downloader). This fork is an independent community effort, not an official Stremio application. See the upstream repository for its licensing and attribution information. Download only media you are authorized to access and save.
