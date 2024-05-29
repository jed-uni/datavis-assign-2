SELECT ac.time_period, reference_area.name, ac.ref_area_code, ac.obs_value as 'Alcohol Consumption', le.obs_value as `Life Expectency`
FROM alcohol_consumption ac
         JOIN life_expectency le ON ac.ref_area_code = le.ref_area_code AND ac.time_period = le.time_period
         JOIN reference_area ON ac.ref_area_code = reference_area.code

