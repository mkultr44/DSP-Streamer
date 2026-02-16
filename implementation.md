You are coding a Raspberry Pi 4 “DSP receiver” system with a Web UI. The Pi will expose 3 parallel network audio inputs:

1) AirPlay Receiver: Shairport Sync
2) UPnP/DLNA Renderer: GMediaRender
3) Spotify Connect: Librespot

All audio from any of these sources must feed into ONE common input (ALSA loopback), then go through CamillaDSP (2.1 crossover + FIR), and finally to a single USB multichannel audio interface (MOTU UltraLite mk5) for sample-accurate outputs.

You are NOT running Codex on the Pi. Deliverables must include:
- A repo with backend + frontend + config templates
- A single “install.sh” script that installs everything + dependencies on a fresh Raspberry Pi OS Lite (Debian-based), sets up services, and leaves the system working headless.
- systemd unit files for all services
- CamillaDSP config(s) matching the DSP topology below
- A minimal README with exact commands to run install.sh and access the UI

HARDWARE / WIRING
- Raspberry Pi 4
- USB Audio Interface: MOTU UltraLite mk5 (single device used for ALL outputs)
- UltraLite Out 1/2 -> SMSL A300 -> Top speakers L/R
- UltraLite Out 3 -> Subwoofer (mono)
- Optional: mirror Sub to Out 4 (for convenience)

AUDIO TOPOLOGY (must match)
Input is stereo (L/R) from the chosen source:
- Pre-PEQ (parametric EQ block; start with a single band but structure must allow multiple)
- Input HPF (rumble protection, e.g., 20 Hz)
- Crossover LR24 at adjustable frequency (default 80 Hz)
  - High path (L and R separately):
    - Delay per channel (ms, default 0)
    - FIR convolution per channel (Dirac Live-exported WAVs)
    - Gain per channel (dB)
    - Output -> UltraLite channels 1/2
  - Low path:
    - Lowpass LR24 applied on L and R
    - Sum to mono (0.5*L + 0.5*R)
    - FIR convolution for sub (Dirac WAV)
    - Gain (dB)
    - Output -> UltraLite channel 3 (and optionally 4 mirrored)

FIR FILES
Dirac Live-generated FIR WAV files will be placed on the Pi and selectable via UI:
- /etc/camilladsp/firs/fir_l.wav
- /etc/camilladsp/firs/fir_r.wav
- /etc/camilladsp/firs/fir_sub.wav
UI must allow upload/replace and selection. Show basic metadata (samplerate, length/taps).
Optional tool: “Trim FIR” (symmetrically around impulse peak; optional Hann fade) to reduce latency.

CORE ROUTING REQUIREMENT (single shared input)
All 3 sources output to ALSA loopback playback: hw:Loopback,0,0
CamillaDSP capture reads from ALSA loopback capture: hw:Loopback,1,0
CamillaDSP playback writes to the MOTU UltraLite mk5 ALSA device

Use snd-aloop (ALSA loopback kernel module). install.sh must ensure it loads at boot.

SERVICES (systemd)
Provide unit files and enable/start them in install.sh:
- camilladsp.service
  - Must run CamillaDSP with websocket control enabled on a fixed local port (e.g. 1234). CamillaDSP supports enabling websocket via a port flag (-p / --port depending on version). Configure it accordingly. (CamillaDSP websocket control doc: https://henquist.github.io/0.5.0/websocket.html and https://github.com/HEnquist/camilladsp/blob/master/websocket.md)
- shairport-sync.service
  - Configure as AirPlay receiver with ALSA backend and output_device pointing to hw:Loopback,0,0. (Shairport Sync docs show output_backend=alsa and alsa.output_device settings in config/manpage.)
- gmediarender.service
  - Start gmediarender with a friendly name and ALSA output to hw:Loopback,0,0 (gmediarender supports an ALSA device arg).
- librespot.service
  - Run librespot in Spotify Connect mode; output backend ALSA and device set to hw:Loopback,0,0 (librespot supports ALSA backend/device selection; also ensure it doesn’t fight for exclusive access to the MOTU because it only writes to loopback).

WEB INTERFACE (must be simple and reliable)
Implement a local web server + UI accessible on LAN (HTTP). No cloud.
Backend language: Node.js (Express) OR Python (FastAPI) – choose one and implement fully.
Frontend: minimal React/Vite OR plain HTML + minimal JS; must be responsive.

UI REQUIREMENTS
1) Dashboard
- Show which source is currently active (best-effort detection: monitor audio level on loopback input or show “last started service”)
- Show CamillaDSP status: running, samplerate, xruns if available via websocket
- Show output routing mapping (Tops = Out1/2, Sub = Out3[/4])
2) Live Controls (via CamillaDSP websocket)
- Master gain
- Top L gain, Top R gain, Sub gain
- Top L delay, Top R delay, Sub delay
- Crossover frequency (default 80 Hz; range 50–120)
- Mute toggles for Top L, Top R, Sub
3) Presets
- Save/load named presets that persist to disk (YAML/JSON). Presets include gains, delays, crossover freq, FIR file selections, PEQ values.
4) FIR Manager
- Upload/replace FIR files for L/R/Sub
- Select active FIR per channel
- Display taps/length/samplerate
- Optional: FIR trimming utility described above

CONTROL PLANE
Use CamillaDSP websocket API for:
- Loading config / setting parameters / querying status
CamillaDSP must be started with websocket server enabled (port fixed). (Docs above.)

INSTALLATION SCRIPT (MANDATORY)
Create install.sh that:
- Runs on Raspberry Pi OS Lite (Debian-based) as root/sudo
- Installs packages: camilladsp, shairport-sync, gmediarender, required build deps if librespot not in repo; also installs Node/Python runtime for the web app
- Installs/places configuration files:
  - /etc/camilladsp/camilladsp.yml (and presets/firs directories)
  - /etc/shairport-sync.conf (or equivalent)
  - systemd units to /etc/systemd/system/
- Enables snd-aloop load at boot and loads it immediately
- Creates a dedicated system user for the web app (optional but preferred)
- Enables and starts services
- Prints final success info: Pi hostname/IP, UI port, service statuses

NON-GOALS / CONSTRAINTS
- Do NOT use the Pi’s analog output at all.
- Do NOT require any manual steps beyond running install.sh and rebooting if needed.
- Assume UltraLite mk5 is connected by USB. Provide a mechanism to set the ALSA device string in a config file (e.g., /etc/camilladsp/device.conf) and document how to discover it with aplay -l.
- Only one audio source should be used at a time; but all three services can be installed/enabled.

DELIVERABLE STRUCTURE (suggested)
repo/
  install.sh
  backend/...
  frontend/...
  systemd/
    camilladsp.service
    shairport-sync.service
    gmediarender.service
    librespot.service
    rpidsp-web.service
  config-templates/
    camilladsp.yml
