drop view if exists times;
create view times as
select alcohol_consumption.time_period from alcohol_consumption
union select life_expectency.time_period from life_expectency

