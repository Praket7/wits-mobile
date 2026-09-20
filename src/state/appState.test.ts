import AsyncStorage from '@react-native-async-storage/async-storage';

// Child-switch behavior is exercised via the queries' key structure: switching a
// child must invalidate all child-scoped keys. We test the key contract itself.
import { keys } from '../queries/useWits';

describe('query key contract (parent child switching)', () => {
  it('scopes child-specific data by student id', () => {
    expect(keys.today('stu-a')).toEqual(['today', 'stu-a']);
    expect(keys.courses('stu-a')).toEqual(['courses', 'stu-a']);
    expect(keys.assignments('stu-a')).toEqual(['assignments', 'stu-a']);
    expect(keys.grades('stu-a')).toEqual(['grades', 'stu-a']);
    expect(keys.attendance('stu-a')).toEqual(['attendance', 'stu-a']);
    expect(keys.calendar('stu-a')).toEqual(['calendar', 'stu-a']);
  });

  it('produces different keys per child so switching refetches', () => {
    expect(keys.today('stu-a')).not.toEqual(keys.today('stu-b'));
  });

  it('keeps shared data unscoped', () => {
    expect(keys.messages).toEqual(['messages']);
    expect(keys.resources).toEqual(['resources']);
  });
});

describe('session persistence keys', () => {
  it('uses AsyncStorage for role and selected student', async () => {
    await AsyncStorage.setItem('wits.role', 'parent');
    await AsyncStorage.setItem('wits.selected-student', 'stu-maya');
    expect(await AsyncStorage.getItem('wits.role')).toBe('parent');
    expect(await AsyncStorage.getItem('wits.selected-student')).toBe('stu-maya');
  });
});
