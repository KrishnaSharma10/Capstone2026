# import re
# import json
# import os
# import sys
# from pathlib import Path
# from openpyxl import load_workbook
# from pymongo import MongoClient, UpdateOne

# # ── Constants ──────────────────────────────────────────────────────────────────────

# DAYS          = ['MON', 'TUE', 'WED', 'THU', 'FRI']
# SLOTS_PER_DAY = 14

# SKIP_SHEETS = {
#     'pg time table 1',
#     'pg time table1',
#     'dlit',
# }

# _CONTINUATION_RE = re.compile(r'^LAB[-\s]?\d*$', re.IGNORECASE)

# # Legit course code: U + 1-3 letters + 2+ digits (covers UCSXX1, UPH013 etc.)
# _COURSE_RE = re.compile(r'^U[A-Z]{1,3}\d{2,}', re.IGNORECASE)

# DAY_MAP = {
#     'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday',
#     'THU': 'Thursday', 'FRI': 'Friday',
# }

# SLOT_TIMES = {
#     1: '8:00 AM', 2: '8:50 AM', 3: '9:40 AM', 4: '10:30 AM',
#     5: '11:20 AM', 6: '12:10 PM', 7: '1:00 PM', 8: '1:50 PM',
#     9: '2:40 PM', 10: '3:30 PM', 11: '4:20 PM', 12: '5:10 PM',
#     13: '6:00 PM', 14: '6:50 PM',
# }

# TYPE_COLOR = {
#     'lecture': '#FFD700', 'lab': '#90EE90',
#     'tutorial': '#ADD8E6', 'elective': '#FFC0CB',
# }


# def slot_to_display(slot_str):
#     parts = slot_str.split('-')
#     return DAY_MAP.get(parts[0], parts[0]), SLOT_TIMES.get(int(parts[1]), parts[1])


# def build_elective_flat_set(elective_data):
#     codes = set()
#     for basket_codes in elective_data.get('main-elective', {}).values():
#         codes.update(basket_codes)
#     return codes


# def parse_token(token):
#     token = token.strip()
#     if not token:
#         return None
#     m = re.match(r'^(U[A-Za-z]{1,3}\d{2,}[A-Za-z0-9]*)([LPT])?$', token, re.IGNORECASE)
#     if not m:
#         return None
#     code   = m.group(1).upper()
#     suffix = (m.group(2) or '').upper()
#     if not _COURSE_RE.match(code):
#         return None
#     typ = {'L': 'lecture', 'P': 'lab', 'T': 'tutorial'}.get(suffix, 'lecture')
#     return code, typ


# def extract_codes_from_cell(raw, elective_flat_set):
#     if not raw:
#         return []
#     s = str(raw).strip().replace(' ', '')
#     if not s:
#         return []

#     plus_groups = s.split('+')
#     results = []

#     for group in plus_groups:
#         slash_tokens = group.split('/')
#         parsed_tokens = [p for p in (parse_token(t) for t in slash_tokens) if p]
#         if not parsed_tokens:
#             continue

#         codes_in_group = [code for code, _ in parsed_tokens]
#         is_elective_group = any(code in elective_flat_set for code in codes_in_group)

#         if is_elective_group:
#             # slash-separated elective options — record ALL as elective type
#             for code, _ in parsed_tokens:
#                 results.append((code, 'elective'))
#         else:
#             # combined regular or single regular — take first only
#             results.append(parsed_tokens[0])

#     return results


# def is_continuation_of_previous(val):
#     if val is None:
#         return False
#     s = str(val).strip()
#     if not s:
#         return False
#     if _CONTINUATION_RE.match(s):
#         return True
#     if re.match(r'^U[A-Z]{1,3}\d{2,}', s, re.IGNORECASE):
#         return False
#     return True


# def slot_label(day_idx, slot_idx):
#     return f"{DAYS[day_idx]}-{slot_idx + 1}"


# def build_merge_lookup(sheet):
#     lk = {}
#     for mr in sheet.merged_cells.ranges:
#         for r in range(mr.min_row, mr.max_row + 1):
#             for c in range(mr.min_col, mr.max_col + 1):
#                 lk[(r, c)] = mr
#     return lk


# def read_cell(sheet, row, col, merge_lookup):
#     mr = merge_lookup.get((row, col))
#     if mr:
#         return sheet.cell(mr.min_row, mr.min_col).value
#     return sheet.cell(row, col).value


# def find_hours_cell(sheet):
#     best, best_sum = None, float('inf')
#     for row in sheet.iter_rows(max_row=15):
#         for cell in row:
#             if cell.value is not None and str(cell.value).strip().upper() in ('HOURS', 'HOUR'):
#                 s = cell.row + cell.column
#                 if s < best_sum:
#                     best_sum = s
#                     best = (cell.row, cell.column)
#     return best if best else (None, None)


# def get_subgroup_columns(sheet, header_row, hours_col):
#     SKIP_VALUES = {
#         'HOURS', 'HOUR', 'DAY', 'DAYS', 'SR NO', 'SR.NO', 'BRANCH',
#         'PRACTICAL', 'TUTORIAL', 'LECTURE', 'TOTAL', 'SIGNATURE', '',
#         'ELECTRONICS', 'ELECTRICAL', 'COMPUTER SCIENCE', 'COMPUTER E',
#         'COMPUTER ENGG', 'CIVIL ENGG', 'MECHANICAL ENGG', 'CHEMICAL ENGG',
#         'BIOMEDICAL ENGG', 'BIOTECHNOLOGY ENGG',
#     }
#     sg_map = {}
#     seen_cols = set()
#     for r in range(header_row, max(0, header_row - 4), -1):
#         for c in range(hours_col + 1, sheet.max_column + 1):
#             val = sheet.cell(r, c).value
#             if val is None:
#                 continue
#             s = str(val).strip()
#             if not s or s.upper() in SKIP_VALUES:
#                 continue
#             if s[0].isdigit() and 3 <= len(s) <= 6 and re.match(r'^[A-Z0-9]+$', s, re.IGNORECASE):
#                 if c not in seen_cols:
#                     sg_map[s] = c
#                     seen_cols.add(c)
#     return sg_map


