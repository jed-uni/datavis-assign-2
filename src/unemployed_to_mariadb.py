import mariadb
from os.path import join as path_join 
from math import floor
import sys
import datetime
from decimal import Decimal

ref_area_codes = {}
obs_status_codes = {}
cancer_site_codes = {}

def time_preiod_mariadb_format(time) -> datetime.datetime:
    split = time.split('-')
    return datetime.datetime(int(split[0]), int(split[1]), 1)

def insert_ref_area_if_not_exists(db_cursor: mariadb.Cursor, ref_area_code, ref_area_name):
    if ref_area_code not in ref_area_codes:
        db_cursor.execute("insert into reference_area(code, name) values(?, ?)", (ref_area_code, ref_area_name))
        ref_area_codes[ref_area_code] = ref_area_name

def insert_obs_status_code(db_cursor: mariadb.Cursor, obs_status_id, obs_status):
    if obs_status_id not in obs_status_codes:
        db_cursor.execute("insert into obs_status(id, name) values(?, ?)", (obs_status_id, obs_status))
        obs_status_codes[obs_status_id] = obs_status

def insert_cancer_site_code(db_cursor: mariadb.Cursor, cancer_site_code, cancer_site_name):
    if cancer_site_code not in cancer_site_codes:
        db_cursor.execute("insert into cancer_site(code, full_name) values(?, ?)", (cancer_site_code, cancer_site_name))
        cancer_site_codes[cancer_site_code] = cancer_site_name

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
dataset_alcohol_consumption = path_join(dataset_dir, "alcohol_consumption.csv")
dataset_cancer = path_join(dataset_dir, "cancer.csv")
dataset_health_status = path_join(dataset_dir, "health_status.csv")
dataset_life_expectency = path_join(dataset_dir, "life_expectency.csv")

connection.autocommit = False
cur.execute("drop database if exists datavis")
cur.execute("create database datavis");
cur.execute("use datavis");

cur.execute("create table cancer_site(code char(8) primary key, full_name varchar(100))")
cur.execute("create table reference_area(code varchar(12) primary key, name varchar(100) not null)")
cur.execute("create table obs_status(id char(1) primary key, name varchar(100) not null)")
cur.execute("create table unemployed(id int primary key auto_increment, ref_area_code varchar(12) not null, obs_status_id char(1) not null, time_period date not null, obs_value decimal(16, 8), foreign key(ref_area_code) references reference_area(code), foreign key(obs_status_id) references obs_status(id))");
cur.execute("create table alcohol_consumption(id int primary key auto_increment, ref_area_code varchar(12) not null, obs_status_id char(1) not null, time_period year not null, obs_value decimal(16, 8), foreign key(ref_area_code) references reference_area(code), foreign key(obs_status_id) references obs_status(id))");
cur.execute("create table cancer(id int primary key auto_increment, ref_area_code varchar(12) not null, cancer_site_code char(8) not null, time_period year not null, cases_per_100000_persons decimal(16, 8) not null, foreign key(ref_area_code) references reference_area(code), foreign key(cancer_site_code) references cancer_site(code))")
cur.execute("create table health_status(id int primary key auto_increment, ref_area_code varchar(12) not null, obs_status_id char(1), time_period year not null, obs_value decimal(16, 8) not null, foreign key(ref_area_code) references reference_area(code), foreign key(obs_status_id) references obs_status(id))");
connection.commit()


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

        # Disculde empty rows
        if row.strip() == '':
            continue

        records = row.split(',')
        ref_area_code = records[0]
        ref_area_name = records[1]
        try:
            time_period = time_preiod_mariadb_format(records[2])
        except ValueError as e:
            print(" - WARNING - Could not convert date "+records[2]+" into yyyy-mm-dd for record "+str(index)+"/"+str(line_c))
            continue
        obs_value = Decimal(records[3])
        obs_status_id = records[4]
        obs_status_code = records[5]

        insert_ref_area_if_not_exists(cur, ref_area_code, ref_area_name)
        insert_obs_status_code(cur, obs_status_id, obs_status_code)

        if floor(index % (line_c / 10)) == 0: 
            percentage = index / line_c;
            print(" - "+str(floor(percentage * 100))+"%")
        index+=1;
    print(" - 100%")

