import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores';
import './SidebarResizer.css';

const MIN_WIDTH = 200;
const MAX_WIDTH_RATIO = 0.33;

function getMaxWidth() {
  // Ensure max is never below min (for very small windows)
  return Math.max(MIN_WIDTH, Math.floor(window.innerWidth * MAX_WIDTH_RATIO));
}

function clampWidth(width: number) {
  return Math.min(getMaxWidth(), Math.max(MIN_WIDTH, width));
}

export function SidebarResizer() {
  const { sidebarWidth, setSidebarWidth, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragWidthRef = useRef(sidebarWidth);

  // Clamp width on window resize
  useEffect(() => {
    const handleResize = () => {
      const clamped = clampWidth(sidebarWidth);
      if (sidebarWidth !== clamped) {
        setSidebarWidth(clamped);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth, setSidebarWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (sidebarCollapsed) return;
    e.preventDefault();
    dragWidthRef.current = sidebarWidth;
    setIsDragging(true);
  }, [sidebarCollapsed, sidebarWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const sidebarContainer = document.querySelector('.sidebar-container') as HTMLElement;
    if (!sidebarContainer) return;

    // Disable transitions during drag for instant feedback
    sidebarContainer.style.transition = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = clampWidth(e.clientX);
      dragWidthRef.current = newWidth;
      sidebarContainer.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      // Restore transitions
      sidebarContainer.style.transition = '';
      // Persist final width to store
      setSidebarWidth(dragWidthRef.current);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setSidebarWidth]);

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('resizing');
    } else {
      document.body.classList.remove('resizing');
    }
  }, [isDragging]);

  return (
    <div
      className={`sidebar-resizer ${isDragging ? 'dragging' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="sidebar-resizer-handle" />
      <button
        className="sidebar-resizer-collapse-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebarCollapsed();
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
