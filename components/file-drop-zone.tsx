'use client';

import { useState, useRef, type DragEvent } from 'react';
import { Upload, FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FileDropZone({
  accept,
  file,
  onFileChange,
  helper,
  disabled = false,
}: {
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  helper?: string;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChange(f);
  }

  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-brand-50 grid place-items-center text-brand-600 shrink-0">
            <FileIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          className="text-gray-500 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
        dragOver
          ? 'border-brand-500 bg-brand-50/60'
          : 'border-gray-200 bg-gray-50/40 hover:border-brand-300 hover:bg-brand-50/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-brand-50 grid place-items-center text-brand-600">
        <Upload className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-gray-700">
        <span className="text-brand-600">Click to upload</span> or drag and drop
      </p>
      {helper && <p className="text-xs text-gray-500">{helper}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
