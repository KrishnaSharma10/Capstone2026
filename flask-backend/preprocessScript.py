import re
import json
import sys
from pathlib import Path
from openpyxl import load_workbook

# ── Constants ──────────────────────────────────────────────────────────────────────

DAYS         = ['MON', 'TUE', 'WED', 'THU', 'FRI']
SLOTS_PER_DAY = 14

# Sheets to skip unconditionally (PG, duplicates, non-timetable sheets)
# Matching is done on the stripped, lowercased sheet name.
SKIP_SHEETS = {
    'pg time table 1',
    'pg time table1',
    'dlit',    # empty older duplicate;   # empty duplicate; '4th year-b' or '4th year b ' has real data
}

# Explicit "lab continuation" labels in the course-code row
_CONTINUATION_RE = re.compile(r'^LAB[-\s]?\d*$', re.IGNORECASE)

# A course code: starts with U, then at least 2 chars (letters/digits/X)
# Intentionally broad — the university changes prefixes (UCS, UEI, UCT, UCSXX, etc.)
_COURSE_RE = re.compile(r'^U[A-Z][A-Z0-9]{2,}', re.IGNORECASE)


# ── Helpers ─────────────────

def is_course_code(val) -> bool:
    """Return True if val looks like a course code (real or placeholder)."""
    if not val:
        return False
    s = str(val).strip()
    # Handle elective combos like UCS301/UCS302 — check first part
    first = s.split('/')[0].strip()
    # Strip trailing type suffix L/P/T if present
    if first and first[-1].upper() in ('L', 'P', 'T'):
        first = first[:-1]
    return bool(_COURSE_RE.match(first))

def extract_code_and_type(raw: str):
    if not raw:
        return None, None
    s = str(raw).strip().replace(' ', '')

    # Elective: slash-separated choices like UCS751L/UCS752L/UMC742L
    # Student picks one — don't assign any slot.
    # Only treat as elective if there's no '+' (which means combined, not optional).
    if '/' in s and '+' not in s:
        return None, None

    # Combined course: UCS534+ULC664L — both taught together.
    # Take only the first code; the slot still gets recorded normally.
    if '+' in s:
        s = s.split('+')[0]

    # Take first part for any remaining slash (e.g. UCS301/UCS302 edge cases)
    first = s.split('/')[0]

    m = re.match(r'(U[A-Z][A-Z0-9]+?)([LPT])?$', first, re.IGNORECASE)
    if not m:
        return None, None

    code   = m.group(1).upper()
    suffix = (m.group(2) or '').upper()

    if not _COURSE_RE.match(code):
        return None, None

    typ = {'L': 'lecture', 'P': 'lab', 'T': 'tutorial'}.get(suffix, 'lecture')
    return code, typ


def is_continuation_of_previous(val) -> bool:
  
    if val is None:
        return False
    s = str(val).strip()
    if not s:
        return False
    if _CONTINUATION_RE.match(s):
        return True
    if is_course_code(s):
        return False
    # Stray text / teacher abbreviation / room code → treat as continuation marker
    return True


def slot_label(day_idx: int, slot_idx: int) -> str:
    return f"{DAYS[day_idx]}-{slot_idx + 1}"


# ── Merged Cell Lookup ──────────────────────────────────

def build_merge_lookup(sheet) -> dict:
    lk = {}
    for mr in sheet.merged_cells.ranges:
        for r in range(mr.min_row, mr.max_row + 1):
            for c in range(mr.min_col, mr.max_col + 1):
                lk[(r, c)] = mr
    return lk


def read_cell(sheet, row, col, merge_lookup):
    """Read cell value, following merged cell back to top-left."""
    mr = merge_lookup.get((row, col))
    if mr:
        return sheet.cell(mr.min_row, mr.min_col).value
    return sheet.cell(row, col).value


# ── Layout Detection ───────────

def find_hours_cell(sheet):
    """
    Find the HOURS/HOUR header cell — our layout anchor.
    Returns (row, col) or (None, None).
    Searches first 15 rows; picks the cell with smallest row+col sum.
    """
    best, best_sum = None, float('inf')
    for row in sheet.iter_rows(max_row=15):
        for cell in row:
            if cell.value is not None and str(cell.value).strip().upper() in ('HOURS', 'HOUR'):
                s = cell.row + cell.column
                if s < best_sum:
                    best_sum = s
                    best = (cell.row, cell.column)
    return best if best else (None, None)


