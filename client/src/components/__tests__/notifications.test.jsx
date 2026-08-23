import { describe, it, expect } from 'vitest';
import reducer, { addNotification, removeNotification } from '../../store/slices/uiSlice';

describe('notification ids (#42)', () => {
  it('assigns unique ids even for notifications created in the same ms', () => {
    const state1 = reducer(undefined, addNotification({ message: 'a' }));
    const state2 = reducer(state1, addNotification({ message: 'b' }));
    expect(state2.notifications).toHaveLength(2);
    const [first, second] = state2.notifications;
    expect(first.id).not.toBe(second.id);
  });

  it('removes only the targeted notification', () => {
    let state = reducer(undefined, addNotification({ message: 'a' }));
    state = reducer(state, addNotification({ message: 'b' }));
    const targetId = state.notifications[0].id;
    state = reducer(state, removeNotification(targetId));
    expect(state.notifications.map(n => n.message)).toEqual(['b']);
  });

  it('increments ids monotonically', () => {
    let state = undefined;
    for (let i = 0; i < 5; i++) {
      state = reducer(state, addNotification({ message: `n${i}` }));
    }
    const ids = state.notifications.map(n => n.id);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sorted);
  });
});
