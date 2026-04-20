# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from pymongo import MongoClient
# import json
# import logic
# import preprocessScript
# import os
# from dotenv import load_dotenv

# env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
# load_dotenv(dotenv_path=env_path)

# MONGO_URI = os.getenv("MONGO_URI")
# MONGO_DB  = os.getenv("MONGO_DB")

# print("MONGO_URI:", MONGO_URI)

# client = MongoClient(MONGO_URI)
# db     = client[MONGO_DB]

# # --- LOAD ALL 4 JSON FILES ---
# with open("subgroups.json") as f:
#     subgroups = json.load(f)
# with open("courses.json") as f:
#     courses = json.load(f)
# with open("elective.json") as f:
#     electives = json.load(f)
# with open("electives_subgrouplist.json") as f:
#     electives_subgrouplist = json.load(f)

# UPLOAD_FOLDER = "timeTableUploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "*"}})

# sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)


# @app.route("/", methods=["POST"])
# def get_students():
#     data = request.json
#     print('\n\n', data, '\n\n')

#     selected_course_data = data.get('selectedCourseData', [])
#     student_data         = data.get('studentData', {})

#     subgroup        = student_data.get('subgroup', '')
#     elective_basket = student_data.get('elective_basket', {})

#     # Handle both shapes: plain string OR {"main-elective": "..."} dict
#     if isinstance(elective_basket, str):
#         basket_name = elective_basket
#     elif isinstance(elective_basket, dict):
#         basket_name = elective_basket.get("main-elective", "")
#     else:
#         basket_name = ""

#     print(f"subgroup: {subgroup}, basket_name: {basket_name}")

#     subject_codes = ["", "", ""]
#     for i in range(min(len(selected_course_data), 3)):
#         subject_codes[i] = selected_course_data[i].get('subjectCode', '')

#     new_tt, choices = sf.mainF(
#         subgroup,
#         basket_name,
#         subject_codes[0],
#         subject_codes[1],
#         subject_codes[2],
#     )

#     return jsonify({"newTimeTable": new_tt, "choices": choices})


# @app.route('/upload', methods=["POST"])
# def upload():
#     file = request.files["file"]
#     path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(path)

#     processor = preprocessScript.PreprocessClass()
#     processor.preprocessScriptFunc(path)

#     global sf, subgroups, courses, electives_subgrouplist
#     with open("subgroups.json") as f:
#         subgroups = json.load(f)
#     with open("courses.json") as f:
#         courses = json.load(f)
#     with open("electives_subgrouplist.json") as f:
#         electives_subgrouplist = json.load(f)

#     sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)

#     return jsonify({"job_id": '1'})


# if __name__ == "__main__":
#     app.run(debug=True, port=3001, use_reloader=False)

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import json
import logic
import preprocessScript
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB  = os.getenv("MONGO_DB")

print("MONGO_URI:", MONGO_URI)

client = MongoClient(MONGO_URI)
db     = client[MONGO_DB]

# --- LOAD ALL 4 JSON FILES ---
with open("subgroups.json") as f:
    subgroups = json.load(f)
with open("courses.json") as f:
    courses = json.load(f)
with open("elective.json") as f:
    electives = json.load(f)
with open("electives_subgrouplist.json") as f:
    electives_subgrouplist = json.load(f)

UPLOAD_FOLDER = "timeTableUploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)


@app.route("/", methods=["POST"])
def get_students():
    data = request.json
    print('\n\n', data, '\n\n')

    selected_course_data = data.get('selectedCourseData', [])
    student_data         = data.get('studentData', {})

    subgroup        = student_data.get('subgroup', '')
    elective_basket = student_data.get('elective_basket', {})

    # Handle both shapes: plain string OR {"main-elective": "..."} dict
    if isinstance(elective_basket, str):
        basket_name = elective_basket
    elif isinstance(elective_basket, dict):
        basket_name = elective_basket.get("main-elective", "")
    else:
        basket_name = ""

    print(f"subgroup: {subgroup}, basket_name: {basket_name}")

    subject_codes = ["", "", ""]
    for i in range(min(len(selected_course_data), 3)):
        subject_codes[i] = selected_course_data[i].get('subjectCode', '')

    # Build expected slot counts (L + T + P) per subject code
    course_ltp = {}
    for course in selected_course_data:
        code = course.get('subjectCode', '')
        if not code:
            continue
        try:
            l = int(course.get('subjectL', 0) or 0)
            t = int(course.get('subjectT', 0) or 0)
            p = int(course.get('subjectP', 0) or 0)
            course_ltp[code] = l + t + p
        except (ValueError, TypeError):
            print(f"Warning: could not parse LTP for {code}, skipping validation")

    print(f"Expected slot counts: {course_ltp}")

    new_tt, choices = sf.mainF(
        subgroup,
        basket_name,
        subject_codes[0],
        subject_codes[1],
        subject_codes[2],
        course_ltp=course_ltp,
    )

    return jsonify({"newTimeTable": new_tt, "choices": choices})


@app.route('/upload', methods=["POST"])
def upload():
    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    processor = preprocessScript.PreprocessClass()
    processor.preprocessScriptFunc(path)

    global sf, subgroups, courses, electives_subgrouplist
    with open("subgroups.json") as f:
        subgroups = json.load(f)
    with open("courses.json") as f:
        courses = json.load(f)
    with open("electives_subgrouplist.json") as f:
        electives_subgrouplist = json.load(f)

    sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)

    return jsonify({"job_id": '1'})


if __name__ == "__main__":
    app.run(debug=True, port=3001, use_reloader=False)