def get_subgroup_columns(sheet, header_row: int, hours_col: int) -> dict[str, int]:
    SKIP_VALUES = {
        'HOURS', 'HOUR', 'DAY', 'DAYS', 'SR NO', 'SR.NO', 'BRANCH',
        'PRACTICAL', 'TUTORIAL', 'LECTURE', 'TOTAL', 'SIGNATURE', '',
        'ELECTRONICS', 'ELECTRICAL', 'COMPUTER SCIENCE', 'COMPUTER E',
        'COMPUTER ENGG', 'CIVIL ENGG', 'MECHANICAL ENGG', 'CHEMICAL ENGG',
        'BIOMEDICAL ENGG', 'BIOTECHNOLOGY ENGG',
    }
    sg_map: dict[str, int] = {}
    seen_cols: set[int] = set()

    # Scan bottom-up: header_row first, then rows above.
    # This ensures the specific subgroup name (4C11) in the lowest row
    # wins over the merged parent label (4C1) in a row above it.
    for r in range(header_row, max(0, header_row - 4), -1):
        for c in range(hours_col + 1, sheet.max_column + 1):
            val = sheet.cell(r, c).value
            if val is None:
                continue
            s = str(val).strip()
            if not s:
                continue
            if s.upper() in SKIP_VALUES:
                continue
            if s[0].isdigit() and 3 <= len(s) <= 6 and re.match(r'^[A-Z0-9]+$', s, re.IGNORECASE):
                if c not in seen_cols:
                    sg_map[s] = c
                    seen_cols.add(c)

    return sg_map

def get_sr_col(sheet, header_row: int) -> int:
  
    for c in range(1, 4):
        v = str(sheet.cell(header_row, c).value or '').strip().upper()
        if 'SR' in v or v in ('1', '2'):
            return c
    return 2  # default


def get_first_data_row(sheet, header_row: int, sr_col: int) -> int:

    for r in range(header_row + 1, header_row + 8):
        v = sheet.cell(r, sr_col).value
        if v == 1 or v == '1':
            return r
    return header_row + 1


def detect_row_step(sheet, first_data_row: int, sr_col: int) -> int:
  
    v = sheet.cell(first_data_row + 1, sr_col).value
    return 1 if (v == 2 or v == '2') else 2


# ── Slot Iterator ──────────────────────────────────────────────────────────────────────

def iter_slot_rows(sheet, first_data_row: int, row_step: int, sr_col: int):
   
    row = first_data_row
    max_row = sheet.max_row

    for day_idx in range(len(DAYS)):
        for slot_idx in range(SLOTS_PER_DAY):
            if row > max_row:
                return
            venue_row = row + 1 if row_step == 2 else row
            yield day_idx, slot_idx, row, venue_row
            row += row_step


# ── Per-Subgroup Builder ──────────────────────────────────────────────────────────────────────

def build_subgroup_slots(sheet, sg_col: int, first_data_row: int,
                          row_step: int, sr_col: int, merge_lookup: dict) -> list:
 
    slots_iter = list(iter_slot_rows(sheet, first_data_row, row_step, sr_col))
    entries = []
    last_code = None  # (code, type) from previous slot for Pattern B detection
    last_was_lab_start = False  # True if previous slot was Pattern-A lab start

    for (day_idx, slot_idx, code_row, venue_row) in slots_iter:
        raw_val = read_cell(sheet, code_row, sg_col, merge_lookup)

        # ── Pattern A: continuation marker (LAB/stray text) ──
        if is_continuation_of_previous(raw_val):
            if last_code is not None:
                entries.append({
                    'slot': slot_label(day_idx, slot_idx),
                    'code': last_code[0],
                    'type': last_code[1],
                })
            # Keep last_code alive in case there's a 3-slot span
            continue

        # Reset last_code at every non-continuation slot
        last_code = None

        if raw_val is None:
            continue
        s = str(raw_val).strip()
        if not s:
            continue

        code, typ = extract_code_and_type(s)
        if code is None:
            continue

        # Emit this slot
        entries.append({
            'slot': slot_label(day_idx, slot_idx),
            'code': code,
            'type': typ,
        })
        last_code = (code, typ)

    # ── Pattern B: repeated code ──────────────────────────────────
    # Walk entries; if two consecutive entries for the SAME subgroup slot sequence
    # have the same code, they were written twice in the Excel — already captured.
    # (Pattern B is naturally handled because we read the code at each slot row.
    #  UTD003L at slot 5 AND slot 6 → two entries → deduplicated in aggregate.)

    return entries


# ── Aggregator ──────────────────────────────────────────────────────────────────────

def aggregate(entries: list) -> dict:
  
    result = {'lecture': {}, 'lab': {}, 'tutorial': {}}
    for e in entries:
        bucket = result[e['type']]
        if e['code'] not in bucket:
            bucket[e['code']] = []
        # Avoid exact duplicate slot entries (can happen at merged-cell edges)
        if e['slot'] not in bucket[e['code']]:
            bucket[e['code']].append(e['slot'])
    return result


# ── Sheet Processor ──────────────────────────────────────────────────────────────────────

