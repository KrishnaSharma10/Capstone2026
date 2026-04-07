import re
import json
import os
import sys
from pathlib import Path
from openpyxl import load_workbook
from pymongo import MongoClient, UpdateOne

# ── Constants ──────────────────────────────────────────────────────────────────────

DAYS          = ['MON', 'TUE', 'WED', 'THU', 'FRI']
SLOTS_PER_DAY = 14

SKIP_SHEETS = {
    'pg time table 1',
    'pg time table1',
    'dlit',
}

_CONTINUATION_RE = re.compile(r'^LAB[-\s]?\d*$', re.IGNORECASE)
_COURSE_RE       = re.compile(r'^U[A-Z][A-Z0-9]{2,}', re.IGNORECASE)

# ── Slot display maps ──────────────────────────────────────────────────────────────

DAY_MAP = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THU': 'Thursday',
    'FRI': 'Friday',
}

SLOT_TIMES = {
    1:  '8:00 AM',
    2:  '8:50 AM',
    3:  '9:40 AM',
    4:  '10:30 AM',
    5:  '11:20 AM',
    6:  '12:10 PM',
    7:  '1:00 PM',
    8:  '1:50 PM',
    9:  '2:40 PM',
    10: '3:30 PM',
    11: '4:20 PM',
    12: '5:10 PM',
    13: '6:00 PM',
    14: '6:50 PM',
}

TYPE_COLOR = {
    'lecture':  '#FFD700',
    'lab':      '#90EE90',
    'tutorial': '#ADD8E6',
}


def slot_to_display(slot_str: str):
    """'MON-3' → ('Monday', '9:40 AM')"""
    parts = slot_str.split('-')
    day   = DAY_MAP.get(parts[0], parts[0])
    hour  = SLOT_TIMES.get(int(parts[1]), parts[1])
    return day, hour


# ── Helpers ────────────────────────────────────────────────────────────────────────

def is_course_code(val) -> bool:
    if not val:
        return False
    s     = str(val).strip()
    first = s.split('/')[0].strip()
    if first and first[-1].upper() in ('L', 'P', 'T'):
        first = first[:-1]
    return bool(_COURSE_RE.match(first))


def extract_code_and_type(raw: str):
    if not raw:
        return None, None
    s = str(raw).strip().replace(' ', '')

    if '/' in s and '+' not in s:
        return None, None

    if '+' in s:
        s = s.split('+')[0]

    first = s.split('/')[0]
    m     = re.match(r'(U[A-Z][A-Z0-9]+?)([LPT])?$', first, re.IGNORECASE)
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
    return True


def slot_label(day_idx: int, slot_idx: int) -> str:
    return f"{DAYS[day_idx]}-{slot_idx + 1}"


# ── Merged Cell Lookup ─────────────────────────────────────────────────────────────

def build_merge_lookup(sheet) -> dict:
    lk = {}
    for mr in sheet.merged_cells.ranges:
        for r in range(mr.min_row, mr.max_row + 1):
            for c in range(mr.min_col, mr.max_col + 1):
                lk[(r, c)] = mr
    return lk


def read_cell(sheet, row, col, merge_lookup):
    mr = merge_lookup.get((row, col))
    if mr:
        return sheet.cell(mr.min_row, mr.min_col).value
    return sheet.cell(row, col).value


# ── Layout Detection ───────────────────────────────────────────────────────────────

def find_hours_cell(sheet):
    best, best_sum = None, float('inf')
    for row in sheet.iter_rows(max_row=15):
        for cell in row:
            if cell.value is not None and str(cell.value).strip().upper() in ('HOURS', 'HOUR'):
                s = cell.row + cell.column
                if s < best_sum:
                    best_sum = s
                    best     = (cell.row, cell.column)
    return best if best else (None, None)


