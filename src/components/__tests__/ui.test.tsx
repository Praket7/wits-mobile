import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListRow, StatusPill, SegmentedControl, EmptyState, ErrorState, SectionHeader } from '../ui';

describe('StatusPill', () => {
  it('renders present with success tone', async () => {
    await render(<StatusPill label="Present" tone="success" />);
    expect(screen.getByText('Present')).toBeTruthy();
  });
  it('renders tardy with warning tone', async () => {
    await render(<StatusPill label="Tardy" tone="warning" />);
    expect(screen.getByText('Tardy')).toBeTruthy();
  });
  it('renders absent with danger tone', async () => {
    await render(<StatusPill label="Absent" tone="danger" />);
    expect(screen.getByText('Absent')).toBeTruthy();
  });
});

describe('ListRow', () => {
  it('fires onPress and is accessible', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="AP Chemistry" subtitle="Mr. Morgan" onPress={onPress} chevron />);
    fireEvent.press(screen.getByLabelText('AP Chemistry'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('renders subtitle', async () => {
    await render(<ListRow title="Lab Questions" subtitle="AP Chemistry" />);
    expect(screen.getByText('AP Chemistry')).toBeTruthy();
  });
});

describe('SegmentedControl', () => {
  it('selects an option on press', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={['Agenda', 'Month']} value="Agenda" onChange={onChange} />);
    fireEvent.press(screen.getByText('Month'));
    expect(onChange).toHaveBeenCalledWith('Month');
  });
  it('marks the active option', async () => {
    await render(<SegmentedControl options={['Agenda', 'Month']} value="Month" onChange={() => {}} />);
    expect(screen.getByLabelText('Month').props.accessibilityState).toEqual({ selected: true });
  });
});

describe('EmptyState / ErrorState', () => {
  it('renders empty message', async () => {
    await render(<EmptyState title="No results" message="Try another query" />);
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try another query')).toBeTruthy();
  });
  it('renders error state', async () => {
    await render(<ErrorState message="Network unavailable" />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Network unavailable')).toBeTruthy();
  });
});

describe('SectionHeader', () => {
  it('renders action label', async () => {
    await render(<SectionHeader title="Recent Grades" actionLabel="See All" onAction={() => {}} />);
    expect(screen.getByText('See All')).toBeTruthy();
  });
});