# def get_sr_col(sheet, header_row):
#     for c in range(1, 4):
#         v = str(sheet.cell(header_row, c).value or '').strip().upper()
#         if 'SR' in v or v in ('1', '2'):
#             return c
#     return 2


# def get_first_data_row(sheet, header_row, sr_col):
#     for r in range(header_row + 1, header_row + 8):
#         v = sheet.cell(r, sr_col).value
#         if v == 1 or v == '1':
#             return r
#     return header_row + 1


# def detect_row_step(sheet, first_data_row, sr_col):
#     v = sheet.cell(first_data_row + 1, sr_col).value
#     return 1 if (v == 2 or v == '2') else 2


# def iter_slot_rows(sheet, first_data_row, row_step, sr_col):
#     row = first_data_row
#     max_row = sheet.max_row
#     for day_idx in range(len(DAYS)):
#         for slot_idx in range(SLOTS_PER_DAY):
#             if row > max_row:
#                 return
#             venue_row = row + 1 if row_step == 2 else row
#             yield day_idx, slot_idx, row, venue_row
#             row += row_step


# def build_subgroup_slots(sheet, sg_col, first_data_row, row_step,
#                           sr_col, merge_lookup, elective_flat_set):
#     slots_iter = list(iter_slot_rows(sheet, first_data_row, row_step, sr_col))
#     entries = []
#     last_codes = []

#     for (day_idx, slot_idx, code_row, venue_row) in slots_iter:
#         raw_val = read_cell(sheet, code_row, sg_col, merge_lookup)

#         if is_continuation_of_previous(raw_val):
#             for (code, typ) in last_codes:
#                 entries.append({'slot': slot_label(day_idx, slot_idx), 'code': code, 'type': typ})
#             continue

#         last_codes = []
#         if raw_val is None:
#             continue
#         s = str(raw_val).strip()
#         if not s:
#             continue

#         parsed = extract_codes_from_cell(s, elective_flat_set)
#         if not parsed:
#             continue

#         for (code, typ) in parsed:
#             entries.append({'slot': slot_label(day_idx, slot_idx), 'code': code, 'type': typ})
#         last_codes = parsed

#     return entries


# def aggregate(entries):
#     result = {'lecture': {}, 'lab': {}, 'tutorial': {}, 'elective': {}}
#     for e in entries:
#         bucket = result[e['type']]
#         if e['code'] not in bucket:
#             bucket[e['code']] = []
#         if e['slot'] not in bucket[e['code']]:
#             bucket[e['code']].append(e['slot'])
#     return result


# def build_elective_subgrouplist(subgroups):
#     """
#     Auto-generates electives_subgrouplist.json from parsed subgroups data.
#     Groups elective codes by slot for each subgroup.
#     """
#     result = {}
#     for sg_name, sg_data in subgroups.items():
#         elective_bucket = sg_data.get('elective', {})
#         if not elective_bucket:
#             continue
#         slot_to_options = {}
#         for code, slots in elective_bucket.items():
#             for slot in slots:
#                 if slot not in slot_to_options:
#                     slot_to_options[slot] = []
#                 if code not in slot_to_options[slot]:
#                     slot_to_options[slot].append(code)
#         if slot_to_options:
#             result[sg_name] = [
#                 {'slot': slot, 'options': options}
#                 for slot, options in sorted(slot_to_options.items())
#             ]
#     return result


# def process_sheet(sheet, elective_flat_set):
#     hours_row, hours_col = find_hours_cell(sheet)
#     if hours_row is None:
#         return {}, {}
#     header_row = hours_row
#     sg_map = get_subgroup_columns(sheet, header_row, hours_col)
#     if not sg_map:
#         return {}, {}
#     sr_col = get_sr_col(sheet, header_row)
#     first_data_row = get_first_data_row(sheet, header_row, sr_col)
#     row_step = detect_row_step(sheet, first_data_row, sr_col)
#     merge_lookup = build_merge_lookup(sheet)

#     subgroup_dict = {}
#     course_to_subgroups = {}

#     for sg_name, sg_col in sg_map.items():
#         entries = build_subgroup_slots(
#             sheet, sg_col, first_data_row, row_step,
#             sr_col, merge_lookup, elective_flat_set)
#         agg = aggregate(entries)
#         subgroup_dict[sg_name] = agg
#         for typ in ('lecture', 'lab', 'tutorial'):
#             for code in agg[typ]:
#                 lst = course_to_subgroups.setdefault(code, [])
#                 if sg_name not in lst:
#                     lst.append(sg_name)

#     return subgroup_dict, course_to_subgroups


# def should_process(sheet):
#     found_hours = False
#     for row in sheet.iter_rows(max_row=15, values_only=True):
#         for cell in row:
#             if cell and str(cell).strip().upper() in ('HOURS', 'HOUR'):
#                 found_hours = True
#                 break
#         if found_hours:
#             break
#     if not found_hours:
#         return False
#     subgroup_found = False
#     for row in sheet.iter_rows(max_row=15, values_only=True):
#         for cell in row:
#             if cell:
#                 s = str(cell).strip()
#                 if len(s) >= 3 and s[0].isdigit() and any(c.isalpha() for c in s):
#                     subgroup_found = True
#                     break
#         if subgroup_found:
#             break
#     return subgroup_found


