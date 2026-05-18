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

# RESET FILE
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

    # STATE FLOW
    if pump["state_time"] <= 0:
        flow = ["normal","warning","failure","recovery"]
        pump["state"] = flow[(flow.index(pump["state"])+1)%4]
        pump["state_time"] = random.randint(3,5)

    pump["state_time"] -= 1

    # ---------------------------
    # 🔥 STATE-BASED BEHAVIOR
    # ---------------------------
    if pump["state"] == "normal":
        pump["flow_rate"] += (4.0 - pump["flow_rate"]) * 0.1 + random.uniform(-0.2,0.2)
        pump["pressure"] += (90 - pump["pressure"]) * 0.1 + random.uniform(-1,1)
        pump["efficiency"] += (85 - pump["efficiency"]) * 0.1 + random.uniform(-1,1)

    elif pump["state"] == "warning":
        pump["pressure"] += random.uniform(5,10)
        pump["flow_rate"] -= random.uniform(0.2,0.5)
        pump["efficiency"] -= random.uniform(2,4)

    elif pump["state"] == "failure":
        pump["flow_rate"] -= random.uniform(1,2)
        pump["pressure"] += random.uniform(10,20)
        pump["efficiency"] -= random.uniform(5,10)

    elif pump["state"] == "recovery":
        pump["flow_rate"] += random.uniform(1,2)
        pump["pressure"] -= random.uniform(8,15)
        pump["efficiency"] += random.uniform(3,6)

    # ---------------------------
    # 🧱 CLAMP VALUES
    # ---------------------------
    pump["flow_rate"] = max(2.0, min(6.0, pump["flow_rate"]))
    pump["pressure"] = max(60, min(140, pump["pressure"]))
    pump["efficiency"] = max(50, min(100, pump["efficiency"]))

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