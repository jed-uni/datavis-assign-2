SELECT
    reference_area.name AS 'ref_area_name',
    reference_area.code AS 'ref_area_code',
    alcohol_consumption.obs_value AS 'average_alcohol_consumption',
    life_expectency.obs_value AS 'average_life_expectancy'
FROM
    reference_area
CROSS JOIN
    times
LEFT JOIN
    alcohol_consumption ON reference_area.code = alcohol_consumption.ref_area_code AND times.time_period = alcohol_consumption.time_period
LEFT JOIN
    life_expectency ON reference_area.code = life_expectency.ref_area_code AND times.time_period = life_expectency.time_period
WHERE
    times.time_period = 2019
ORDER BY
    alcohol_consumption.obs_value DESC
LIMIT 10