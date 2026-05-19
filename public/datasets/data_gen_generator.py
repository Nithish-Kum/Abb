import random, time, csv, os
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE_NAME = os.path.join(SCRIPT_DIR, "generator_data.csv")

gen = {
    "power": 220,
    "load": 60,
    "frequency": 50,
    "state": "normal",
    "state_time": 3
}

with open(FILE_NAME, "w", newline="") as f:
    csv.writer(f).writerow([
        "timestamp","power","load","frequency","risk","status"
    ])

def risk_calc(g):
    risk = 0
    if g["power"] > 250: risk += 30
    if g["load"] > 80: risk += 40
    if g["frequency"] < 48: risk += 30
    return min(risk,100)

while True:
    now = datetime.now().strftime("%H:%M:%S")

    if gen["state_time"] <= 0:
        flow = ["normal","warning","failure","recovery"]
        gen["state"] = flow[(flow.index(gen["state"])+1)%4]
        gen["state_time"] = random.randint(3,5)

    gen["state_time"] -= 1

    if gen["state"] == "warning":
        gen["load"] += random.uniform(5,10)
    elif gen["state"] == "failure":
        gen["power"] += random.uniform(20,40)
    elif gen["state"] == "recovery":
        gen["power"] -= random.uniform(10,20)

    risk = risk_calc(gen)

    # Align status string directly with calculated risk limits (40% warning, 70% critical)
    if risk >= 70:
        status_str = "FAILURE"
    elif risk >= 40:
        status_str = "WARNING"
    elif gen["state"] == "recovery":
        status_str = "RECOVERY"
    else:
        status_str = "NORMAL"

    row = [
        now,
        round(gen["power"],2),
        round(gen["load"],2),
        round(gen["frequency"],2),
        risk,
        status_str
    ]

    print("GENERATOR:", row)

    with open(FILE_NAME, "a", newline="") as f:
        csv.writer(f).writerow(row)

    time.sleep(2)