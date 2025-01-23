# Tdarr_DoVi_Processing

A set of Tdarr plugins that can handle Dolby Vision videos in **Profiles 4, 5, 7, 8**, and **HDR10+**, remuxing them into MP4 files compatible with LG TVs (and other devices). This project originated from andrasmaroy’s [Tdarr_Plugins_DoVi](https://github.com/andrasmaroy/Tdarr_Plugins_DoVi), then expanded to include additional functionality for Profile 7 and HDR10+ with the help of ChatGPT.

---

## Overview

Many LG OLED owners (and other users) encounter problems with certain Dolby Vision (DoVi) profiles, missing HDR10 fallback, or device crashes (e.g., the Nvidia Shield showing a green or purple screen). 

- **Goal**: Preserve Dolby Vision whenever possible while ensuring the file remains playable on LG TVs and other devices.  
- **Main Approach**:  
  - Filter or identify DV files (Profiles 4, 5, 7, 8) and HDR10+ content.  
  - If DV Profile 7 lacks HDR10 fallback metadata, optionally convert it from dual-layer to single-layer (Profile 8.1).  
  - Repack or transcode as needed, then remux into MP4 with correct DoVi flags.

This README explains how the **Extract → Inject → Package** (or skip steps if not needed) pipeline works, which ensures safer playback on LG TVs and the Nvidia Shield.

---

## Key Features

1. **Handles DV Profiles 4/5/7/8 & HDR10+.**  
2. **Optional fallback detection** (checks if ST 2086 / MaxCLL / Master Display info is present).  
3. **Profile 7** can remain dual-layer or be converted to single-layer if fallback is missing.  
4. **HDR10+** → DV Profile 8 conversion using `hdr10plus_tool`.  
5. **SRT Subtitle extraction** and re-injection if desired.  
6. **Can re-encode the base HEVC** or do simple pass-through.

---

## Plugin Flow (High-Level)

1. **Check HDR type**  
   - Identifies if file is DV, HDR10+, or SDR.  
2. **Check DoVi Profile**  
   - Determines Profile 4, 5, 7, or 8.  
3. **Check for HDR10 fallback**  
   - Looks for Mastering Display / ST 2086 / CLL. If missing, flags it.  
4. **Extract / Reorder streams**  
   - Plugin to reorder audio/subtitle streams or extract raw HEVC if needed.  
5. **Process**  
   - **Profile 4/5/8**: Typically just extract RPU and inject back, then package as DV Profile 8 MP4.  
   - **Profile 7 (dual-layer)**: Keep both layers or discard the EL if fallback is missing → single-layer Profile 8.  
   - **HDR10+**: Extract HDR10+ metadata to JSON, convert to DV Profile 8.  
6. **Inject**  
   - Re-inject the RPU or newly created DV metadata.  
7. **Package**  
   - Use MP4Box or similar, add the DV container flags (`:dvp=8.1:dv-cm=hdr10`).  
8. **Remux**  
   - Final step merges original audio streams / subtitles back into an MP4 container.

---

## Detailed Plugins

Below is a quick summary of each plugin used in the flow. Many are adapted from [andrasmaroy/Tdarr_Plugins_DoVi](https://github.com/andrasmaroy/Tdarr_Plugins_DoVi) with modifications:

1. **Check HDR Type**  
   - Determines if the file is Dolby Vision, HDR10+, HDR10, or SDR by scanning MediaInfo.  
   - Adjusted to handle SMPTE ST 2094 (HDR10+) properly.

2. **Check DoVi Profile**  
   - Inspects Dolby Vision to see if it’s Profile 4, 5, 7, or 8.  
   - Unmodified from the original version.

3. **Check HDR10 Fallback Metadata**  
   - Detects missing fallback (e.g., `cll=0,0` or no mention of ST 2086 / Master Display).  
   - Flags if fallback is absent.

4. **ffmpeg - Reorder Streams DoVi**  
   - Reorders audio/subtitle/video streams so the video stream is last.  
   - Helps certain DoVi injection steps that rely on a fixed stream order.

5. **ffmpeg - Extract Streams DoVi**  
   - Extracts raw HEVC and .srt subtitles. Other tracks are dropped.  
   - You can specify which subtitle languages to keep (default: English).

6. **Extract DoVi RPU / Inject DoVi RPU / Package DoVi MP4**  
   - For **Profiles 4/5/8**: No forced `-m 2` usage. Metadata is kept intact.  
   - For **Profile 7**: 
     - **Extract DoVi 7 RPU** (dual-layer)  
     - **Inject DoVi RPU 7** (can remain dual-layer or convert to single-layer with `--discard`).  
     - **Package DoVi 7 mp4** uses MP4Box with `:dvp=8.1:dv-cm=hdr10`.

7. **Processing HDR10+**  
   - **Extract HDR10+ Metadata** → .json using `hdr10plus_tool`.  
   - **Inject HDR10+ as DoVi P8** → Convert it to DV.  
   - **Package** the new DV (Profile 8) track in MP4.

8. **Remux DoVi MP4**  
   - If input is MP4, merges existing audio/subtitle streams with the new DV video. If MKV, re-mux to MP4.  
   - Unwanted or unsupported audio (e.g., TrueHD) can be removed or re-encoded.

---

## Common Flows

**Short version**:  
[Input File] → [Extract raw HEVC stream] → [Extract Dolby Vision RPU] → [Optional re-encode HEVC / keep fallback if needed] → [Inject DV RPU] → [Package into MP4 with DV Profile 8.1] → [Remux with original audio/subtitles]


- *Note*: If you do re-encode, be careful to preserve HDR10 fallback metadata. ffmpeg may strip it unless you add `-color_primaries bt2020 -color_trc smpte2084 ... -metadata "cll=..."`.

---

## Docker Image / Environment

Because we need `dovi_tool`, `hdr10plus_tool`, and `MP4Box`, a **custom Docker image** is needed:

- **Docker Hub**: [`nichols89ben/dovi-tdarr-node:2.28.01`](https://hub.docker.com/r/nichols89ben/dovi-tdarr-node)  
- This image aligns with the current Tdarr version and includes the required tools.  
- If you’re running locally, you can install these tools yourself, but it’s untested here.

### Example Docker Compose
**- Included in this repo**

### Installing Plugins

1. Clone or download this repository.
2. Copy the `DoVi` folder into your local Flow Plugins directory:

**/path/to/server/Tdarr/Plugins/FlowPlugins/LocalFlowPlugins/DoVi**

3. **Important**: Do not place them in the “community” folder, as updates may overwrite them.

---

### Tdarr Flow JSON

- A sample **Flow JSON** is included in this repository.
- To import it into Tdarr:
1. Go to “Flow” → “Import Flow.”
2. Paste the JSON file provided, which includes the chain of plugins as described above.

---

### Notes & Tips

- **Requeue to a DoVi Node**  
Ensure your node is tagged (e.g., `DoVi_Yeezy`) to use the correct environment. Configure it under:  

Select the Custom Node > Options > Node Tags > DoVi_Yeezy

Adjust tag names if you have a different node name or want CPU/GPU only.

- **Make This the Last Flow**  
Further processing on the MP4 file may overwrite/corrupt the DoVi metadata. Best to use this flow at the end of your pipeline.

- **Replacing the Original File**  
Certain steps reference the original file for final packaging. If you’ve done prior processing, be sure to replace the original so it doesn’t revert your changes.

---

## References

- [**Tdarr_Plugins_DoVi** (original)](https://github.com/andrasmaroy/Tdarr_Plugins_DoVi)  
- [**dvmkv2mp4**](https://github.com/gacopl/dvmkv2mp4)  
- [**dovi_tool**](https://github.com/quietvoid/dovi_tool)  
- [**MP4Box** GPAC Wiki](https://wiki.gpac.io/MP4Box/MP4Box/)  
- [**hdr10plus_tool**](https://github.com/quietvoid/hdr10plus_tool)
