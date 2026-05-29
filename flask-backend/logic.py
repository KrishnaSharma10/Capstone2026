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
    occupied: Set[str] = set()

    sg_data = subgroups.get(batch)
    if not sg_data:
        raise ValueError(f"Batch '{batch}' not found in subgroups data")

    for cat in ("lecture", "lab", "tutorial"):
        for subject_slots in sg_data.get(cat, {}).values():
            occupied.update(subject_slots)

    chosen_lower = {c.lower() for c in chosen_elective_codes}

    if "elective" in sg_data and sg_data["elective"]:
        for code, slots in sg_data["elective"].items():
            if code.lower() in chosen_lower:
                occupied.update(slots)
    else:
        for entry in electives_subgrouplist.get(batch, []):
            slot = entry.get("slot")
            options = [o.lower() for o in entry.get("options", [])]
            if any(c in options for c in chosen_lower):
                if slot:
                    occupied.add(slot)

    return occupied


# ---------------------------------------------------------------------------
# Build lecture-only occupied set for a subgroup
# ---------------------------------------------------------------------------

def build_lecture_occupied(batch: str, subgroups: Dict[str, Any]) -> Set[str]:
    """
    Returns only the lecture slots for a given subgroup.
    Used to check if a lecture clash is lec-vs-lec only.
    """
    sg_data = subgroups.get(batch, {})
    lecture_slots: Set[str] = set()
    for slots in sg_data.get("lecture", {}).values():
        lecture_slots.update(slots)
    return lecture_slots


# ---------------------------------------------------------------------------
# Build full occupied set for a subgroup (all cats)
# ---------------------------------------------------------------------------

def build_full_occupied(sg: str, subgroups: Dict[str, Any]) -> Set[str]:
    """
    Returns ALL slots (lecture + lab + tutorial) for a given subgroup.
    Used to check lab/tut subgroup conflicts.
    """
    sg_data = subgroups.get(sg, {})
    all_slots: Set[str] = set()
    for cat in ("lecture", "lab", "tutorial","elective"):
        for slots in sg_data.get(cat, {}).values():
            all_slots.update(slots)
    return all_slots


# ---------------------------------------------------------------------------
# Subject slot helpers
# ---------------------------------------------------------------------------

def get_slots_for_component(
    sg: str,
    subject: str,
    cat: str,
    subgroups: Dict[str, Any],
) -> Set[str]:
    return set(subgroups.get(sg, {}).get(cat, {}).get(subject, []))


def pre_group_subgroups(
    subject: str,
    subgroups: Dict[str, Any],
    courses: Dict[str, Any],
) -> Tuple[List[str], List[str], List[str]]:
    candidate_sgs = courses.get(subject, [])

    lecture_sgs = [
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
    student_batch: str = "",          # ← NEW: student's own subgroup name
    allow_clash: bool = False,
    max_results: int = 5,
    existing_results: int = 0,
) -> List[Dict]:
    results = []
    needed = max_results - existing_results

    # Pre-build student's lecture-only slots for lec-vs-lec clash validation
    student_lec_slots = build_lecture_occupied(student_batch, subgroups) if student_batch else base_occupied

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
        occupied: Set[str],   # base_occupied + ALL slots of previously added subjects
        base_occ: Set[str],   # original base_occupied, never modified
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
            if not lec_slots and lec_sg:
                lec_slots = get_slots_for_component(lec_sg, subj, "elective", subgroups)

            lab_slots = get_slots_for_component(lab_sg, subj, "lab",      subgroups) if lab_sg else set()
            tut_slots = get_slots_for_component(tut_sg, subj, "tutorial", subgroups) if tut_sg else set()

            all_new_slots = lec_slots | lab_slots | tut_slots

            # ── RULE 1: intra-subject component overlaps → hard reject ──────
            if not lab_slots.isdisjoint(lec_slots):
                continue
            if not tut_slots.isdisjoint(lec_slots):
                continue
            if not lab_slots.isdisjoint(tut_slots):
                continue

            # ── RULE 2: inter-subject overlap (already added subjects) → hard reject ──
            inter_subject_occupied = occupied - base_occ
            if not all_new_slots.isdisjoint(inter_subject_occupied):
                continue

            # ── RULE 3: lab slots must not clash with ANYTHING ───────────────
            # Check against: student base + lab subgroup's full timetable
            if lab_slots:
                lab_sg_full = build_full_occupied(lab_sg, subgroups) - lab_slots if lab_sg else set()
                lab_forbidden = base_occ | lab_sg_full
                if not lab_slots.isdisjoint(lab_forbidden):
                    continue

            # ── RULE 4: tutorial slots must not clash with ANYTHING ──────────
            # Check against: student base + tutorial subgroup's full timetable
            if tut_slots:
                tut_sg_full = build_full_occupied(tut_sg, subgroups) - tut_slots if tut_sg else set()
                tut_forbidden = base_occ | tut_sg_full
                if not tut_slots.isdisjoint(tut_forbidden):
                    continue

            # ── RULE 5: lecture clash — only allowed if it's lec-vs-lec ─────
            # Max 1 lecture clash per subject, and ONLY against student's lecture slots
            # (not against lab/tutorial slots of the base timetable)
            lec_clash = lec_slots & student_lec_slots   # lec vs lec only
            non_lec_base = base_occ - student_lec_slots  # lab+tut slots of base
            if not lec_slots.isdisjoint(non_lec_base):
                # Lecture of improvement subject hits a lab/tut of base → hard reject
                continue
            if len(lec_clash) > 1:
                # More than 1 lecture slot of THIS subject clashes → hard reject
                continue

            this_subject_clashes = len(lec_clash) == 1
            if this_subject_clashes and not allow_clash:
                continue

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

            new_occupied = occupied | all_new_slots

            backtrack(
                idx + 1,
                new_occupied,
                base_occ,
                assignment + [entry],
                has_clash or this_subject_clashes,
            )

            if len(results) >= needed:
                return

    backtrack(0, base_occupied, base_occupied, [], False)
    return results