def process_sheet(sheet) -> tuple[dict, dict]:
 
    hours_row, hours_col = find_hours_cell(sheet)
    if hours_row is None:
        return {}, {}

    header_row = hours_row   # The HOURS cell IS in the header row
    sg_map = get_subgroup_columns(sheet, header_row, hours_col)
    if not sg_map:
        return {}, {}

    sr_col         = get_sr_col(sheet, header_row)
    first_data_row = get_first_data_row(sheet, header_row, sr_col)
    row_step       = detect_row_step(sheet, first_data_row, sr_col)
    merge_lookup   = build_merge_lookup(sheet)

    subgroup_dict       = {}
    course_to_subgroups = {}

    for sg_name, sg_col in sg_map.items():
        entries = build_subgroup_slots(
            sheet, sg_col, first_data_row, row_step, sr_col, merge_lookup)
        agg = aggregate(entries)
        subgroup_dict[sg_name] = agg

        for typ in ('lecture', 'lab', 'tutorial'):
            for code in agg[typ]:
                lst = course_to_subgroups.setdefault(code, [])
                if sg_name not in lst:
                    lst.append(sg_name)

    return subgroup_dict, course_to_subgroups


# ── Workbook Processor ──────────────────────────────────────────────────────────────────────

def should_process(sheet) -> bool:
   

    # 1. Must contain HOURS/HOUR somewhere in top rows
    found_hours = False
    for row in sheet.iter_rows(max_row=15, values_only=True):
        for cell in row:
            if cell and str(cell).strip().upper() in ("HOURS", "HOUR"):
                found_hours = True
                break
        if found_hours:
            break

    if not found_hours:
        return False

    # 2. Must contain subgroup-like values (e.g. 2C1A, 3E2B)
    subgroup_found = False
    for row in sheet.iter_rows(max_row=15, values_only=True):
        for cell in row:
            if cell:
                s = str(cell).strip()
                if (
                    len(s) >= 3 and
                    s[0].isdigit() and
                    any(c.isalpha() for c in s)
                ):
                    subgroup_found = True
                    break
        if subgroup_found:
            break

    return subgroup_found

def process_workbook(path: str) -> tuple[dict, dict]:
   
    wb = load_workbook(path)
    subgroups = {}
    courses   = {}

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]

        if not should_process(sheet):
          continue
        sg_dict, course_map = process_sheet(sheet)

        # Merge subgroups ─ later sheets win on conflict (or extend)
        for sg, data in sg_dict.items():
            if sg not in subgroups:
                subgroups[sg] = data
            else:
                # Merge: extend slot lists for each type/code
                for typ in ('lecture', 'lab', 'tutorial'):
                    for code, slots in data[typ].items():
                        existing = subgroups[sg][typ].setdefault(code, [])
                        for s in slots:
                            if s not in existing:
                                existing.append(s)

        for code, sgs in course_map.items():
            existing = courses.setdefault(code, [])
            for sg in sgs:
                if sg not in existing:
                    existing.append(sg)

    return subgroups, courses


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    path = "/content/UG, PG TIME TABLE JAN TO MAY 2026.xlsx" # Explicitly set the path for Colab execution

    # The following block is commented out to prevent issues with sys.argv in Colab environment
    # if len(sys.argv) > 1:
    #     path = sys.argv[1]
    # else:
    #     # Default: look for the xlsx next to this script
    #     default = Path(__file__).parent / 'UG__PG_TIME_TABLE_JAN_TO_MAY_2026.xlsx'
    #     if default.exists():
    #         path = str(default)
    #     else:
    #         print("Usage: python timetable_parser.py <path_to_timetable.xlsx>")
    #         sys.exit(1)

    print(f"Parsing: {path}\n")
    subgroups, courses = process_workbook(path)

    print(f"✅  {len(subgroups)} subgroups  |  {len(courses)} unique course codes\n")

    # ── Write subgroups.json ──
    out_sg = Path(path).parent / 'subgroups.json'
    with open(out_sg, 'w', encoding='utf-8') as f:
        json.dump(subgroups, f, indent=2)
    print(f"Saved → {out_sg}")

    # ── Write courses.json ──
    out_c = Path(path).parent / 'courses.json'
    with open(out_c, 'w', encoding='utf-8') as f:
        json.dump(courses, f, indent=2)
    print(f"Saved → {out_c}")

    # ── Quick sanity output ──
    print("\n── Sample: first 3 subgroups ──")
    for sg in list(subgroups.keys())[:3]:
        print(f"\n  {sg}:")
        data = subgroups[sg]
        for typ in ('lecture', 'lab', 'tutorial'):
            for code, slots in data[typ].items():
                print(f"    [{typ:8}] {code:14} → {slots}")

    print("\n── Sample: first 5 course codes ──")
    for code in list(courses.keys())[:5]:
        print(f"  {code:14} → {courses[code]}")


if __name__ == '__main__':
    main()