import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, sumRecordedAmounts, payrollStatusLabel } from '../src/features/payroll/utils/payrollDisplay.js';
import { createCutoff, currentCutoff, getCutoffStatus } from '../src/features/payroll/components/payrollConstants.js';

test('recorded zero amounts remain zero; missing and invalid amounts stay unavailable', () => {
  for (const value of [0, '0', '0.00']) assert.equal(formatCurrency(value), '₱0.00');
  for (const value of [null, undefined, '', ' ', 'invalid', Infinity, false, {}]) assert.equal(formatCurrency(value), 'Not available');
});

test('totals aggregate recorded amounts exactly without salary fallbacks', () => {
  assert.equal(sumRecordedAmounts([{ gross_salary: '0.10' }, { gross_salary: '0.20' }], 'gross_salary'), '0.30');
  assert.equal(sumRecordedAmounts([{ gross_salary: '0.00', basic_salary: '1000.00' }], 'gross_salary'), '0.00');
  assert.equal(sumRecordedAmounts([{ basic_salary: '1000.00' }], 'gross_salary'), null);
  assert.equal(sumRecordedAmounts([{ net_salary: null }], 'net_salary'), null);
  assert.equal(sumRecordedAmounts([], 'net_salary'), '0.00');
});

test('semi-monthly selection uses parser-compatible month ends including leap years', () => {
  assert.equal(createCutoff(2028, 1, 2), 'February 16-29, 2028');
  assert.equal(createCutoff(2027, 1, 2), 'February 16-28, 2027');
  assert.equal(createCutoff(2026, 3, 2), 'April 16-30, 2026');
  assert.equal(createCutoff(2026, 11, 2), 'December 16-31, 2026');
  assert.equal(createCutoff(2026, 0, 1), 'January 1-15, 2026');
  assert.equal(createCutoff(0, 0, 1), null);
  assert.equal(createCutoff(2026.5, 0, 1), null);
});

test('default follows current local semi-monthly period and year rollover', () => {
  assert.equal(currentCutoff(new Date(2026, 10, 15)), 'November 1-15, 2026');
  assert.equal(currentCutoff(new Date(2026, 10, 16)), 'November 16-30, 2026');
  assert.equal(currentCutoff(new Date(2027, 0, 1)), 'January 1-15, 2027');
});

test('unknown statuses never imply a prepared or unprepared payroll', () => {
  assert.equal(getCutoffStatus([]), 'unprepared');
  assert.equal(getCutoffStatus([{ status: 'unknown' }]), 'unavailable');
  assert.equal(getCutoffStatus([{ status: 'draft' }, { status: 'unknown' }]), 'unavailable');
  assert.equal(payrollStatusLabel(undefined), 'Status unavailable');
});