# ---------------------------------------------------------------------------
# LTP slot count validator
# ---------------------------------------------------------------------------

def validate_slot_counts(
    result: List[Dict],
    course_ltp: Dict[str, int],
) -> bool:
    for entry in result:
        subj = entry["subject"]
        expected = course_ltp.get(subj)
        if expected is None:
            continue
        actual = (
            len(entry["lecture_slots"]) +
            len(entry["lab_slots"])     +
            len(entry["tutorial_slots"])
        )
        if actual < expected:
            print(f"  LTP filter: {subj} has {actual} slots, expected {expected} → rejected")
            return False
    return True

# ---------------------------------------------------------------------------
# Frontend formatter
# ---------------------------------------------------------------------------

def format_for_frontend(results: List[List[Dict]]) -> Tuple[List[List[Dict]], List[List[Dict]]]:
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
# Slot fingerprint deduplication
# ---------------------------------------------------------------------------

def result_slot_fingerprint(result: List[Dict]) -> frozenset:
    return frozenset(
        slot
        for entry in result
        for slot in (
            entry["lecture_slots"] |
            entry["lab_slots"]     |
            entry["tutorial_slots"]
        )
    )

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

class SlotFinder:

    def __init__(self, subgroups_data, courses_data, electives_data, electives_subgrouplist_data):
        self.subgroups              = subgroups_data
        self.courses                = courses_data
        self.electives              = electives_data
        self.electives_subgrouplist = electives_subgrouplist_data

    def mainF(
        self,
        batch: str,
        elective_basket: str,
        sub1: str = "",
        sub2: str = "",
        sub3: str = "",
        course_ltp: Dict[str, int] = None,
    ) -> Tuple[List[List[Dict]], List[List[Dict]]]:

        if course_ltp is None:
            course_ltp = {}

        chosen_elective_codes = self.electives.get("main-elective", {}).get(elective_basket, [])

        base_occupied = build_occupied(
            batch,
            self.subgroups,
            self.electives_subgrouplist,
            chosen_elective_codes,
        )

        subjects = [s for s in [sub1, sub2, sub3] if s]

        if not subjects:
            return [], []

        missing = [s for s in subjects if s not in self.courses]
        if missing:
            print(f"Warning: subjects not found in courses data, skipping: {missing}")
        subjects = [s for s in subjects if s in self.courses]

        if not subjects:
            return [], []

        for subj in subjects:
            lec, lab, tut = pre_group_subgroups(subj, self.subgroups, self.courses)
            print(f"{subj}: lec_sgs={lec}, lab_sgs={lab}, tut_sgs={tut}")

        # Pass 1 — zero-clash pool
        pool = find_combinations(
            subjects,
            base_occupied,
            self.subgroups,
            self.courses,
            student_batch=batch,          # ← pass batch so lec-vs-lec check works
            allow_clash=False,
            max_results=50,
        )

        # Pass 2 — fill with clash-allowed if needed
        if len(pool) < 50:
            pool += find_combinations(
                subjects,
                base_occupied,
                self.subgroups,
                self.courses,
                student_batch=batch,      # ← pass batch here too
                allow_clash=True,
                max_results=50,
                existing_results=len(pool),
            )

        print(f"Pool size before diversity filter: {len(pool)}")

        def fp_lecture(result):
            return frozenset((e["subject"], e["lecture_sg"]) for e in result)

        def fp_lab(result):
            return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"]) for e in result)

        def fp_tutorial(result):
            return frozenset((e["subject"], e["lecture_sg"], e["lab_sg"], e["tutorial_sg"]) for e in result)

        seen_lec = set()
        lec_diverse, lec_remaining = [], []
        for result in pool:
            fp = fp_lecture(result)
            if fp not in seen_lec:
                seen_lec.add(fp)
                lec_diverse.append(result)
            else:
                lec_remaining.append(result)

        seen_lab = set()
        lab_diverse, lab_remaining = [], []
        for result in lec_remaining:
            fp = fp_lab(result)
            if fp not in seen_lab:
                seen_lab.add(fp)
                lab_diverse.append(result)
            else:
                lab_remaining.append(result)

        seen_tut = set()
        tut_diverse, tut_remaining = [], []
        for result in lab_remaining:
            fp = fp_tutorial(result)
            if fp not in seen_tut:
                seen_tut.add(fp)
                tut_diverse.append(result)
            else:
                tut_remaining.append(result)

        merged = lec_diverse + lab_diverse + tut_diverse + tut_remaining

        seen_slots = set()
        truly_distinct = []
        for result in merged:
            fp = result_slot_fingerprint(result)
            if fp not in seen_slots:
                seen_slots.add(fp)
                truly_distinct.append(result)

        if course_ltp:
            print("Running LTP slot count validation...")
            ltp_valid = [r for r in truly_distinct if validate_slot_counts(r, course_ltp)]
            print(f"After LTP validation: {len(ltp_valid)} / {len(truly_distinct)} passed")
        else:
            ltp_valid = truly_distinct

        final = ltp_valid[:5]

        print(f"Final options after slot dedup: {len(final)}")

        for i, result in enumerate(final):
            for entry in result:
                print(f"Option {i+1} | {entry['subject']} | "
                      f"lec={entry['lecture_slots']} | "
                      f"lab={entry['lab_slots']} | "
                      f"tut={entry['tutorial_slots']}")

        options, raw_choices = format_for_frontend(final)

        return options, raw_choices