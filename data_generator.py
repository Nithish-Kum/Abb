import random
import time
import csv
import os
from datetime import datetime

FILE_NAME = "sensor_data_live.csv"

machines = {
    "motor": {"temp": 70, "pressure": 80, "vibration": 1.5, "voltage": 185, "current": 13, "state": "normal", "state_time": 3}
}

# Initialize / clear CSV on script startup so it starts completely fresh
with open(FILE_NAME, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "timestamp","motor_temp","voltage","pressure",
        "flow_rate","vibration","current","risk","status"
    ])

def calculate_risk(m):
    risk = 0
    if m["temp"] > 75: risk += 30
    if m["vibration"] > 1.2: risk += 25
    if m["pressure"] > 85: risk += 20
    if m["voltage"] > 200: risk += 15
    return min(risk, 100)

while True:

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for name, m in machines.items():

        # 🎯 STATE MACHINE (STRICT SEQUENTIAL LOOP STATE FLOW)
        if m["state_time"] <= 0:

            if m["state"] == "normal":
                m["state"] = "warning"
                m["state_time"] = random.randint(3, 5) # 9-15s duration

            elif m["state"] == "warning":
                m["state"] = "failure"
                m["state_time"] = random.randint(2, 3) # 6-9s duration

            elif m["state"] == "failure":
                m["state"] = "recovery"
                m["state_time"] = random.randint(2, 3) # 6-9s duration

            elif m["state"] == "recovery":
                m["state"] = "normal"
                m["state_time"] = random.randint(3, 5) # 9-15s duration

        m["state_time"] -= 1

        # 🔥 BEHAVIOR PER STATE
        if m["state"] == "normal":
            # Gentle restoring force toward baseline specs to maintain realistic normal operations
            m["temp"] += (70 - m["temp"]) * 0.15 + random.uniform(-1, 1)
            m["pressure"] += (80 - m["pressure"]) * 0.15 + random.uniform(-1, 1)
            m["vibration"] += (1.5 - m["vibration"]) * 0.15 + random.uniform(-0.1, 0.1)

        elif m["state"] == "warning":
            m["temp"] += random.uniform(2,5)
            m["pressure"] += random.uniform(2,5)

        elif m["state"] == "failure":
            m["temp"] += random.uniform(10,20)
            m["vibration"] += random.uniform(1,2)

        elif m["state"] == "recovery":
            m["temp"] -= random.uniform(10,20)
            m["pressure"] -= random.uniform(10,20)
            m["vibration"] -= random.uniform(0.5,1)

        # Clamp
        m["temp"] = max(50, min(120, m["temp"]))
        m["pressure"] = max(50, min(120, m["pressure"]))
        m["vibration"] = max(0.5, min(3, m["vibration"]))

        # Risk
        risk = calculate_risk(m)

        row = [
            now,
            round(m["temp"],2),
            round(m["voltage"],2),
            round(m["pressure"],2),
            4.2,
            round(m["vibration"],2),
            round(m["current"],2),
            risk,
            m["state"].upper()
        ]

        # PRINT
        print("\n===================")
        print("Time:", row[0])
        print("Temp:", row[1], "| Pressure:", row[3])
        print("Risk:", risk, "| Status:", row[8])

        # SAVE
        with open(FILE_NAME, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(row)

    time.sleep(5)