# def process_workbook(path, elective_flat_set):
#     wb = load_workbook(path)
#     subgroups = {}
#     courses = {}
#     for sheet_name in wb.sheetnames:
#         sheet = wb[sheet_name]
#         if not should_process(sheet):
#             continue
#         sg_dict, course_map = process_sheet(sheet, elective_flat_set)
#         for sg, data in sg_dict.items():
#             if sg not in subgroups:
#                 subgroups[sg] = data
#             else:
#                 for typ in ('lecture', 'lab', 'tutorial', 'elective'):
#                     for code, slots in data[typ].items():
#                         existing = subgroups[sg][typ].setdefault(code, [])
#                         for s in slots:
#                             if s not in existing:
#                                 existing.append(s)
#         for code, sgs in course_map.items():
#             existing = courses.setdefault(code, [])
#             for sg in sgs:
#                 if sg not in existing:
#                     existing.append(sg)
#     return subgroups, courses


# def subgroups_to_mongo_format(subgroups):
#     documents = []
#     for sg_name, sg_data in subgroups.items():
#         events = []
#         for typ in ('lecture', 'lab', 'tutorial'):
#             color = TYPE_COLOR[typ]
#             for code, slots in sg_data.get(typ, {}).items():
#                 for slot_str in slots:
#                     try:
#                         day, hour = slot_to_display(slot_str)
#                     except Exception:
#                         continue
#                     events.append({
#                         'day': day, 'hour': hour,
#                         'subjectCode': code, 'subjectName': code,
#                         'venue': '', 'color': color,
#                     })
#         for code, slots in sg_data.get('elective', {}).items():
#             for slot_str in slots:
#                 try:
#                     day, hour = slot_to_display(slot_str)
#                 except Exception:
#                     continue
#                 events.append({
#                     'day': day, 'hour': hour,
#                     'subjectCode': code, 'subjectName': code,
#                     'venue': '', 'color': TYPE_COLOR['elective'],
#                 })
#         documents.append({'subgroup': sg_name, 'data': events})
#     return documents


# def upsert_to_mongodb(documents, mongo_uri):
#     try:
#         client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
#         db = client['capstone']
#         collection = db['timeTableData2']
#         operations = [
#             UpdateOne({'subgroup': doc['subgroup']}, {'$set': doc}, upsert=True)
#             for doc in documents
#         ]
#         if operations:
#             result = collection.bulk_write(operations)
#             print(f"MongoDB: upserted {result.upserted_count} new, modified {result.modified_count} existing subgroups")
#         client.close()
#     except Exception as e:
#         print(f"MongoDB upsert failed: {e}")
#         print("JSON files were still saved successfully.")


# class PreprocessClass:

#     def preprocessScriptFunc(self, path):
#         print(f"Parsing: {path}")
#         base = Path(__file__).parent

#         # load elective.json first — needed during parsing
#         elective_path = base / 'elective.json'
#         if elective_path.exists():
#             with open(elective_path, encoding='utf-8') as f:
#                 electives_data = json.load(f)
#             elective_flat_set = build_elective_flat_set(electives_data)
#             print(f"Loaded {len(elective_flat_set)} elective codes")
#         else:
#             print("Warning: elective.json not found — all codes treated as regular")
#             elective_flat_set = set()

#         subgroups, courses = process_workbook(path, elective_flat_set)
#         print(f"Parsed: {len(subgroups)} subgroups | {len(courses)} unique course codes")

#         # subgroups.json — includes elective bucket per subgroup
#         out_sg = base / 'subgroups.json'
#         with open(out_sg, 'w', encoding='utf-8') as f:
#             json.dump(subgroups, f, indent=2)
#         print(f"Saved → {out_sg}")

#         # courses.json — regular courses only
#         out_c = base / 'courses.json'
#         with open(out_c, 'w', encoding='utf-8') as f:
#             json.dump(courses, f, indent=2)
#         print(f"Saved → {out_c}")

#         # electives_subgrouplist.json — auto-generated from parsed data
#         elective_sglist = build_elective_subgrouplist(subgroups)
#         out_esg = base / 'electives_subgrouplist.json'
#         with open(out_esg, 'w', encoding='utf-8') as f:
#             json.dump(elective_sglist, f, indent=2)
#         print(f"Saved → {out_esg} ({len(elective_sglist)} subgroups with elective slots)")

#         # MongoDB upsert
#         mongo_uri = os.environ.get('MONGO_URI', '')
#         if not mongo_uri:
#             print("Warning: MONGO_URI not set — skipping MongoDB update")
#         else:
#             print("Uploading to MongoDB...")
#             documents = subgroups_to_mongo_format(subgroups)
#             upsert_to_mongodb(documents, mongo_uri)


# def main():
#     if len(sys.argv) > 1:
#         path = sys.argv[1]
#     else:
#         default = Path(__file__).parent / 'UG__PG_TIME_TABLE_JAN_TO_MAY_2026.xlsx'
#         if default.exists():
#             path = str(default)
#         else:
#             print("Usage: python preprocessScript.py <path_to_timetable.xlsx>")
#             sys.exit(1)
#     processor = PreprocessClass()
#     processor.preprocessScriptFunc(path)


# if __name__ == '__main__':
#     main()






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

