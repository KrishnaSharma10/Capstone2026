# import json
# from itertools import product
# from typing import Dict, List, Set, Any, Optional, Tuple

# # ---------------------------------------------------------------------------
# # Slot utilities
# # ---------------------------------------------------------------------------

# DAY_MAP = {
#     "MON": "Monday",
#     "TUE": "Tuesday",
#     "WED": "Wednesday",
#     "THU": "Thursday",
#     "FRI": "Friday",
# }

# # slot numbers are 1-indexed; map to start times (each slot = 50 min)
# SLOT_TIMES = {
#     1:  "8:00 AM",
#     2:  "8:50 AM",
#     3:  "9:40 AM",
#     4:  "10:30 AM",
#     5:  "11:20 AM",
#     6:  "12:10 PM",
#     7:  "1:00 PM",
#     8:  "1:50 PM",
#     9:  "2:40 PM",
#     10: "3:30 PM",
#     11: "4:20 PM",
#     12: "5:10 PM",
#     13: "6:00 PM",
# }


# def slot_to_display(slot: str) -> Tuple[str, str]:
#     """
#     Convert "MON-3" → ("Monday", "9:40 AM").
#     """
#     day_code, num = slot.split("-")
#     day = DAY_MAP.get(day_code, day_code)
#     time = SLOT_TIMES.get(int(num), slot)
#     return day, time


# # ---------------------------------------------------------------------------
# # Occupancy builder
# # ---------------------------------------------------------------------------

# def build_occupied(
#     batch: str,
#     subgroups: Dict[str, Any],
#     electives_subgrouplist: Dict[str, Any],
#     chosen_elective_codes: List[str],
# ) -> Set[str]:
#     """
#     Returns the set of occupied slot strings for the student's batch.

#     Regular slots (lecture/lab/tutorial) are always marked occupied.
#     Elective slots are marked only for the student's chosen elective codes.
#     Uses the 'elective' bucket in subgroups.json if available,
#     falls back to electives_subgrouplist.json for backward compatibility.
#     """
#     occupied: Set[str] = set()

#     sg_data = subgroups.get(batch)
#     if not sg_data:
#         raise ValueError(f"Batch '{batch}' not found in subgroups data")

#     # mark all regular lecture / lab / tutorial slots
#     for cat in ("lecture", "lab", "tutorial"):
#         for subject_slots in sg_data.get(cat, {}).values():
#             occupied.update(subject_slots)

#     # mark chosen elective slots
#     chosen_lower = {c.lower() for c in chosen_elective_codes}

#     if "elective" in sg_data and sg_data["elective"]:
#         # new format: elective bucket in subgroups.json
#         # mark slots where the subject code matches student's chosen electives
#         for code, slots in sg_data["elective"].items():
#             if code.lower() in chosen_lower:
#                 occupied.update(slots)
#     else:
#         # fallback: electives_subgrouplist.json format
#         for entry in electives_subgrouplist.get(batch, []):
#             slot = entry.get("slot")
#             options = [o.lower() for o in entry.get("options", [])]
#             if any(c in options for c in chosen_lower):
#                 if slot:
#                     occupied.add(slot)

#     return occupied


# # ---------------------------------------------------------------------------
# # Subject slot helpers
# # ---------------------------------------------------------------------------

# def get_slots_for_component(
#     sg: str,
#     subject: str,
#     cat: str,
#     subgroups: Dict[str, Any],
# ) -> Set[str]:
#     """
#     Returns the set of slot strings for a given subgroup / subject / component.
#     Empty set if not present.
#     """
#     return set(
#         subgroups.get(sg, {}).get(cat, {}).get(subject, [])
#     )


# def pre_group_subgroups(
#     subject: str,
#     subgroups: Dict[str, Any],
#     courses: Dict[str, Any],
# ) -> Tuple[List[str], List[str], List[str]]:
#     """
#     For a subject, returns three lists:
#       lecture_sgs  — subgroups that have a lecture component for this subject
#       lab_sgs      — subgroups that have a lab component
#       tutorial_sgs — subgroups that have a tutorial component
#     """
#     candidate_sgs = courses.get(subject, [])

#     lecture_sgs  = [sg for sg in candidate_sgs if subject in subgroups.get(sg, {}).get("lecture",  {})]
#     lab_sgs      = [sg for sg in candidate_sgs if subject in subgroups.get(sg, {}).get("lab",      {})]
#     tutorial_sgs = [sg for sg in candidate_sgs if subject in subgroups.get(sg, {}).get("tutorial", {})]

#     return lecture_sgs, lab_sgs, tutorial_sgs


# # ---------------------------------------------------------------------------
# # Core backtracking
# # ---------------------------------------------------------------------------

# def find_combinations(
#     subjects: List[str],
#     base_occupied: Set[str],
#     subgroups: Dict[str, Any],
#     courses: Dict[str, Any],
#     allow_clash: bool = False,
#     max_results: int = 5,
#     existing_results: int = 0,
# ) -> List[Dict]:
#     """
#     Backtrack over subjects, trying all valid (lecture_sg, lab_sg, tutorial_sg)
#     combinations per subject.

#     Clash rule:
#       - Each subject may have AT MOST 1 lecture slot overlapping with
#         base_occupied (the student's original timetable).
#       - Added subjects must NOT clash with each other's lecture slots at all.
#       - Lab / tutorial slots must have zero overlap with anything — hard reject.

#     allow_clash — if False, only zero-clash results accepted.
#                   if True, up to 1 lecture clash per subject accepted.
#     existing_results — how many results already collected (from first pass),
#                        so we know how many more to find.

#     Returns a list of result dicts.
#     """
#     results = []
#     needed = max_results - existing_results

#     # pre-compute component lists for each subject
#     subject_components = {}
#     for subj in subjects:
#         lec_sgs, lab_sgs, tut_sgs = pre_group_subgroups(subj, subgroups, courses)
#         subject_components[subj] = {
#             "lecture":  lec_sgs,
#             "lab":      lab_sgs,
#             "tutorial": tut_sgs,
#         }

#     def backtrack(
#         idx: int,
#         occupied: Set[str],           # base + previously added subjects' slots
#         added_lecture_slots: Set[str], # lecture slots of subjects added so far
#         assignment: List[Dict],
#         has_clash: bool,               # whether any clash has occurred so far
#     ):
#         if len(results) >= needed:
#             return

#         if idx == len(subjects):
#             results.append(assignment.copy())
#             return

#         subj = subjects[idx]
#         comps = subject_components[subj]

#         lec_sgs = comps["lecture"]  or [None]
#         lab_sgs = comps["lab"]      or [None]
#         tut_sgs = comps["tutorial"] or [None]

#         for lec_sg, lab_sg, tut_sg in product(lec_sgs, lab_sgs, tut_sgs):

#             # --- collect slots per component ---
#             lec_slots = get_slots_for_component(lec_sg, subj, "lecture",  subgroups) if lec_sg else set()
#             lab_slots = get_slots_for_component(lab_sg, subj, "lab",      subgroups) if lab_sg else set()
#             tut_slots = get_slots_for_component(tut_sg, subj, "tutorial", subgroups) if tut_sg else set()

#             all_new_slots = lec_slots | lab_slots | tut_slots

#             # --- hard reject: lab or tutorial overlaps with anything ---
#             non_lec_slots = lab_slots | tut_slots
#             if not non_lec_slots.isdisjoint(occupied):
#                 continue

#             # --- hard reject: any new slot overlaps with other added subjects' lectures ---
#             if not all_new_slots.isdisjoint(added_lecture_slots):
#                 continue

#             # --- lecture clash check ---
#             lec_clash = lec_slots & base_occupied
#             if len(lec_clash) > 1:
#                 continue  # more than 1 lecture clash → always reject

#             this_subject_clashes = len(lec_clash) == 1

#             if this_subject_clashes and not allow_clash:
#                 continue  # first pass: zero clash only

#             # --- record this assignment ---
#             entry = {
#                 "subject":        subj,
#                 "lecture_sg":     lec_sg,
#                 "lab_sg":         lab_sg,
#                 "tutorial_sg":    tut_sg,
#                 "lecture_slots":  lec_slots,
#                 "lab_slots":      lab_slots,
#                 "tutorial_slots": tut_slots,
#                 "clash_slots":    lec_clash,
#             }

#             new_occupied        = occupied | all_new_slots
#             new_added_lec_slots = added_lecture_slots | lec_slots

#             backtrack(
#                 idx + 1,
#                 new_occupied,
#                 new_added_lec_slots,
#                 assignment + [entry],
#                 has_clash or this_subject_clashes,
#             )

#             if len(results) >= needed:
#                 return

#     backtrack(0, base_occupied, set(), [], False)
#     return results


# # ---------------------------------------------------------------------------
# # Frontend formatter
# # ---------------------------------------------------------------------------

# def format_for_frontend(results: List[List[Dict]]) -> Tuple[List[List[Dict]], List[List[Dict]]]:
#     """
#     Converts backtracking results into frontend-friendly event lists.

#     Each event:
#       {
#         "day":         "Monday",
#         "hour":        "9:40 AM",
#         "subjectCode": "UCS071",
#         "type":        "lecture" | "lab" | "tutorial",
#         "subgroup":    "3C4A",
#         "clash":       True | False,
#         "color":       "red" | "orange"   (orange = clash)
#       }

#     Returns (options, raw_choices) where:
#       options      = list of event lists (one per result)
#       raw_choices  = list of simplified assignment dicts (one per result)
#     """
#     options      = []
#     raw_choices  = []

#     for result in results:
#         events       = []
#         choice_entry = {}

#         for entry in result:
#             subj       = entry["subject"]
#             clash_set  = entry["clash_slots"]

#             choice_entry[subj] = {
#                 "lecture_sg":  entry["lecture_sg"],
#                 "lab_sg":      entry["lab_sg"],
#                 "tutorial_sg": entry["tutorial_sg"],
#             }

#             for cat, sg_key, slots in [
#                 ("lecture",  "lecture_sg",  entry["lecture_slots"]),
#                 ("lab",      "lab_sg",      entry["lab_slots"]),
#                 ("tutorial", "tutorial_sg", entry["tutorial_slots"]),
#             ]:
#                 sg = entry[sg_key]
#                 for slot in sorted(slots):
#                     is_clash = (cat == "lecture") and (slot in clash_set)
#                     day, hour = slot_to_display(slot)
#                     events.append({
#                         "day":         day,
#                         "hour":        hour,
#                         "subjectCode": subj,
#                         "subjectName": subj,
#                         "venue":       "",
#                         "type":        cat,
#                         "subgroup":    sg,
#                         "clash":       is_clash,
#                         "color":       "orange" if is_clash else "red",
#                     })

#         options.append(events)
#         raw_choices.append(choice_entry)

#     return options, raw_choices


# # ---------------------------------------------------------------------------
# # Main entry point
# # ---------------------------------------------------------------------------

# class SlotFinder:

#     def __init__(self, subgroups_data, courses_data, electives_data, electives_subgrouplist_data):
#         self.subgroups              = subgroups_data
#         self.courses                = courses_data
#         self.electives              = electives_data              # basket → [codes]
#         self.electives_subgrouplist = electives_subgrouplist_data # subgroup → [{slot, options}]

#     def mainF(
#         self,
#         batch: str,
#         elective_basket: str,
#         sub1: str = "",
#         sub2: str = "",
#         sub3: str = "",
#     ) -> Tuple[List[List[Dict]], List[List[Dict]]]:
#         """
#         Main function called by app.py.

#         batch           — student's current subgroup e.g. "3C4A"
#         elective_basket — name of the elective basket e.g. "High Performance Computing"
#         sub1/2/3        — subject codes to add (empty string = not used)

#         Returns (options, raw_choices) ready for the frontend.
#         """
#         # resolve elective codes from basket name
#         chosen_elective_codes = self.electives.get("main-elective", {}).get(elective_basket, [])

#         # build base occupied set
#         base_occupied = build_occupied(
#             batch,
#             self.subgroups,
#             self.electives_subgrouplist,
#             chosen_elective_codes,
#         )

#         # collect only non-empty subjects
#         subjects = [s for s in [sub1, sub2, sub3] if s]

#         if not subjects:
#             return [], []

#         # filter out subjects that don't exist in courses — skip silently
#         missing = [s for s in subjects if s not in self.courses]
#         if missing:
#             print(f"Warning: subjects not found in courses data, skipping: {missing}")
#         subjects = [s for s in subjects if s in self.courses]

#         if not subjects:
#             return [], []

#         # pass 1 — collect a large pool of zero-clash results
#         pool = find_combinations(
#             subjects,
#             base_occupied,
#             self.subgroups,
#             self.courses,
#             allow_clash=False,
#             max_results=50,
#         )

#         # pass 2 — if pool still under 50, fill with clash-allowed results
#         if len(pool) < 50:
#             pool += find_combinations(
#                 subjects,
#                 base_occupied,
#                 self.subgroups,
#                 self.courses,
#                 allow_clash=True,
#                 max_results=50,
#                 existing_results=len(pool),
#             )

#         # diversity filter — prioritise lecture variety, then lab, then tutorial
#         def fp_lecture(result):
#             return frozenset((e["subject"], e["lecture_sg"]) for e in result)

#         def fp_lab(result):
#             return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"]) for e in result)

#         def fp_tutorial(result):
#             return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"], e["tutorial_sg"]) for e in result)

#         # stage 1 — pick results with unique lecture_sg combos
#         seen_lec = set()
#         lec_diverse   = []
#         lec_remaining = []
#         for result in pool:
#             fp = fp_lecture(result)
#             if fp not in seen_lec:
#                 seen_lec.add(fp)
#                 lec_diverse.append(result)
#             else:
#                 lec_remaining.append(result)

#         # stage 2 — from leftovers, pick results with unique lab_sg combos
#         seen_lab = set()
#         lab_diverse   = []
#         lab_remaining = []
#         for result in lec_remaining:
#             fp = fp_lab(result)
#             if fp not in seen_lab:
#                 seen_lab.add(fp)
#                 lab_diverse.append(result)
#             else:
#                 lab_remaining.append(result)

#         # stage 3 — from leftovers, pick results with unique tutorial_sg combos
#         seen_tut = set()
#         tut_diverse = []
#         tut_remaining = []
#         for result in lab_remaining:
#             fp = fp_tutorial(result)
#             if fp not in seen_tut:
#                 seen_tut.add(fp)
#                 tut_diverse.append(result)
#             else:
#                 tut_remaining.append(result)

#         # merge in priority order: lecture > lab > tutorial > exact duplicates
#         final = (lec_diverse + lab_diverse + tut_diverse + tut_remaining)[:5]

#         # format for frontend
#         options, raw_choices = format_for_frontend(final)

#         return options, raw_choices


# # ---------------------------------------------------------------------------
# # Quick test
# # ---------------------------------------------------------------------------

# if __name__ == "__main__":
#     with open("/mnt/user-data/uploads/subgroups__2_.json") as f:
#         subgroups_data = json.load(f)
#     with open("/mnt/user-data/uploads/courses__2_.json") as f:
#         courses_data = json.load(f)
#     with open("/mnt/user-data/uploads/elective.json") as f:
#         electives_data = json.load(f)
#     with open("/mnt/user-data/uploads/electives_subgrouplist.json") as f:
#         electives_sg_data = json.load(f)

#     finder = SlotFinder(subgroups_data, courses_data, electives_data, electives_sg_data)

#     options, choices = finder.mainF(
#         batch="3C4A",
#         elective_basket="High Performance Computing",
#         sub1="UMA022",
#         sub2="UES013",
#     )

#     print(f"Found {len(options)} options\n")
#     for i, (opt, ch) in enumerate(zip(options, choices)):
#         print(f"--- Option {i+1} ---")
#         print("Assignment:", json.dumps(ch, indent=2))
#         print("Events:")
#         for ev in opt:
#             clash_marker = " *** CLASH ***" if ev["clash"] else ""
#             print(f"  {ev['day']:10} {ev['hour']:10} {ev['subjectCode']} [{ev['type']:8}] sg={ev['subgroup']}{clash_marker}")
#         print()



import json
from itertools import product
from typing import Dict, List, Set, Any, Optional, Tuple

# ---------------------------------------------------------------------------
# Slot utilities
# ---------------------------------------------------------------------------

DAY_MAP = {
    "MON": "Monday",
    "TUE": "Tuesday",
    "WED": "Wednesday",
    "THU": "Thursday",
    "FRI": "Friday",
}

# slot numbers are 1-indexed; map to start times (each slot = 50 min)
SLOT_TIMES = {
    1:  "8:00 AM",
    2:  "8:50 AM",
    3:  "9:40 AM",
    4:  "10:30 AM",
    5:  "11:20 AM",
    6:  "12:10 PM",
    7:  "1:00 PM",
    8:  "1:50 PM",
    9:  "2:40 PM",
    10: "3:30 PM",
    11: "4:20 PM",
    12: "5:10 PM",
    13: "6:00 PM",
}

def slot_to_display(slot: str) -> Tuple[str, str]:
    """
    Convert "MON-3" → ("Monday", "9:40 AM").
    """
    day_code, num = slot.split("-")
    day = DAY_MAP.get(day_code, day_code)
    time = SLOT_TIMES.get(int(num), slot)
    return day, time

# ---------------------------------------------------------------------------
# Occupancy builder
# ---------------------------------------------------------------------------

def build_occupied(
    batch: str,
    subgroups: Dict[str, Any],
    electives_subgrouplist: Dict[str, Any],
    chosen_elective_codes: List[str],
) -> Set[str]:
    """
    Returns the set of occupied slot strings for the student's batch.
    """
    occupied: Set[str] = set()

    sg_data = subgroups.get(batch)
    if not sg_data:
        raise ValueError(f"Batch '{batch}' not found in subgroups data")

    # mark all regular lecture / lab / tutorial slots
    for cat in ("lecture", "lab", "tutorial"):
        for subject_slots in sg_data.get(cat, {}).values():
            occupied.update(subject_slots)

    # mark chosen elective slots
    chosen_lower = {c.lower() for c in chosen_elective_codes}

    if "elective" in sg_data and sg_data["elective"]:
        # new format: elective bucket in subgroups.json
        for code, slots in sg_data["elective"].items():
            if code.lower() in chosen_lower:
                occupied.update(slots)
    else:
        # fallback: electives_subgrouplist.json format
        for entry in electives_subgrouplist.get(batch, []):
            slot = entry.get("slot")
            options = [o.lower() for o in entry.get("options", [])]
            if any(c in options for c in chosen_lower):
                if slot:
                    occupied.add(slot)

    return occupied

# ---------------------------------------------------------------------------
# Subject slot helpers
# ---------------------------------------------------------------------------

def get_slots_for_component(
    sg: str,
    subject: str,
    cat: str,
    subgroups: Dict[str, Any],
) -> Set[str]:
    """
    Returns the set of slot strings for a given subgroup / subject / component.
    Empty set if not present.
    """
    return set(subgroups.get(sg, {}).get(cat, {}).get(subject, []))


def pre_group_subgroups(
    subject: str,
    subgroups: Dict[str, Any],
    courses: Dict[str, Any],
) -> Tuple[List[str], List[str], List[str]]:
    """
    For a subject, returns three lists:
      lecture_sgs  — subgroups that have a lecture OR elective component
      lab_sgs      — subgroups that have a lab component
      tutorial_sgs — subgroups that have a tutorial component
    """
    candidate_sgs = courses.get(subject, [])

    # UPDATED: Now checks both "lecture" and "elective" buckets
    lecture_sgs  = [
        sg for sg in candidate_sgs 
        if subject in subgroups.get(sg, {}).get("lecture", {}) 
        or subject in subgroups.get(sg, {}).get("elective", {})
    ]
    lab_sgs      = [sg for sg in candidate_sgs if subject in subgroups.get(sg, {}).get("lab", {})]
    tutorial_sgs = [sg for sg in candidate_sgs if subject in subgroups.get(sg, {}).get("tutorial", {})]

    return lecture_sgs, lab_sgs, tutorial_sgs

