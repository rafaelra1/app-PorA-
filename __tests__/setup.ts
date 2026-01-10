import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup após cada teste
afterEach(() => {
    cleanup();
});

// Mock do crypto.randomUUID se não estiver disponível
if (!global.crypto) {
    global.crypto = {
        randomUUID: () => Math.random().toString(36).substring(2, 15),
    } as any;
}

// Mock do navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: true,
});
