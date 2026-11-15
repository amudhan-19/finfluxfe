import { DataGrid, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid'

export type AppDataGridProps<R extends GridValidRowModel = GridValidRowModel> = DataGridProps<R> & {
  className?: string
}

const defaultPageSizes = [10, 25, 50]

/**
 * Enterprise DataGrid wrapper — premium license registered at app boot.
 * Applies `.app-data-grid` styles (sticky header, brand headers).
 */
export function AppDataGrid<R extends GridValidRowModel = GridValidRowModel>({
  className = '',
  pagination = true,
  pageSizeOptions = defaultPageSizes,
  disableRowSelectionOnClick = true,
  rowHeight = 76,
  columnHeaderHeight = 52,
  ...rest
}: AppDataGridProps<R>) {
  const classes = ['app-data-grid', className].filter(Boolean).join(' ')

  return (
    <DataGrid
      className={classes}
      pagination={pagination}
      pageSizeOptions={pageSizeOptions}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      rowHeight={rowHeight}
      columnHeaderHeight={columnHeaderHeight}
      {...rest}
    />
  )
}
