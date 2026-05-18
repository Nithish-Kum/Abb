import random, time, csv
from datetime import datetime

FILE_NAME = "motor_data.csv"

motor = {
    "temp": 70,
    "pressure": 80,
    "vibration": 1.2,
    "voltage": 185,
    "current": 13,
    "state": "normal",
    "state_time": 3
}

# RESET FILE
with open(FILE_NAME, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "timestamp","temp","pressure","vibration","voltage","current","risk","status"
    ])

def risk_calc(m):
    risk = 0
    if m["temp"] > 75: risk += 30
    if m["vibration"] > 1.5: risk += 25
    if m["pressure"] > 90: risk += 20
    if m["voltage"] > 200: risk += 15
    return min(risk,100)

while True:
    now = datetime.now().strftime("%H:%M:%S")

    # STATE FLOW
    if motor["state_time"] <= 0:
        flow = ["normal","warning","failure","recovery"]
        motor["state"] = flow[(flow.index(motor["state"])+1)%4]
        motor["state_time"] = random.randint(3,5)

    motor["state_time"] -= 1

    # ---------------------------
    # 🔥 STATE-BASED BEHAVIOR
    # ---------------------------
    if motor["state"] == "normal":
        motor["temp"] += (70 - motor["temp"]) * 0.1 + random.uniform(-1,1)
        motor["pressure"] += (80 - motor["pressure"]) * 0.1 + random.uniform(-1,1)
        motor["vibration"] += (1.2 - motor["vibration"]) * 0.1 + random.uniform(-0.1,0.1)
        motor["voltage"] += random.uniform(-1,1)
        motor["current"] += random.uniform(-0.5,0.5)

    elif motor["state"] == "warning":
        motor["temp"] += random.uniform(2,4)
        motor["pressure"] += random.uniform(2,4)
        motor["vibration"] += random.uniform(0.2,0.4)
        motor["voltage"] += random.uniform(1,3)
        motor["current"] += random.uniform(1,2)

    elif motor["state"] == "failure":
        motor["temp"] += random.uniform(8,15)
        motor["pressure"] += random.uniform(5,10)
        motor["vibration"] += random.uniform(0.5,1.0)
        motor["voltage"] += random.uniform(5,10)
        motor["current"] += random.uniform(2,4)

    elif motor["state"] == "recovery":
        motor["temp"] -= random.uniform(8,12)
        motor["pressure"] -= random.uniform(5,10)
        motor["vibration"] -= random.uniform(0.3,0.6)
        motor["voltage"] -= random.uniform(3,6)
        motor["current"] -= random.uniform(1,2)

    # ---------------------------
    # 🧱 CLAMP VALUES (safety limits)
    # ---------------------------
    motor["temp"] = max(50, min(120, motor["temp"]))
    motor["pressure"] = max(50, min(120, motor["pressure"]))
    motor["vibration"] = max(0.5, min(3, motor["vibration"]))
    motor["voltage"] = max(170, min(240, motor["voltage"]))
    motor["current"] = max(5, min(30, motor["current"]))

    risk = risk_calc(motor)

    row = [
        now,
        round(motor["temp"],2),
        round(motor["pressure"],2),
        round(motor["vibration"],2),
        round(motor["voltage"],2),
        round(motor["current"],2),
        risk,
        motor["state"].upper()
    ]

    print("MOTOR:", row)

    with open(FILE_NAME, "a", newline="") as f:
        csv.writer(f).writerow(row)

    time.sleep(2)