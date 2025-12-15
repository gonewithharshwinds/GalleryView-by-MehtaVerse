import React, { useState } from 'react';
import { AppNotification } from '../types';
import MaterialIcon from './MaterialIcon';
import Button from './Button';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: (id: string) => void;
}

const PictorialGuide = ({ guide }: { guide: { steps: { icon: string; label: string }[], summary: string } }) => (
    <div className="mt-3 p-3 bg-background/50 rounded border border-border/50 animate-in slide-in-from-top-2">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <MaterialIcon icon="school" size={12} /> Manual Resolution Guide
        </p>
        <p className="text-xs mb-3 text-foreground">{guide.summary}</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {guide.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-secondary-foreground border border-border">
                            <MaterialIcon icon={step.icon} size={18} />
                        </div>
                        <span className="text-[9px] text-center font-medium leading-tight max-w-[60px]">{step.label}</span>
                    </div>
                    {idx < guide.steps.length - 1 && (
                         <MaterialIcon icon="arrow_right_alt" size={16} className="text-muted-foreground opacity-50" />
                    )}
                </React.Fragment>
            ))}
        </div>
    </div>
);

const NotificationItem = ({ notification, onClose }: { notification: AppNotification; onClose: (id: string) => void }) => {
    const [showGuide, setShowGuide] = useState(false);

    const getIcon = () => {
        switch(notification.type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'batch': return 'layers';
            default: return 'info';
        }
    };

    const getColor = () => {
        switch(notification.type) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-destructive';
            case 'warning': return 'text-yellow-500';
            case 'batch': return 'text-primary';
            default: return 'text-blue-500';
        }
    };

    return (
        <div className="w-[350px] bg-popover text-popover-foreground rounded-md shadow-xl border border-border overflow-hidden pointer-events-auto flex flex-col animate-in slide-in-from-right-5 fade-in duration-300">
            {/* Header */}
            <div className="flex items-start gap-3 p-3">
                <MaterialIcon icon={getIcon()} size={20} className={`mt-0.5 ${getColor()}`} />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold leading-tight mb-1">{notification.title}</h4>
                    {notification.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{notification.description}</p>
                    )}
                </div>
                <button 
                    onClick={() => onClose(notification.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded p-0.5 transition-colors"
                >
                    <MaterialIcon icon="close" size={16} />
                </button>
            </div>

            {/* Manual Guide Expansion */}
            {showGuide && notification.manualGuide && (
                <div className="px-3 pb-3">
                    <PictorialGuide guide={notification.manualGuide} />
                </div>
            )}

            {/* Action Footer */}
            {(notification.actions || notification.manualGuide) && (
                <div className="bg-secondary/30 p-2 flex items-center justify-end gap-2 border-t border-border">
                    {/* Manual Guide Toggle */}
                    {notification.manualGuide && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowGuide(!showGuide)}
                            className="mr-auto text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <MaterialIcon icon={showGuide ? "expand_less" : "menu_book"} size={14} className="mr-1" />
                            {showGuide ? "Hide Guide" : "Manual Guide"}
                        </Button>
                    )}

                    {notification.actions?.map((action, idx) => (
                        <Button 
                            key={idx}
                            variant={action.variant as any || 'secondary'}
                            size="sm"
                            onClick={action.onClick}
                            className="h-6 text-xs px-2"
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose }) => {
  return (
    <div className="fixed bottom-10 right-4 flex flex-col gap-3 z-50 pointer-events-none items-end">
      {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} onClose={onClose} />
      ))}
    </div>
  );
};

export default NotificationCenter;