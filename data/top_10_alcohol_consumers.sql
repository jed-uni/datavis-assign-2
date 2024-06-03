SELECT
    reference_area.name,
    AVG(alcohol_consumption.obs_value) AS 'average_alcohol_consumption',
    AVG(life_expectency.obs_value) AS 'average_life_expectancy'
FROM
    reference_area
CROSS JOIN
    times
LEFT JOIN
    alcohol_consumption ON reference_area.code = alcohol_consumption.ref_area_code AND times.time_period = alcohol_consumption.time_period
LEFT JOIN
    life_expectency ON reference_area.code = life_expectency.ref_area_code AND times.time_period = life_expectency.time_period
GROUP BY
    reference_area.code
HAVING
    average_alcohol_consumption IS NOT NULL
   AND average_life_expectancy IS NOT NULL
ORDER BY
    average_alcohol_consumption DESC
LIMIT 10