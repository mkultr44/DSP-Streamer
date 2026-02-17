# Raspberry Pi DSP Streamer

A complete DSP receiver system for Raspberry Pi 4 with AirPlay, Spotify Connect, DLNA, and CamillaDSP (Crossover + FIR).

## Features
- **Inputs**: AirPlay (Shairport Sync), Spotify Connect (Librespot), UPnP/DLNA (GMediaRender)
- **DSP**: CamillaDSP with 2.1 Crossover, Parametric EQ, and FIR Filtering per channel.
- **Output**: Multichannel USB Audio (MOTU UltraLite mk5 configured).
- **Control**: Web Interface for Volume, Delays, and FIR Management.

## Installation

1. **Flash Raspberry Pi OS Lite** (64-bit recommended) to your SD card.
2. **Boot the Pi** and connect it to your network.
3. **Copy this repository** to the Pi (or clone it).
4. **Run the installer** as root:

```bash
sudo ./install.sh
```

The installer will:
- Update the system and install dependencies.
- Configure ALSA loopback.
- Install and configure CamillaDSP, Shairport Sync, Librespot, GMediaRender.
- Build and install the Web UI service.

## Configuration

### Audio Device
By default, the system assumes a generic USB output. You **must** identify your MOTU UltraLite mk5 ALSA device name and update the configuration.

1. List audio devices:
   ```bash
   aplay -l
   ```
2. Edit `/etc/camilladsp/default.yml`:
   ```yaml
   playback:
     device: "hw:UltraLiteMk5,0" # Update this line!
   ```
3. Restart CamillaDSP:
   ```bash
   sudo systemctl restart camilladsp
   ```

### Web Interface (CamillaGUI)
Access the UI at: `http://<your-pi-ip>:5005`

The official CamillaDSP GUI provides full control over the DSP pipeline:
- **Status**: View detailed system state, buffer levels, and performace.
- **Pipeline Editor**: Visually edit the filter pipeline.
- **Files**: Manage config and coefficient files directly.
- **Volume**: Master volume control.

**Note**: To use the system effectively, ensure you switch to the "Configs" tab and load the default configuration if it's not already active.

## Services
- `camilladsp` - Core DSP engine
- `shairport-sync` - AirPlay receiver
- `librespot` - Spotify Connect
- `gmediarender` - DLNA renderer
- `camillagui` - CamillaDSP Web GUI

Check status:
```bash
sudo systemctl status camillagui
```

## Logs
- CamillaDSP Application Log: `/var/log/camilladsp.log`
- CamillaGUI Log: `journalctl -u camillagui -f`
