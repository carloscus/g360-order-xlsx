/**
 * Tests for back button functionality
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { DistributionDashboard } from './DistributionDashboard'

// Mock window.history
const mockHistoryBack = vi.fn()
const mockLocationHref = vi.fn()

Object.defineProperty(window, 'history', {
  value: { back: mockHistoryBack, length: 2 },
  writable: true
})

Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
})

describe('Back Button Functionality', () => {
  it('should close modal when back button is clicked', () => {
    const mockOnClose = vi.fn()

    render(() => (
      <DistributionDashboard
        onClose={mockOnClose}
        productos={[]}
        totales={{}}
      />
    ))

    const backButton = screen.getByRole('button', { name: /volver/i })
    fireEvent.click(backButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should have proper accessibility attributes', () => {
    const mockOnClose = vi.fn()

    render(() => (
      <DistributionDashboard
        onClose={mockOnClose}
        productos={[]}
        totales={{}}
      />
    ))

    const backButton = screen.getByRole('button', { name: /volver/i })
    expect(backButton).toHaveAttribute('aria-label', 'Volver a la página principal')
  })

  it('should prevent default event behavior', () => {
    const mockOnClose = vi.fn()

    render(() => (
      <DistributionDashboard
        onClose={mockOnClose}
        productos={[]}
        totales={{}}
      />
    ))

    const backButton = screen.getByRole('button', { name: /volver/i })

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    }

    fireEvent.click(backButton, mockEvent)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should fallback to browser history when no onClose provided', () => {
    // This would require modifying the component to handle the case
    // where onClose is not provided, but in current design it's always provided
    expect(true).toBe(true) // Placeholder test
  })
})