# --- ALCOHOL CONSUMPTION DATASET ---
with open(dataset_alcohol_consumption, "r") as f:
    lines = f.readlines()
    line_c = len(lines)
    index = 0

    print("\nParsing "+str(line_c)+" records in ALCOHOL CONSUMPTION dataset")
    for row in lines:
        if index == 0:
            index += 1
            continue

        if row.strip() == '':
            continue

        records = row.split(',')
        ref_area_code = records[0]
        ref_area_name = records[1]
        time_period = records[2]
        obs_value = records[3]
        obs_status_id = records[4]
        obs_status_name = records[5] 

        insert_ref_area_if_not_exists(cur, ref_area_code, ref_area_name)
        insert_obs_status_code(cur, obs_status_id, obs_status_name)
        cur.execute("insert into alcohol_consumption(ref_area_code, obs_status_id, time_period, obs_value) values(?, ?, ?, ?)", (ref_area_code, obs_status_id, time_period, str(obs_value)))

        if floor(index % (line_c / 10)) == 0: 
            percentage = index / line_c;
            print(" - "+str(floor(percentage * 100))+"%")
        index+=1;

# --- CANCER DATASET ---
with open(dataset_cancer, "r") as f:
    lines = f.readlines()
    line_c = len(lines)
    index = 0

    print("\nParsing "+str(line_c)+" records in CANCER dataset")
    for row in lines:
        if index == 0:
            index += 1
            continue

        records = row.split(',')
        ref_area_code = records[0]
        ref_area_name = records[1]
        cancer_site_code = records[2]
        cancer_site_name = records[3]
        time_period = records[4]
        cases = records[5]

        if ref_area_code.strip() == '' or ref_area_name.strip() == '' or cancer_site_code.strip() == '' or cancer_site_name.strip() == '' or time_period.strip() == '' or  cases.strip() == '':
            continue

        insert_ref_area_if_not_exists(cur, ref_area_code, ref_area_name)
        insert_cancer_site_code(cur, cancer_site_code, cancer_site_name)
        cur.execute("insert into cancer(ref_area_code, cancer_site_code, time_period, cases_per_100000_persons) values(?, ?, ?, ?)", (ref_area_code, cancer_site_code, int(time_period), cases));

        if floor(index % (line_c / 10)) == 0: 
            percentage = index / line_c;
            print(" - "+str(floor(percentage * 100))+"%")
        index+=1;

# --- HEALTH STATUS ---

with open(dataset_health_status, "r") as f:
    lines = f.readlines()
    line_c = len(lines)
    index = 0

    print("\nParsing "+str(line_c)+" records in HEALTH STATUS dataset")
    for row in lines:
        if index == 0:
            index += 1
            continue

        records = row.split(',')
        ref_area_code = records[0]
        ref_area_name = records[1]
        time_period = records[2]
        obs_value = records[3]
        obs_status_id = records[4]
        obs_status_name = records[5]

        insert_ref_area_if_not_exists(cur, ref_area_code, ref_area_name)
        if obs_status_id == "":
            insert_obs_status_code(cur, obs_status_id, obs_status_name)
            cur.execute("insert into health_status(ref_area_code, obs_status_id, time_period, obs_value) values(?, ?, ?, ?)", (ref_area_code, None, time_period, obs_value))
        else:
            cur.execute("insert into health_status(ref_area_code, obs_status_id, time_period, obs_value) values(?, ?, ?, ?)", (ref_area_code, obs_status_id, time_period, obs_value))

        if floor(index % (line_c / 10)) == 0: 
            percentage = index / line_c;
            print(" - "+str(floor(percentage * 100))+"%")
        index+=1;

connection.commit()

