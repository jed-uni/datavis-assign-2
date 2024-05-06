import mariadb
from os.path import join as path_join 
from math import floor
import sys
import datetime
from decimal import Decimal

def time_preiod_mariadb_format(time) -> datetime.datetime:
    split = time.split('-')
    return datetime.datetime(int(split[0]), int(split[1]), 1)

try:
    connection = mariadb.connect(
            user="user",
            password="password",
            host="localhost",
            port=3306,
            )
except mariadb.Error as e:
    print("Mariadb error: " + e)
    sys.exit()

cur = connection.cursor()

dataset_dir = input("Enter dataset location: ") 
dataset_unemployed = path_join(dataset_dir, "unemployed.csv")

connection.autocommit = False
cur.execute("drop database if exists datavis")
cur.execute("create database datavis");
cur.execute("use datavis");
cur.execute("drop table if exists main")
cur.execute("drop table if exists reference_area")
cur.execute("drop table if exists obs_status")

cur.execute("create table reference_area(code varchar(12) primary key, name varchar(100) not null)")
cur.execute("create table obs_status(id char(1) primary key, name varchar(100) not null)")
cur.execute("create table main(id int primary key auto_increment, ref_area_code varchar(12) not null, obs_status_id char(1) not null, time_period date not null, obs_value decimal(16, 8), foreign key(ref_area_code) references reference_area(code), foreign key(obs_status_id) references obs_status(id))");
connection.commit()

ref_area_codes = {}
obs_status_codes = {}

# --- UNEMPLOYED DATASET ---
with open(dataset_unemployed, "r") as f:
    lines = f.readlines()
    line_c = len(lines)
    index = 0;

    print("Parsing "+str(line_c)+" records in unemployed dataset")
    for row in lines:
        if index == 0:
            index += 1
            continue;

        records = row.split(',')
        ref_area_code = records[0]
        ref_area = records[1]
        try:
            time_period = time_preiod_mariadb_format(records[2])
        except ValueError as e:
            print("Could not convert date "+records[2]+" into yyyy-mm-dd for record "+str(index)+"/"+str(line_c))
            continue
        obs_value = Decimal(records[3])
        obs_status_id = records[4]
        obs_status = records[5]

        if ref_area_code not in ref_area_codes:
            cur.execute("insert into reference_area(code, name) values(?, ?)", (ref_area_code, ref_area))
            ref_area_codes[ref_area_code] = ref_area

        if obs_status_id not in obs_status_codes:
            cur.execute("insert into obs_status(id, name) values(?, ?)", (obs_status_id, obs_status))
            obs_status_codes[obs_status_id] = obs_status

        cur.execute("insert into main(ref_area_code, obs_status_id, time_period, obs_value) values(?, ?, ?, ?)", (ref_area_code, obs_status_id, (time_period.strftime("%Y-%m-%d")), str(obs_value)))
        # print("Inserted record" + str(index) + "/" + str(line_c))
        
        if floor(index % (line_c / 10)) == 0: 
            percentage = index / line_c;
            print(" - "+str(floor(percentage * 100))+"%")
        index+=1;
    print(" - 100%")

connection.commit()

