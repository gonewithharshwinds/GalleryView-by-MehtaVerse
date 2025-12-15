import React from 'react';
import { BatchStatus, ImageItem } from '../types';
import MaterialIcon from './MaterialIcon';

interface FooterProps {
  batchStatus: BatchStatus;
  selectedImage: ImageItem | null;
  selectedCount: number;
  activeToolName: string;
}

const Footer: React.FC<FooterProps> = ({ batchStatus, selectedImage, selectedCount, activeToolName }) => {
  // Calculate percentage
  const progress = batchStatus.total > 0 
    ? Math.round((batchStatus.processed / batchStatus.total) * 100) 
    : 0;

  return (
    <footer className="h-7 bg-card border-t border-border flex items-center justify-between px-3 text-[11px] select-none shrink-0 z-40 text-muted-foreground transition-colors duration-300">
      
      {/* LEFT SECTION: Status & Context */}
      <div className="flex items-center gap-4 flex-1">
        
        {/* State: Batch Processing */}
        {batchStatus.isActive ? (
          <div className="flex items-center gap-3 text-foreground animate-in fade-in slide-in-from-bottom-1">
            <div className="flex items-center gap-2">
               <MaterialIcon icon="sync" size={14} className="animate-spin text-primary" />
               <span className="font-medium">
                 {batchStatus.operationName}: {batchStatus.processed}/{batchStatus.total}
               </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* State: Idle / Standard */
          <>
            <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors group">
              <MaterialIcon icon="cloud_done" size={14} className="text-green-500 group-hover:text-green-400" />
              Cloud Connected
            </span>
            <div className="h-3 w-px bg-border/50" />
            
            {selectedCount > 0 ? (
              <span className="flex items-center gap-1 text-foreground">
                <MaterialIcon icon="check_circle" size={14} className="text-primary" />
                {selectedCount} Selected
                {selectedCount === 1 && selectedImage && (
                    <span className="text-muted-foreground ml-1">
                        - {selectedImage.name} ({selectedImage.dimensions})
                    </span>
                )}
              </span>
            ) : (
              <span className="opacity-70">Ready</span>
            )}
          </>
        )}
      </div>

      {/* RIGHT SECTION: Errors & System Info */}
      <div className="flex items-center gap-4">
        
        {/* Error Indicator (Only if recent failures exist and not currently processing) */}
        {!batchStatus.isActive && batchStatus.failed.length > 0 && (
           <div className="flex items-center gap-1 text-destructive font-medium cursor-pointer hover:bg-destructive/10 px-2 rounded">
              <MaterialIcon icon="error" size={14} />
              <span>{batchStatus.failed.length} Errors in last batch</span>
           </div>
        )}

        {activeToolName === 'DATA COLLECT' && (
            <span className="flex items-center gap-1 text-primary">
              <MaterialIcon icon="smart_toy" size={14} />
              AI Ready
            </span>
        )}

        <div className="h-3 w-px bg-border/50" />

        <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
           <MaterialIcon icon="database" size={14} />
           1.2GB / 5GB
        </span>
      </div>
    </footer>
  );
};

export default Footer;