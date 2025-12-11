
import { useEffect, useRef } from 'react';

/**
 * useBarcodeScanner
 * 
 * Listens for high-speed keyboard input characteristic of a barcode scanner (HID mode).
 * If a sequence of characters is entered rapidly (<30ms between strokes) ending with Enter,
 * it triggers the onScan callback.
 * 
 * @param onScan Callback function receiving the scanned barcode string
 */
export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const SCANNER_THRESHOLD_MS = 40; // Scanners usually type within 10-30ms per char

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      
      // If user is typing in a form input, ignore (unless we want to override input behavior)
      // Usually better to let normal inputs behave normally, unless we force focus elsewhere.
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInput) return;

      if (e.key === 'Enter') {
        // If buffer has content and was typed rapidly, fire scan event
        if (bufferRef.current.length > 2 && timeSinceLastKey < SCANNER_THRESHOLD_MS * 5) {
           // Small tolerance for the 'Enter' key delay
           onScan(bufferRef.current);
           bufferRef.current = '';
        } else {
           // Just a normal enter key or slow typing, clear buffer
           bufferRef.current = '';
        }
      } else if (e.key.length === 1) { // Printable char
        if (timeSinceLastKey > SCANNER_THRESHOLD_MS) {
           // Too slow, probably manual typing. Reset buffer.
           bufferRef.current = e.key;
        } else {
           // Fast, append to buffer
           bufferRef.current += e.key;
        }
      } else {
        // Non-printable keys reset buffer usually
        // bufferRef.current = '';
      }
      
      lastKeyTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan]);
};
