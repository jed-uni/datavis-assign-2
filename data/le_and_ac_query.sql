SELECT
    reference_area.name,
    times.time_period,
    life_expectency.obs_value as life_expectency
FROM
    reference_area
        CROSS JOIN
    times
        LEFT JOIN
    alcohol_consumption ON reference_area.code = alcohol_consumption.ref_area_code AND times.time_period = alcohol_consumption.time_period
        LEFT JOIN
    life_expectency ON reference_area.code = life_expectency.ref_area_code AND times.time_period = life_expectency.time_period
WHERE
    reference_area.code = 'RUS'
ORDER BY
    reference_area.code, times.time_period;
