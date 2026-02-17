#!/bin/bash
set -e

# DSP Streamer Installer for Raspberry Pi OS Lite (Debian-based)

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

echo "Updating system..."
# Prevent interactive prompts
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y

# Stop existing services if running
echo "Stopping existing services..."
systemctl stop camilladsp shairport-sync gmediarender librespot camillagui || true

echo "Installing core dependencies..."
apt-get install -y git curl wget build-essential pkg-config libasound2-dev alsa-utils python3-pip python3-venv protobuf-compiler

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
    # Install Rust via rustup to get latest version (apt version is too old for 2024 edition)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    
    ARCH=$(dpkg --print-architecture)
    if [ "$ARCH" = "arm64" ]; then
        echo "Detected ARM64 - enabling NEON optimizations"
        RUSTFLAGS='-C target-feature=+neon -C target-cpu=native' cargo install librespot --locked --root /usr/local
    else
        echo "Detected $ARCH - using native CPU optimizations"
        RUSTFLAGS='-C target-cpu=native' cargo install librespot --locked --root /usr/local
    fi
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

# Install CamillaGUI
echo "Installing CamillaGUI..."
# Install dependencies
apt-get install -y python3-setuptools python3-wheel
# Create directory for GUI
GUI_DIR="/opt/camillagui"

# Backup existing config if present
if [ -f "$GUI_DIR/config/camillagui.yml" ]; then
    cp "$GUI_DIR/config/camillagui.yml" /tmp/camillagui_backup.yml
fi

# Clean old install
rm -rf "$GUI_DIR"
mkdir -p "$GUI_DIR"

# Clone or download release (Using git clone for latest)
git clone https://github.com/HEnquist/camillagui.git "$GUI_DIR"

# Restore backup config if it existed
if [ -f "/tmp/camillagui_backup.yml" ]; then
    mkdir -p "$GUI_DIR/config"
    cp /tmp/camillagui_backup.yml "$GUI_DIR/config/camillagui.yml"
fi

# Create venv and install deps
echo "Setting up CamillaGUI environment..."
python3 -m venv "$GUI_DIR/venv"
"$GUI_DIR/venv/bin/pip" install -r "$GUI_DIR/requirements.txt"
# Optional: install websocket-client if needed for some features
"$GUI_DIR/venv/bin/pip" install websocket-client

# Configure CamillaGUI
# We can use the default config or create one if needed across specific ports
# By default it connects to 127.0.0.1:1234 (CamillaDSP) and serves on 0.0.0.0:5005
# This matches our setup.

# Config Files
echo "Copying Configuration Files..."
cp config-templates/camilladsp.yml /etc/camilladsp/default.yml

# Systemd Services
echo "Installing Systemd Services..."
# Remove old services first to ensure clean state
rm -f /etc/systemd/system/camilladsp.service
rm -f /etc/systemd/system/shairport-sync.service
rm -f /etc/systemd/system/gmediarender.service
rm -f /etc/systemd/system/librespot.service
rm -f /etc/systemd/system/camillagui.service
rm -f /etc/systemd/system/rpidsp-web.service # Clean up legacy service

cp systemd/*.service /etc/systemd/system/
systemctl daemon-reload

echo "Enabling Services..."
systemctl enable camilladsp shairport-sync gmediarender librespot camillagui

echo "Starting Services..."
systemctl restart shairport-sync || true
systemctl restart gmediarender || true
# Librespot and CamillaDSP need configured config files first

echo "------------------------------------------------"
echo "Installation Complete!"
echo "Access the CamillaGUI at: http://$(hostname -I | awk '{print $1}'):5005"
echo "------------------------------------------------"
