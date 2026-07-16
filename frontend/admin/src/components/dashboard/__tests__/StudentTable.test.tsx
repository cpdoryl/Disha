import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StudentTable } from '../StudentTable';
import type { Student } from '@/types/student';

const students: Student[] = [
  {
    id: '1',
    schoolId: 's1',
    enrollmentNumber: 'ENR-001',
    firstName: 'Asha',
    lastName: 'Rao',
    gradeLevel: 5,
    classSection: 'A',
    status: 'active',
    guardianName: 'Ram Rao',
    guardianPhone: '9990001111',
  },
  {
    id: '2',
    schoolId: 's1',
    enrollmentNumber: 'ENR-002',
    firstName: 'Bilal',
    lastName: 'Khan',
    gradeLevel: 6,
    classSection: 'B',
    status: 'active',
    guardianName: 'Farid Khan',
    guardianPhone: '9990002222',
  },
];

describe('StudentTable', () => {
  it('renders every student by default', () => {
    render(<StudentTable students={students} title="Students" />);
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Bilal Khan')).toBeInTheDocument();
    expect(screen.getByText('Students (2)')).toBeInTheDocument();
  });

  it('filters by search text across name and enrollment number', async () => {
    render(<StudentTable students={students} title="Students" />);

    await userEvent.type(screen.getByPlaceholderText(/search by name/i), 'bilal');

    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();
    expect(screen.getByText('Bilal Khan')).toBeInTheDocument();
    expect(screen.getByText('Students (1)')).toBeInTheDocument();
  });

  it('shows an empty message when no students are passed', () => {
    render(<StudentTable students={[]} title="Students" />);
    expect(screen.getByText('No students found.')).toBeInTheDocument();
  });
});
