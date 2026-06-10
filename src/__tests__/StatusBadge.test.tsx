import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders the human-readable label for each status', () => {
    const { rerender } = render(<StatusBadge status="available" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Available');

    rerender(<StatusBadge status="in_use" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('In Use');

    rerender(<StatusBadge status="maintenance" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Maintenance');

    rerender(<StatusBadge status="offline" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Offline');
  });
});
