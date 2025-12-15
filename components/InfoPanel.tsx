import React, { useState } from 'react';
import { FileNode, ImageItem } from '../types';
import MaterialIcon from './MaterialIcon';

interface InfoPanelProps {
  fileTree: FileNode[];
  selectedImage: ImageItem | null;
  selectedCount: number;
  onToggleFolder: (id: string) => void;
  onOpenFolder: (node: FileNode) => void;
  onDropAction: (actionType: string, folderId: string) => void;
}

const FileTreeNode: React.FC<{ 
    node: FileNode; 
    depth: number; 
    onToggle: (id: string) => void;
    onOpen: (node: FileNode) => void;
    onDrop: (action: string, id: string) => void;
}> = ({ node, depth, onToggle, onOpen, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getIcon = () => {
    if (node.type === 'cloud') return 'cloud';
    if (node.type === 'drive') return 'hard_drive';
    if (node.type === 'folder') return node.isOpen ? 'folder_open' : 'folder';
    return 'image';
  };

  const isContainer = ['folder', 'cloud', 'drive'].includes(node.type);

  // Smart Stat Calculation for Visual Density
  // Assume max comfortable size is 5GB for visual representation
  const densityPercent = node.sizeBytes ? Math.min((node.sizeBytes / 5000000000) * 100, 100) : 0;
  const healthColor = densityPercent > 80 ? 'bg-destructive' : densityPercent > 40 ? 'bg-yellow-500' : 'bg-green-500';

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const action = e.dataTransfer.getData('application/x-batch-action');
      if (action) {
          onDrop(action, node.id);
      }
  };

  return (
    <div className="select-none">
      <div 
        className={`
            relative flex items-center gap-2 py-2 px-3 cursor-pointer text-sm transition-all
            ${isDragOver ? 'bg-primary/20 ring-2 ring-primary inset-0' : 'hover:bg-secondary/50'}
            ${node.isOpen ? 'text-foreground' : 'text-muted-foreground'}
        `}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        onClick={(e) => {
             // If clicking icon area, toggle. If clicking name, open in tab.
             e.stopPropagation();
             if (isContainer) onToggle(node.id);
        }}
        onDoubleClick={() => isContainer && onOpen(node)}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {isContainer && (
          <span className="text-muted-foreground hover:text-foreground">
            <MaterialIcon icon={node.isOpen ? "expand_more" : "chevron_right"} size={16} />
          </span>
        )}
        
        <div className="relative">
            <MaterialIcon 
                icon={getIcon()} 
                size={18} 
                className={node.isOpen || isDragOver ? "text-primary" : "text-muted-foreground"} 
            />
            {node.isBackup && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                    <MaterialIcon icon="sync" size={10} className="text-green-500" />
                </div>
            )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span className="truncate font-medium leading-none mb-0.5">{node.name}</span>
            {node.itemCount !== undefined && (
                <div className="flex items-center gap-2">
                     <span className="text-[9px] text-muted-foreground">{node.itemCount} items</span>
                     {/* Density Bar */}
                     <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${healthColor}`} style={{ width: `${densityPercent}%` }}></div>
                     </div>
                </div>
            )}
        </div>

        {/* Smart Dominant Tags (On Hover or Always visible if space permits) */}
        {node.dominantTags && node.dominantTags.length > 0 && (
             <div className="flex gap-1">
                 {node.dominantTags.slice(0, 1).map(tag => (
                     <span key={tag} className="text-[8px] uppercase px-1 py-0.5 bg-secondary rounded text-muted-foreground">
                         {tag}
                     </span>
                 ))}
             </div>
        )}
      </div>

      {node.isOpen && node.children?.map(child => (
        <FileTreeNode 
            key={child.id} 
            node={child} 
            depth={depth + 1} 
            onToggle={onToggle} 
            onOpen={onOpen}
            onDrop={onDrop}
        />
      ))}
    </div>
  );
};

const InfoPanel: React.FC<InfoPanelProps> = ({ fileTree, selectedImage, selectedCount, onToggleFolder, onOpenFolder, onDropAction }) => {
  return (
    <div className="w-80 bg-sidebar border-l border-border flex flex-col h-full shadow-lg z-20">
      {/* Top Half: Smart Explorer */}
      <div className="flex-1 overflow-hidden flex flex-col border-b border-border">
        <div className="h-10 flex items-center justify-between px-4 border-b border-border bg-sidebar-accent/10">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MaterialIcon icon="folder_special" size={16} /> Smart Explorer
          </span>
          <MaterialIcon icon="more_horiz" size={16} className="text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
        
        {/* Help Tip */}
        <div className="px-4 py-2 bg-secondary/20 text-[10px] text-muted-foreground border-b border-border flex gap-2 items-center">
             <MaterialIcon icon="lightbulb" size={14} className="text-primary" />
             <span>Drag batch actions onto folders to process.</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {fileTree.map(node => (
            <FileTreeNode 
                key={node.id} 
                node={node} 
                depth={0} 
                onToggle={onToggleFolder} 
                onOpen={onOpenFolder}
                onDrop={onDropAction}
            />
          ))}
        </div>
      </div>

      {/* Bottom Half: Context Properties */}
      <div className="h-1/2 flex flex-col bg-card">
        <div className="h-10 flex items-center px-4 border-b border-border bg-sidebar-accent/10">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
             <MaterialIcon icon="info" size={16} /> Context Properties
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedCount > 1 ? (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                 <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <MaterialIcon icon="layers" size={24} className="text-primary" />
                 </div>
                 <p className="text-sm font-bold text-foreground">{selectedCount} Items Selected</p>
                 <p className="text-[10px] text-center max-w-[150px]">Batch actions available in Tools panel.</p>
             </div>
          ) : selectedImage ? (
            <div className="space-y-6">
              <div className="space-y-2">
                 <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                   Information
                 </h4>
                 <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-muted-foreground">Name</span>
                    <span className="text-right truncate" title={selectedImage.name}>{selectedImage.name}</span>
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-right">{selectedImage.type}</span>
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="text-right">{selectedImage.dimensions}</span>
                    <span className="text-muted-foreground">Size</span>
                    <span className="text-right">{selectedImage.size}</span>
                 </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                  Metadata & Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedImage.tags.length > 0 ? selectedImage.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-secondary rounded text-[10px] text-secondary-foreground border border-border">
                      {tag}
                    </span>
                  )) : (
                    <span className="text-xs text-muted-foreground italic">No tags</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                 <MaterialIcon icon="dashboard" size={24} className="opacity-50" />
              </div>
              <p className="text-xs font-medium">No Selection</p>
              <p className="text-[10px] text-center max-w-[150px]">Select an image or folder to view insights and properties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;