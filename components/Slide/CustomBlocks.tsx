import React, { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { GripVertical, Trash2 } from 'lucide-react';
import { EditableText } from '../EditableText';

interface CustomBlock {
    id: string;
    html: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CustomBlocksProps {
    customBlocks: CustomBlock[];
    isEditable: boolean;
    scale?: number;
    activeTextColor: string;
    fontScale: number;
    onUpdate?: (field: string, value: unknown) => void;
}

export const CustomBlocks: React.FC<CustomBlocksProps> = ({
    customBlocks,
    isEditable,
    scale = 1,
    activeTextColor,
    fontScale,
    onUpdate,
}) => {
    const isTableBlock = (html: string) => html.includes('<table');

    const handleCustomBlockChange = useCallback((blockId: string, updates: Partial<CustomBlock>) => {
        if (!onUpdate) return;
        const updatedBlocks = customBlocks.map((block) =>
            block.id === blockId ? { ...block, ...updates } : block
        );
        onUpdate('customBlocks', updatedBlocks);
    }, [customBlocks, onUpdate]);

    const handleRemoveCustomBlock = useCallback((blockId: string) => {
        if (!onUpdate) return;
        const updatedBlocks = customBlocks.filter((block) => block.id !== blockId);
        onUpdate('customBlocks', updatedBlocks);
    }, [customBlocks, onUpdate]);

    const addTableRow = (block: CustomBlock) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return;

        const lastRow = table.querySelector('tr:last-child');
        if (!lastRow) return;

        const newRow = lastRow.cloneNode(true) as HTMLTableRowElement;
        newRow.querySelectorAll('td').forEach(cell => {
            cell.textContent = 'Cell';
            cell.style.fontWeight = 'normal';
            cell.style.background = 'transparent';
        });
        table.appendChild(newRow);

        handleCustomBlockChange(block.id, {
            html: table.outerHTML,
            height: block.height + 50
        });
    };

    const addTableColumn = (block: CustomBlock) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const lastCell = row.querySelector('td:last-child, th:last-child');
            if (!lastCell) return;

            const newCell = lastCell.cloneNode(true) as HTMLTableCellElement;
            newCell.textContent = index === 0 ? `Header ${row.children.length + 1}` : 'Cell';
            row.appendChild(newCell);
        });

        handleCustomBlockChange(block.id, {
            html: table.outerHTML,
            width: block.width + 100
        });
    };

    const removeTableRow = (block: CustomBlock) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        if (rows.length <= 1) return;

        rows[rows.length - 1].remove();

        handleCustomBlockChange(block.id, {
            html: table.outerHTML,
            height: Math.max(block.height - 50, 70)
        });
    };

    const removeTableColumn = (block: CustomBlock) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        const firstRowCells = rows[0]?.querySelectorAll('td, th');
        if (!firstRowCells || firstRowCells.length <= 1) return;

        rows.forEach(row => {
            const lastCell = row.querySelector('td:last-child, th:last-child');
            if (lastCell) lastCell.remove();
        });

        handleCustomBlockChange(block.id, {
            html: table.outerHTML,
            width: Math.max(block.width - 100, 160)
        });
    };

    if (!customBlocks?.length) return null;

    return (
        <>
            {customBlocks.map((block) => {
                const isTable = isTableBlock(block.html);

                if (isEditable) {
                    return (
                        <Rnd
                            key={block.id}
                            bounds="parent"
                            scale={scale}
                            size={{ width: block.width, height: block.height }}
                            position={{ x: block.x, y: block.y }}
                            onDragStop={(_, data) => handleCustomBlockChange(block.id, { x: data.x, y: data.y })}
                            onResizeStop={(_, __, ref, ___, position) =>
                                handleCustomBlockChange(block.id, {
                                    width: parseFloat(ref.style.width),
                                    height: parseFloat(ref.style.height),
                                    x: position.x,
                                    y: position.y,
                                })
                            }
                            dragHandleClassName="drag-handle"
                            minWidth={isTable ? 200 : 160}
                            minHeight={isTable ? 60 : 40}
                            className={`pointer-events-auto group/block ${isTable ? 'table-block' : ''}`}
                            style={{ zIndex: 40, touchAction: 'none' }}
                            cancel=".editable-text, .table-controls"
                            enableResizing={isTable ? {
                                top: true,
                                right: true,
                                bottom: true,
                                left: true,
                                topRight: true,
                                bottomRight: true,
                                bottomLeft: true,
                                topLeft: true,
                            } : {
                                top: false,
                                right: true,
                                bottom: true,
                                left: false,
                                topRight: false,
                                bottomRight: true,
                                bottomLeft: false,
                                topLeft: false,
                            }}
                        >
                            <div className="w-full h-full relative group">
                                <div
                                    className="drag-handle absolute -top-3 -left-3 w-8 h-8 bg-[#ffd700] rounded-full flex items-center justify-center cursor-move shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Drag to move"
                                >
                                    <GripVertical size={16} className="text-black" />
                                </div>
                                <button
                                    onClick={() => handleRemoveCustomBlock(block.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                    title="Delete block"
                                >
                                    <Trash2 size={12} />
                                </button>

                                {isTable && (
                                    <div className="table-controls absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addTableRow(block); }}
                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium shadow-lg"
                                            title="Add Row"
                                        >
                                            + Row
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeTableRow(block); }}
                                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded font-medium shadow-lg"
                                            title="Remove Row"
                                        >
                                            - Row
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addTableColumn(block); }}
                                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-medium shadow-lg"
                                            title="Add Column"
                                        >
                                            + Col
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeTableColumn(block); }}
                                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded font-medium shadow-lg"
                                            title="Remove Column"
                                        >
                                            - Col
                                        </button>
                                    </div>
                                )}

                                <div className="w-full h-full text-left overflow-visible cursor-text p-2 editable-text">
                                    <EditableText
                                        tagName="div"
                                        className="leading-relaxed w-full h-full overflow-visible editable-text"
                                        style={{
                                            color: 'var(--slide-text)',
                                            overflow: 'visible',
                                            fontSize: isTable ? '1rem' : `${2.25 * fontScale}rem`,
                                        }}
                                        html={block.html}
                                        onChange={(val) => {
                                            const strippedVal = val.replace(/<[^>]*>/g, '').trim();
                                            if (!strippedVal && !isTableBlock(val)) {
                                                handleRemoveCustomBlock(block.id);
                                            } else {
                                                handleCustomBlockChange(block.id, { html: val });
                                            }
                                        }}
                                        placeholder="Text block"
                                    />
                                </div>
                            </div>
                        </Rnd>
                    );
                }

                const strippedContent = block.html
                    ?.replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/gi, ' ')
                    .replace(/\u200B/g, '')
                    .trim();

                if (!strippedContent) return null;

                return (
                    <div
                        key={block.id}
                        style={{
                            position: 'absolute',
                            left: `${block.x}px`,
                            top: `${block.y}px`,
                            width: `${block.width}px`,
                            height: `${block.height}px`,
                            zIndex: 40,
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                textAlign: 'left',
                                fontSize: `${2.25 * fontScale}rem`,
                                lineHeight: 1.6,
                                color: 'var(--slide-text)',
                                overflow: 'visible',
                                padding: '0.5rem',
                            }}
                            dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                    </div>
                );
            })}
        </>
    );
};
