import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    isEditable: boolean;
    className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, isEditable, className = '' }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    const onPointerDown = (e: React.PointerEvent) => {
        if (!isEditable) return;

        const target = e.target as HTMLElement;
        const isContentEditable = target.closest('[contenteditable="true"]');
        const isUiControl = target.closest('button, select, input, .table-controls');

        if (isContentEditable || isUiControl) {
            e.stopPropagation();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${className} selection:bg-yellow-200 selection:text-black`}
            {...attributes}
            {...(isEditable ? listeners : {})}
            onPointerDown={onPointerDown}
        >
            {children}
        </div>
    );
};
