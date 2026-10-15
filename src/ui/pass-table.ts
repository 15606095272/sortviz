import type { PassRecord } from '../core/replay';
import { COPY } from '../copy/zh';

/** 表头文案（COPY 未覆盖的表结构字段，集中在此） */
const HEAD = { pass: '趟次', seq: '序列' } as const;

function cell(text: string, className?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text;
  return td;
}

/**
 * 每趟结果表：首行「初始」，之后每个 pass 一行快照，activePass 命中行加 .now。
 * 一趟都没走完时提示 COPY.emptyPasses（初始序列仍然显示）。
 */
export function renderPassTable(
  host: HTMLElement,
  initial: number[],
  passes: readonly PassRecord[],
  activePass: number | null,
): void {
  host.innerHTML = '';
  const table = document.createElement('table');

  const head = document.createElement('tr');
  const thPass = document.createElement('th');
  thPass.textContent = HEAD.pass;
  const thSeq = document.createElement('th');
  thSeq.textContent = HEAD.seq;
  head.append(thPass, thSeq);
  table.append(head);

  const initialRow = document.createElement('tr');
  initialRow.append(cell(COPY.initial), cell(initial.join(' '), 'mono'));
  table.append(initialRow);

  for (const record of passes) {
    const row = document.createElement('tr');
    if (activePass === record.pass) row.className = 'now';
    row.append(cell(COPY.pass.replace('{pass}', String(record.pass))), cell(record.data.join(' '), 'mono'));
    table.append(row);
  }

  if (passes.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty';
    const td = cell(COPY.emptyPasses);
    td.colSpan = 2;
    emptyRow.append(td);
    table.append(emptyRow);
  }

  host.append(table);
}
