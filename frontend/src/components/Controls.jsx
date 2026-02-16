import React from 'react';

function Slider({ label, value, min, max, step, onChange, unit }) {
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <span className="text-sm text-gray-400 font-mono">{value} {unit}</span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-500 transition-colors"
            />
        </div>
    );
}

export function Controls({ gains, delays, onGainChange, onDelayChange }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>Audio Controls</span>
            </h2>

            <div className="mb-8 p-4 bg-gray-700/30 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-blue-400">Gains (dB)</h3>
                <Slider label="Master Volume" value={gains.master} min={-60} max={0} step={0.5} onChange={(v) => onGainChange('master', v)} unit="dB" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <Slider label="Left Channel" value={gains.l} min={-20} max={10} step={0.5} onChange={(v) => onGainChange('l', v)} unit="dB" />
                    <Slider label="Right Channel" value={gains.r} min={-20} max={10} step={0.5} onChange={(v) => onGainChange('r', v)} unit="dB" />
                    <Slider label="Subwoofer" value={gains.sub} min={-20} max={10} step={0.5} onChange={(v) => onGainChange('sub', v)} unit="dB" />
                </div>
            </div>

            <div className="p-4 bg-gray-700/30 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-purple-400">Delays (ms)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Slider label="Left Delay" value={delays.l} min={0} max={20} step={0.1} onChange={(v) => onDelayChange('l', v)} unit="ms" />
                    <Slider label="Right Delay" value={delays.r} min={0} max={20} step={0.1} onChange={(v) => onDelayChange('r', v)} unit="ms" />
                    <Slider label="Sub Delay" value={delays.sub} min={0} max={20} step={0.1} onChange={(v) => onDelayChange('sub', v)} unit="ms" />
                </div>
            </div>
        </div>
    );
}
