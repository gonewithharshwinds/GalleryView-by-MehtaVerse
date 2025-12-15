import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import Button from './Button';
import MaterialIcon from './MaterialIcon';

const DEFAULT_SETTINGS: AppSettings = {
    googleApiKey: '',
    useLocalAI: false,
    localAIUrl: 'http://localhost:11434',
    defaultBatchFormat: 'image/jpeg',
    watermarkText: 'CONFIDENTIAL'
};

const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('gallery_settings');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('gallery_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex-1 bg-background p-8 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                        <p className="text-muted-foreground text-sm">Configure AI providers and processing defaults.</p>
                    </div>
                    <Button variant="ghost" onClick={onClose}>
                        <MaterialIcon icon="close" />
                    </Button>
                </div>

                {/* AI Configuration */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                        <MaterialIcon icon="psychology" /> Artificial Intelligence
                    </h3>
                    
                    <div className="bg-card p-4 rounded border border-border space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Google Gemini API Key</label>
                            <input 
                                type="password" 
                                value={settings.googleApiKey}
                                onChange={e => setSettings({...settings, googleApiKey: e.target.value})}
                                placeholder="AIzaSy..."
                                className="w-full bg-input rounded p-2 text-sm border border-border focus:ring-1 focus:ring-primary outline-none"
                            />
                            <p className="text-[10px] text-muted-foreground">Required for Auto-Tagging and Data Extraction.</p>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                             <input 
                                type="checkbox" 
                                id="useLocal"
                                checked={settings.useLocalAI}
                                onChange={e => setSettings({...settings, useLocalAI: e.target.checked})}
                                className="rounded border-border bg-input"
                             />
                             <label htmlFor="useLocal" className="text-sm">Use Local AI (Ollama/LlamaCpp) - <span className="text-[10px] italic">Experimental</span></label>
                        </div>

                        {settings.useLocalAI && (
                            <div className="space-y-2 pl-6">
                                <label className="text-sm font-medium">Local Server URL</label>
                                <input 
                                    type="text" 
                                    value={settings.localAIUrl}
                                    onChange={e => setSettings({...settings, localAIUrl: e.target.value})}
                                    className="w-full bg-input rounded p-2 text-sm border border-border focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Processing Configuration */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                        <MaterialIcon icon="tune" /> Processing Defaults
                    </h3>
                    
                    <div className="bg-card p-4 rounded border border-border space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Watermark Text</label>
                            <input 
                                type="text" 
                                value={settings.watermarkText}
                                onChange={e => setSettings({...settings, watermarkText: e.target.value})}
                                className="w-full bg-input rounded p-2 text-sm border border-border focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-sm font-medium">Batch Conversion Format</label>
                             <select 
                                value={settings.defaultBatchFormat}
                                onChange={e => setSettings({...settings, defaultBatchFormat: e.target.value as any})}
                                className="w-full bg-input rounded p-2 text-sm border border-border focus:ring-1 focus:ring-primary outline-none"
                             >
                                <option value="image/jpeg">JPEG (Web Standard)</option>
                                <option value="image/png">PNG (Lossless)</option>
                                <option value="image/webp">WebP (Modern)</option>
                             </select>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="w-32">
                        {saved ? <span className="flex items-center gap-2"><MaterialIcon icon="check" size={16}/> Saved</span> : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;