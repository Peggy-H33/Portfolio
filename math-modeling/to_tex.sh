#!/bin/bash

# 检查是否提供了输入文件名
if [ $# -eq 0 ]; then
    echo "请提供输入文件名。"
    exit 1
fi

# 输入文件
input_file="$1"

# 获取列数 (假设第一行是完整的列数据)
header_line=$(head -n 1 "$input_file")
column_count=$(echo "$header_line" | awk '{print NF}')  # 获取列的数量

# 动态生成 \tabular{} 中的 'c'，表示每列居中对齐
columns=$(printf "c%.0s" $(seq 1 $column_count))
columns="${columns}"

# 输出 LaTeX 表格头部
cat <<EOT
\\begin{table}[H]
    \\setlength\\extrarowheight{-3pt}
    \\centering
    \\begin{tabular}{$columns}
        \\toprule
EOT

# 处理表头（第一行）
header_row=$(echo "$header_line" | sed 's/ \{1,\}/ \& /g')
echo "        $header_row \\\\"
echo "        \\midrule"

# 处理表格的内容（除了第一行）
tail -n +2 "$input_file" | while read -r line; do
    row=$(echo "$line" | sed 's/ \{1,\}/ \& /g')
    echo "        $row \\\\"
done

# 输出 LaTeX 表格尾部
cat <<EOT
        \\bottomrule
    \\end{tabular}
\\end{table}
EOT

