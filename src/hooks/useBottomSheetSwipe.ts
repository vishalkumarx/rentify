import { useEffect } from 'react';

export function useBottomSheetSwipe() {
  useEffect(() => {
    let startY = 0;
    let sheetEl: HTMLElement | null = null;
    let isDragging = false;

    const touchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      sheetEl = target.closest('.bottom-sheet.visible') as HTMLElement;
      if (!sheetEl) return;
      
      // If we're interacting with a scrollable element inside the sheet, don't drag the sheet itself
      const closestScrollable = target.closest('.scrollable-content');
      if (closestScrollable && closestScrollable.scrollTop > 0) {
        sheetEl = null;
        return;
      }
      
      startY = e.touches[0].clientY;
      isDragging = false;
    };

    const touchMove = (e: TouchEvent) => {
      if (!sheetEl || !startY) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 5) { // small threshold to distinguish from tapping
        isDragging = true;
        sheetEl.style.transition = 'none';
        sheetEl.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
        if (e.cancelable) e.preventDefault(); // prevent pull-to-refresh
      }
    };

    const touchEnd = (e: TouchEvent) => {
      if (!sheetEl || !startY) return;
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      
      if (isDragging) {
        sheetEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        sheetEl.style.transform = '';
        
        if (deltaY > 100) {
          // Trigger a click on the overlay to close it
          const overlay = sheetEl.previousElementSibling as HTMLElement;
          if (overlay && overlay.classList.contains('bottom-sheet-overlay')) {
            overlay.click();
          }
        }
      }
      
      sheetEl = null;
      startY = 0;
      isDragging = false;
    };

    document.addEventListener('touchstart', touchStart, { passive: false });
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);

    return () => {
      document.removeEventListener('touchstart', touchStart);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    };
  }, []);
}