# NEW REGEX: Must be at least 5 chars long AND contain at least one digit
# Blocks faculty initials like "DMG" while allowing "UCSXX1"
_COURSE_RE = re.compile(r'^(?=.{5,})[A-Z]{2,}[A-Z0-9]*\d+', re.IGNORECASE)

DAY_MAP = {
    'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday',
    'THU': 'Thursday', 'FRI': 'Friday',
}

SLOT_TIMES = {
    1: '8:00 AM',  2: '8:50 AM',  3: '9:40 AM',  4: '10:30 AM',
    5: '11:20 AM', 6: '12:10 PM', 7: '1:00 PM',  8: '1:50 PM',
    9: '2:40 PM', 10: '3:30 PM', 11: '4:20 PM', 12: '5:10 PM',
    13: '6:00 PM', 14: '6:50 PM',
}

TYPE_COLOR = {
    'lecture':  '#FFD700',
    'lab':      '#90EE90',
    'tutorial': '#ADD8E6',
    'elective': '#FFC0CB',
}


def slot_to_display(slot_str):
    parts = slot_str.split('-')
    return DAY_MAP.get(parts[0], parts[0]), SLOT_TIMES.get(int(parts[1]), parts[1])


def build_elective_flat_set(elective_data):
    codes = set()
    for basket_codes in elective_data.get('main-elective', {}).values():
        codes.update(basket_codes)
    return codes


# def parse_token(token):
#     """
#     Parse a single course token like 'UCS658L' -> ('UCS658', 'lab').
#     """
#     token = token.strip()
#     if not token:
#         return None
        
#     # Updated to handle more flexible alphanumeric base codes
#     m = re.match(r'^([A-Z0-9]+?)([LPT])?$', token, re.IGNORECASE)
#     if not m:
#         return None
#     code   = m.group(1).upper()
#     suffix = (m.group(2) or '').upper()
    
#     if not _COURSE_RE.match(code):
#         return None
        
#     typ = {'L': 'lecture', 'P': 'lab', 'T': 'tutorial'}.get(suffix, 'lecture')
#     return code, typ
def parse_token(token):
    """
    Parses a single course token. 
    FIX: Now allows trailing text (like GAMING LAB) but strictly validates the code.
    """
    token = token.strip()
    if not token:
        return None
        
    # Match the base code and the optional suffix (L/P/T).
    # Removed the '$' anchor so it doesn't fail if there's text after the code.
    m = re.match(r'^([A-Z0-9]+?)([LPT])?(?:\s|$)', token, re.IGNORECASE)
    if not m:
        return None
        
    code   = m.group(1).upper()
    suffix = (m.group(2) or '').upper()
    
    # Apply the strict 5-character + digit filter (Blocks DMG, SBH, etc.)
    if not _COURSE_RE.match(code):
        return None
        
    typ = {'L': 'lecture', 'P': 'lab', 'T': 'tutorial'}.get(suffix, 'lecture')
    return code, typ


def extract_codes_from_cell(raw, elective_flat_set):
    """
    Parses an Excel cell value.
    FIX 1: Handles multiline cells (UCT801P\nGAMING LAB) by taking the first line.
    FIX 2: Correctly tags single-code electives as 'elective'.
    """
    if not raw:
        return []
    
    # Split by newline and take the first line to ignore descriptive notes
    # Then remove spaces for the code processing
    raw_str = str(raw).split('\n')[0]
    s = raw_str.strip().replace(' ', '')
    
    if not s:
        return []

    # -- Combined class: UCS534+ULC664L ---------------------------------------
    if '+' in s:
        first_token = s.split('+')[0]
        parsed = parse_token(first_token)
        return [parsed] if parsed else []

    # -- Elective slash group: UCS751L/UCS752L --------------------------------
    if '/' in s:
        slash_tokens  = s.split('/')
        parsed_tokens = [p for p in (parse_token(t) for t in slash_tokens) if p]
        if not parsed_tokens:
            return []
        
        # If any code in the group is in the elective list, treat all as electives
        is_elective_group = any(code in elective_flat_set for code, _ in parsed_tokens)
        if is_elective_group:
            return [(code, 'elective') for code, _ in parsed_tokens]
        else:
            return [parsed_tokens[0]]

    # -- Single token (e.g., UCS635L or UCT801P) ------------------------------
    parsed = parse_token(s)
    if parsed:
        code, typ = parsed
        # GLOBAL FIX: Even if there is no slash, check if this code is an elective
        if code in elective_flat_set:
            return [(code, 'elective')]
        return [parsed]
        
    return []

# def extract_codes_from_cell(raw, elective_flat_set):
#     """
#     Parse a raw Excel cell value and return a list of (code, type) pairs.
#     """
#     if not raw:
#         return []
#     s = str(raw).strip().replace(' ', '')
#     if not s:
#         return []

#     # -- Combined class: UCS534+ULC664L (BUG C FIX) ---------------------------
#     if '+' in s:
#         first_token = s.split('+')[0]
#         parsed = parse_token(first_token)
#         return [parsed] if parsed else []

#     # -- Elective slash group: UCS751L/UCS752L or UCSXX2P/UCS658L -------------
#     if '/' in s:
#         slash_tokens  = s.split('/')
#         parsed_tokens = [p for p in (parse_token(t) for t in slash_tokens) if p]
#         if not parsed_tokens:
#             return []
        
#         is_elective_group = any(code in elective_flat_set for code, _ in parsed_tokens)
#         if is_elective_group:
#             return [(code, 'elective') for code, _ in parsed_tokens]
#         else:
#             return [parsed_tokens[0]]