def get_subgroup_columns(sheet, header_row: int, hours_col: int) -> dict:
    SKIP_VALUES = {
        'HOURS', 'HOUR', 'DAY', 'DAYS', 'SR NO', 'SR.NO', 'BRANCH',
        'PRACTICAL', 'TUTORIAL', 'LECTURE', 'TOTAL', 'SIGNATURE', '',
        'ELECTRONICS', 'ELECTRICAL', 'COMPUTER SCIENCE', 'COMPUTER E',
        'COMPUTER ENGG', 'CIVIL ENGG', 'MECHANICAL ENGG', 'CHEMICAL ENGG',
        'BIOMEDICAL ENGG', 'BIOTECHNOLOGY ENGG',
    }
    sg_map    = {}
    seen_cols = set()

    for r in range(header_row, max(0, header_row - 4), -1):
        for c in range(hours_col + 1, sheet.max_column + 1):
            val = sheet.cell(r, c).value
            if val is None:
                continue
            s = str(val).strip()
            if not s or s.upper() in SKIP_VALUES:
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
    return 2


def get_first_data_row(sheet, header_row: int, sr_col: int) -> int:
    for r in range(header_row + 1, header_row + 8):
        v = sheet.cell(r, sr_col).value
        if v == 1 or v == '1':
            return r
    return header_row + 1


def detect_row_step(sheet, first_data_row: int, sr_col: int) -> int:
    v = sheet.cell(first_data_row + 1, sr_col).value
    return 1 if (v == 2 or v == '2') else 2


# ── Slot Iterator ──────────────────────────────────────────────────────────────────

def iter_slot_rows(sheet, first_data_row: int, row_step: int, sr_col: int):
    row     = first_data_row
    max_row = sheet.max_row

    for day_idx in range(len(DAYS)):
        for slot_idx in range(SLOTS_PER_DAY):
            if row > max_row:
                return
            venue_row = row + 1 if row_step == 2 else row
            yield day_idx, slot_idx, row, venue_row
            row += row_step


# ── Per-Subgroup Builder ───────────────────────────────────────────────────────────

def build_subgroup_slots(sheet, sg_col, first_data_row, row_step, sr_col, merge_lookup):
    slots_iter      = list(iter_slot_rows(sheet, first_data_row, row_step, sr_col))
    entries         = []
    last_code       = None
    last_was_lab_start = False

    for (day_idx, slot_idx, code_row, venue_row) in slots_iter:
        raw_val = read_cell(sheet, code_row, sg_col, merge_lookup)

        if is_continuation_of_previous(raw_val):
            if last_code is not None:
                entries.append({
                    'slot': slot_label(day_idx, slot_idx),
                    'code': last_code[0],
                    'type': last_code[1],
                })
            continue

        last_code = None

        if raw_val is None:
            continue
        s = str(raw_val).strip()
        if not s:
            continue

        code, typ = extract_code_and_type(s)
        if code is None:
            continue

        entries.append({
            'slot': slot_label(day_idx, slot_idx),
            'code': code,
            'type': typ,
        })
        last_code = (code, typ)

    return entries


# ── Aggregator ─────────────────────────────────────────────────────────────────────

def aggregate(entries: list) -> dict:
    result = {'lecture': {}, 'lab': {}, 'tutorial': {}}
    for e in entries:
        bucket = result[e['type']]
        if e['code'] not in bucket:
            bucket[e['code']] = []
        if e['slot'] not in bucket[e['code']]:
            bucket[e['code']].append(e['slot'])
    return result


# ── Sheet Processor ────────────────────────────────────────────────────────────────

def process_sheet(sheet):
    hours_row, hours_col = find_hours_cell(sheet)
    if hours_row is None:
        return {}, {}

    header_row     = hours_row
    sg_map         = get_subgroup_columns(sheet, header_row, hours_col)
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


# ── Workbook Processor ─────────────────────────────────────────────────────────────

