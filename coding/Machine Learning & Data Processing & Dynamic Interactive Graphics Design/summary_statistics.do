*数据集导入与路径设置
cd "C:\Users\12539\Desktop\初稿RAtest\task3"
use "C:\Users\12539\Desktop\初稿RAtest\task3\task.dta"

*创建变量discount
gen discount = (initial_list_price - sales_price) / initial_list_price

*描述性统计
*数值型变量
estpost tabstat discount initial_list_price sales_price dom prop_age prop_type living_area_ft bedrooms baths stories,statistics(mean sd min p50 max) columns(statistics)
esttab using summary_stats_listing.csv, cells("mean sd min p50 max") label replace csv
*分类变量
estpost tabulate cooling
esttab using summary_cooling.csv, cells("b pct") replace csv
estpost tabulate fireplace
esttab using summary_fireplace.csv, cells("b pct") replace csv
estpost tabulate heating
esttab using summary_heating2.csv, cells("b pct") replace csv
estpost tabulate parking
esttab using summary_parking.csv, cells("b pct") replace csv
estpost tabulate pool
esttab using summary_pool.csv, cells("b pct") replace csv
estpost tabulate quality
esttab using summary_quality.csv, cells("b pct") replace csv
estpost tabulate condition
esttab using summary_condition.csv, cells("b pct") replace csv
estpost tabulate prop_type
esttab using summary_prop_type.csv, cells("b pct") replace csv