#     # -- Single token ----------------------------------------------------------
#     parsed = parse_token(s)
#     if parsed:
#         code, typ = parsed
#         # GLOBAL FIX: Check if the single code is actually an elective
#         if code in elective_flat_set:
#             return [(code, 'elective')]
#         return [parsed]
#     return []


def is_continuation_of_previous(val):
    if val is None:
        return False
    s = str(val).strip()
    if not s:
        return False
    if _CONTINUATION_RE.match(s):
        return True
    if _COURSE_RE.match(s):
        return False
    return True


def slot_label(day_idx, slot_idx):
    return f"{DAYS[day_idx]}-{slot_idx + 1}"


# -- Merged Cell Lookup --------------------------------------------------------

def build_merge_lookup(sheet):
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


# -- Layout Detection ----------------------------------------------------------

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


def get_subgroup_columns(sheet, header_row, hours_col):
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


def get_sr_col(sheet, header_row):
    for c in range(1, 4):
        v = str(sheet.cell(header_row, c).value or '').strip().upper()
        if 'SR' in v or v in ('1', '2'):
            return c
    return 2


def get_first_data_row(sheet, header_row, sr_col):
    for r in range(header_row + 1, header_row + 8):
        v = sheet.cell(r, sr_col).value
        if v == 1 or v == '1':
            return r
    return header_row + 1


def detect_row_step(sheet, first_data_row, sr_col):
    v = sheet.cell(first_data_row + 1, sr_col).value
    return 1 if (v == 2 or v == '2') else 2


# -- Slot Iterator -------------------------------------------------------------

def iter_slot_rows(sheet, first_data_row, row_step, sr_col):
    row     = first_data_row
    max_row = sheet.max_row
    for day_idx in range(len(DAYS)):
        for slot_idx in range(SLOTS_PER_DAY):
            if row > max_row:
                return
            venue_row = row + 1 if row_step == 2 else row
            yield day_idx, slot_idx, row, venue_row
            row += row_step


# -- Per-Subgroup Builder ------------------------------------------------------

def build_subgroup_slots(sheet, sg_col, first_data_row, row_step,
                          sr_col, merge_lookup, elective_flat_set):
    slots_iter = list(iter_slot_rows(sheet, first_data_row, row_step, sr_col))
    entries    = []
    last_codes = []

    for (day_idx, slot_idx, code_row, venue_row) in slots_iter:
        raw_val = read_cell(sheet, code_row, sg_col, merge_lookup)

        if is_continuation_of_previous(raw_val):
            for (code, typ) in last_codes:
                entries.append({
                    'slot': slot_label(day_idx, slot_idx),
                    'code': code,
                    'type': typ,
                })
            continue

        last_codes = []
        if raw_val is None:
            continue
        s = str(raw_val).strip()
        if not s:
            continue

        parsed = extract_codes_from_cell(s, elective_flat_set)
        if not parsed:
            continue

        for (code, typ) in parsed:
            entries.append({
                'slot': slot_label(day_idx, slot_idx),
                'code': code,
                'type': typ,
            })
        last_codes = parsed

    return entries


# -- Aggregator ----------------------------------------------------------------

def aggregate(entries):
    result = {'lecture': {}, 'lab': {}, 'tutorial': {}, 'elective': {}}
    for e in entries:
        bucket = result[e['type']]
        if e['code'] not in bucket:
            bucket[e['code']] = []
        if e['slot'] not in bucket[e['code']]:
            bucket[e['code']].append(e['slot'])
    return result


# -- Elective subgroup list builder --------------------------------------------

def build_elective_subgrouplist(subgroups):
    result = {}
    for sg_name, sg_data in subgroups.items():
        elective_bucket = sg_data.get('elective', {})
        if not elective_bucket:
            continue
        slot_to_options = {}
        for code, slots in elective_bucket.items():
            for slot in slots:
                if slot not in slot_to_options:
                    slot_to_options[slot] = []
                if code not in slot_to_options[slot]:
                    slot_to_options[slot].append(code)
        if slot_to_options:
            result[sg_name] = [
                {'slot': slot, 'options': options}
                for slot, options in sorted(slot_to_options.items())
            ]
    return result


# -- Sheet & Workbook Processors -----------------------------------------------

def process_sheet(sheet, elective_flat_set):
    hours_row, hours_col = find_hours_cell(sheet)
    if hours_row is None:
        return {}, {}
    header_row = hours_row
    sg_map     = get_subgroup_columns(sheet, header_row, hours_col)
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
            sheet, sg_col, first_data_row, row_step,
            sr_col, merge_lookup, elective_flat_set)
        agg = aggregate(entries)
        subgroup_dict[sg_name] = agg
        for typ in ('lecture', 'lab', 'tutorial'):
            for code in agg[typ]:
                lst = course_to_subgroups.setdefault(code, [])
                if sg_name not in lst:
                    lst.append(sg_name)

    return subgroup_dict, course_to_subgroups


def should_process(sheet):
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
    for row in sheet.iter_rows(max_row=15, values_only=True):
        for cell in row:
            if cell:
                s = str(cell).strip()
                if len(s) >= 3 and s[0].isdigit() and any(c.isalpha() for c in s):
                    return True
    return False


def process_workbook(path, elective_flat_set):
    wb        = load_workbook(path)
    subgroups = {}
    courses   = {}
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        if not should_process(sheet):
            continue
        sg_dict, course_map = process_sheet(sheet, elective_flat_set)
        for sg, data in sg_dict.items():
            if sg not in subgroups:
                subgroups[sg] = data
            else:
                for typ in ('lecture', 'lab', 'tutorial', 'elective'):
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


