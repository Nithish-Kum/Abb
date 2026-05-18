import random, time, csv
from datetime import datetime

FILE_NAME = "motor_data.csv"

motor = {
    "temp": 70,
    "pressure": 80,
    "vibration": 1.5,
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
    if m["vibration"] > 1.2: risk += 25
    if m["pressure"] > 85: risk += 20
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

    # BEHAVIOR
    if motor["state"] == "normal":
        motor["temp"] += random.uniform(-1,1)
    elif motor["state"] == "warning":
        motor["temp"] += random.uniform(2,5)
    elif motor["state"] == "failure":
        motor["temp"] += random.uniform(10,15)
    elif motor["state"] == "recovery":
        motor["temp"] -= random.uniform(8,12)

    motor["temp"] = max(50,min(120,motor["temp"]))

    risk = risk_calc(motor)

    row = [
        now,
        round(motor["temp"],2),
        round(motor["pressure"],2),
        round(motor["vibration"],2),
        motor["voltage"],
        motor["current"],
        risk,
        motor["state"].upper()
    ]

    print("MOTOR:", row)

    with open(FILE_NAME, "a", newline="") as f:
        csv.writer(f).writerow(row)

    time.sleep(2)