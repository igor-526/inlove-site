export type TableCellFormatter = 'text_bold' | 'text_italic' | 'text_underline';

export type TableColumn = {
    key: string;
    title: string;
    annotation: string;
    cell_formatter: TableCellFormatter[];
};

export type TableCell = {
    value: string;
    annotation: string;
    cell_formatter: TableCellFormatter[];
};

export type TableRow = {
    cells: Record<string, TableCell>;
};

export type TableType = {
    columns: TableColumn[];
    rows: TableRow[];
};
