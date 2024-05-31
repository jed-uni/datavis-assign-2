select
    reference_area.code,
    reference_area.name,
    AVG(obs_value) as `obs_value`
FROM
    alcohol_consumption
INNER JOIN
    reference_area ON alcohol_consumption.ref_area_code = reference_area.code
GROUP BY
    reference_area.code