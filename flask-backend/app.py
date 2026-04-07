from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import json
import logic
import preprocessScript
import threading, time, os
import openpyxl
from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")

print("MONGO_URI:", MONGO_URI)  # debug

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

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
CORS(app)
sf = logic.SlotFinder(subgroups, courses, electives, electives_subgrouplist)


@app.route("/", methods=["POST"])
def get_students():

    data = request.json

    print('\n\n')
    print(data)
    print('\n\n')

    selectedCourseData = data['selectedCourseData']
    studentData = data['studentData']

    subgroup = studentData['subgroup']
    elective_basket = studentData['elective_basket']
    general_elective = studentData['general_elective']

    subjectCodes = ["", "", ""]
    for i in range(len(selectedCourseData)):
        subjectCodes[i] = selectedCourseData[i]['subjectCode']

    newTT, choices = sf.mainF(subgroup, elective_basket, subjectCodes[0], subjectCodes[1], subjectCodes[2])

    return jsonify({"newTimeTable": newTT, "choices": choices})


@app.route('/upload', methods=["POST"])
def upload():
    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    processor = preprocessScript.PreprocessClass()
    processor.preprocessScriptFunc(path)

    return jsonify({"job_id": '1'})


if __name__ == "__main__":
    app.run(debug=True, port=3001)