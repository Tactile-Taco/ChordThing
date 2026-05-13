import { test, expect } from '@playwright/test';

test.describe('Device Connect', () => {
  test.beforeEach(async ({ page }) => {
    // Mock navigator.serial before page loads
    await page.addInitScript(() => {
      const encoder = new TextEncoder();
      let readableController: ReadableStreamDefaultController<Uint8Array> | null = null;

      const mockPort = {
        readable: new ReadableStream<Uint8Array>({
          start(controller) {
            readableController = controller;
          },
        }),
        writable: new WritableStream<Uint8Array>({
          write(chunk) {
            const text = new TextDecoder().decode(chunk).trim();
            // Simulate CCOS device responses
            if (text === 'VERSION') {
              readableController?.enqueue(encoder.encode('VERSION 2.2.0\r\n'));
            } else if (text === 'ID') {
              readableController?.enqueue(encoder.encode('ID CharaChorder\r\n'));
            } else if (text === 'VAR B1 91') {
              readableController?.enqueue(encoder.encode('VAR B1 91 0 0\r\n'));
            } else if (text === 'CML C0') {
              readableController?.enqueue(encoder.encode('CML C0 2\r\n'));
            } else if (text.startsWith('CML C1')) {
              const index = text.split(' ')[2];
              if (index === '0') {
                readableController?.enqueue(
                  encoder.encode('CML C1 0 000CC200000000000000000000000000 68656C6C6F 0\r\n')
                );
              } else {
                readableController?.enqueue(
                  encoder.encode('CML C1 1 00000000000000000000000000000000 776F726C64 0\r\n')
                );
              }
            } else if (text.startsWith('VAR B3')) {
              // Keymap query - return dummy value
              readableController?.enqueue(encoder.encode('VAR B3 A1 0 32 0\r\n'));
            }
          },
        }),
        open: async () => {},
        close: async () => {},
        getInfo: () => ({ usbVendorId: 0x239A, usbProductId: 0x801F }),
      };

      Object.defineProperty(navigator, 'serial', {
        value: {
          requestPort: async () => mockPort,
          getPorts: async () => [mockPort],
        },
      });
    });

    await page.goto('/');
  });

  test('connect button shows connected state after successful connection', async ({ page }) => {
    await page.locator('#chara-connect').click();

    // Wait for the connection flow to complete
    const connectButton = page.locator('#chara-connect');
    await expect(connectButton).toHaveText('connected');
    await expect(connectButton).toHaveAttribute('data-connected', 'true');
  });
});
