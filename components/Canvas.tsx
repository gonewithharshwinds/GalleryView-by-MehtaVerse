import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ImageItem, ToolType, ExtractedFile, Tab, FilterState } from '../types';
import MaterialIcon from './MaterialIcon';
import DataOutputPanel from './DataOutputPanel';

interface CanvasProps {
  images: ImageItem[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  viewMode: FilterState['viewMode'];
  onChangeViewMode: (mode: FilterState['viewMode']) => void;
  activeTool: ToolType;
  extractedFiles: ExtractedFile[];
  onFileClick: (file: ExtractedFile) => void;
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (e: React.MouseEvent, id: string) => void;
  onImportFiles: (files: FileList | null) => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  images, 
  selectedIds, 
  onSelect, 
  viewMode, 
  onChangeViewMode,
  activeTool,
  extractedFiles,
  onFileClick,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onImportFiles
}) => {
  const isSplitView = activeTool === ToolType.DATA_COLLECT;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [activeDateLabel, setActiveDateLabel] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Drag Selection State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Group images
  const { groupedImages, groupKeys, years } = useMemo(() => {
    const groups: Record<string, ImageItem[]> = {};
    const yearSet = new Set<string>();

    images.forEach(img => {
      const d = new Date(img.dateCreated);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const year = d.getFullYear().toString();
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(img);
      yearSet.add(year);
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    const sortedYears = Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));

    return { groupedImages: groups, groupKeys: sortedKeys, years: sortedYears };
  }, [images]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => setIsScrolling(false), 1500);

    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
    
    for (const key of groupKeys) {
        const safeKey = key.replace(/\s+/g, '-');
        const el = document.getElementById(`group-${safeKey}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom > containerTop + 50 && rect.top < window.innerHeight) {
                setActiveDateLabel(key);
                break;
            }
        }
    }
  };

  const scrollToGroup = (key: string) => {
    const targetGroupKey = groupKeys.find(k => k.includes(key));
    if (!targetGroupKey) return;
    const safeKey = targetGroupKey.replace(/\s+/g, '-');
    const el = document.getElementById(`group-${safeKey}`);
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const offset = elTop - containerTop + scrollContainerRef.current.scrollTop - 20; 
      scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  // --- SELECTION LOGIC ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-selectable="true"]')) return;
    if (!e.shiftKey && !e.ctrlKey) onSelect([]);

    const container = scrollContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setIsSelecting(true);
    dragStartRef.current = { x: startX + container.scrollLeft, y: startY + container.scrollTop };
    setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !dragStartRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left + container.scrollLeft;
    const currentY = e.clientY - rect.top + container.scrollTop;
    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    const renderX = Math.min(startX, currentX) - container.scrollLeft;
    const renderY = Math.min(startY, currentY) - container.scrollTop;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    setSelectionBox({ x: renderX, y: renderY, width, height });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionBox || !scrollContainerRef.current) {
        setIsSelecting(false);
        return;
    }
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const absLeft = selectionBox.x + container.scrollLeft;
    const absTop = selectionBox.y + container.scrollTop;
    const absRight = absLeft + selectionBox.width;
    const absBottom = absTop + selectionBox.height;
    const newSelectedIds: string[] = [];
    const elements = container.querySelectorAll('[data-selectable="true"]');
    elements.forEach((el) => {
        const id = el.getAttribute('data-id');
        if (!id) return;
        const rect = el.getBoundingClientRect();
        const elLeft = rect.left - containerRect.left + container.scrollLeft;
        const elTop = rect.top - containerRect.top + container.scrollTop;
        const elRight = elLeft + rect.width;
        const elBottom = elTop + rect.height;
        const isIntersecting = !(
            elLeft > absRight || elRight < absLeft || elTop > absBottom || elBottom < absTop
        );
        if (isIntersecting) newSelectedIds.push(id);
    });

    if (newSelectedIds.length > 0) onSelect(newSelectedIds);
    setIsSelecting(false);
    setSelectionBox(null);
    dragStartRef.current = null;
  };

  const handleImageClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter(sid => sid !== id));
    } else {
        onSelect([id]);
    }
  };

  const handleImageDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!selectedIds.includes(id)) onSelect([id]);
    onChangeViewMode('preview');
  };

  // --- File Drop Logic ---
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
      setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      onImportFiles(e.dataTransfer.files);
  };

  // --- RENDER ---

  if (viewMode === 'preview') {
      const selectedImage = images.find(img => img.id === selectedIds[0]);
      return (
        <div className="flex-1 flex flex-col h-full bg-background relative z-50 animate-in fade-in zoom-in-95 duration-200">
             <div className="h-12 bg-background border-b border-border flex items-center px-4 justify-between">
                 <button onClick={() => onChangeViewMode('grid')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                     <MaterialIcon icon="arrow_back" /> Back to Grid
                 </button>
                 <span className="font-medium text-sm">{selectedImage?.name}</span>
                 <div className="w-8"></div>
             </div>
             <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-black/5">
                 {selectedImage ? (
                     <img src={selectedImage.url} alt={selectedImage.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                 ) : (
                     <div className="text-muted-foreground">No Image Selected</div>
                 )}
             </div>
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative select-none">
      <div className="h-10 bg-secondary/30 border-b border-border flex items-end px-2 gap-1 overflow-x-auto shrink-0 z-20">
          {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                className={`
                    group relative px-4 py-2 text-xs font-medium rounded-t-md cursor-pointer border-t border-l border-r transition-all min-w-[120px] max-w-[200px] flex items-center justify-between
                    ${activeTabId === tab.id 
                        ? 'bg-background border-border text-foreground -mb-px pb-2.5 z-10' 
                        : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary/80'
                    }
                `}
              >
                  <div className="flex items-center gap-2 truncate">
                      <MaterialIcon icon={tab.type === 'folder' ? 'folder' : 'photo_library'} size={14} />
                      <span className="truncate">{tab.label}</span>
                  </div>
                  <button 
                    onClick={(e) => onTabClose(e, tab.id)}
                    className={`ml-2 p-0.5 rounded hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity ${tabs.length === 1 ? 'hidden' : ''}`}
                  >
                      <MaterialIcon icon="close" size={12} />
                  </button>
              </div>
          ))}
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {handleMouseUp(); handleDragLeave();}}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${isSplitView ? 'h-1/2 border-b-4 border-border' : 'flex-1'} overflow-y-auto p-6 transition-all duration-300 scroll-smooth pr-14 relative`}
      >
         {isDragOver && (
             <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center backdrop-blur-sm">
                 <div className="bg-card p-6 rounded-lg shadow-xl flex flex-col items-center animate-bounce">
                     <MaterialIcon icon="upload_file" size={48} className="text-primary mb-2" />
                     <h3 className="text-lg font-bold text-primary">Drop files to Import</h3>
                 </div>
             </div>
         )}

         {selectionBox && (
             <div 
                className="absolute bg-primary/20 border border-primary/50 z-50 pointer-events-none"
                style={{
                    left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height
                }}
             />
         )}

         {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
               <MaterialIcon icon="folder_open" size={48} className="mb-2 opacity-20" />
               <p className="text-lg">No Images</p>
               <p className="text-sm mb-4">Drag and drop images here to start.</p>
               <input 
                 type="file" 
                 id="file-upload" 
                 multiple 
                 accept="image/*" 
                 className="hidden"
                 onChange={(e) => onImportFiles(e.target.files)}
               />
               <label 
                 htmlFor="file-upload" 
                 className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2"
               >
                 <MaterialIcon icon="upload" size={18} /> Import Files
               </label>
            </div>
         ) : (
             <div className="pb-20">
              {groupKeys.map((groupName) => (
                <div key={groupName} id={`group-${groupName.replace(/\s+/g, '-')}`} className="mb-8">
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-3 px-1 border-b border-transparent mb-2 pointer-events-none">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {groupName} <span className="text-xs text-muted-foreground font-normal">({groupedImages[groupName].length})</span>
                    </h3>
                  </div>

                  <div className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6' : 'flex flex-col gap-2'}
                  `}>
                    {groupedImages[groupName].map((img) => (
                      <div
                        key={img.id}
                        data-selectable="true"
                        data-id={img.id}
                        onClick={(e) => handleImageClick(e, img.id)}
                        onDoubleClick={(e) => handleImageDoubleClick(e, img.id)}
                        className={`
                          group relative cursor-pointer rounded-lg overflow-hidden border transition-all duration-200
                          ${selectedIds.includes(img.id) ? 'ring-2 ring-primary border-transparent shadow-lg scale-[0.98]' : 'border-border hover:border-primary/50 hover:shadow-md'}
                          ${viewMode === 'list' ? 'flex h-20 items-center bg-card' : 'bg-card aspect-square'}
                        `}
                      >
                        <div className={`${viewMode === 'list' ? 'h-20 w-20 flex-shrink-0' : 'w-full h-full'}`}>
                          <img 
                            src={img.url} 
                            alt={img.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                          />
                        </div>
                        
                        {viewMode === 'grid' && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                            <span className="text-white text-sm font-medium truncate">{img.name}</span>
                          </div>
                        )}
                        {viewMode === 'list' && (
                          <div className="px-4 flex-1 flex justify-between items-center pointer-events-none">
                            <div>
                              <h3 className="text-sm font-medium text-card-foreground">{img.name}</h3>
                              <p className="text-xs text-muted-foreground">{img.dimensions} • {img.size}</p>
                            </div>
                          </div>
                        )}
                        {selectedIds.includes(img.id) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                <MaterialIcon icon="check" size={14} className="text-primary-foreground" />
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>
      {isSplitView && (
        <div className="h-1/2 animate-in slide-in-from-bottom-10 fade-in duration-300 bg-background z-10 border-t border-border">
           <DataOutputPanel files={extractedFiles} onFileClick={onFileClick} />
        </div>
      )}
    </div>
  );
};

export default Canvas;