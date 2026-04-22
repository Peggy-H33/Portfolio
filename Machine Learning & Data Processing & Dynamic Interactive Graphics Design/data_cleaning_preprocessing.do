*路径设置
cd "C:\Users\12539\Desktop\初稿RAtest\task2"

*转换文件格式
import delimited "C:\Users\12539\Desktop\初稿RAtest\task2\task.csv", clear
save "C:\Users\12539\Desktop\初稿RAtest\task2\task.dta", replace

*导入数据集
use "C:\Users\12539\Desktop\初稿RAtest\task2\task.dta", clear

*查看数据结构
describe
*查看缺失值
misstable summarize, all

*检查并删除dom与sales_price不一致的数据
list list_id status sales_price dom if !missing(sales_price) & missing(dom)
count if !missing(sales_price) & missing(dom)
drop if !missing(sales_price) & missing(dom)

*lot_size_acres的处理
tabulate prop_type if missing(lot_size_acres)
gen lot_missing = missing(lot_size_acres)
preserve
keep if !missing(lot_size_acres) & inlist(prop_type, 1, 2, 5)  
collapse (mean) mean_lot_size=lot_size_acres, by(prop_type)
save temp_means.dta, replace
restore
merge m:1 prop_type using temp_means.dta, keep(match master) nogenerate
*按prop_type分组均值填充缺失值
replace lot_size_acres = mean_lot_size if missing(lot_size_acres) & inlist(prop_type, 1, 2, 5)

*Bedrooms、baths、stories、living_area_ft和prop_age的处理
list list_id bedrooms if bedrooms < 0
list list_id baths if baths < 0
list list_id prop_age if prop_age < 0
list list_id stories if stories <= 0
list list_id living_area_ft if living_area_ft <= 0
drop if bedrooms < 0 | baths < 0 | prop_age < 0 | stories <= 0 | living_area_ft <= 0
gen miss_bedrooms = missing(bedrooms)
gen miss_baths = missing(baths)
gen miss_stories = missing(stories)
gen miss_living_area = missing(living_area_ft)
gen miss_prop_age = missing(prop_age)
*按prop_type分组中位数填补
egen med_bed = median(bedrooms), by(prop_type)
replace bedrooms = round(med_bed) if missing(bedrooms)
egen med_bath = median(baths), by(prop_type)
replace baths = med_bath if missing(baths)
egen med_stories = median(stories), by(prop_type)
replace stories = med_stories if missing(stories)
egen med_area = median(living_area_ft), by(prop_type)
replace living_area_ft = med_area if missing(living_area_ft)
egen med_age = median(prop_age), by(prop_type)
replace prop_age = round(med_age) if missing(prop_age)
replace bedrooms = round(bedrooms)
replace baths = round(baths)

*分类变量的处理
replace condition = "" if trim(condition) == ""
gen miss_condition = missing(condition)
replace condition = "Missing" if missing(condition)
replace quality = "" if trim(quality) == ""
gen miss_quality = missing(quality)
replace quality = "Missing" if missing(quality)
replace cooling = "" if trim(cooling) == ""
gen cooling = missing(cooling)
replace cooling = "Missing" if missing(cooling)
replace heating = "" if trim(heating) == ""
gen heating = missing(heating)
replace heating = "Missing" if missing(heating)
replace parking = "" if trim(parking) == ""
gen parking = missing(parking)
replace parking = "Missing" if missing(parking)
replace pool = "" if trim(pool) == ""
gen pool = missing(pool)
replace pool = "Missing" if missing(pool)
replace fireplace = "" if trim(fireplace) == ""
gen fireplace = missing(fireplace)
replace fireplace = "Missing" if missing(fireplace)
*赋值
gen condition_numeric = .
replace condition_numeric = 4  if condition == "AVE"
replace condition_numeric = 7  if condition == "EXC"
replace condition_numeric = 3  if condition == "FAI"
replace condition_numeric = 5  if condition == "GOO"
replace condition_numeric = 2  if condition == "POO"
replace condition_numeric = 1  if condition == "UCN"
replace condition_numeric = 6  if condition == "VGO"
replace condition_numeric = 0  if condition == "Missing"
gen quality_numeric = .
replace quality_numeric = 10 if quality == "QEX"
replace quality_numeric = 9  if quality == "QEC"
replace quality_numeric = 8  if quality == "QVV"
replace quality_numeric = 7  if quality == "QGO"
replace quality_numeric = 6  if quality == "QBA"
replace quality_numeric = 5  if quality == "QAV"
replace quality_numeric = 4  if quality == "QFA"
replace quality_numeric = 3  if quality == "QLO"
replace quality_numeric = 2  if quality == "QPO"
replace quality_numeric = 1  if quality == "QLU"
replace quality_numeric = 0  if quality == "Missing" 
gen cooling_numeric = .
replace cooling_numeric = 1  if cooling == "Y"
replace cooling_numeric = 0  if cooling == "N"
gen heating_numeric = .
replace heating_numeric = 1  if heating == "Y"
replace heating_numeric = 0  if heating == "N"
gen parking_numeric = .
replace parking_numeric = 1  if parking == "Y"
replace parking_numeric = 0  if parking == "N"
gen pool_numeric = .
replace pool_numeric = 1  if pool_numeric == "Y"
replace pool_numeric = 0  if pool_numeric == "N"
gen fireplace_numeric = .
replace fireplace_numeric = 1  if fireplace_numeric == "Y"
replace fireplace_numeric = 0  if fireplace_numeric == "N"

*时间变量的处理
describe initial_list_date
gen initial_list_date_numeric = date(initial_list_date, "DMY", 2050)
format initial_list_date_numeric %td

*文本信息的处理
replace publicremarks = lower(publicremarks)
replace publicremarks = ustrregexra(publicremarks, "[[:punct:]]", "")
