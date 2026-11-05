"""Read bounded attendance spreadsheets into the same row contract."""
import csv
from hashlib import sha256
from io import BytesIO, StringIO
from pathlib import Path
from zipfile import ZipFile

from openpyxl import load_workbook
import xlrd
from rest_framework.exceptions import ValidationError

HEADERS = ['employee_identifier', 'identifier_type', 'source_id', 'date', 'time', 'punch_type', 'employee_name']
MAX_ROWS = 10000
MAX_BYTES = 5 * 1024 * 1024
CONTENT_TYPES = {
    '.xlsx': {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'},
    '.xls': {'application/vnd.ms-excel', 'application/msexcel', 'application/octet-stream'},
    '.csv': {'text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'},
}


def read_xlsx(data):
    with ZipFile(BytesIO(data)) as archive:
        if sum(info.file_size for info in archive.infolist()) > 25 * 1024 * 1024 or len(archive.infolist()) > 100:
            raise ValueError('Workbook is too large when expanded.')
        if any('vbaProject' in name for name in archive.namelist()):
            raise ValueError('Macros are not supported.')
    book = load_workbook(BytesIO(data), read_only=True, data_only=False, keep_links=False)
    try:
        if len(book.worksheets) != 1:
            raise ValueError('Use one worksheet per import.')
        sheet = book.active
        if sheet.max_row > MAX_ROWS + 1 or sheet.max_column > len(HEADERS):
            raise ValueError('Workbook exceeds the row or column limit.')
        return list(sheet.iter_rows(values_only=True))
    finally:
        book.close()


def read_xls(data):
    book = xlrd.open_workbook(file_contents=data, on_demand=True, logfile=StringIO())
    try:
        if book.nsheets != 1:
            raise ValueError('Use one worksheet per import.')
        sheet = book.sheet_by_index(0)
        if sheet.nrows > MAX_ROWS + 1 or sheet.ncols > len(HEADERS):
            raise ValueError('Workbook exceeds the row or column limit.')
        rows = []
        for index in range(sheet.nrows):
            row = []
            for column, cell in enumerate(sheet.row(index)):
                value = cell.value
                if cell.ctype == xlrd.XL_CELL_ERROR:
                    raise ValueError('Workbook contains Excel errors.')
                if cell.ctype == xlrd.XL_CELL_DATE:
                    stamp = xlrd.xldate_as_datetime(value, book.datemode)
                    value = stamp.time() if column == 4 else stamp.date()
                row.append(value)
            rows.append(row)
        return rows
    finally:
        book.release_resources()


def read_csv(data):
    if data.startswith((b'\xff\xfe', b'\xfe\xff')):
        content = data.decode('utf-16')
    else:
        try:
            content = data.decode('utf-8-sig')
        except UnicodeDecodeError:
            content = data.decode('cp1252')
    if '\x00' in content:
        raise ValueError('CSV must be UTF-8 or Windows-1252 text.')
    # Match the header rather than guessing from employee names or other data.
    for delimiter in (',', ';', '\t'):
        reader = csv.reader(StringIO(content, newline=''), delimiter=delimiter, strict=True)
        header = next(reader, [])
        if [value.strip() for value in header] == HEADERS:
            rows = [header]
            for row in reader:
                rows.append([value.strip() for value in row])
                if len(rows) > MAX_ROWS + 1:
                    raise ValueError('CSV exceeds the row limit.')
            return rows
    raise ValueError('CSV headers do not match the template.')


def read_upload(upload):
    extension = Path(upload.name).suffix.lower() if upload else ''
    if extension not in CONTENT_TYPES:
        raise ValidationError({'detail': 'Upload an Excel (.xlsx or .xls) or CSV (.csv) attendance file.'})
    if upload.size > MAX_BYTES:
        raise ValidationError({'detail': 'Attendance file exceeds the 5 MB limit.'})
    content_type = (upload.content_type or '').split(';')[0].lower()
    if content_type not in CONTENT_TYPES[extension]:
        raise ValidationError({'detail': 'Invalid attendance file content type.'})
    data = upload.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValidationError({'detail': 'Attendance file exceeds the 5 MB limit.'})
    try:
        reader = {'.xlsx': read_xlsx, '.xls': read_xls, '.csv': read_csv}[extension]
        rows = reader(data)
        if not rows or [str(value).strip() for value in rows[0]] != HEADERS:
            raise ValueError('Column headers must match the downloaded template.')
        if len(rows) > MAX_ROWS + 1 or any(len(row) > len(HEADERS) for row in rows):
            raise ValueError('Attendance file exceeds the row or column limit.')
    except Exception as exc:
        raise ValidationError({'detail': 'Invalid attendance file. Use the template columns, one worksheet, and at most 10,000 punches.'}) from exc
    # CSV and old Excel may omit empty trailing cells. All parsers feed the same validator.
    normalized = [list(row) + [None] * (len(HEADERS) - len(row)) for row in rows[1:]]
    return sha256(data).hexdigest(), normalized
