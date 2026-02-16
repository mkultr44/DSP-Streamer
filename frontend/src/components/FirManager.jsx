import React, { useState } from 'react';
import { Upload, Trash2, FileAudio } from 'lucide-react';

export function FirManager({ files, onUpload, onDelete }) {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (selectedFile) {
            await onUpload(selectedFile);
            setSelectedFile(null);
            // Reset input?
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileAudio className="text-yellow-400" />
                <span>FIR Filters</span>
            </h2>

            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-gray-400">Available Files</h3>
                <ul className="space-y-2">
                    {files.map(f => (
                        <li key={f} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                            <span className="font-mono text-sm">{f}</span>
                            <button className="text-red-400 hover:text-red-300 opacity-50 cursor-not-allowed" title="Delete not implemented"><Trash2 size={16} /></button>
                        </li>
                    ))}
                    {files.length === 0 && <li className="text-gray-500 italic">No FIR files found.</li>}
                </ul>
            </div>

            <form onSubmit={handleUpload} className="bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-gray-400">Upload New Filter</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        type="file"
                        accept=".wav"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
              "
                    />
                    <button
                        type="submit"
                        disabled={!selectedFile}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <Upload size={16} /> Upload
                    </button>
                </div>
            </form>
        </div>
    );
}