# -- MongoDB -------------------------------------------------------------------

def subgroups_to_mongo_format(subgroups):
    documents = []
    for sg_name, sg_data in subgroups.items():
        events = []
        for typ in ('lecture', 'lab', 'tutorial', 'elective'):
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
                        'subjectName': code,
                        'venue':       '',
                        'color':       color,
                    })
        documents.append({'subgroup': sg_name, 'data': events})
    return documents


def upsert_to_mongodb(documents, mongo_uri):
    try:
        client     = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        db         = client['capstone']
        collection = db['timeTableData2']

        deleted = collection.delete_many({})
        print(f"MongoDB: cleared {deleted.deleted_count} stale document(s)")

        operations = [
            UpdateOne(
                {'subgroup': doc['subgroup']},
                {'$set': doc},
                upsert=True,
            )
            for doc in documents
        ]
        if operations:
            result = collection.bulk_write(operations)
            print(f"MongoDB: upserted {result.upserted_count} new, "
                  f"modified {result.modified_count} existing subgroups")
        client.close()
    except Exception as e:
        print(f"MongoDB upsert failed: {e}")
        print("JSON files were still saved successfully.")


# -- PreprocessClass -----------------------------------------------------------

class PreprocessClass:

    def preprocessScriptFunc(self, path):
        print(f"Parsing: {path}")
        base = Path(__file__).parent

        elective_path = base / 'elective.json'
        if elective_path.exists():
            with open(elective_path, encoding='utf-8') as f:
                electives_data = json.load(f)
            elective_flat_set = build_elective_flat_set(electives_data)
            print(f"Loaded {len(elective_flat_set)} elective codes")
        else:
            print("Warning: elective.json not found -- all codes treated as regular")
            elective_flat_set = set()

        subgroups, courses = process_workbook(path, elective_flat_set)
        print(f"Parsed: {len(subgroups)} subgroups | {len(courses)} unique course codes")

        out_sg = base / 'subgroups.json'
        with open(out_sg, 'w', encoding='utf-8') as f:
            json.dump(subgroups, f, indent=2)
        print(f"Saved -> {out_sg}")

        out_c = base / 'courses.json'
        with open(out_c, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2)
        print(f"Saved -> {out_c}")

        elective_sglist = build_elective_subgrouplist(subgroups)
        out_esg = base / 'electives_subgrouplist.json'
        with open(out_esg, 'w', encoding='utf-8') as f:
            json.dump(elective_sglist, f, indent=2)
        print(f"Saved -> {out_esg} ({len(elective_sglist)} subgroups with elective slots)")

        mongo_uri = os.environ.get('MONGO_URI', '')
        if not mongo_uri:
            print("Warning: MONGO_URI not set -- skipping MongoDB update")
        else:
            print("Uploading to MongoDB...")
            documents = subgroups_to_mongo_format(subgroups)
            upsert_to_mongodb(documents, mongo_uri)


# -- CLI -----------------------------------------------------------------------

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

    

#     import re
# import json
# import os
# import sys
# from pathlib import Path
# from openpyxl import load_workbook
# from pymongo import MongoClient, UpdateOne

# # ── Constants ──────────────────────────────────────────────────────────────────────

# DAYS          = ['MON', 'TUE', 'WED', 'THU', 'FRI']
# SLOTS_PER_DAY = 14
# SKIP_SHEETS   = {'pg time table 1', 'pg time table1', 'dlit'}

# _CONTINUATION_RE = re.compile(r'^LAB[-\s]?\d*$', re.IGNORECASE)

# # UPDATED REGEX: Must be at least 5 characters long AND contain at least one digit
# _COURSE_RE = re.compile(r'^(?=.{5,})[A-Z]{2,}[A-Z0-9]*\d+', re.IGNORECASE)

# DAY_MAP = {
#     'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday',
#     'THU': 'Thursday', 'FRI': 'Friday',
# }

# SLOT_TIMES = {
#     1: '8:00 AM',  2: '8:50 AM',  3: '9:40 AM',  4: '10:30 AM',
#     5: '11:20 AM', 6: '12:10 PM', 7: '1:00 PM',  8: '1:50 PM',
#     9: '2:40 PM', 10: '3:30 PM', 11: '4:20 PM', 12: '5:10 PM',
#     13: '6:00 PM', 14: '6:50 PM',
# }

# TYPE_COLOR = {
#     'lecture':  '#FFD700',
#     'lab':      '#90EE90',
#     'tutorial': '#ADD8E6',
#     'elective': '#FFC0CB',
# }

# # -- Helpers -------------------------------------------------------------------

# def slot_to_display(slot_str):
#     parts = slot_str.split('-')
#     return DAY_MAP.get(parts[0], parts[0]), SLOT_TIMES.get(int(parts[1]), parts[1])

# def build_elective_flat_set(elective_data):
#     codes = set()
#     for basket_codes in elective_data.get('main-elective', {}).values():
#         codes.update(basket_codes)
#     return codes

# def parse_token(token):
#     token = token.strip()
#     if not token: return None
    
#     m = re.match(r'^([A-Z0-9]+?)([LPT])?$', token, re.IGNORECASE)
#     if not m: return None
    
#     code = m.group(1).upper()
#     suffix = (m.group(2) or '').upper()

#     if not _COURSE_RE.match(code): return None

#     typ = {'L': 'lecture', 'P': 'lab', 'T': 'tutorial'}.get(suffix, 'lecture')
#     return code, typ

