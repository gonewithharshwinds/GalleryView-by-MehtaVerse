import React from 'react';
import { ExtractedFile, DataTopic } from '../types';
import MaterialIcon from './MaterialIcon';

interface DataOutputPanelProps {
  files: ExtractedFile[];
  onFileClick: (file: ExtractedFile) => void;
}

const DataOutputPanel: React.FC<DataOutputPanelProps> = ({ files, onFileClick }) => {
  const getIconForType = (type: string) => {
    switch(type) {
      case 'csv': return 'table_chart';
      case 'md': return 'markdown';
      default: return 'description';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-10 border-b border-border bg-secondary/30 flex items-center justify-between px-4">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
           <MaterialIcon icon="folder_data" size={18} /> Collection Output
        </span>
        <div className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          {files.length} Generated Files
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
             <MaterialIcon icon="topic" size={48} className="mb-2" />
             <p className="text-sm">No data collected yet.</p>
             <p className="text-xs">Select a topic and process an image.</p>
          </div>
        ) : (
          <div className="w-full overflow-y-auto p-2 grid grid-cols-1 gap-1">
            {files.map(file => (
              <div 
                key={file.id}
                onClick={() => onFileClick(file)}
                className="group flex items-center gap-3 p-3 rounded-md hover:bg-secondary/40 cursor-pointer border border-transparent hover:border-border transition-all"
              >
                <div className={`p-2 rounded bg-secondary/50 text-foreground`}>
                   <MaterialIcon icon={getIconForType(file.type)} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {file.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MaterialIcon icon="calendar_today" size={12} /> {file.date}
                    </span>
                    <span className="flex items-center gap-1">
                       <MaterialIcon icon="image" size={12} /> Source ID: {file.sourceImageId}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                      <MaterialIcon icon="download" size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataOutputPanel;