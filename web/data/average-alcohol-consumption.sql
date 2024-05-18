select 
    ref_area_code, 
    avg(obs_value) 
from alcohol_consumption 
group by ref_area_code;
