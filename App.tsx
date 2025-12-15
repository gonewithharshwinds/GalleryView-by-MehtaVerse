import React, { useState, useEffect, useCallback } from 'react';
import { ImageItem, ToolType, FilterState, FileNode, DataTopic, ExtractedFile, Tab, AppNotification, BatchStatus, BatchError } from './types';
import ActivityBar from './components/ActivityBar';
import ToolPanel from './components/ToolPanel';
import Canvas from './components/Canvas';
import InfoPanel from './components/InfoPanel';
import Footer from './components/Footer';
import NotificationCenter from './components/NotificationCenter';
import SettingsPanel from './components/SettingsPanel';
import MaterialIcon from './components/MaterialIcon';
import { generateImageTags, analyzeImageContext, extractDataFromImage } from './services/geminiService';
import { processImage } from './services/imageProcessor';

// Start Empty
const INITIAL_IMAGES: ImageItem[] = [];

const INITIAL_FILE_TREE: FileNode[] = [
  {
    id: 'local-root',
    name: 'Local Session',
    type: 'drive',
    isOpen: true,
    children: [
      { id: 'uploads', name: 'Imported', type: 'folder', isOpen: true, itemCount: 0, sizeBytes: 0, dominantTags: ['new'] }
    ]
  }
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.LIBRARY);
  const [images, setImages] = useState<ImageItem[]>(INITIAL_IMAGES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [fileTree, setFileTree] = useState<FileNode[]>(INITIAL_FILE_TREE);
  const [filter, setFilter] = useState<FilterState>({ searchQuery: '', sortBy: 'date', viewMode: 'grid' });
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'tab-all', label: 'All Photos', type: 'all' }]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-all');
  const [activeTopic, setActiveTopic] = useState<DataTopic>(DataTopic.MISC);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>({ isActive: false, total: 0, processed: 0, failed: [], operationName: '' });

  const addNotification = useCallback((note: Omit<AppNotification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString();
    const newNote = { ...note, id };
    setNotifications(prev => [...prev, newNote]);
    if (!note.persistent) setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  // --- Real File Import Logic ---
  const handleImportFiles = (fileList: FileList | null) => {
      if (!fileList) return;
      const newImages: ImageItem[] = [];

      Array.from(fileList).forEach((file, index) => {
          if (!file.type.startsWith('image/')) return;
          
          const objUrl = URL.createObjectURL(file);
          newImages.push({
              id: `local-${Date.now()}-${index}`,
              url: objUrl,
              name: file.name,
              dimensions: 'Unknown', // Could calculate on load
              size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              type: file.type,
              dateCreated: new Date(file.lastModified).toISOString().split('T')[0],
              tags: [],
              fileObject: file
          });
      });

      setImages(prev => [...prev, ...newImages]);
      addNotification({ title: 'Import Successful', description: `Loaded ${newImages.length} images into session.`, type: 'success' });
      
      // Switch to library
      setActiveTool(ToolType.LIBRARY);
  };

  // --- Real Batch Processing Logic ---
  const runBatchProcessing = async (actionType: string, folderId: string) => {
    // For this demo, we assume dropping on "folder" means processing ALL selected images
    // In a real app, you might want to process folder contents. 
    // We will use the selection if exists, or all images if none selected (simulate folder content)
    
    const targets = selectedIds.length > 0 
        ? images.filter(img => selectedIds.includes(img.id))
        : images; // Fallback to all if dropping generalized

    if (targets.length === 0) {
        addNotification({ title: 'No Targets', description: 'Select images to process.', type: 'warning' });
        return;
    }

    setBatchStatus({ isActive: true, total: targets.length, processed: 0, failed: [], operationName: actionType });

    const failedItems: BatchError[] = [];
    const processedImages: ImageItem[] = [];

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        
        try {
            if (!item.fileObject) throw new Error("Source file unavailable");
            
            let resultFile: File;
            
            // Map Action Type to Processor
            if (actionType.includes("Resize")) {
                resultFile = await processImage(item.fileObject, 'resize', { width: 1200 }); // Standard Web Size
            } else if (actionType.includes("Convert")) {
                resultFile = await processImage(item.fileObject, 'convert', { format: 'image/jpeg' });
            } else if (actionType.includes("Watermark")) {
                 const settings = JSON.parse(localStorage.getItem('gallery_settings') || '{}');
                 resultFile = await processImage(item.fileObject, 'watermark', { text: settings.watermarkText || "CONFIDENTIAL" });
            } else if (actionType.includes("Enhance")) {
                resultFile = await processImage(item.fileObject, 'grayscale'); // Simple filter for demo
            } else {
                throw new Error("Unknown Action");
            }

            // Create new item entry for the processed file
            const newObjUrl = URL.createObjectURL(resultFile);
            processedImages.push({
                ...item,
                id: item.id + '-proc',
                name: 'PROCESSED_' + item.name,
                url: newObjUrl,
                size: (resultFile.size / 1024 / 1024).toFixed(2) + ' MB',
                type: resultFile.type,
                fileObject: resultFile,
                tags: [...item.tags, 'processed']
            });

        } catch (e) {
            console.error(e);
            failedItems.push({
                fileId: item.id,
                fileName: item.name,
                error: (e as Error).message,
                canAutoFix: false
            });
        }

        setBatchStatus(prev => ({ ...prev, processed: i + 1, failed: failedItems }));
    }

    // Add processed items to gallery
    if (processedImages.length > 0) {
        setImages(prev => [...processedImages, ...prev]);
    }

    setBatchStatus(prev => ({ ...prev, isActive: false }));

    if (failedItems.length > 0) {
        addNotification({
             title: 'Batch Completed with Errors',
             description: `${failedItems.length} images failed processing. Check console for details.`,
             type: 'error',
             persistent: true,
             actions: [{ label: 'Dismiss', onClick: () => {} }]
        });
    } else {
        addNotification({ title: 'Batch Complete', description: `Processed ${targets.length} images successfully.`, type: 'success' });
    }
  };

  // --- Handlers ---
  const handleDropAction = (actionType: string, folderId: string) => {
    runBatchProcessing(actionType, folderId);
  };

  // Boilerplate handlers...
  const handleCloseNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const toggleNode = (nodes: FileNode[], id: string): FileNode[] => nodes.map(n => n.id === id ? {...n, isOpen: !n.isOpen} : {...n, children: n.children ? toggleNode(n.children, id) : undefined});
  const handleToggleFolder = (id: string) => setFileTree(prev => toggleNode(prev, id));
  const handleOpenFolder = (node: FileNode) => {
      const exists = tabs.find(t => t.filterId === node.id);
      if(exists) setActiveTabId(exists.id);
      else { const newTab = {id: `tab-${node.id}`, label: node.name, type: 'folder' as const, filterId: node.id}; setTabs(p=>[...p, newTab]); setActiveTabId(newTab.id); }
  };
  const handleCloseTab = (e: React.MouseEvent, id: string) => { e.stopPropagation(); if(tabs.length>1) { const f = tabs.filter(t=>t.id!==id); setTabs(f); if(activeTabId===id) setActiveTabId(f[f.length-1].id); } };

  // Derived Selection
  const selectedImage = selectedIds.length > 0 ? images.find(img => img.id === selectedIds[0]) || null : null;
  
  // Filtering
  const activeTab = tabs.find(t => t.id === activeTabId);
  const filteredImages = images.filter(img => {
      const match = img.name.toLowerCase().includes(filter.searchQuery.toLowerCase());
      if (activeTab?.type === 'folder' && activeTab.id !== 'tab-all') return false; // Basic filter logic
      return match;
  });

  // AI Logic Wrapper
  const handleAIWrapper = async (fn: () => Promise<void>) => {
      setIsGeneratingAI(true);
      try {
          await fn();
      } catch (e) {
          if ((e as Error).message === "Missing API Key") {
             addNotification({
                 title: "Configuration Required",
                 description: "Please set your Google Gemini API Key in Settings.",
                 type: "warning",
                 actions: [{ label: "Open Settings", onClick: () => setActiveTool(ToolType.SETTINGS) }]
             });
          } else {
             addNotification({ title: "AI Error", description: (e as Error).message, type: "error" });
          }
      } finally {
          setIsGeneratingAI(false);
      }
  };

  const handleAITagging = () => handleAIWrapper(async () => {
      if(!selectedImage) return;
      const [tags, desc] = await Promise.all([generateImageTags(selectedImage.name), analyzeImageContext(selectedImage.name)]);
      setImages(prev => prev.map(img => img.id === selectedImage.id ? {...img, tags: [...new Set([...img.tags, ...tags])].slice(0,5), description: desc} : img));
  });

  const handleProcessData = () => handleAIWrapper(async () => {
      if(!selectedImage) return;
      const content = await extractDataFromImage(selectedImage.name, activeTopic);
      const ext = (activeTopic === DataTopic.CONTACTS || activeTopic === DataTopic.CHAT) ? 'csv' : 'md';
      setExtractedFiles(prev => [{id: Date.now().toString(), name: `EXT_${selectedImage.name}.${ext}`, type: ext, date: new Date().toISOString(), topic: activeTopic, content, sourceImageId: selectedImage.id}, ...prev]);
      addNotification({ title: 'Data Extracted', description: 'View results in the bottom panel.', type: 'success' });
  });

  const handleAddTag = (tag: string) => {
      if(selectedImage && selectedImage.tags.length < 5) setImages(prev => prev.map(i => i.id === selectedImage.id && !i.tags.includes(tag) ? {...i, tags: [...i.tags, tag]} : i));
      else addNotification({ title: 'Limit Reached', description: 'Max 5 tags.', type: 'warning' });
  };
  const handleRemoveTag = (tag: string) => selectedImage && setImages(prev => prev.map(i => i.id === selectedImage.id ? {...i, tags: i.tags.filter(t => t !== tag)} : i));

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-foreground bg-background font-sans">
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <MaterialIcon icon="gallery_thumbnail" className="text-primary" />
          <span className="font-bold tracking-tight text-sm">Graphite Gallery <span className="text-[10px] font-normal text-muted-foreground ml-2">Pro Edition</span></span>
        </div>
        <div className="flex-1 max-w-md mx-4 relative hidden md:block">
           <input type="text" placeholder="Search assets..." className="w-full h-8 pl-4 bg-secondary/50 rounded text-sm outline-none" value={filter.searchQuery} onChange={e => setFilter(p => ({...p, searchQuery: e.target.value}))}/>
        </div>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">MV</div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeTool={activeTool} onToolChange={setActiveTool} />
        
        {activeTool === ToolType.SETTINGS ? (
             <SettingsPanel onClose={() => setActiveTool(ToolType.LIBRARY)} />
        ) : (
            <>
                <ToolPanel 
                  activeTool={activeTool} 
                  filterState={filter} 
                  onFilterChange={p => setFilter(prev => ({...prev, ...p}))} 
                  onGenerateTags={handleAITagging}
                  isGenerating={isGeneratingAI}
                  selectedImage={selectedImage}
                  selectedCount={selectedIds.length}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  activeTopic={activeTopic}
                  onTopicChange={setActiveTopic}
                  onProcessData={handleProcessData}
                />
                
                <Canvas 
                  images={filteredImages} 
                  selectedIds={selectedIds} 
                  onSelect={setSelectedIds} 
                  viewMode={filter.viewMode}
                  onChangeViewMode={m => setFilter(p => ({...p, viewMode: m}))}
                  activeTool={activeTool}
                  extractedFiles={extractedFiles}
                  onFileClick={f => alert(f.content)}
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabClick={setActiveTabId}
                  onTabClose={handleCloseTab}
                  onImportFiles={handleImportFiles}
                />
                
                <InfoPanel 
                  fileTree={fileTree} 
                  selectedImage={selectedImage}
                  selectedCount={selectedIds.length}
                  onToggleFolder={handleToggleFolder}
                  onOpenFolder={handleOpenFolder}
                  onDropAction={handleDropAction}
                />
            </>
        )}
      </div>

      <Footer batchStatus={batchStatus} selectedImage={selectedImage} selectedCount={selectedIds.length} activeToolName={activeTool.replace('_', ' ')} />
      <NotificationCenter notifications={notifications} onClose={handleCloseNotification} />
    </div>
  );
};

export default App;