def should_process(sheet) -> bool:
    found_hours = False
    for row in sheet.iter_rows(max_row=15, values_only=True):
        for cell in row:
            if cell and str(cell).strip().upper() in ('HOURS', 'HOUR'):
                found_hours = True
                break
        if found_hours:
            break
    if not found_hours:
        return False

    subgroup_found = False
    for row in sheet.iter_rows(max_row=15, values_only=True):
        for cell in row:
            if cell:
                s = str(cell).strip()
                if len(s) >= 3 and s[0].isdigit() and any(c.isalpha() for c in s):
                    subgroup_found = True
                    break
        if subgroup_found:
            break

    return subgroup_found


def process_workbook(path: str):
    wb        = load_workbook(path)
    subgroups = {}
    courses   = {}

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        if not should_process(sheet):
            continue
        sg_dict, course_map = process_sheet(sheet)

        for sg, data in sg_dict.items():
            if sg not in subgroups:
                subgroups[sg] = data
            else:
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


# ── MongoDB Converter ──────────────────────────────────────────────────────────────

def subgroups_to_mongo_format(subgroups: dict) -> list:
    """
    Convert subgroups dict to timeTableData2 format:
    [ { subgroup: "2C2A", data: [{day, hour, subjectCode, subjectName, venue, color}] } ]
    """
    documents = []

    for sg_name, sg_data in subgroups.items():
        events = []
        for typ in ('lecture', 'lab', 'tutorial'):
            color = TYPE_COLOR[typ]
            for code, slots in sg_data.get(typ, {}).items():
                for slot_str in slots:
                    try:
                        day, hour = slot_to_display(slot_str)
                    except Exception:
                        continue
                    events.append({
                        'day':         day,
                        'hour':        hour,
                        'subjectCode': code,
                        'subjectName': code,  # name not available from Excel, use code
                        'venue':       '',
                        'color':       color,
                    })

        documents.append({
            'subgroup': sg_name,
            'data':     events,
        })

    return documents


def upsert_to_mongodb(documents: list, mongo_uri: str):
    """Upsert all subgroup documents into timeTableData2."""
    try:
        client     = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        db         = client['capstone']
        collection = db['timeTableData2']

        operations = [
            UpdateOne(
                {'subgroup': doc['subgroup']},
                {'$set': doc},
                upsert=True
            )
            for doc in documents
        ]

        if operations:
            result = collection.bulk_write(operations)
            print(f"MongoDB: upserted {result.upserted_count} new, modified {result.modified_count} existing subgroups")
        
        client.close()

    except Exception as e:
        print(f"MongoDB upsert failed: {e}")
        print("JSON files were still saved successfully.")


# ── PreprocessClass (called by app.py) ────────────────────────────────────────────

class PreprocessClass:

    def preprocessScriptFunc(self, path: str):
        print(f"Parsing: {path}")
        subgroups, courses = process_workbook(path)
        print(f"✅ {len(subgroups)} subgroups | {len(courses)} unique course codes")

        # ── Write subgroups.json ──
        base   = Path(__file__).parent
        out_sg = base / 'subgroups.json'
        with open(out_sg, 'w', encoding='utf-8') as f:
            json.dump(subgroups, f, indent=2)
        print(f"Saved → {out_sg}")

        # ── Write courses.json ──
        out_c = base / 'courses.json'
        with open(out_c, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2)
        print(f"Saved → {out_c}")

        # ── Upsert to MongoDB ──
        mongo_uri = os.environ.get('MONGO_URI', '')
        if not mongo_uri:
            print("Warning: MONGO_URI not set in environment — skipping MongoDB update")
        else:
            print("Uploading to MongoDB...")
            documents = subgroups_to_mongo_format(subgroups)
            upsert_to_mongodb(documents, mongo_uri)


# ── CLI ────────────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        default = Path(__file__).parent / 'UG__PG_TIME_TABLE_JAN_TO_MAY_2026.xlsx'
        if default.exists():
            path = str(default)
        else:
            print("Usage: python preprocessScript.py <path_to_timetable.xlsx>")
            sys.exit(1)

    processor = PreprocessClass()
    processor.preprocessScriptFunc(path)


if __name__ == '__main__':
    main()