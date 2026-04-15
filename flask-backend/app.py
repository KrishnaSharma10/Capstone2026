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

# with open("subgroups.json") as f:
#     subgroups = json.load(f)
# with open("courses.json") as f:
#     courses = json.load(f)
# with open("elective.json") as f:
#     electives = json.load(f)

# # electives_subgrouplist.json is no longer used by logic.py — removed

# UPLOAD_FOLDER = "timeTableUploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# app = Flask(__name__)
# CORS(app)

# # SlotFinder now takes 3 args (subgroups, courses, electives)
# sf = logic.SlotFinder(subgroups, courses, electives)


# @app.route("/", methods=["POST"])
# def get_students():
#     data = request.json

#     print('\n\n', data, '\n\n')

#     selected_course_data = data['selectedCourseData']
#     student_data         = data['studentData']

#     subgroup        = student_data['subgroup']
#     elective_basket = student_data['elective_basket']    # e.g. {"main-elective": "Cyber Forensics ..."}
#     general_elective = student_data.get('general_elective', {})  # e.g. {"open-elective": "..."}

#     # Merge both elective dicts into one chosen_electives dict for logic.py
#     chosen_electives = {**elective_basket, **general_elective}

#     subject_codes = ["", "", ""]
#     for i in range(len(selected_course_data)):
#         subject_codes[i] = selected_course_data[i]['subjectCode']

#     new_tt, choices = sf.mainF(
#         subgroup,
#         chosen_electives,
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

#     # Reload JSON files and reinitialize SlotFinder after new timetable is parsed
#     processor = preprocessScript.PreprocessClass()
#     processor.preprocessScriptFunc(path)

#     global sf, subgroups, courses
#     with open("subgroups.json") as f:
#         subgroups = json.load(f)
#     with open("courses.json") as f:
#         courses = json.load(f)
#     sf = logic.SlotFinder(subgroups, courses, electives)

#     return jsonify({"job_id": '1'})


# if __name__ == "__main__":
#     app.run(debug=True, port=3001)

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
# Re-added because the final logic.py expects it for the fallback/frontend
with open("electives_subgrouplist.json") as f:
    electives_subgrouplist = json.load(f)

UPLOAD_FOLDER = "timeTableUploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)

# SlotFinder now takes all 4 args
sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)


@app.route("/", methods=["POST"])
def get_students():
    data = request.json
    print('\n\n', data, '\n\n')

    selected_course_data = data.get('selectedCourseData', [])
    student_data         = data.get('studentData', {})

    subgroup         = student_data.get('subgroup', '')
    elective_basket  = student_data.get('elective_basket', {})    # e.g. {"main-elective": "Cyber Forensics ..."}
    
    # Extract the ACTUAL STRING NAME of the basket for logic.py
    # logic.py expects: "Cyber Forensics and Ethical Hacking", not a dict.
    basket_name = elective_basket.get("main-elective", "")

    subject_codes = ["", "", ""]
    for i in range(min(len(selected_course_data), 3)):
        subject_codes[i] = selected_course_data[i].get('subjectCode', '')

    # Pass the string `basket_name` to mainF
    new_tt, choices = sf.mainF(
        subgroup,
        basket_name,
        subject_codes[0],
        subject_codes[1],
        subject_codes[2],
    )

    return jsonify({"newTimeTable": new_tt, "choices": choices})


@app.route('/upload', methods=["POST"])
def upload():
    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    # Reload JSON files and reinitialize SlotFinder after new timetable is parsed
    processor = preprocessScript.PreprocessClass()
    processor.preprocessScriptFunc(path)

    global sf, subgroups, courses, electives_subgrouplist
    with open("subgroups.json") as f:
        subgroups = json.load(f)
    with open("courses.json") as f:
        courses = json.load(f)
    with open("electives_subgrouplist.json") as f:
        electives_subgrouplist = json.load(f)
        
    # Reinitialize with all 4 arguments
    sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)

    return jsonify({"job_id": '1'})


if __name__ == "__main__":
    app.run(debug=True, port=3001, use_reloader=False)