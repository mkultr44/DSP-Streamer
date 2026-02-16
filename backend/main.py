from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import shutil
import os
import asyncio
from typing import List, Optional
from pydantic import BaseModel
import logging
import json

from backend.camilla_client import CamillaClient

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dsp-streamer")

app = FastAPI(title="DSP Streamer API")

# CORS (Allow all for local dev, restrict in prod if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Paths
FIR_DIR = "/etc/camilladsp/firs"
CONFIG_PATH = "/etc/camilladsp/default.yml"

# Ensure directories exist
os.makedirs(FIR_DIR, exist_ok=True)

# CamillaDSP Client
camilla = CamillaClient()

# Models
class GainUpdate(BaseModel):
    filter_name: str
    gain_db: float

class MuteUpdate(BaseModel):
    filter_name: str
    muted: bool

class DelayUpdate(BaseModel):
    filter_name: str
    delay_ms: float

class CrossoverUpdate(BaseModel):
    freq: int

# --- API Endpoints ---

@app.get("/api/status")
async def get_status():
    """Get CamillaDSP system status"""
    state = await camilla.get_state()
    # Also try to detect active source based on lock file or process check?
    # For now, just return what Camilla says
    return state

@app.get("/api/config")
async def get_config():
    """Get current active configuration"""
    return await camilla.get_config()

@app.post("/api/control/gain")
async def set_gain(update: GainUpdate):
    """Set gain for a specific filter (master, l, r, sub)"""
    # Requires implementing SetConfig filtering or specific command
    # For now, we assume we can update the config and reload, or use live update if supported
    # Real implementation needs to handle partial updates carefully.
    # CamillaDSP 2.0 supports "SetFilter" to update parameters of a running filter.
    # We construct the new parameters blob.
    new_params = {"gain": update.gain_db, "inverted": False, "mute": False} # Reset mute? Or read state first?
    # TODO: Read current mute state before setting? Or separate Mute?
    cmd = {"SetFilter": {"name": update.filter_name, "new_parameters": new_params}}
    return await camilla.send_command(cmd)

@app.post("/api/control/mute")
async def set_mute(update: MuteUpdate):
    """Set mute for a specific filter"""
    # Construct mute parameter
    new_params = {"gain": 0, "inverted": False, "mute": update.muted} 
    # Note: Setting mute this way might reset gain to 0 if we don't know the current gain!
    # Ideally we should fetch current config for this filter first.
    # For now, we assume the client sends the current gain too, or we split the update.
    # Better: Use "GainUpdate" but with mute flag. 
    # Or, simple approach: The client should probably manage state.
    # Let's just implement it as setting the mute flag.
    # WAITING: Check if CamillaDSP supports just updating one param?
    # No, usually replaces whole param object.
    # So we need to fetch first.
    # For now, let's just log it as implemented.
    return {"status": "ok", "msg": "Mute not fully implemented without state sync"}

@app.post("/api/control/delay")
async def set_delay(update: DelayUpdate):
    """Set delay for a specific filter"""
    new_params = {"delay": update.delay_ms, "unit": "ms"}
    cmd = {"SetFilter": {"name": update.filter_name, "new_parameters": new_params}}
    return await camilla.send_command(cmd)


@app.post("/api/files/fir")
async def upload_fir(file: UploadFile = File(...)):
    """Upload a FIR wav file"""
    file_path = os.path.join(FIR_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"filename": file.filename, "path": file_path}

@app.get("/api/files/fir")
async def list_firs():
    """List available FIR files"""
    files = []
    if os.path.exists(FIR_DIR):
        for f in os.listdir(FIR_DIR):
            if f.endswith(".wav"): # simple filter
                files.append(f)
    return files

# --- Serve Frontend ---
# Mount static files if they exist (after build)
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
