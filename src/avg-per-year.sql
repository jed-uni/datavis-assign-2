select
    main.ref_area_code as 'Country Code', reference_area.name as 'Country Name', year(main.time_period) as 'Year', avg(main.obs_value) as 'Average Unemployment Rate'
from
    main
inner join
    reference_area on main.ref_area_code = reference_area.code
group by
    ref_area_code, year(time_period)
