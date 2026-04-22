#!/usr/bin/env python
# coding: utf-8

# In[ ]:


# 导入所需库
import pandas as pd
import numpy as np
import re
import string
import nltk
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords as nltk_stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
import matplotlib.pyplot as plt
import seaborn as sns

# 1. 数据加载与预处理
print("正在加载数据集...")
try:
    # 尝试读取数据集
    df = pd.read_csv('task_train.csv')
    
    # 检查必要的列是否存在
    required_columns = ['list_id', 'clip', 'publicremarks', 'anxiety']
    if not all(col in df.columns for col in required_columns):
        missing_cols = [col for col in required_columns if col not in df.columns]
        raise ValueError(f"数据集中缺少必要的列: {missing_cols}")
    
    print("数据集加载成功!")
    print(f"数据集形状: {df.shape}")
    print("\n前5行数据:")
    print(df.head())
    
    # 检查类别分布
    print("\n焦虑标签分布:")
    print(df['anxiety'].value_counts(normalize=True))
    
    # 检查缺失值
    print("\n缺失值统计:")
    print(df.isnull().sum())
    
    # 处理缺失值 - 删除publicremarks为空的记录
    df = df.dropna(subset=['publicremarks'])
    print(f"\n删除缺失值后数据集形状: {df.shape}")
    
except Exception as e:
    print(f"加载数据集时出错: {e}")
    exit()
    
    
    
# 2. 文本预处理
class TextPreprocessor:
    def __init__(self, stopwords_file):
        try:
            # 加载自定义停用词表
            with open(stopwords_file, 'r', encoding='utf-8') as f:
                self.custom_stopwords = set([line.strip() for line in f])
            
            # 合并NLTK英文停用词
            self.stopwords = self.custom_stopwords.union(set(nltk_stopwords.words('english')))
            
            # 初始化词干化和词形还原器
            self.stemmer = PorterStemmer()
            self.lemmatizer = WordNetLemmatizer()
            
            print("停用词表加载成功!")
            print(f"总停用词数量: {len(self.stopwords)}")
            
        except Exception as e:
            print(f"加载停用词表时出错: {e}")
            exit()
    
    def clean_text(self, text):
        # 转换为小写
        text = text.lower()
        
        # 移除URL
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # 移除HTML标签
        text = re.sub(r'<.*?>', '', text)
        
        # 移除标点符号
        text = text.translate(str.maketrans('', '', string.punctuation))
        
        # 移除数字
        text = re.sub(r'\d+', '', text)
        
        # 移除多余空格
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize_and_remove_stopwords(self, text):
        tokens = word_tokenize(text)
        filtered_tokens = [word for word in tokens if word not in self.stopwords and len(word) > 2]
        return filtered_tokens
    
    def stem_tokens(self, tokens):
        return [self.stemmer.stem(token) for token in tokens]
    
    def lemmatize_tokens(self, tokens):
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def preprocess(self, text, use_stemming=False, use_lemmatization=True):
        cleaned_text = self.clean_text(text)
        tokens = self.tokenize_and_remove_stopwords(cleaned_text)
        
        if use_stemming:
            tokens = self.stem_tokens(tokens)
        elif use_lemmatization:
            tokens = self.lemmatize_tokens(tokens)
        
        return ' '.join(tokens)

# 初始化文本预处理器
print("\n初始化文本预处理器...")
try:
    preprocessor = TextPreprocessor('stopwords.txt')
except Exception as e:
    print(f"初始化预处理器失败: {e}")
    exit()
    
    
    
# 3. 数据准备与划分
print("\n预处理文本数据...")
df['processed_text'] = df['publicremarks'].apply(
    lambda x: preprocessor.preprocess(x, use_lemmatization=True))

# 划分训练集和测试集 (8:2)
print("\n划分训练集和测试集...")
train_df, val_df = train_test_split(
    df, 
    test_size=0.2, 
    random_state=42, 
    stratify=df['anxiety']
)

print(f"训练集大小: {len(train_df)}")
print(f"测试集大小: {len(val_df)}")



# 4. 特征工程 - TF-IDF向量化
print("\n进行TF-IDF向量化...")
tfidf = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    min_df=5,
    max_df=0.7
)

X_train = tfidf.fit_transform(train_df['processed_text'])
X_val = tfidf.transform(val_df['processed_text'])

y_train = train_df['anxiety']
y_val = val_df['anxiety']

print(f"TF-IDF特征维度: {X_train.shape[1]}")



# 5. 模型训练与评估
def train_and_evaluate(models, X_train, X_val, y_train, y_val):
    results = {}
    for name, model in models.items():
        print(f"\n=== 训练模型: {name} ===")
        try:
            model.fit(X_train, y_train)
            
            # 在验证集上预测
            y_pred = model.predict(X_val)
            
            # 计算评估指标
            accuracy = accuracy_score(y_val, y_pred)
            report = classification_report(y_val, y_pred)
            cm = confusion_matrix(y_val, y_pred)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'report': report,
                'confusion_matrix': cm
            }
            
            print(f"{name} 准确率: {accuracy:.4f}")
            print("分类报告:")
            print(report)
            
            # 绘制混淆矩阵
            plt.figure(figsize=(6, 5))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                        xticklabels=['Not Anxious (0)', 'Anxious (1)'],
                        yticklabels=['Not Anxious (0)', 'Anxious (1)'])
            plt.title(f'{name} 混淆矩阵')
            plt.ylabel('真实标签')
            plt.xlabel('预测标签')
            plt.show()
            
        except Exception as e:
            print(f"训练模型 {name} 时出错: {e}")
    
    return results

# 定义要尝试的模型
models = {
    'Logistic Regression': LogisticRegression(
        max_iter=1000, 
        random_state=42,
        class_weight='balanced'  # 处理类别不平衡
    ),
    'Random Forest': RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    ),
     'KNN': KNeighborsClassifier(
        n_neighbors=10,  # 可以调整K值
        weights='uniform',  # 考虑距离权重
        metric='cosine'  # 对文本数据使用余弦相似度
    ),
    'Naive Bayes': MultinomialNB(
        alpha=2.0,  # 平滑参数
        fit_prior=True,  # 学习类别先验概率
        class_prior=None
    )
}

# 训练和评估模型
print("\n开始模型训练与评估...")
results = train_and_evaluate(models, X_train, X_val, y_train, y_val)



# 6. 结果分析与模型选择
print("\n=== 模型性能总结 ===")
for name, result in results.items():
    print(f"{name}: 准确率 = {result['accuracy']:.4f}")

# 选择最佳模型
best_model_name = max(results, key=lambda x: results[x]['accuracy'])
best_model = results[best_model_name]['model']
print(f"\n最佳模型: {best_model_name} (准确率: {results[best_model_name]['accuracy']:.4f})")



# 7. 保存模型和向量化器
import joblib
joblib.dump(best_model, 'best_anxiety_model.pkl')
joblib.dump(tfidf, 'tfidf_vectorizer.pkl')
print("\n模型和向量化器已保存!")