# ---------------------------------------------------------------------------
# Core backtracking
# ---------------------------------------------------------------------------

def find_combinations(
    subjects: List[str],
    base_occupied: Set[str],
    subgroups: Dict[str, Any],
    courses: Dict[str, Any],
    allow_clash: bool = False,
    max_results: int = 5,
    existing_results: int = 0,
) -> List[Dict]:
    """
    Backtrack over subjects, trying all valid (lecture_sg, lab_sg, tutorial_sg) combinations.
    """
    results = []
    needed = max_results - existing_results

    # pre-compute component lists for each subject
    subject_components = {}
    for subj in subjects:
        lec_sgs, lab_sgs, tut_sgs = pre_group_subgroups(subj, subgroups, courses)
        subject_components[subj] = {
            "lecture":  lec_sgs,
            "lab":      lab_sgs,
            "tutorial": tut_sgs,
        }

    def backtrack(
        idx: int,
        occupied: Set[str],
        added_lecture_slots: Set[str],
        assignment: List[Dict],
        has_clash: bool,
    ):
        if len(results) >= needed:
            return

        if idx == len(subjects):
            results.append(assignment.copy())
            return

        subj = subjects[idx]
        comps = subject_components[subj]

        lec_sgs = comps["lecture"]  or [None]
        lab_sgs = comps["lab"]      or [None]
        tut_sgs = comps["tutorial"] or [None]

        for lec_sg, lab_sg, tut_sg in product(lec_sgs, lab_sgs, tut_sgs):

            # --- collect slots per component ---
            lec_slots = get_slots_for_component(lec_sg, subj, "lecture", subgroups) if lec_sg else set()
            
            # UPDATED: Fallback to elective bucket if no lecture found
            if not lec_slots and lec_sg:
                lec_slots = get_slots_for_component(lec_sg, subj, "elective", subgroups)

            lab_slots = get_slots_for_component(lab_sg, subj, "lab",      subgroups) if lab_sg else set()
            tut_slots = get_slots_for_component(tut_sg, subj, "tutorial", subgroups) if tut_sg else set()

            all_new_slots = lec_slots | lab_slots | tut_slots

            # --- hard reject: lab or tutorial overlaps with anything ---
            non_lec_slots = lab_slots | tut_slots
            if not non_lec_slots.isdisjoint(occupied):
                continue

            # --- hard reject: any new slot overlaps with other added subjects' lectures ---
            if not all_new_slots.isdisjoint(added_lecture_slots):
                continue

            # --- lecture clash check ---
            lec_clash = lec_slots & base_occupied
            if len(lec_clash) > 1:
                continue  # more than 1 lecture clash → always reject

            this_subject_clashes = len(lec_clash) == 1

            if this_subject_clashes and not allow_clash:
                continue  # first pass: zero clash only

            # --- record this assignment ---
            entry = {
                "subject":        subj,
                "lecture_sg":     lec_sg,
                "lab_sg":         lab_sg,
                "tutorial_sg":    tut_sg,
                "lecture_slots":  lec_slots,
                "lab_slots":      lab_slots,
                "tutorial_slots": tut_slots,
                "clash_slots":    lec_clash,
            }

            new_occupied        = occupied | all_new_slots
            new_added_lec_slots = added_lecture_slots | lec_slots

            backtrack(
                idx + 1,
                new_occupied,
                new_added_lec_slots,
                assignment + [entry],
                has_clash or this_subject_clashes,
            )

            if len(results) >= needed:
                return

    backtrack(0, base_occupied, set(), [], False)
    return results

# ---------------------------------------------------------------------------
# Frontend formatter
# ---------------------------------------------------------------------------

