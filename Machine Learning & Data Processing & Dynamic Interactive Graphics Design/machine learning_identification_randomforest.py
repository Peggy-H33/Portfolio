#!/usr/bin/env python
# coding: utf-8

# In[3]:


import pandas as pd
import joblib
import os

#加载模型和向量化器 
model = joblib.load('best_anxiety_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')

#读取数据
df = pd.read_csv('task.csv')

#确保publicremarks列存在
if 'publicremarks' not in df.columns:
    raise ValueError("task.csv中没有名为publicremarks的列")

#对文本进行向量化 
X = vectorizer.transform(df['publicremarks'].fillna(''))

# 进行识别
df['urgent'] = model.predict(X)

#输出结果到指定路径
output_path = r'C:\Users\12539\Desktop\初稿RAtest\task4\task_new.csv'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
df.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f'预测完成，结果已保存到 {output_path}')


# In[2]:





# In[ ]:




