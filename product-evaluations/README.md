# 产品评测 | Product Evaluations

[English Version](#english-version)

本目录收录我在 AI 产品工作中整理的产品评测标准，重点关注生成结果是否符合提示词、设计规范、交互要求与基础质量门槛。

## 当前内容

| 文档 | 评测对象 | 主要方法 |
| --- | --- | --- |
| [design-product-evaluation-rubric.md](./design-product-evaluation-rubric.md) | 可生成网页、PPT、原型和图片的设计类产品 | 将 P0 一票否决项、量化评分项、QA 核对动作、验收标准和扣分规则组合成可执行的评测框架 |

## 评分体系

| 评测体系 | 重点维度 |
| --- | --- |
| HTML / PPT / 原型 | 色彩规范、文字对比度、字体与字号、形状与栅格、留白、交互状态、信息架构、视觉焦点、跨页一致性、提示词吻合度 |
| 图片生成 | 主体与场景准确性、动作关系、风格、构图与光影、色彩、物理与解剖结构、AI 伪影、文字渲染、分辨率与清晰度 |

## 评测流程

```text
提示词 / 设计规范
        ↓
生成结果采样
        ↓
P0 质量门槛检查
        ↓
分维度评分与扣分
        ↓
问题记录、对比与改进建议
```

该评分规则的目标是把“页面好不好看”或“图片质量高不高”转化为更明确、可复核的判断依据，也便于不同评测人员对齐尺度并进行版本间比较。

[返回作品集首页](../README.md)

---

## English Version

This directory contains product-evaluation criteria developed for AI product work. The current framework focuses on whether generated outputs satisfy the prompt, design system, interaction requirements, and baseline quality gates.

### Current Artifact

| Document | Evaluation target | Method |
| --- | --- | --- |
| [design-product-evaluation-rubric.md](./design-product-evaluation-rubric.md) | Design products that generate web pages, PPTs, prototypes, and images | Combines P0 rejection gates, scored dimensions, QA actions, acceptance criteria, and explicit deduction rules into an executable review framework |

### Rubric Coverage

| Rubric | Key dimensions |
| --- | --- |
| HTML / PPT / prototype | Color compliance, text contrast, typography, shape and grid consistency, whitespace, interaction states, information architecture, visual hierarchy, cross-page consistency, and prompt fidelity |
| Image generation | Subject and scene accuracy, actions and relationships, style, composition and lighting, color, physical and anatomical integrity, AI artifacts, text rendering, resolution, and clarity |

### Evaluation Flow

```text
Prompt / design specification
        ↓
Generated-output sampling
        ↓
P0 quality-gate review
        ↓
Dimension-level scoring and deductions
        ↓
Issue log, comparison, and improvement recommendations
```

The rubric turns broad judgments such as “Does this page look good?” or “Is this image high quality?” into criteria that can be checked and reproduced. It also helps reviewers align standards and compare output quality across versions.

[Back to portfolio home](../README.md)
