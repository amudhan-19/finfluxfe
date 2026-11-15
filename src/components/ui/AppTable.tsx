import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

export type AppTableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

export type AppTableProps<T> = {
  columns: AppTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  toolbar?: ReactNode
  pagination?: ReactNode
  getRowKey: (row: T, index: number) => string | number
  className?: string
}

export function AppTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No data',
  emptyDescription,
  toolbar,
  pagination,
  getRowKey,
  className = '',
}: AppTableProps<T>) {
  const wrapClass = ['app-table-wrap', className].filter(Boolean).join(' ')

  return (
    <div>
      {toolbar != null ? <div className="app-table-toolbar">{toolbar}</div> : null}
      <div className={wrapClass}>
        <table className="app-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align ?? 'left',
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={getRowKey(row, i)}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination != null ? <div className="app-table-pagination">{pagination}</div> : null}
    </div>
  )
}
