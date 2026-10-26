import { useEffect } from 'react';

/**
 * Custom React hook that invokes a callback when the Escape (Esc) key is pressed.
 * Ideal for closing modals, dialogs, drawers, and dropdowns.
 *
 * @param {Function} onEscape - Function to execute when Escape is pressed
 * @param {boolean} [isActive=true] - Whether the shortcut is currently active
 */
export const useEscapeKey = (onEscape, isActive = true) => {
  useEffect(() => {
    if (!isActive || typeof onEscape !== 'function') return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, isActive]);
};

export default useEscapeKey;
