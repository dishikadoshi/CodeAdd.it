import React, { useState, useRef, useEffect } from 'react';

export const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        js: '▸JS', jsx: '⚛', ts: '◆TS', tsx: '◆',
        html: '◉', css: '◈', json: '{}', py: 'PY',
        java: '☕', cpp: 'C+', c: 'C', md: '✎',
        sql: '⊞', sh: '$', yaml: '⚙', yml: '⚙',
    };
    return icons[ext] || '◻';
};

const FileTree = ({ files, activeFile, onFileSelect, onFileCreate, onFileDelete, onFileRename }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const inputRef = useRef(null);

    const [renamingFile, setRenamingFile] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef(null);

    useEffect(() => {
        if (renamingFile) {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [renamingFile]);

    const handleCreate = (e) => {
        e.preventDefault();
        const name = newFileName.trim();
        if (!name) { setIsAdding(false); return; }
        if (files[name]) { alert('A file with that name already exists!'); return; }
        onFileCreate(name);
        setNewFileName('');
        setIsAdding(false);
    };

    const startAdding = () => {
        setIsAdding(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const startRenaming = (filename) => {
        setRenamingFile(filename);
        setRenameValue(filename);
    };

    const commitRename = (originalName) => {
        const name = renameValue.trim();
        setRenamingFile(null);
        if (!name || name === originalName) return;
        if (files[name]) { alert('A file with that name already exists!'); return; }
        onFileRename?.(originalName, name);
    };

    return (
        <div className="fileTree">
            <div className="fileTreeHeader">
                <span className="fileTreeTitle">EXPLORER</span>
                <button className="addFileBtn" onClick={startAdding} title="New File">＋</button>
            </div>
            <div className="fileList">
                {isAdding && (
                    <form onSubmit={handleCreate} className="addFileForm">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                            placeholder="filename.js"
                            className="addFileInput"
                            onKeyDown={e => {
                                if (e.key === 'Escape') { setIsAdding(false); setNewFileName(''); }
                            }}
                            onBlur={() => {
                                if (!newFileName.trim()) setIsAdding(false);
                            }}
                        />
                    </form>
                )}
                {Object.keys(files).map(filename => (
                    <div
                        key={filename}
                        className={`fileItem ${activeFile === filename ? 'active' : ''}`}
                        onClick={() => { if (renamingFile !== filename) onFileSelect(filename); }}
                        onDoubleClick={() => startRenaming(filename)}
                    >
                        <span className="fileIcon">{getFileIcon(filename)}</span>
                        {renamingFile === filename ? (
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                className="renameFileInput"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => commitRename(filename)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); commitRename(filename); }
                                    if (e.key === 'Escape') { setRenamingFile(null); }
                                }}
                            />
                        ) : (
                            <span className="fileName">{filename}</span>
                        )}
                        <div className="fileItemActions">
                            <button
                                className="renameFileBtn"
                                onClick={(e) => { e.stopPropagation(); startRenaming(filename); }}
                                title="Rename file"
                            >✎</button>
                            {Object.keys(files).length > 1 && (
                                <button
                                    className="deleteFileBtn"
                                    onClick={(e) => { e.stopPropagation(); onFileDelete(filename); }}
                                    title="Delete file"
                                >✕</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileTree;