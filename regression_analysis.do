*数据集导入与路径设置
cd "C:\Users\12539\Desktop\初稿RAtest\task5-6"
use "C:\Users\12539\Desktop\初稿RAtest\task5-6\task.dta"

*创建新变量并赋值
gen discount_num = .
replace discount_num = 1 if discount > 0 & !missing(discount) 
replace discount_num = 0 if discount < 0 & !missing(discount) 

*合并变量state与urgent
merge 1:1 clip using task1.dta, keepusing(state)
merge 1:1 clip using task4.dta, keepusing(urgent)

*皮尔逊相关系数分析
matrix list_vars = (discount, dom, urgent, condition_numeric, quality_numeric, cooling_numeric, heating_numeric, parking_numeric, bedrooms, baths, prop_age, stories, living_area_ft, lot_size_acres)
pwcorr discount dom urgent condition_numeric quality_numeric cooling_numeric heating_numeric parking_numeric bedrooms baths prop_age stories living_area_ft lot_size_acres, sig
matrix R = r(C)
local varnames discount dom urgent condition_numeric quality_numeric cooling_numeric heating_numeric parking_numeric bedrooms baths prop_age stories living_area_ft lot_size_acres
clear
svmat R, names(col)
gen varname = ""
local i = 1
foreach v of local varnames {
    replace varname = "`v'" in `i'
    local ++i
}
order varname
export delimited using "correlation_matrix.csv", replace

*基准回归
reg discount dom urgent condition_numeric quality_numeric cooling_numeric heating_numeric parking_numeric bedrooms prop_age stories lot_size_acres
estat vif


