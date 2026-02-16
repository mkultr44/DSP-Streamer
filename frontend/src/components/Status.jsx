import React from 'react';
import { Activity } from 'lucide-react';

export function Status({ state }) {
    if (!state) return <div className="text-gray-500 animate-pulse">Connecting...</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
                <Activity className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold">System Status</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 p-3 rounded">
                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Status</span>
                    <span className="text-lg font-mono">{state.status || 'Unknown'}</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Sample Rate</span>
                    <span className="text-lg font-mono">{state.capture_rate || '-'} Hz</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Buffer</span>
                    <span className="text-lg font-mono">{state.buffer_frames || '-'}</span>
                </div>
            </div>
        </div>
    );
}
