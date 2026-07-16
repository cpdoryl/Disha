import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DataTable, DataTableColumn } from '../DataTable';

interface Row {
  id: string;
  name: string;
  score: number;
}

const rows: Row[] = [
  { id: '1', name: 'Charlie', score: 30 },
  { id: '2', name: 'Alice', score: 10 },
  { id: '3', name: 'Bob', score: 20 },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, sortValue: (r) => r.name, render: (r) => r.name },
  { key: 'score', header: 'Score', sortable: true, sortValue: (r) => r.score, render: (r) => r.score },
];

describe('DataTable', () => {
  it('renders all rows in the given order by default', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const cells = screen.getAllByRole('row').slice(1); // skip header row
    expect(cells[0]).toHaveTextContent('Charlie');
    expect(cells[1]).toHaveTextContent('Alice');
    expect(cells[2]).toHaveTextContent('Bob');
  });

  it('sorts ascending then descending when a sortable header is clicked', async () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);

    await userEvent.click(screen.getByText('Name'));
    let dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0]).toHaveTextContent('Alice');
    expect(dataRows[1]).toHaveTextContent('Bob');
    expect(dataRows[2]).toHaveTextContent('Charlie');

    await userEvent.click(screen.getByText(/Name/));
    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0]).toHaveTextContent('Charlie');
    expect(dataRows[1]).toHaveTextContent('Bob');
    expect(dataRows[2]).toHaveTextContent('Alice');
  });

  it('shows the empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