# def extract_codes_from_cell(raw, elective_flat_set):
#     if not raw: return []
    
#     # SAFETY NET: If the cell has newlines (e.g., Course \n Teacher Initials),
#     # this ensures we only look at the first line to avoid parsing errors.
#     s = str(raw).split('\n')[0].strip().replace(' ', '')
#     if not s: return []

#     tokens_to_process = []
#     is_forced_elective = False

#     if '+' in s:
#         tokens_to_process = [s.split('+')[0]]
#     elif '/' in s:
#         tokens_to_process = s.split('/')
#         is_forced_elective = True
#     else:
#         tokens_to_process = [s]

#     results = []
#     for t in tokens_to_process:
#         parsed = parse_token(t)
#         if parsed:
#             code, typ = parsed
#             if code in elective_flat_set:
#                 results.append((code, 'elective'))
#             else:
#                 final_typ = 'elective' if is_forced_elective else typ
#                 results.append((code, final_typ))
                
#     return results

# def is_continuation_of_previous(val):
#     if val is None: return False
#     s = str(val).split('\n')[0].strip()
#     if not s or _CONTINUATION_RE.match(s): return True
#     if _COURSE_RE.match(s): return False
#     return True

# # -- Excel Parsing -------------------------------------------------------------

# def build_merge_lookup(sheet):
#     lk = {}
#     for mr in sheet.merged_cells.ranges:
#         for r in range(mr.min_row, mr.max_row + 1):
#             for c in range(mr.min_col, mr.max_col + 1):
#                 lk[(r, c)] = mr
#     return lk

# def read_cell(sheet, row, col, merge_lookup):
#     mr = merge_lookup.get((row, col))
#     if mr: return sheet.cell(mr.min_row, mr.min_col).value
#     return sheet.cell(row, col).value

# def find_hours_cell(sheet):
#     best, best_sum = None, float('inf')
#     for row in sheet.iter_rows(max_row=15):
#         for cell in row:
#             if cell.value is not None and str(cell.value).strip().upper() in ('HOURS', 'HOUR'):
#                 s = cell.row + cell.column
#                 if s < best_sum:
#                     best_sum = s
#                     best = (cell.row, cell.column)
#     return best if best else (None, None)

# def get_subgroup_columns(sheet, header_row, hours_col):
#     SKIP_VALUES = {
#         'HOURS', 'HOUR', 'DAY', 'DAYS', 'SR NO', 'SR.NO', 'BRANCH',
#         'PRACTICAL', 'TUTORIAL', 'LECTURE', 'TOTAL', 'SIGNATURE', '',
#         'ELECTRONICS', 'ELECTRICAL', 'COMPUTER SCIENCE', 'COMPUTER E'
#     }
#     sg_map = {}
#     seen_cols = set()
#     for r in range(header_row, max(0, header_row - 4), -1):
#         for c in range(hours_col + 1, sheet.max_column + 1):
#             val = sheet.cell(r, c).value
#             if val is None: continue
#             s = str(val).split('\n')[0].strip()
#             if not s or s.upper() in SKIP_VALUES: continue
#             if any(char.isdigit() for char in s) and len(s) <= 7:
#                 if c not in seen_cols:
#                     sg_map[s] = c
#                     seen_cols.add(c)
#     return sg_map

# # RESTORED: Robust grid-layout detection
# def get_sr_col(sheet, header_row):
#     for c in range(1, 4):
#         v = str(sheet.cell(header_row, c).value or '').strip().upper()
#         if 'SR' in v or v in ('1', '2'): return c
#     return 2

# def get_first_data_row(sheet, header_row, sr_col):
#     for r in range(header_row + 1, header_row + 8):
#         v = sheet.cell(r, sr_col).value
#         if v == 1 or v == '1': return r
#     return header_row + 1

# def detect_row_step(sheet, first_data_row, sr_col):
#     v = sheet.cell(first_data_row + 1, sr_col).value
#     return 1 if (v == 2 or v == '2') else 2

# def iter_slot_rows(sheet, first_data_row, row_step):
#     row = first_data_row
#     for day_idx in range(len(DAYS)):
#         for slot_idx in range(SLOTS_PER_DAY):
#             if row > sheet.max_row: return
#             yield day_idx, slot_idx, row
#             row += row_step

# def build_subgroup_slots(sheet, sg_col, first_data_row, row_step, merge_lookup, elective_flat_set):
#     entries = []
#     last_codes = []
#     for (day_idx, slot_idx, code_row) in iter_slot_rows(sheet, first_data_row, row_step):
#         raw_val = read_cell(sheet, code_row, sg_col, merge_lookup)
        
#         if is_continuation_of_previous(raw_val):
#             for (code, typ) in last_codes:
#                 entries.append({'slot': f"{DAYS[day_idx]}-{slot_idx + 1}", 'code': code, 'type': typ})
#             continue

#         parsed = extract_codes_from_cell(raw_val, elective_flat_set)
#         for (code, typ) in parsed:
#             entries.append({'slot': f"{DAYS[day_idx]}-{slot_idx + 1}", 'code': code, 'type': typ})
#         last_codes = parsed
#     return entries

# def process_sheet(sheet, elective_flat_set):
#     h_row, h_col = find_hours_cell(sheet)
#     if h_row is None: return {}, {}
#     sg_map = get_subgroup_columns(sheet, h_row, h_col)
    
#     # RESTORED: Dynamic row layout detection
#     sr_col    = get_sr_col(sheet, h_row)
#     first_row = get_first_data_row(sheet, h_row, sr_col)
#     row_step  = detect_row_step(sheet, first_row, sr_col)
    
