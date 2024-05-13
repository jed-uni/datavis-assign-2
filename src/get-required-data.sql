select count(*)
from datavis.alcohol_consumption
where datavis.alcohol_consumption.ref_area_code in (select * from datavis.available_countries)
group by datavis.alcohol_consumption.ref_area_code;
