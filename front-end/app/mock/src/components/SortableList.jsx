import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableListItem({ id, item, index, renderItem }) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'sortable-list-item--dragging' : undefined}>
      {renderItem({
        item,
        index,
        isDragging,
        handleProps: {
          ...attributes,
          ...listeners,
          ref: setActivatorNodeRef
        }
      })}
    </div>
  );
}

export default function SortableList({
  items,
  getId = (item) => item.id,
  onReorder,
  renderItem,
  disabled = false,
  className = ''
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map((item) => String(getId(item)));

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getId(item)}>
            {renderItem({ item, index, isDragging: false, handleProps: null })}
          </div>
        ))}
      </div>
    );
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder?.(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableListItem
              key={getId(item)}
              id={String(getId(item))}
              item={item}
              index={index}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