#     merge_lk = build_merge_lookup(sheet)
#     subgroup_dict = {}
#     course_to_subgroups = {}

#     for sg_name, col in sg_map.items():
#         entries = build_subgroup_slots(sheet, col, first_row, row_step, merge_lk, elective_flat_set)
        
#         sg_data = {'lecture':{}, 'lab':{}, 'tutorial':{}, 'elective':{}}
#         for e in entries:
#             bucket = sg_data[e['type']]
#             bucket.setdefault(e['code'], []).append(e['slot'])
#             course_to_subgroups.setdefault(e['code'], set()).add(sg_name)
        
#         subgroup_dict[sg_name] = sg_data

#     course_map = {k: list(v) for k, v in course_to_subgroups.items()}
#     return subgroup_dict, course_map

# def build_elective_subgrouplist(subgroups):
#     result = {}
#     for sg_name, sg_data in subgroups.items():
#         elective_bucket = sg_data.get('elective', {})
#         if not elective_bucket: continue
#         slot_to_options = {}
#         for code, slots in elective_bucket.items():
#             for slot in slots:
#                 slot_to_options.setdefault(slot, []).append(code)
#         if slot_to_options:
#             result[sg_name] = [{'slot': s, 'options': o} for s, o in sorted(slot_to_options.items())]
#     return result

# # -- MongoDB -------------------------------------------------------------------

# def subgroups_to_mongo_format(subgroups):
#     documents = []
#     for sg_name, sg_data in subgroups.items():
#         events = []
#         for typ in ('lecture', 'lab', 'tutorial', 'elective'):
#             color = TYPE_COLOR[typ]
#             for code, slots in sg_data.get(typ, {}).items():
#                 for slot_str in slots:
#                     try:
#                         day, hour = slot_to_display(slot_str)
#                     except Exception:
#                         continue
#                     events.append({
#                         'day':         day,
#                         'hour':        hour,
#                         'subjectCode': code,
#                         'subjectName': code,
#                         'venue':       '',
#                         'color':       color,
#                     })
#         documents.append({'subgroup': sg_name, 'data': events})
#     return documents

# def upsert_to_mongodb(documents, mongo_uri):
#     try:
#         client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
#         db = client['capstone']
#         collection = db['timeTableData2']

#         deleted = collection.delete_many({})
#         print(f"MongoDB: cleared {deleted.deleted_count} stale document(s)")

#         operations = [
#             UpdateOne({'subgroup': doc['subgroup']}, {'$set': doc}, upsert=True)
#             for doc in documents
#         ]
#         if operations:
#             result = collection.bulk_write(operations)
#             print(f"MongoDB: upserted {result.upserted_count} new, modified {result.modified_count} existing")
#         client.close()
#     except Exception as e:
#         print(f"MongoDB upsert failed: {e}")
#         print("JSON files were still saved successfully.")

# # -- Main Class ----------------------------------------------------------------

# class PreprocessClass:
#     def preprocessScriptFunc(self, path):
#         base = Path(__file__).parent
#         print(f"Parsing: {path}")
        
#         elective_path = base / 'elective.json'
#         elective_flat_set = set()
#         if elective_path.exists():
#             with open(elective_path, encoding='utf-8') as f:
#                 elective_flat_set = build_elective_flat_set(json.load(f))
#             print(f"Loaded {len(elective_flat_set)} elective codes")

#         wb = load_workbook(path, data_only=True)
#         all_subgroups = {}
#         all_courses = {}

#         for name in wb.sheetnames:
#             if any(x in name.lower() for x in SKIP_SHEETS): continue
#             s_dict, c_map = process_sheet(wb[name], elective_flat_set)
            
#             for sg, data in s_dict.items():
#                 if sg not in all_subgroups:
#                     all_subgroups[sg] = data
#                 else:
#                     for typ in ('lecture', 'lab', 'tutorial', 'elective'):
#                         for code, slots in data[typ].items():
#                             existing = all_subgroups[sg][typ].setdefault(code, [])
#                             for s in slots:
#                                 if s not in existing: existing.append(s)

#             for code, sgs in c_map.items():
#                 all_courses.setdefault(code, []).extend(sgs)
        
#         all_courses = {k: list(set(v)) for k, v in all_courses.items()}

#         out_sg = base / 'subgroups.json'
#         with open(out_sg, 'w', encoding='utf-8') as f: json.dump(all_subgroups, f, indent=2)
        
#         out_c = base / 'courses.json'
#         with open(out_c, 'w', encoding='utf-8') as f: json.dump(all_courses, f, indent=2)

#         elective_sglist = build_elective_subgrouplist(all_subgroups)
#         out_esg = base / 'electives_subgrouplist.json'
#         with open(out_esg, 'w', encoding='utf-8') as f: json.dump(elective_sglist, f, indent=2)
        
#         print(f"Success! Processed {len(all_subgroups)} subgroups and {len(all_courses)} unique courses.")

#         mongo_uri = os.environ.get('MONGO_URI', '')
#         if mongo_uri:
#             print("Uploading to MongoDB...")
#             upsert_to_mongodb(subgroups_to_mongo_format(all_subgroups), mongo_uri)

# if __name__ == '__main__':
#     if len(sys.argv) > 1:
#         path = sys.argv[1]
#     else:
#         path = str(Path(__file__).parent / 'UG__PG_TIME_TABLE_JAN_TO_MAY_2026.xlsx')
    
#     processor = PreprocessClass()
#     processor.preprocessScriptFunc(path)