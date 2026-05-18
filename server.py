import csv
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

FILE_NAME = "sensor_data_live.csv"


def get_latest_data():
    try:
        with open(FILE_NAME, "r") as file:
            rows = list(csv.DictReader(file))
            if not rows:
                return None
            return rows[-1]
    except Exception as e:
        print("Error reading CSV:", e)
        return None


@app.route("/data")
def get_data():
    data = get_latest_data()
    return jsonify(data if data else {})


if __name__ == "__main__":
    app.run(debug=True)