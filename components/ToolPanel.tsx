import React, { useState } from 'react';
import { ToolType, FilterState, ImageItem, DataTopic } from '../types';
import Button from './Button';
import MaterialIcon from './MaterialIcon';

interface ToolPanelProps {
  activeTool: ToolType;
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onGenerateTags: () => void;
  isGenerating: boolean;
  selectedImage: ImageItem | null;
  selectedCount: number;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  activeTopic: DataTopic;
  onTopicChange: (topic: DataTopic) => void;
  onProcessData: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ 
  activeTool, 
  filterState, 
  onFilterChange,
  onGenerateTags,
  isGenerating,
  selectedImage,
  selectedCount,
  onAddTag,
  onRemoveTag,
  activeTopic,
  onTopicChange,
  onProcessData
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  const DraggableAction = ({ label, icon }: { label: string; icon: string }) => (
      <div 
        draggable 
        onDragStart={(e) => {
            e.dataTransfer.setData('application/x-batch-action', label);
            e.dataTransfer.effectAllowed = 'copy';
        }}
        className="flex items-center gap-2 p-2 bg-input border border-border rounded cursor-grab active:cursor-grabbing hover:bg-secondary/50 transition-colors"
      >
          <MaterialIcon icon="drag_indicator" size={14} className="text-muted-foreground" />
          <MaterialIcon icon={icon} size={18} />
          <span className="text-xs font-medium">{label}</span>
      </div>
  );

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col z-20 shadow-md">
      <div className="h-12 border-b border-border flex items-center px-4 font-medium text-sm uppercase tracking-wider text-muted-foreground">
        {activeTool.replace('_', ' ')}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {activeTool === ToolType.LIBRARY && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MaterialIcon icon="search" size={14} /> Search
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Filter by name..." 
                  value={filterState.searchQuery}
                  onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                  className="w-full bg-input rounded-md pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                 <MaterialIcon icon="sort" size={14} /> Sort By
              </label>
              <div className="flex flex-col gap-1">
                {['date', 'name', 'size'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onFilterChange({ sortBy: opt as any })}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      filterState.sortBy === opt ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50'
                    }`}
                  >
                    <span className="capitalize">{opt}</span>
                    {filterState.sortBy === opt && <MaterialIcon icon="check" size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTool === ToolType.EDIT && (
          <div className="space-y-6">
             {/* 1. Selection Context Actions (Intent Driven) */}
             <div className="space-y-3">
                 <div className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between">
                    <span>Selection Actions</span>
                    {selectedCount > 0 ? (
                        <span className="text-green-500">{selectedCount} Active</span>
                    ) : (
                        <span className="text-muted-foreground/50">Inactive</span>
                    )}
                 </div>
                 
                 {selectedCount > 0 ? (
                     <div className="grid grid-cols-2 gap-2">
                         <Button size="sm" variant="secondary" className="text-xs gap-1">
                            <MaterialIcon icon="crop" size={14} /> Crop
                         </Button>
                         <Button size="sm" variant="secondary" className="text-xs gap-1">
                            <MaterialIcon icon="tune" size={14} /> Adjust
                         </Button>
                         <Button size="sm" variant="secondary" className="text-xs gap-1">
                            <MaterialIcon icon="auto_fix_high" size={14} /> Magic
                         </Button>
                         <Button size="sm" variant="secondary" className="text-xs gap-1">
                            <MaterialIcon icon="filter" size={14} /> Filter
                         </Button>
                     </div>
                 ) : (
                     <div className="p-3 border border-dashed border-border rounded text-xs text-muted-foreground text-center">
                         Select an image to see context actions.
                     </div>
                 )}
             </div>

             <div className="w-full h-px bg-border"></div>

             {/* 2. Batch Operations (Draggable) */}
             <div className="space-y-3">
                 <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <span>Batch Operations</span>
                    <MaterialIcon icon="info" size={12} title="Drag these to a folder" className="cursor-help" />
                 </div>
                 <p className="text-[10px] text-muted-foreground mb-2">Drag & Drop these onto folders in Explorer.</p>
                 
                 <div className="flex flex-col gap-2">
                     <DraggableAction label="Resize to Web" icon="aspect_ratio" />
                     <DraggableAction label="Convert to JPG" icon="transform" />
                     <DraggableAction label="Add Watermark" icon="branding_watermark" />
                     <DraggableAction label="Auto Enhance" icon="shutter_speed" />
                 </div>
             </div>
          </div>
        )}

        {activeTool === ToolType.AI_LAB && (
          <div className="space-y-4">
             <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-primary">
                   <MaterialIcon icon="auto_awesome" size={18} />
                   <span className="font-semibold text-sm">Smart Analysis</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Use Gemini AI to analyze the selected image context and generate tags.
                </p>
                <Button 
                  onClick={onGenerateTags} 
                  disabled={isGenerating || !selectedImage}
                  className="w-full text-xs"
                >
                  {isGenerating ? 'Analyzing...' : 'Analyze Image'}
                </Button>
                {!selectedImage && <p className="text-[10px] text-destructive mt-2">* Select a single image first</p>}
             </div>
          </div>
        )}

        {activeTool === ToolType.TAGGING && (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Quick Tagging</label>
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 bg-input rounded text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={!selectedImage || (selectedImage && selectedImage.tags.length >= 5)}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    variant="secondary" 
                    disabled={!selectedImage || (selectedImage && selectedImage.tags.length >= 5)}
                  >
                    <MaterialIcon icon="add" size={16} />
                  </Button>
                </form>
                {selectedImage && selectedImage.tags.length >= 5 && (
                    <span className="text-[10px] text-destructive">Max 5 tags reached.</span>
                )}
             </div>

             {selectedImage ? (
               <div className="flex flex-wrap gap-1.5">
                 {selectedImage.tags.map(tag => (
                   <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs text-secondary-foreground border border-border group">
                     {tag}
                     <button onClick={() => onRemoveTag(tag)} className="hover:text-destructive">
                       <MaterialIcon icon="close" size={10} />
                     </button>
                   </span>
                 ))}
                 {selectedImage.tags.length === 0 && (
                   <span className="text-xs text-muted-foreground italic">No tags assigned.</span>
                 )}
               </div>
             ) : (
               <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
                 {selectedCount > 1 ? "Multiple items selected. Tagging disabled." : "Select an image to manage tags"}
               </div>
             )}
          </div>
        )}

        {activeTool === ToolType.DATA_COLLECT && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MaterialIcon icon="category" size={14} /> Extraction Topic
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: DataTopic.CONTACTS, icon: 'contact_page', label: 'Contacts', desc: 'Extract contact details' },
                  { id: DataTopic.CHAT, icon: 'chat', label: 'Conversations', desc: 'Log timestamps & msgs' },
                  { id: DataTopic.DOCS, icon: 'article', label: 'Documents', desc: 'OCR & Structure' },
                  { id: DataTopic.MISC, icon: 'receipt_long', label: 'Misc', desc: 'General extraction' },
                ].map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => onTopicChange(topic.id)}
                    className={`text-left p-2 rounded-md border transition-all ${
                      activeTopic === topic.id 
                        ? 'bg-secondary border-primary/50 ring-1 ring-primary/20' 
                        : 'bg-input border-transparent hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <MaterialIcon icon={topic.icon} size={16} className={activeTopic === topic.id ? 'text-primary' : 'text-muted-foreground'} />
                      <span className={`text-xs font-medium ${activeTopic === topic.id ? 'text-foreground' : 'text-muted-foreground'}`}>{topic.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                onClick={onProcessData} 
                disabled={isGenerating || !selectedImage}
                className="w-full relative overflow-hidden"
              >
                {isGenerating && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                <span className="flex items-center gap-2">
                  <MaterialIcon icon="smart_toy" size={16} /> 
                  {isGenerating ? 'Processing...' : 'Start Extraction'}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolPanel;