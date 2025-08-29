const HISTORY_STORAGE_KEY = 'text-to-cad-history';

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.load(); // Load history on initialization
    }

    /**
     * Pushes a new state to the history, clearing the redo stack.
     * @param {string} textState The new text content to save.
     */
    push(textState) {
        const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
        if (textState !== lastState) {
            this.undoStack.push(textState);
            this.redoStack = [];
            this.save();
        }
    }

    /**
     * Moves the current state to the redo stack and returns the previous state.
     * @returns {string|null} The previous text state, or null if no undo is possible.
     */
    undo() {
        if (this.undoStack.length < 2) {
            return null; // Can't undo if there's only one or zero items
        }
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        this.save();
        return this.undoStack[this.undoStack.length - 1];
    }

    /**
     * Moves a state from the redo stack back to the undo stack and returns it.
     * @returns {string|null} The redone text state, or null if no redo is possible.
     */
    redo() {
        if (this.redoStack.length === 0) {
            return null;
        }
        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);
        this.save();
        return nextState;
    }

    save() {
        const historyData = { undo: this.undoStack, redo: this.redoStack };
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData));
    }

    load() {
        const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (savedHistory) {
            try {
                const historyData = JSON.parse(savedHistory);
                this.undoStack = historyData.undo || [];
                this.redoStack = historyData.redo || [];
            } catch (e) {
                console.error("Failed to parse history from localStorage:", e);
                this.undoStack = [];
                this.redoStack = [];
            }
        }
    }

    getCurrentState() { 
        return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : ""; 
    }
    
    canUndo() { 
        return this.undoStack.length >= 2; 
    }
    
    canRedo() { 
        return this.redoStack.length > 0; 
    }
}

export const historyManager = new HistoryManager();