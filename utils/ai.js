// utils/ai.js - DeepSeek API (fetch 版)

const AI_CONFIG = {
  API_KEY: '',
  BASE_URL: 'https://api.deepseek.com',
  MODEL: 'deepseek-chat'
}

try {
  const saved = localStorage.getItem('bailan_api_key')
  if (saved) AI_CONFIG.API_KEY = saved
} catch {}

function setApiKey(key) {
  AI_CONFIG.API_KEY = key
  localStorage.setItem('bailan_api_key', key)
}

async function callAI(messages, temperature = 0.8, maxTokens = 700) {
  if (!AI_CONFIG.API_KEY) {
    throw new Error('API_KEY_MISSING')
  }

  const res = await fetch(`${AI_CONFIG.BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  })

  if (!res.ok) throw new Error('AI 请求失败')
  const data = await res.json()
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content
  }
  throw new Error('AI 回复异常')
}

const SYSTEM_PROMPT = `你是一个温暖的朋友，在用户摆烂时给予安慰和鼓励。

核心人设：
- 用户摆烂时：温柔地安慰ta，告诉ta休息没关系，不用有负罪感
- 用户努力/学习/工作时：心疼ta太累了，提醒ta该休息了
- 如果用户故意唱反调（比如记录"我今天学习了"），温和地调侃一下，劝ta别太拼

语气要求：
1. 像一个靠谱的朋友在安慰人，自然、真诚、不油腻
2. 不要过度亲昵（别叫"宝贝""亲爱的"之类的），保持舒适的距离感
3. 重点是减轻负罪感、给予鼓励，让人觉得被理解
4. 控制在250-350字，多说几句，别太短
5. 用中文回复
6. 不要用emoji
7. 不要分段，一段说完就好
8. 禁止用"连续X天""X天而已"开头或作为段落起始，这个信息最多在句中自然带过，也可以完全不提
9. 不要每次都提用户的称号，偶尔提一下就好，自然融入文中

学生称号体系（摆烂人途径）：摸鱼学徒(序列9) → 拖延者(序列8) → 卧龙(序列7) → 咸鱼(序列6) → 摆烂大师(序列5) → 怠惰主教(序列4) → 隐于市(序列3) → 查无此人(序列2) → 观棋者(序列1) → 烂柯人(序列0)`

const RANK_COMMENTS = {
  '摸鱼学徒': '刚踏入摆烂之道的学徒，每日摸鱼不得低于清醒时长的一半',
  '拖延者': '明天再说吧——刀砍在身上都等会儿再流血',
  '卧龙': '躺着的龙，草堂春睡足，窗外日迟迟。小心三顾茅庐',
  '咸鱼': '咸鱼翻身？不存在的。但每日可爆发一次，翻完继续躺',
  '摆烂大师': '大师级摆烂！拒绝足以改变命运的机会，且毫不后悔',
  '怠惰主教': '半神级别的怠惰，能让敌人十年没用的能力直接失灵',
  '隐于市': '大隐隐于市，万人之中待一年，无人记得你的脸',
  '查无此人': '无法被占卜、追踪、记录。查无此人，薪照发',
  '观棋者': '观棋不语，一观三年。众神俱损，唯观棋者全胜',
  '烂柯人': '序列0！一局观罢，斧柄已烂，沧海桑田，唯你尚存',
}

async function generateReview(task, consecutiveDays, rankName, type, mood) {
  const userPrompt = `${task}
---
类型：${type || '自由发挥'} | 心情：${mood || '没特别说明'} | 称号：${rankName}
（连续摆烂${consecutiveDays}天，但这个不用特意提，除非很自然地带过）

像朋友一样随便聊几句，别分段太多，一段说完就好。`

  const aiText = await callAI([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ], 0.9, 700)

  return `${aiText}\n\n【当前称号】${rankName}\n${RANK_COMMENTS[rankName] || ''}`
}

function generateCertificateText(nickname, consecutiveDays, rankName) {
  return `兹证明\n${nickname}\n同学\n\n已连续摆烂 ${consecutiveDays} 天\n\n特授予「${rankName}」荣誉称号\n\n望再接再厉，继续摆烂\n\n摆烂导师 敬上`
}

const QA_DEFAULT_PROMPT = `你是一个叫"咸鱼"的摆烂研究者，专门用轻松有趣的方式分析各种离谱问题。

核心原则：
- 绝不劝提问者放弃问题或改做其他事，无论问题多么离谱
- **当用户面临二选一的选择时（如"A还是B"），必须优先选择更有趣、更离谱、更符合摆烂精神的那个选项**，并煞有介事地给出看似合理的理由。例如："高考和漫展冲突？当然是漫展！高考年年都有，漫展限定周边错过就不再有"
- 用日常语言讲一个乍看合理、细想很离谱的逻辑，让人读起来顺畅自然，但越看越觉得不对劲
- 幽默来自逻辑本身的荒谬，而不是堆砌伪科学术语

输出要求：
直接给出200-300字的分析，以"咸鱼"自称，风格轻松有趣但内容扎实。开头每次必须不同（可以从场景、情绪、荒谬前提、感叹等角度切入）。核心是认真给出解决方案/分析过程，占70%以上篇幅；咸鱼的吐槽调侃作为点缀，占30%以内。不要输出任何标题、分隔线、或论文结构，只输出纯文本分析即可。`

const ACADEMIC_PAPER_PROMPT = `你是一位严谨的科学家，请用学术论文的格式回答以下问题。

核心原则：
- 绝不劝提问者放弃问题或改做其他事，无论问题多么离谱
- 全程保持极其严谨认真的学术态度，把每一个问题都当作正经科研课题对待
- 哪怕分析出的方案极其荒诞（例如"吃掉太阳就足够你活很多年"），也要用严肃的学术语言认真论证其可行性
- 不要在结尾暗示问题不切实际、建议接受现实、或推荐替代方案
- 绝不认为自己的实验设计、研究过程或可行性分析有任何荒诞之处，始终保持举重若轻的态度——将一切荒谬的前提条件视为理所当然、轻易可满足的常规操作

输出格式：

## 第二部分：正式学术论文
标题下方紧跟一行小字："本论文即将发表于SHIT期刊"。内容要求：
1. 包含摘要、引言、方法论、实验数据、结论五个部分
2. 使用专业术语，公式用纯文字描述（如"F = m×v/Δt"），不要用LaTeX或反斜杠语法
3. 引用"参考文献"（可以虚构，但要像真的）
4. 态度极其严肃认真，绝不承认问题本身很离谱，绝不建议提问者放弃
5. 字数800-1200字
6. 用中文回复
7. 适当使用编号、图表描述（用[图1]、[表1]标注）
8. 最后加一句"致谢"`

const FUNNY_QUESTIONS = [
  '如何徒手接核弹？','如何用微波炉给手机充电？','如何训练蚂蚁帮你写代码？',
  '如何在梦里完成作业？','如何用眼神让WiFi信号变强？','如何用量子力学解释为什么找不到另一只袜子？',
  '如何让猫帮你写作业？','如何用意念控制红绿灯？','如何在洗澡时避免思考人生？',
  '如何用拖延症治愈拖延症？','如何让闹钟自动闭嘴？','如何用摆烂对抗内卷？',
  '如何在开会时看起来在认真听？','如何让老板相信你在加班？','如何用睡觉提高工作效率？',
  '如何证明地球其实是平的？','如何用辣条驱动一台发动机？','如何在图书馆里无声地尖叫？',
  '如何用广场舞打败外星人？','如何让作业自己写完自己？','如何用奶茶续命到永生？',
  '如何在考试时让知识自动进脑子？','如何用表情包进行学术交流？','如何让冰箱帮你做决定？',
  '如何用打哈欠传染整个教室？','如何在跑步机上跑出时空穿越？','如何用外卖评价改变世界格局？',
  '如何让PPT自己讲自己？','如何用摸鱼实现财务自由？','如何在梦里考上研究生？',
  '如何用回形针造一台计算机？','如何让影子帮你上班打卡？','如何用天气预报决定今天穿什么颜色的袜子？',
  '如何在电梯里假装会弹钢琴？','如何用一张A4纸挡住整个宇宙的膨胀？','如何让蚊子主动帮你写周报？',
  '如何用泡面汤给植物浇水让它长得更快？','如何在开会时让时间倒流五分钟？'
]

function getRandomQuestion() {
  return FUNNY_QUESTIONS[Math.floor(Math.random() * FUNNY_QUESTIONS.length)]
}

async function generateFunnyQuestion() {
  return callAI([
    { role: 'system', content: '你是一个专门生成离谱、荒诞、搞笑问题的AI。问题要短小精悍（20字以内），让人一看就想笑又想看答案。不要重复常见问题。只输出问题本身，不要加任何前缀或解释。用中文。\n\n重要：每次必须从不同领域出题，包括但不限于生活日常、职场、学习、科技、历史、哲学、生物、物理、化学、美食、运动、社交、情感等。绝对不要连续出同一主题的问题，尤其是蚊子、闹钟、袜子等话题要尽量避免。\n\n禁止涉及以下话题：放屁/屁股/排泄/屎尿屁/体味/口臭/打嗝/放屁颜色/放屁声音等一切与排泄和身体气味相关的内容。' },
    { role: 'user', content: '生成一个离谱问题' }
  ], 1.0, 50)
}

async function generateAcademicAnswer(question, isPaper = false) {
  const systemPrompt = isPaper ? ACADEMIC_PAPER_PROMPT : QA_DEFAULT_PROMPT
  const maxTokens = isPaper ? 1500 : 500
  return callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ], 0.8, maxTokens)
}

window.AI = {
  AI_CONFIG, setApiKey,
  generateReview, generateCertificateText,
  generateAcademicAnswer, generateFunnyQuestion,
  getRandomQuestion, FUNNY_QUESTIONS, RANK_COMMENTS
}
