#!/bin/bash
set -e

# DSP Streamer Installer for Raspberry Pi OS Lite (Debian-based)

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

echo "Updating system..."
apt-get update && apt-get upgrade -y

echo "Installing core dependencies..."
apt-get install -y git curl wget build-essential pkg-config libasound2-dev alsa-utils python3-pip python3-venv

# Install Node.js (for frontend build)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
fi

# Install CamillaDSP
if ! command -v camilladsp &> /dev/null; then
    echo "Installing CamillaDSP..."
    # Fetch latest release from GitHub (assuming arm64 or armv7 depending on Pi OS)
    # Using a fixed version for stability or latest
    CDSP_VER="v2.0.3" # Check for latest version at runtime or use a known good one
    ARCH=$(dpkg --print-architecture)
    if [ "$ARCH" = "arm64" ]; then
        url="https://github.com/HEnquist/camilladsp/releases/download/$CDSP_VER/camilladsp-linux-aarch64.tar.gz"
    else
        url="https://github.com/HEnquist/camilladsp/releases/download/$CDSP_VER/camilladsp-linux-armv7.tar.gz"
    fi
    wget -O /tmp/camilladsp.tar.gz "$url"
    tar -xvf /tmp/camilladsp.tar.gz -C /usr/local/bin/
    chmod +x /usr/local/bin/camilladsp
    rm /tmp/camilladsp.tar.gz
fi

# Install Shairport Sync
echo "Installing Shairport Sync..."
apt-get install -y shairport-sync

# Install GMediaRender
echo "Installing GMediaRender..."
apt-get install -y gmediarender

# Install Librespot
# Librespot is often best built from source or installed via cargo, but cargo on Pi takes a while.
# Trying to find a prebuilt binary or use cargo if necessary.
if ! command -v librespot &> /dev/null; then
    echo "Installing Librespot (via Cargo, this may take a while)..."
    apt-get install -y cargo rustc
    cargo install librespot --root /usr/local
fi

# Configure ALSA Loopback
echo "Configuring ALSA Loopback..."
if ! grep -q "snd-aloop" /etc/modules; then
    echo "snd-aloop" >> /etc/modules
fi
modprobe snd-aloop || true

# Setup Directories
mkdir -p /etc/camilladsp/configs
mkdir -p /etc/camilladsp/coeff
mkdir -p /var/lib/dsp-streamer

# Backend Setup
echo "Setting up Backend (FastAPI)..."
APP_DIR="/opt/dsp-streamer"
mkdir -p "$APP_DIR"
cp -r backend "$APP_DIR/"
cp -r frontend "$APP_DIR/"

# Create venv and install python deps
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install fastapi uvicorn websockets pyyaml aiofiles stringcase

# Build Frontend
echo "Building Frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build
cd -

# Config Files
echo "Copying Configuration Files..."
cp config-templates/camilladsp.yml /etc/camilladsp/default.yml
# Ensure camilladsp config points to correct devices (placeholders for now)

# Systemd Services
echo "Installing Systemd Services..."
cp systemd/*.service /etc/systemd/system/
systemctl daemon-reload

echo "Enabling Services..."
systemctl enable camilladsp shairport-sync gmediarender librespot rpidsp-web

echo "Starting Services..."
# We might not want to start them immediately if config is missing, but let's try
systemctl restart shairport-sync || true
systemctl restart gmediarender || true
# Librespot and CamillaDSP need configured config files first

echo "------------------------------------------------"
echo "Installation Complete!"
echo "Access the Web UI at: http://$(hostname -I | awk '{print $1}'):8000"
echo "------------------------------------------------"
