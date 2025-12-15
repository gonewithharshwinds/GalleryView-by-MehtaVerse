import React from 'react';

export interface AppSettings {
  googleApiKey: string;
  useLocalAI: boolean; // Future proofing for Ollama/Localhost
  localAIUrl: string;
  defaultBatchFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  watermarkText: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'drive' | 'cloud';
  children?: FileNode[];
  isOpen?: boolean;
  isBackup?: boolean;
  itemCount?: number;
  sizeBytes?: number;
  dominantTags?: string[];
}

export interface ImageItem {
  id: string;
  url: string; // Blob URL
  name: string;
  dimensions: string;
  size: string;
  type: string;
  dateCreated: string;
  tags: string[];
  description?: string;
  fileObject?: File; // Keep reference to original file
}

export enum ToolType {
  LIBRARY = 'LIBRARY',
  EDIT = 'EDIT',
  AI_LAB = 'AI_LAB',
  TAGGING = 'TAGGING',
  DATA_COLLECT = 'DATA_COLLECT',
  SETTINGS = 'SETTINGS',
}

export enum DataTopic {
  CONTACTS = 'CONTACTS',
  CHAT = 'CHAT',
  DOCS = 'DOCS',
  MISC = 'MISC'
}

export interface ExtractedFile {
  id: string;
  name: string;
  type: 'csv' | 'md' | 'txt';
  date: string;
  content: string;
  topic: DataTopic;
  sourceImageId: string;
}

export interface FilterState {
  searchQuery: string;
  sortBy: 'date' | 'name' | 'size';
  viewMode: 'grid' | 'list' | 'preview';
}

export interface Tab {
  id: string;
  label: string;
  type: 'folder' | 'search' | 'all';
  filterId?: string; 
}

export interface BatchError {
  fileId: string;
  fileName: string;
  error: string;
  canAutoFix: boolean;
}

export interface BatchStatus {
  isActive: boolean;
  total: number;
  processed: number;
  failed: BatchError[];
  operationName: string;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
}

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'batch';
  persistent?: boolean;
  actions?: NotificationAction[];
  manualGuide?: {
    steps: { icon: string; label: string }[];
    summary: string;
  };
}