import React from 'react';
import { ToolType } from '../types';
import MaterialIcon from './MaterialIcon';

interface ActivityBarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeTool, onToolChange }) => {
  const tools = [
    { id: ToolType.LIBRARY, icon: 'grid_view', label: 'Library Tools' },
    { id: ToolType.EDIT, icon: 'tune', label: 'Edit Tools' },
    { id: ToolType.AI_LAB, icon: 'smart_toy', label: 'AI Tools' },
    { id: ToolType.TAGGING, icon: 'label', label: 'Media Tagging' },
    { id: ToolType.DATA_COLLECT, icon: 'analytics', label: 'Smart Data Collect' },
  ];

  return (
    <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-4 z-20">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
          className={`p-3 rounded-md transition-all duration-200 group relative ${
            activeTool === tool.id 
              ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <MaterialIcon icon={tool.icon} filled={activeTool === tool.id} />
          {activeTool === tool.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full -ml-3" />
          )}
        </button>
      ))}
      
      <div className="flex-grow" />
      
      <button
        onClick={() => onToolChange(ToolType.SETTINGS)}
        className={`p-3 rounded-md transition-all ${
          activeTool === ToolType.SETTINGS
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <MaterialIcon icon="settings" filled={activeTool === ToolType.SETTINGS} />
      </button>
    </div>
  );
};

export default ActivityBar;