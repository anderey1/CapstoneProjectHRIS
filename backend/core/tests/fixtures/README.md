# Legacy attendance fixture

`attendance-legacy.xls` is synthetic Excel 97-2003 test data, generated with xlwt 1.3.0. It contains a text employee ID (`000123`), four punches on 2026-05-04, and native Excel date/time cells. No real personnel information is included. Tests read the committed fixture with xlrd; xlwt is not a runtime or test dependency.
