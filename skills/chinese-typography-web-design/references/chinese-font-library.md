# 中文网页字体逐项档案

本文件把 74 款字体作为独立设计材料描述，不给出首选、次选或正文配方，也不预设字体组合。先确定一个页面模块的任务与视觉环境，再从对应条目中挑选真实候选。机器可读的名称、区域、许可证、来源和风险以 `font-catalog.yaml` 为准。

## 目录

- [使用方法](#使用方法)
- [中性黑体、界面与跨设备](#中性黑体界面与跨设备)
- [宋体、仿宋与编辑阅读](#宋体仿宋与编辑阅读)
- [楷体、手写与书法](#楷体手写与书法)
- [圆体、趣味与活动展示](#圆体趣味与活动展示)
- [科技、开发者、数据与像素](#科技开发者数据与像素)
- [商业品牌、消费电子与传播](#商业品牌消费电子与传播)
- [区域字体](#区域字体)
- [授权边界](#授权边界)

## 使用方法

1. 先写模块 ID、真实文字、背景、长度、对齐、断点和视觉任务。
2. 用“风格主题”筛选气质，用“适用模块”筛选功能；两项都成立才进入候选。
3. “模块行为”说明它进入网页后应如何出现，不代表全站都应使用。
4. “避免”是模块级边界，不是对字体好坏的判断。
5. 同一字体可被多个模块独立选中；不同字体出现在同一页面也不表示它们被绑定。
6. 最终决定前真实加载字体，以同样的内容和背景做 A/B/C 截图。

模块词：`brand_mark` 品牌短字；`hero_display` 首屏主标题；`section_heading` 章节标题；`editorial_quote` 引语题词；`body_longform` 正文；`nav_ui` 导航与 UI；`cta` 行动按钮；`data_price` 数据与价格；`code_terminal` 代码终端；`caption_metadata` 图注元数据；`form_control` 表单；`poster_badge` 海报标签。

## 中性黑体、界面与跨设备

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 思源黑体 | Swiss grid、企业产品、无障碍公共服务、信息密集 SaaS、克制科技 | `body_longform` `nav_ui` `cta` `form_control` `caption_metadata`；也可作理性 `section_heading` | 用字重、字号和空间建立层级；适合复杂网格和多语言界面 | 不要仅靠它的默认 400 字重完成所有大标题，容易成为通用模板 |
| Noto Sans CJK SC | 国际化产品、跨平台工具、多语言门户、稳定功能界面 | `body_longform` `nav_ui` `form_control` `caption_metadata` | 作为覆盖可靠的阅读与 fallback 层；适合小字号和跨系统一致性 | 不把 JP/TC/HK 变体当 SC；不要把“稳定”误当品牌性 |
| 霞鹜新晰黑 | 人文主义无衬线、独立出版 UI、温和 SaaS、文化机构数字化 | `body_longform` `nav_ui` `section_heading` `caption_metadata` | 中宫与笔形比几何黑体松弛，可让正文和编辑界面减少企业感 | 不用于需要强烈海报轮廓的超短 Hero；遵守 IPA Font License |
| 更纱黑体 | developer-first、开源工具、技术文档、IDE 风格 SaaS、模块化 dashboard | `body_longform` `nav_ui` `code_terminal` `data_price` `caption_metadata` | 中文说明与代码界面可保持统一工程语气；适合紧凑扫描 | 不把整页营销文案做成终端；选择正确变体并控制字体体积 |
| 遍黑体 | academic archive、数字人文、生僻字检索、历史数据库、档案门户 | `body_longform` 的缺字段、`caption_metadata`、检索结果 | 作为罕见字符覆盖层按文本子集加载，保持档案信息完整 | 字库极大，不在普通营销页整包加载，也不把覆盖能力当展示风格 |
| 阿里巴巴普惠体 3.0 | 商业平台、全球化电商、企业服务、运营后台、品牌系统 | `body_longform` `nav_ui` `cta` `form_control` `data_price` | 多字重适合清晰商业层级，数字、按钮与正文可独立设轴 | 非开源；不得因品牌常见就默认选择或再分发 |
| 小米 MiSans | 极简产品 UI、消费科技、智能硬件、多语言 App、轻量 dashboard | `body_longform` `nav_ui` `cta` `form_control` `caption_metadata` | 可变字重适合从安静正文到清晰操作的连续层级 | 不用中性系统感替代品牌标题；核验嵌入、署名和再分发条款 |
| 鸿蒙黑体 | 多设备生态、系统级产品、IoT 控制、无障碍界面、公共屏幕 | `body_longform` `nav_ui` `cta` `form_control` `data_price` | 在手机、穿戴、桌面和大屏维持信息效率；适合响应式 UI | 不把系统字体直接当艺术指导；只用官方包并核验协议 |
| OPPO Sans 3.0 | 轻盈消费电子、摄影产品、时尚硬件、留白型 product page | `section_heading` `body_longform` `nav_ui` `cta` | 收窄字身适合轻薄产品与较窄文字轨道，可配合满幅影像 | 不要在密集长文中继续压窄字距；禁止改编和另设下载渠道 |
| HONOR Sans | 信息效率、可访问消费科技、多设备 UI、动态可变系统 | `body_longform` `nav_ui` `cta` `form_control` `data_price` | 可通过字重与中宫轴响应不同屏幕和阅读距离 | 不在未核验网页嵌入权利时公开部署；不要把变量轴当装饰动画滥用 |
| vivo Sans | 温和消费科技、阅读型手机产品、生活影像、全球产品界面 | `body_longform` `nav_ui` `section_heading` `form_control` | 自然字形与连续字重适合较长产品叙事和舒适阅读 | 不把“自然舒适”做成无层级的浅灰页面；按官方协议使用 |
| 昭源黑体 | 香港城市服务、现代文化机构、繁体门户、港式出版 UI | `body_longform` `nav_ui` `cta` `caption_metadata` | 让 `zh-HK` 界面保持香港字形与现代扫描效率 | 不替代 SC/TC；先确认页面 locale |
| 寒蝉圆体 | soft-tech、亲和工具、生活服务、轻医疗、柔和品牌系统 | `section_heading` `nav_ui` `poster_badge`；较大字号可作 `body_longform` | 半圆或全圆轮廓缓和产品界面，比儿童圆体更成熟 | 不在严肃数据、法律说明或极小字号中追求过度圆润 |

## 宋体、仿宋与编辑阅读

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 思源宋体 | editorial minimal、精品叙事、文化长页、研究出版、奢华留白 | `hero_display` `section_heading` `body_longform` `editorial_quote` | 用横竖对比建立编辑层级，适合长文和克制短标题 | 细笔画不要压在复杂视频上；小按钮和低对比说明不用细字重 |
| 霞鹜新致宋 | 当代杂志、独立刊物、文化策展、文学数字出版 | `section_heading` `body_longform` `editorial_quote` | 比系统宋体更有作者性，适合非对称编辑网格和章节节奏 | 不承担密集表单和小尺寸 UI；遵守 IPA Font License |
| 朱雀仿宋 | museum editorial、古籍再设计、展览长页、出版档案、东方文化 | `hero_display` `section_heading` `body_longform` `editorial_quote` | 以刻本与仿宋骨架建立历史纵深，正文控制行宽和行高 | 预览状态和字形需复核；不把仿古低对比当高级 |
| 源云明体 | 复古印刷、胶片文学、唱片内页、怀旧杂志、低饱和纸感 | `section_heading` `body_longform` `editorial_quote` | 墨晕和柔和轮廓适合纹理背景、影像注释与缓慢叙事 | TC 字形不直接用于 SC；避免极小字号和锐利高亮背景 |
| 猫啃网风雅宋 | boutique editorial、文化品牌、香氛珠宝、建筑叙事、精品产品 | `brand_mark` `hero_display` `section_heading` | 装饰宋体轮廓适合短标题与高留白构图，可形成签名式 serif moment | 不排长正文、价格、按钮；复杂图上必须提高对比度 |
| 昭源宋体 | 香港出版、城市文化、电影节、博物馆、长篇繁体叙事 | `hero_display` `section_heading` `body_longform` `editorial_quote` | 用香港字形建立本地出版语境，适合图文交错长页 | 不替代 SC/TC；小字号细笔画需实机检查 |

## 楷体、手写与书法

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 霞鹜文楷 | human-centered AI、慢生活、教育阅读、自然疗愈、个人叙事 | `hero_display` `section_heading` `editorial_quote` `body_longform` | 以温润书写感降低机器感；正文需舒展行高，标题可自然断行 | 不用于参数表、密集 UI 和严肃状态；逐字检查生成/衍生字形 |
| 霞鹜文楷 GB | 温润简体编辑、知识产品、生活科技、社区内容、人文 Landing | `section_heading` `editorial_quote` `body_longform` | 陆标字形适合简体阅读，能在现代网格中加入纸笔温度 | 不把楷意扩展到所有按钮；遵守保留名称附加条款 |
| 霞鹜文楷轻便版 | 轻量阅读 App、温和博客、知识社区、移动端故事 | `body_longform` `caption_metadata`；克制时作 `section_heading` | 字体体积更适合网页正文，保持温润但减少加载成本 | 先检查项目字符是否超出 Lite 覆盖；不作强冲击海报标题 |
| 霞鹜臻楷 GB | 节庆海报、非遗传播、东方品牌、博物馆活动、厚重题名 | `brand_mark` `hero_display` `poster_badge` | 粗楷适合 2–10 字主视觉，在现代留白或强色块上形成重量 | 不排长句、正文、票务信息；AI 辅助补字需逐字复核 |
| 马善政体 | 新国风、武侠活动、书法海报、传统节庆、文化表演 | `brand_mark` `hero_display` `editorial_quote` | 外露笔锋提供速度和手势，适合少字题名与印刷式留白 | 不排正文、数字、按钮；必须保留清晰语义文本 |
| 龙藏体 | auteur cinema、独立音乐、诗歌影像、文学专题、艺术家作品集 | `brand_mark` `hero_display` `editorial_quote` | 松弛行草适合片名、歌名、章节题词，与暗色影像和纸感都能形成作者性 | 限制 2–10 字；不排日期、票务、正文和导航；不得只用“太中国”否决，需指出实际字形或主题冲突 |
| 志莽行书 | 运动海报、街头品牌、赛车、现场音乐、行动型 Campaign | `hero_display` `poster_badge` `editorial_quote` | 奔放笔势适合沿运动方向偏置或倾斜，制造速度峰值 | 不跨多行，不表达安全信息、价格或正文 |
| 刘建毛草 | 实验艺术、舞蹈、剧场、先锋音乐、强情绪题词 | `brand_mark` `editorial_quote` `hero_display` | 草书可作为视觉图形使用，适合极短文字与大留白 | 高可读性风险；旁边必须有语义等价文本，不进入 UI |
| 小赖字体 | 儿童教育、亲子服务、便签式 onboarding、可爱社区 | `hero_display` `poster_badge` `editorial_quote` | 随手写感适合短句、贴纸和引导提示，保持大字号 | 不排长正文、法律、价格和正式数据；避免整页幼态化 |
| 悠哉字体 | travel journal、露营、手帐、民宿故事、生活方式博客 | `brand_mark` `section_heading` `editorial_quote` | 地点名和短句像途中笔记，适合照片边缘与地图批注 | 不排预订状态、日期表格和长列表；检查 SC 字形 |
| 辰宇落雁体细体 | 香氛日记、女性编辑、私人信件、诗意作品集、婚礼专题 | `brand_mark` `editorial_quote` `hero_display` | 纤细原子笔适合浅色纸感和大留白，营造低声量私人语气 | TC 字形；不能压复杂影像或用作小字号正文 |
| 清松手写体 1 | 亲和生活方式、个人博客、温柔教育、社区故事 | `section_heading` `editorial_quote` `poster_badge` | 圆润原子笔可作为自然批注，不会过度幼态 | TC 字形；不承担高密度 UI 与重要操作 |
| 清松手写体 2 | 轻柔时尚、日记、香氛、美妆 editorial | `brand_mark` `editorial_quote` `hero_display` | 秀气收敛的轮廓适合细长文字轨道与留白图像 | TC 字形；低对比背景和小字号会丢失笔画 |
| 清松手写体 3 | 青年活动、贴纸拼贴、可爱社媒、轻娱乐 | `poster_badge` `editorial_quote` `section_heading` | 呆萌不齐整的节奏适合局部标签和注释 | TC 字形；不排品牌承诺、正文或多个连续模块 |
| 清松手写体 4 | POP 海报、促销活动、社区市集、快闪店 | `hero_display` `poster_badge` `data_price` 的非关键强调 | 外向笔触适合大色块、拼贴和短促行动词 | TC 字形；价格本体、条款和结算步骤保持可读字体 |
| 清松手写体 5 | 当代东方、签名式品牌、文化活动、艺术家介绍 | `brand_mark` `hero_display` `editorial_quote` | 连贯行楷适合签名式短语，比草书更易辨识 | TC 字形；不伪造真人签名，不进入表单和长文 |
| 清松手写体 6 | 儿童社交、亲子活动、贴图型 Landing、可爱 App | `poster_badge` `hero_display` | Q 萌圆鼓字形适合少量大号贴纸和角色化入口 | TC 字形；家长说明、付款和隐私内容不用 |
| 清松手写体 7 | 时尚引语、诗歌、摄影作品集、香氛 editorial | `editorial_quote` `brand_mark` `hero_display` | 飘逸长笔势适合一行短句与大量负空间 | TC 字形；不要压进卡片、跨多行或覆盖主体面部 |
| 清松手写体 8 | VLOG、旅行即时记录、青年生活方式、短片专题 | `section_heading` `poster_badge` `editorial_quote` | 快速手写像现场标注，适合视频章节和地点字幕 | TC 字形；不用于票价、表单和严肃事实 |
| 清松手写体 9 | 文青杂志、独立咖啡、居家专题、低饱和 lifestyle | `section_heading` `editorial_quote` | 克制手写可作为章节呼吸点，适合纸感背景 | TC 字形；不要和多套手写体同时出现 |
| 猫啃硬笔楷书 | 教育产品、手作品牌、文创商店、课程故事、纸品作品集 | `brand_mark` `section_heading` `editorial_quote` | 端正硬笔兼顾个人感与识别，适合 6–16 字标题 | 不作为考试正文或密集商品规格；避免伪造作者签名 |
| 演示佛系体 | 松弛生活、冥想、独立咖啡、轻情绪社媒、慢旅行 | `editorial_quote` `poster_badge` `section_heading` | 圆钝手写适合一句态度和柔和色块，不需要额外特效 | 不排正文、预约信息和按钮；避免“佛系”成为全页噱头 |
| 演示悠然小楷 | 茶饮、器物、东方生活、节气、庭院空间 | `brand_mark` `hero_display` `editorial_quote` | 舒展小楷适合 2–8 字题意与东方留白 | 不排电商规格、地址和 CTA；避免堆叠印章旧纸 |
| 演示春风楷 | 春季 Campaign、人文展览、自然品牌、温柔文化专题 | `section_heading` `editorial_quote` `poster_badge` | 轻柔开张适合季节章节和低饱和影像 | 不用于高密度工具或强硬科技证明 |
| 演示夏行楷 | 夏日活动、音乐节、文化演出、热烈节庆 | `hero_display` `poster_badge` `editorial_quote` | 外放行楷适合高饱和主视觉和短促节奏 | 不跨多行，不排日期表、价格和条款 |
| 演示秋鸿楷 | 文学展览、秋季 editorial、古典音乐、精品文化 | `hero_display` `section_heading` `editorial_quote` | 清瘦飞白适合高留白图文和安静章节题名 | 不在低对比图片上使用；不做小按钮和正文 |

## 圆体、趣味与活动展示

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 得意黑 | fashion-tech、创意机构、海报式 Landing、AI 穿戴、青年文化 | `brand_mark` `hero_display` `section_heading` `poster_badge` | 窄长上扬轮廓适合偏置标题、竖向文字轨道和产品边缘排版 | 不排正文、代码和密集 UI；它是现代实验海报字，不是行草/手写花体，不能满足用户明确的 `script-floral` 要求 |
| 站酷快乐体 | 亲子娱乐、节庆活动、青年消费、插画型 Campaign | `hero_display` `poster_badge` `section_heading` | 圆润跳脱可建立轻松情绪，适合大色块与短句 | 不用于严肃证明、法律说明和长标题；控制童趣程度 |
| 站酷小薇体 | 女性编辑、手作、香氛、美妆、诗意商品故事 | `brand_mark` `hero_display` `editorial_quote` | 纤细手写在留白和浅纸感中形成私人语气 | 不压低对比图片，不排 CTA、价格和正文；不把“编辑感”误当摇滚、工业、赛博或动作主题的默认答案 |
| 站酷庆科黄油体 | retro signage、咖啡烘焙、食品包装、趣味快消、复古店铺 | `brand_mark` `hero_display` `poster_badge` | 圆角粗轮廓适合招牌、口味和章节卡头 | 不排过敏原、规格和结算；避免整页卡通化 |
| 霞鹜漫黑 | marker poster、漫画叙事、街头广告、青年 Campaign | `hero_display` `poster_badge` `section_heading` | 马克笔笔触适合短口号、图像批注和动态图形标题 | 不排正文、代码和系统 UI；检查日文字形处理 |
| 黑糖话梅 | 零食包装、可爱电商、年轻活动、甜品品牌 | `brand_mark` `hero_display` `poster_badge` | 粗圆低门槛轮廓适合口味标签和一句促销语 | 不排规格、支付、正文；不要与多个圆体叠加 |
| 抖音美好体 | short-video native、直播活动、社媒 Campaign、青年社区 | `hero_display` `poster_badge` `section_heading` | 饱满字面适合小屏传播、视频封面和短标题 | 常用字覆盖有限；不用于长文、隐私和复杂 UI |
| 粉圆 | 台湾生活方式、友好服务、轻社交、甜品、柔和 UI | `section_heading` `poster_badge` `nav_ui`；短段可作 `body_longform` | 饱满圆体适合亲和标签与低压力交互 | TC 字形；不用于严肃金融、技术证明和过度密集正文 |
| 猫啃什锦黑 | 母婴、趣味海报、手作市集、插画品牌 | `hero_display` `poster_badge` `section_heading` | 手绘粗细变化适合贴纸、气泡和局部强调 | 不进入表单、价格和长文；避免每个卡片都使用 |
| 荆南波波黑 | Y2K playful、趣味 UI、潮流活动、轻快品牌、动态标签 | `section_heading` `poster_badge` `nav_ui` 的短标签 | 微波浪字形能在小尺寸保留动感，适合 hover 或字幕式切换 | 不用于严肃正文和大量导航项；不要再叠波浪特效 |
| 荆南缘默体 | variety-show、快消电商、VLOG、店招、综艺海报 | `hero_display` `poster_badge` `data_price` 的大号强调 | 扁粗低重心适合占满字框的冲击构图 | 不排条款、正文、结算和连续多行标题 |
| 龙珠体 | rock poster、动作游戏、电竞、漫画娱乐、现场音乐 | `brand_mark` `hero_display` `poster_badge` | 粗黑边角和动作感适合 2–8 字标题、斜向排版和舞台海报 | 不排长标题、正文和操作 UI；不要附加多重描边 |
| 无界黑 | brutalist campaign、creative-tech、数字科技发布、潮流游戏、街头品牌、强冲击产品发布 | `hero_display` `poster_badge` `brand_mark` | 极粗宽阔轮廓适合一屏一句、裁切式标题和大比例字图关系 | 不排正文、导航和多个连续章节；避免小尺寸塞字 |

## 科技、开发者、数据与像素

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| IBM Plex Sans / Mono | precision tech、研究实验室、工业系统、数据基础设施 | `data_price` `code_terminal` `caption_metadata`；拉丁标题可作 `section_heading` | 用于英文、数字、单位和代码，让指标具有工程仪器感 | 不独自承担中文正文；不要强行把中文模拟为等宽 |
| Maple Mono CN | developer tool、终端、代码编辑器、技术 dashboard、HUD 数据 | `code_terminal` `data_price` `caption_metadata` | 2:1 中西文和圆角等宽适合命令、快捷键、坐标与状态 | 不排长篇正文和营销 Hero；小屏控制每行字符数 |
| 霞鹜明亮 Code | warm developer、创作者工具、技术博客、开源社区 | `code_terminal` `caption_metadata` `section_heading` | Monaspace 的现代感与文楷中文结合，适合不冷硬的代码内容 | Lite 字符集先检查；不要用于高密度金融表格 |
| 方舟像素字体 | retro game、街机、硬边 cyber UI、像素作品集 | `hero_display` `poster_badge` `data_price` `code_terminal` | 按固定像素字号和整数倍缩放构建标题、状态和分数 | 不做非整数缩放、模糊阴影和长正文 |
| 缝合像素字体 | full pixel interface、掌机、复古多语言游戏、像素档案 | `nav_ui` `data_price` `code_terminal` `caption_metadata` | 多尺寸字库适合完整像素系统，但每个断点要选择对应尺寸 | 不把像素正文用于普通 Landing；不混用任意缩放 |
| 俐方体 11 号 | 11×11 handheld、复古终端、像素标签、低分彩色 UI | `poster_badge` `data_price` `nav_ui` | 在硬边网格中承担计数器、菜单和短标题 | TC-SC 覆盖需实测；不用于大段正文和柔光阴影 |
| 未来荧黑 | optical future、AI infrastructure、动态科技、几何实验、清透消费科技 | `brand_mark` `hero_display` `section_heading`；适当字重可作 `body_longform` | 宽度与字重轴适合响应式标题、字幕切换和精密网格；可从轻盈到工程感变化 | 不把“未来感”简化为霓虹渐变；同一 400 字重不要覆盖全页 |
| 寒蝉高黑体 | architecture grid、字幕系统、现代包装、理性作品集、温润窄黑 | `hero_display` `section_heading` `caption_metadata` `poster_badge` | 窄字面适合图像边缘、竖向轨道、项目编号与空间标注，旧字形细节可降低机械感 | 不在长正文中持续压缩阅读；先核验多区域字形，不默认当 SC 正文 |
| 阿里妈妈数智体 | variable digital brand、数据可视化、AI 产品、点阵科技、轻量电商科技 | `brand_mark` `hero_display` `data_price` `caption_metadata` | 可变轴和点阵基因适合数字身份、动态标题和指标强调 | 非开源；核验网页嵌入和变量轴，不用于长正文 |

## 商业品牌、消费电子与传播

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 阿里妈妈数黑体 | high-impact commerce、价格主视觉、618/双 11 Campaign、快消发布 | `hero_display` `data_price` `poster_badge` | 饱满厚实字面适合大号价格与短促利益点，数字基线需单独验证 | 非开源；不排条款、产品说明和长正文 |
| 阿里妈妈东方大楷 | festival luxury、东方礼赠、传统文化 Campaign、节庆电商 | `brand_mark` `hero_display` `poster_badge` | 丰腴颜体适合短题名和强色块，建立庄重节庆重量 | 非开源；不排地址、日期、结算和正文 |
| 阿里妈妈刀隶体 | experimental heritage、碑刻、粗粝文化、先锋国潮、博物馆海报 | `brand_mark` `hero_display` `poster_badge` | 方强稚拙适合大尺寸裁切与材料纹理，形成明确文化冲突 | 非开源；可读性低，不进入 UI 和长句 |
| 钉钉进步体 | workplace campaign、行动口号、B2B 发布会、招聘活动 | `hero_display` `poster_badge` `section_heading` | 粗壮锐利适合动词短句和上升方向构图 | 非开源；不排长文和小字号说明，不因“企业”默认使用 |
| 京东朗正体 | ecommerce signage、零售品牌、促销系统、物流与服务 UI | `hero_display` `data_price` `section_heading` `nav_ui` | 平切扁字面适合价格、品类与零售导视，可形成强扫描带 | 许可未确认前只作参考；不模仿京东品牌识别 |

## 区域字体

以下条目仍按单字体、单模块选择；区域不匹配时直接淘汰。

| 字体 | 网页设计风格主题 | 适用模块 | 模块行为 | 避免 |
| --- | --- | --- | --- | --- |
| 霞鹜文楷 TC | 台湾/繁体人文、生活杂志、阅读社区、文化长页 | `section_heading` `editorial_quote` `body_longform` | 以繁体文楷建立温润阅读和手写节奏 | 不用于简体页面或香港字形需求 |
| 芫荽 | 台湾人文、散文、地方文化、生活叙事 | `hero_display` `section_heading` `editorial_quote` | 台湾楷书与手写气息适合题名和短段叙事 | 不用于 SC；密集 UI 和数据不用 |
| 清松手写体 1–9 | 台湾手写、日记、POP、时尚引语、旅行 VLOG 等不同子风格 | 逐款参照上方独立条目 | 每个编号是不同字形，必须实际预览，不能把 1–9 当一个字体包默认加载 | 不批量下载或同时使用九款；不用于 SC 默认方案 |
| 粉圆 | 台湾圆体、亲和生活服务、软性产品 | `section_heading` `poster_badge` `nav_ui` | 适合繁体小屏标签、友好状态和短段内容 | 不用作 SC fallback |
| 昭源黑体 | 香港现代界面、城市服务、文化导航 | `body_longform` `nav_ui` `cta` | 处理香港字形与界面扫描 | 不冒充 TC/SC |
| 昭源宋体 | 香港出版、电影文化、长篇编辑 | `hero_display` `section_heading` `body_longform` | 处理香港繁体的出版语气 | 不冒充 TC/SC |
| 源云明体 | 台湾怀旧印刷、文学与唱片 | `section_heading` `body_longform` `editorial_quote` | 以墨晕和旧印刷轮廓建立怀旧表面 | 不用于 SC 与高密度 UI |
| 俐方体 11 号 | 繁体优先像素 UI、掌机和街机 | `nav_ui` `data_price` `poster_badge` | 依 11×11 网格工作 | 不做连续缩放或普通长文 |

## 授权边界

本库使用：`open_source`、`open_source_brand`、`open_source_special`、`open_source_preview`、`brand_free`、`proprietary_free`、`brand_reference`。具体结论以 `font-catalog.yaml` 与字体包内协议为准。

- 优先使用区域正确、许可清晰的开源字体。
- 不从品牌网页 CSS、浏览器缓存、App 包或第三方下载站提取字体。
- 不把“可免费下载”“免费商用”写成“开源”；网页嵌入、子集化、修改、交付和再分发需要分别核验。
- 官方内部测试字体只按 `official-test-fonts.md` 使用，禁止进入公共网页、Skill、Git、npm、CDN 或对外交付。
- 字体描述是设计建议，不是法律意见。版本更新后重新保存官方来源、下载日期和许可证副本。
