drop view if exists unemployed_avg_per_year;
create view unemployed_avg_per_year as
   select
    ref_area_code, year(unemployed.time_period) as 'time_period', avg(unemployed.obs_value) as 'obs_value'
from
    datavis.unemployed
inner join
    reference_area on unemployed.ref_area_code = reference_area.code
group by
    ref_area_code, year(time_period);

drop view if exists times;
create view times as
    select alcohol_consumption.time_period from alcohol_consumption
    union select cancer.time_period from cancer
    union select health_status.time_period from health_status
    union select life_expectency.time_period from life_expectency
    union select unemployed_avg_per_year.time_period from unemployed_avg_per_year;

select
    datavis.reference_area.code,
    datavis.reference_area.name,
    datavis.times.time_period,
    datavis.unemployed_avg_per_year.obs_value as 'Unemployment Rate',
    datavis.alcohol_consumption.obs_value as 'Alcohol Consumption',
    datavis.health_status.obs_value as 'Health Status',
    datavis.cancer.cases_per_100000_persons as 'Cancer cases per 100,000 persons',
drop view if exists unemployed_avg_per_year;
create view unemployed_avg_per_year as
   select
    ref_area_code, year(unemployed.time_period) as 'time_period', avg(unemployed.obs_value) as 'obs_value'
from
    datavis.unemployed
inner join
    reference_area on unemployed.ref_area_code = reference_area.code
group by
    ref_area_code, year(time_period);

drop view if exists times;
create view times as
    select alcohol_consumption.time_period from alcohol_consumption
    union select cancer.time_period from cancer
    union select health_status.time_period from health_status
    union select life_expectency.time_period from life_expectency
    union select unemployed_avg_per_year.time_period from unemployed_avg_per_year;

drop view if exists cancer_only_malignant_neoplasms;
create view cancer_only_malignant_neoplasms as
    select * from cancer where cancer.cancer_site_code = 'CICDTUME';

select
    datavis.reference_area.code,
    datavis.reference_area.name,
    datavis.times.time_period,
    datavis.unemployed_avg_per_year.obs_value as 'Unemployment Rate',
    datavis.alcohol_consumption.obs_value as 'Alcohol Consumption',
    datavis.health_status.obs_value as 'Health Status',
    datavis.cancer_only_malignant_neoplasms.cases_per_100000_persons as 'Cancer cases per 100,000 persons',
    datavis.life_expectency.obs_value as 'Life Expectancy'
from datavis.reference_area
cross join datavis.times
left join datavis.health_status on reference_area.code = health_status.ref_area_code and datavis.health_status.time_period = datavis.times.time_period
left join datavis.life_expectency on reference_area.code = life_expectency.ref_area_code and datavis.life_expectency.time_period = datavis.times.time_period
left join datavis.cancer_only_malignant_neoplasms on reference_area.code = cancer_only_malignant_neoplasms.ref_area_code and datavis.cancer_only_malignant_neoplasms.time_period = datavis.times.time_period
left join datavis.alcohol_consumption on reference_area.code = alcohol_consumption.ref_area_code and datavis.alcohol_consumption.time_period = datavis.times.time_period
left join datavis.unemployed_avg_per_year on reference_area.code = datavis.unemployed_avg_per_year.time_period = datavis.times.time_period
