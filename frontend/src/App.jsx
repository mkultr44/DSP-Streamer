import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Status } from './components/Status';
import { Controls } from './components/Controls';
import { FirManager } from './components/FirManager';
import { Settings } from 'lucide-react';

function App() {
    const [status, setStatus] = useState(null);
    const [config, setConfig] = useState(null);
    const [firFiles, setFirFiles] = useState([]);

    // Local state for UI responsiveness before confirm
    const [gains, setGains] = useState({ master: 0, l: 0, r: 0, sub: 0 });
    const [delays, setDelays] = useState({ l: 0, r: 0, sub: 0 });

    useEffect(() => {
        const poll = async () => {
            try {
                const s = await axios.get('/api/status');
                setStatus(s.data);
            } catch (e) {
                console.error("Status poll failed", e);
            }
        };

        const fetchConfig = async () => {
            try {
                // In a real app we'd parse the complex config object to populate gains/delays
                // For now, we just rely on local state or fetch once
                // TODO: Parse config to update UI state
                const c = await axios.get('/api/config');
                setConfig(c.data);
            } catch (e) { console.error("Config fetch failed", e); }
        };

        const fetchFirs = async () => {
            try {
                const f = await axios.get('/api/files/fir');
                setFirFiles(f.data);
            } catch (e) { console.error("FIR fetch failed", e); }
        };

        poll();
        fetchConfig(); // Fetch once initially
        fetchFirs();

        const interval = setInterval(poll, 1000); // Poll status every 1s
        return () => clearInterval(interval);
    }, []);

    const handleGainChange = async (channel, value) => {
        setGains(prev => ({ ...prev, [channel]: value }));
        try {
            // Map channel alias to filter name from config template
            const map = {
                'master': 'gain_master',
                'l': 'gain_l',
                'r': 'gain_r',
                'sub': 'gain_sub'
            };
            await axios.post('/api/control/gain', {
                filter_name: map[channel],
                gain_db: value
            });
        } catch (e) {
            console.error("Gain update failed", e);
        }
    };

    const handleDelayChange = async (channel, value) => {
        setDelays(prev => ({ ...prev, [channel]: value }));
        // TODO: Implement delay endpoint
        console.log("Delay change not implemented in backend yet", channel, value);
    };

    const handleUploadFir = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post('/api/files/fir', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Refresh list
            const f = await axios.get('/api/files/fir');
            setFirFiles(f.data);
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        DSP Streamer
                    </h1>
                    <p className="text-gray-400 mt-1">Raspberry Pi DSP Controller</p>
                </div>
                <div className="bg-gray-800 p-2 rounded-full">
                    <Settings className="text-gray-400" />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <Status state={status} />
                    <Controls
                        gains={gains}
                        delays={delays}
                        onGainChange={handleGainChange}
                        onDelayChange={handleDelayChange}
                    />
                </div>
                <div className="space-y-8">
                    <FirManager
                        files={firFiles}
                        onUpload={handleUploadFir}
                    />

                    {/* Additional panels like Crossover could go here */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 opacity-50">
                        <h2 className="text-xl font-bold mb-4">Crossover (Coming Soon)</h2>
                        <div className="h-32 flex items-center justify-center bg-gray-900 rounded border border-dashed border-gray-700 text-gray-500">
                            Visualization Placeholder
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
