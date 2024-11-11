/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, vi } from 'vitest'
import * as main from './main'

// Mock the action's entrypoint
const runMock = vi.spyOn(main, 'run').mockImplementation(async () => {})

describe('index', () => {
  it('calls run when imported', async () => {
    await import('./index.js')

    expect(runMock).toHaveBeenCalled()
  })
})
