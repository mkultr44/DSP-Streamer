import asyncio
import json
import websockets
import logging

logger = logging.getLogger(__name__)

class CamillaClient:
    def __init__(self, host="127.0.0.1", port=1234):
        self.uri = f"ws://{host}:{port}"
        self.websocket = None

    async def connect(self):
        try:
            self.websocket = await websockets.connect(self.uri)
            logger.info(f"Connected to CamillaDSP at {self.uri}")
        except Exception as e:
            logger.error(f"Failed to connect to CamillaDSP: {e}")
            self.websocket = None

    async def disconnect(self):
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

    async def send_command(self, command, args=None):
        if not self.websocket:
            await self.connect()
            if not self.websocket:
                return {"result": "error", "error": "Not connected"}
        
        payload = {
            "GetConfig": {} # Placeholder structure, need check actual API
        }
        # CamillaDSP Protocol: "command" string or object
        # Example: "GetConfig", "GetState", "SetConfigJson"
        # Based on docs: https://github.com/HEnquist/camilladsp/blob/master/websocket.md
        
        # We need to construct the message properly
        # For simple commands like GetState, it is just "GetState" string?
        # Protocol is JSON. "GetState" -> returns state.
        
        # If args is meant to be the command name for wrapper convenience:
        msg = command
        if args:
             # If command requires args, it sends logic here.
             # e.g. {"SetConfigJson": {...}}
             msg = {command: args}
        else:
             msg = command

        try:
            await self.websocket.send(json.dumps(msg))
            response = await self.websocket.recv()
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error sending command: {e}")
            self.websocket = None # Force reconnect next time
            return {"result": "error", "error": str(e)}

    # High level helpers
    async def get_state(self):
        return await self.send_command("GetState")

    async def get_config(self):
        return await self.send_command("GetConfigJson")

    async def set_volume(self, volume):
        return await self.send_command("SetVolume", volume)
    
    async def set_mute(self, mute):
        return await self.send_command("SetMute", mute)

