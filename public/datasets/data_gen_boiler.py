import random,time,csv
from datetime import datetime

FILE_NAME="public/datasets/boiler_data.csv"

with open(FILE_NAME,"w",newline="") as f:
    csv.writer(f).writerow([
        "timestamp",
        "temperature",
        "steam_pressure",
        "water_level",
        "risk",
        "status"
    ])

temp=85
pressure=100
water=80

while True:

    temp+=random.uniform(-2,5)
    pressure+=random.uniform(-3,6)
    water+=random.uniform(-2,2)

    risk=random.randint(5,90)

    status="NORMAL"

    if risk>40:
        status="WARNING"

    if risk>70:
        status="FAILURE"

    row=[
        datetime.now().strftime("%H:%M:%S"),
        round(temp,2),
        round(pressure,2),
        round(water,2),
        risk,
        status
    ]

    with open(FILE_NAME,"a",newline="") as f:
        csv.writer(f).writerow(row)

    print(row)

    time.sleep(2)