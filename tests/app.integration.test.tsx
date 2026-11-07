// @vitest-environment jsdom
// Integration: the real page (App) uses the real checkAvailability and SAMPLE_ROOMS.
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../src/App';
import { SAMPLE_ROOMS } from '../src/data';

afterEach(cleanup);

function fill(current: string, start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Current time'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: end } });
  fireEvent.click(screen.getByRole('button', { name: /check availability/i }));
}

describe('App integration', () => {
  test('I1: Room A101, now 09:00, 11:00–12:00 → "Available" (AC5)', () => {
    render(<App />);
    fill('540', '660', '720');
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByText('Unavailable')).toBeNull();
  });

  test('I2: blocked room C303 → "Unavailable" replaces the earlier result (AC3/AC5)', () => {
    render(<App />);
    fill('540', '660', '720');
    expect(screen.getByText('Available')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Room C303/ }));
    fill('540', '660', '720');
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.queryByText('Available')).toBeNull();
    expect(screen.getByText(/blocked and cannot be booked/i)).toBeTruthy();
  });

  test('I3: empty required field → understandable validation message (AC6)', () => {
    render(<App />);
    fill('540', '660', '');
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.getByText('Please fill in all three time fields.')).toBeTruthy();
  });

  test('I4: overlap names the conflicting booking; repeated checks keep the data (AC4/AC5)', () => {
    render(<App />);
    fill('540', '630', '690');
    expect(screen.getByText(/Overlaps existing booking 600–660/)).toBeTruthy();
    fill('540', '660', '720');
    fill('540', '630', '690');
    expect(screen.getByText(/10:00 – 11:00/)).toBeTruthy();
    expect(SAMPLE_ROOMS[0].bookings).toEqual([{ start: 600, end: 660 }]);
  });
});
