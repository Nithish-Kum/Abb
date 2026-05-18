import random, time, csv
from datetime import datetime

FILE_NAME = "pump_data.csv"

pump = {
    "flow_rate": 4.0,
    "pressure": 90,
    "efficiency": 85,
    "state": "normal",
    "state_time": 3
}

with open(FILE_NAME, "w", newline="") as f:
    csv.writer(f).writerow([
        "timestamp","flow_rate","pressure","efficiency","risk","status"
    ])

def risk_calc(p):
    risk = 0
    if p["flow_rate"] < 3.5: risk += 30
    if p["pressure"] > 100: risk += 30
    if p["efficiency"] < 70: risk += 40
    return min(risk,100)

while True:
    now = datetime.now().strftime("%H:%M:%S")

    if pump["state_time"] <= 0:
        flow = ["normal","warning","failure","recovery"]
        pump["state"] = flow[(flow.index(pump["state"])+1)%4]
        pump["state_time"] = random.randint(3,5)

    pump["state_time"] -= 1

    if pump["state"] == "normal":
        pump["flow_rate"] += random.uniform(-0.2,0.2)
    elif pump["state"] == "warning":
        pump["pressure"] += random.uniform(5,10)
    elif pump["state"] == "failure":
        pump["flow_rate"] -= random.uniform(1,2)
    elif pump["state"] == "recovery":
        pump["flow_rate"] += random.uniform(1,2)

    risk = risk_calc(pump)

    row = [
        now,
        round(pump["flow_rate"],2),
        round(pump["pressure"],2),
        round(pump["efficiency"],2),
        risk,
        pump["state"].upper()
    ]

    print("PUMP:", row)

    with open(FILE_NAME, "a", newline="") as f:
        csv.writer(f).writerow(row)

    time.sleep(2)