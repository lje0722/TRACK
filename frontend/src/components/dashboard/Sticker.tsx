import { useState, useEffect } from "react";
import { Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllStickers,
  createSticker,
  toggleSticker,
  deleteSticker,
  updateSticker,
} from "@/lib/stickers";

interface StickerItem {
  id: string;
  text: string;
  completed: boolean;
}

const CACHE_KEY = "stickers_cache";

const Sticker = () => {
  // Load from cache immediately to avoid loading state
  const getCachedItems = (): StickerItem[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  const [items, setItems] = useState<StickerItem[]>(getCachedItems);
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Load stickers on mount (background refresh)
  useEffect(() => {
    loadStickers();
  }, []);

  const loadStickers = async () => {
    try {
      // Only show loading if no cached data
      if (items.length === 0) setLoading(true);

      const data = await getAllStickers();
      const newItems = data.map(item => ({
        id: item.id,
        text: item.text,
        completed: item.is_completed,
      }));

      setItems(newItems);
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error("Failed to load stickers:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCache = (newItems: StickerItem[]) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(newItems));
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    try {
      const data = await createSticker(newItem);
      const newItems = [...items, {
        id: data.id,
        text: data.text,
        completed: data.is_completed,
      }];
      setItems(newItems);
      updateCache(newItems);
      setNewItem("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add sticker:", error);
    }
  };

  const handleToggle = async (id: string) => {
    const newItems = items.map(i =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setItems(newItems);
    updateCache(newItems);

    try {
      await toggleSticker(id);
    } catch (error) {
      console.error("Failed to toggle sticker:", error);
      const revertedItems = items.map(i =>
        i.id === id ? { ...i, completed: !i.completed } : i
      );
      setItems(revertedItems);
      updateCache(revertedItems);
    }
  };

  const handleDelete = async (id: string) => {
    const deletedItem = items.find(i => i.id === id);
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    updateCache(newItems);

    try {
      await deleteSticker(id);
    } catch (error) {
      console.error("Failed to delete sticker:", error);
      if (deletedItem) {
        setItems(items);
        updateCache(items);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addItem();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewItem("");
    }
  };

  const startEditing = (item: StickerItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      setEditingText("");
      return;
    }

    const originalItem = items.find(i => i.id === editingId);
    if (originalItem && originalItem.text === editingText.trim()) {
      setEditingId(null);
      setEditingText("");
      return;
    }

    const newItems = items.map(i =>
      i.id === editingId ? { ...i, text: editingText.trim() } : i
    );
    setItems(newItems);
    updateCache(newItems);

    try {
      await updateSticker(editingId, editingText);
    } catch (error) {
      console.error("Failed to update sticker:", error);
      if (originalItem) {
        const revertedItems = items.map(i =>
          i.id === editingId ? { ...i, text: originalItem.text } : i
        );
        setItems(revertedItems);
        updateCache(revertedItems);
      }
    }

    setEditingId(null);
    setEditingText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingText("");
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg shadow-md border border-border p-5 h-full flex flex-col relative">
      {/* Tape decoration - w-12 h-4, shadow-sm, bg-muted */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-muted shadow-sm rounded-sm" />

      {/* Header - pt-2, mb-4 */}
      <div className="pt-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📌</span>
          <h3 className="text-base font-bold text-foreground">Sticker</h3>
        </div>
      </div>

      {/* Content area - items + add button together, max 12 items visible then scroll */}
      <div className="max-h-[340px] overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-muted" />
                <div className="h-4 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Todo items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 group"
              >
                {/* Checkbox - w-5 h-5, border-2, rounded */}
                <button
                  onClick={() => handleToggle(item.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    item.completed
                      ? "bg-primary border-primary text-white"
                      : "border-muted-foreground/40 hover:border-primary"
                  )}
                >
                  {item.completed && <Check className="w-3 h-3" />}
                </button>
                {/* Text - text-sm, clickable to edit */}
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    className="text-sm flex-1 leading-relaxed bg-transparent border-b border-primary outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => startEditing(item)}
                    className={cn(
                      "text-sm flex-1 leading-relaxed cursor-text",
                      item.completed
                        ? "line-through text-muted-foreground/60"
                        : "text-foreground"
                    )}
                  >
                    {item.text}
                  </span>
                )}
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5 mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add button or input field - right below the last item */}
            {isAdding ? (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newItem.trim()) {
                      setIsAdding(false);
                    }
                  }}
                  placeholder="할 일을 입력하세요..."
                  className="flex-1 px-3 h-8 text-sm bg-background border border-primary rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={addItem}
                  className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  추가
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors pt-1"
              >
                <Plus className="w-4 h-4" />
                <span>할 일 추가</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sticker;
