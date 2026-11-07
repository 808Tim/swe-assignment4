// @vitest-environment jsdom
// Assignment #04 UI behavior checks: the real page with the real catalog, filters and booking rule.
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../src/App';
import { SAMPLE_ROOMS } from '../src/data';

afterEach(cleanup);

const roomButton = (name: string) => screen.queryByRole('button', { name: new RegExp(name) });
const shownRooms = () =>
  SAMPLE_ROOMS.map((r) => r.name).filter((name) => roomButton(name) !== null);

function setAttendees(value: string) {
  fireEvent.change(screen.getByLabelText(/Attendees/), { target: { value } });
}
function toggle(item: string) {
  fireEvent.click(screen.getByRole('checkbox', { name: item }));
}
function check(current: string, start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Current time'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: end } });
  fireEvent.click(screen.getByRole('button', { name: /check availability/i }));
}

describe('Room selection page', () => {
  test('UI1 (F1): 30 attendees shows A101 (exactly 30 seats); 31 hides it', () => {
    render(<App />);
    expect(shownRooms()).toHaveLength(SAMPLE_ROOMS.length);
    setAttendees('30');
    expect(shownRooms()).toEqual(['Room A101', 'Room C303']);
    setAttendees('31');
    expect(shownRooms()).toEqual(['Room C303']);
  });

  test('UI2 (F2): Projector + Computers shows only E505', () => {
    render(<App />);
    toggle('Projector');
    toggle('Computers');
    expect(shownRooms()).toEqual(['Room E505']);
  });

  test('UI3 (F4): no match → clear empty state and the check button is disabled', () => {
    render(<App />);
    toggle('Computers');
    toggle('Video conference');
    expect(shownRooms()).toEqual([]);
    expect(screen.getByText('No rooms match')).toBeTruthy();
    expect((screen.getByRole('button', { name: /check availability/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('UI4 (F3): the only match is blocked C303 → shown with a badge, result is Unavailable', () => {
    render(<App />);
    setAttendees('10');
    toggle('Video conference');
    expect(shownRooms()).toEqual(['Room C303']);
    expect(screen.getByText('Blocked')).toBeTruthy();
    check('540', '660', '720');
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.getByText(/blocked and cannot be booked/i)).toBeTruthy();
    expect(screen.queryByText('Available')).toBeNull();
  });

  test('UI5 (F5): switching rooms refreshes the result with the new room bookings', () => {
    render(<App />);
    check('540', '660', '720');
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Checked room: Room A101')).toBeTruthy();

    fireEvent.click(roomButton('Room D404')!); // D404 is booked 660–720
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.getByText('Overlaps existing booking 660–720.')).toBeTruthy();
    expect(screen.getByText('Checked room: Room D404')).toBeTruthy();

    fireEvent.click(roomButton('Room B202')!); // no bookings
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Checked room: Room B202')).toBeTruthy();
  });

  test('UI6 (F5): when the selected room is filtered out, the result belongs to the newly selected room', () => {
    render(<App />);
    fireEvent.click(roomButton('Room D404')!);
    check('540', '660', '720');
    expect(screen.getByText('Overlaps existing booking 660–720.')).toBeTruthy();

    setAttendees('20'); // D404 has 8 seats → hidden; A101 becomes the selection
    expect(roomButton('Room D404')).toBeNull();
    expect(screen.getByText('Checked room: Room A101')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Existing bookings for Room A101')).toBeTruthy();
  });

  test('UI7: invalid attendees value → understandable message instead of a room list', () => {
    render(<App />);
    setAttendees('0');
    expect(shownRooms()).toEqual([]);
    expect(screen.getAllByText('Attendees must be a whole number of at least 1.').length).toBeGreaterThan(0);
  });
});