def format_for_frontend(results: List[List[Dict]]) -> Tuple[List[List[Dict]], List[List[Dict]]]:
    """
    Converts backtracking results into frontend-friendly event lists.
    """
    options      = []
    raw_choices  = []

    for result in results:
        events       = []
        choice_entry = {}

        for entry in result:
            subj       = entry["subject"]
            clash_set  = entry["clash_slots"]

            choice_entry[subj] = {
                "lecture_sg":  entry["lecture_sg"],
                "lab_sg":      entry["lab_sg"],
                "tutorial_sg": entry["tutorial_sg"],
            }

            for cat, sg_key, slots in [
                ("lecture",  "lecture_sg",  entry["lecture_slots"]),
                ("lab",      "lab_sg",      entry["lab_slots"]),
                ("tutorial", "tutorial_sg", entry["tutorial_slots"]),
            ]:
                sg = entry[sg_key]
                for slot in sorted(slots):
                    is_clash = (cat == "lecture") and (slot in clash_set)
                    day, hour = slot_to_display(slot)
                    events.append({
                        "day":         day,
                        "hour":        hour,
                        "subjectCode": subj,
                        "subjectName": subj,
                        "venue":       "",
                        "type":        cat,
                        "subgroup":    sg,
                        "clash":       is_clash,
                        "color":       "orange" if is_clash else "red",
                    })

        options.append(events)
        raw_choices.append(choice_entry)

    return options, raw_choices

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

class SlotFinder:

    def __init__(self, subgroups_data, courses_data, electives_data, electives_subgrouplist_data):
        self.subgroups              = subgroups_data
        self.courses                = courses_data
        self.electives              = electives_data              # basket → [codes]
        self.electives_subgrouplist = electives_subgrouplist_data # subgroup → [{slot, options}]

    def mainF(
        self,
        batch: str,
        elective_basket: str,
        sub1: str = "",
        sub2: str = "",
        sub3: str = "",
    ) -> Tuple[List[List[Dict]], List[List[Dict]]]:
        """
        Main function called by app.py.
        """
        # resolve elective codes from basket name
        chosen_elective_codes = self.electives.get("main-elective", {}).get(elective_basket, [])

        # build base occupied set
        base_occupied = build_occupied(
            batch,
            self.subgroups,
            self.electives_subgrouplist,
            chosen_elective_codes,
        )

        # collect only non-empty subjects
        subjects = [s for s in [sub1, sub2, sub3] if s]

        if not subjects:
            return [], []

        # filter out subjects that don't exist in courses — skip silently
        missing = [s for s in subjects if s not in self.courses]
        if missing:
            print(f"Warning: subjects not found in courses data, skipping: {missing}")
        subjects = [s for s in subjects if s in self.courses]

        if not subjects:
            return [], []

        # pass 1 — collect a large pool of zero-clash results
        pool = find_combinations(
            subjects,
            base_occupied,
            self.subgroups,
            self.courses,
            allow_clash=False,
            max_results=50,
        )

        # pass 2 — if pool still under 50, fill with clash-allowed results
        if len(pool) < 50:
            pool += find_combinations(
                subjects,
                base_occupied,
                self.subgroups,
                self.courses,
                allow_clash=True,
                max_results=50,
                existing_results=len(pool),
            )

        # diversity filter — prioritise lecture variety, then lab, then tutorial
        def fp_lecture(result):
            return frozenset((e["subject"], e["lecture_sg"]) for e in result)

        def fp_lab(result):
            return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"]) for e in result)

        def fp_tutorial(result):
            return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"], e["tutorial_sg"]) for e in result)

        seen_lec = set()
        lec_diverse   = []
        lec_remaining = []
        for result in pool:
            fp = fp_lecture(result)
            if fp not in seen_lec:
                seen_lec.add(fp)
                lec_diverse.append(result)
            else:
                lec_remaining.append(result)

        seen_lab = set()
        lab_diverse   = []
        lab_remaining = []
        for result in lec_remaining:
            fp = fp_lab(result)
            if fp not in seen_lab:
                seen_lab.add(fp)
                lab_diverse.append(result)
            else:
                lab_remaining.append(result)

        seen_tut = set()
        tut_diverse = []
        tut_remaining = []
        for result in lab_remaining:
            fp = fp_tutorial(result)
            if fp not in seen_tut:
                seen_tut.add(fp)
                tut_diverse.append(result)
            else:
                tut_remaining.append(result)

        final = (lec_diverse + lab_diverse + tut_diverse + tut_remaining)[:5]

        options, raw_choices = format_for_frontend(final)

        return options, raw_choices