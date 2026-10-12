import { callWorkBuddyGateway } from '@/features/shared-ai/workbuddy-gateway'
import type { AutoCutCategory, VideoDeepDiagnosis } from './auto-cut-model'

export async function runDeepVideoDiagnosis({
  source,
  category,
  durationMinutes = 10,
  recentMemories = '',
}: {
  source: string
  category: AutoCutCategory
  durationMinutes?: number
  recentMemories?: string
}): Promise<VideoDeepDiagnosis> {
  const prompt = `你是专精跨境电商、出海短视频与TikTok/微信视频号的顶级爆款视频编导与AI剪辑总监。
请针对以下输入的视频素材/对标视频进行全方位深度拆解与智能切片策划：

【输入源】：${source}
【视频类型】：${category === 'spoken' ? '口播类长视频' : '排行榜数据类视频'}
【原始预估时长】：约 ${durationMinutes} 分钟
${recentMemories ? `【历史沉淀的AI风格记忆（请参考并持续迭代，不要重复犯错）】：\n${recentMemories}` : ''}

【核心任务要求】：
1. 行业深度强结合：必须紧密结合当前【出海/跨境电商/TikTok美区/供应链/短视频带货】的最新热点新闻与真实痛点。
2. 长视频智能切片：将这段长视频智能拆分为若干个【约2分钟（110~130秒）】的独立精悍小视频。
   - 每个小视频必须具备：
     a. 前3秒黄金抓人钩子（反常识/痛点提问/利益诱导）
     b. 中段核心冲突与场景反差（避免枯燥）
     c. 结尾升华金句与引导转发话术
     d. 剪映专属贴纸与BGM卡点建议
3. 爆款基因与人设参数提取：提取目标受众画像、语速、口语化特征。
4. 本次沉淀提炼：总结一条最值得永久记住的内容/剪辑法则，供AI记忆库学习。

请直接返回一个标准的 JSON 字符串（不要包含任何 markdown 代码块包裹，纯 JSON）：
{
  "sourceNameOrUrl": "${source}",
  "category": "${category}",
  "originalDurationSec": ${durationMinutes * 60},
  "overallPersona": {
    "targetAudience": "跨境卖家、亚马逊转TK创业者、出海带货剪辑师",
    "toneStyle": "犀利实战型、低姿态经验过来人、极度接地气",
    "emotionalDensity": "高压迫感起手，务实解法收尾",
    "speakingRate": "快节奏口播（约240字/分）"
  },
  "viralDNA": {
    "hookPatterns": ["开场否定常识", "直戳封店亏损痛点", "算账对比反差"],
    "corePainPoints": ["选品滞销压货", "美区本土店门槛提升", "视频播放量破不了500"],
    "commentControversies": ["海外版抖音到底能不能赚到钱", "新手该不该做全托管"]
  },
  "hotNewsRelevance": {
    "industryTopic": "TikTok Shop 美区黑五备战与本土闭环政策收紧",
    "relevanceReason": "卖家迫切需要低成本短视频测品方案与自然流破局技巧",
    "suggestedHook": "很多人以为黑五备货是拼资金，其实90%的人第一关就死在测品短视频上！"
  },
  "learnedExperienceSummary": "口播前3秒禁止讲废话自我介绍，直接报数字或抛出扎心反常识观点，留存率提升40%以上。",
  "slices": [
    {
      "id": "clip-1",
      "clipIndex": 1,
      "title": "破局第1集：为什么你的爆款视频总在第4秒被划走？",
      "targetDurationSec": 120,
      "startSec": 0,
      "endSec": 120,
      "hook3s": "别再第一秒说大家好我是XX了！观众划走你只要0.8秒！",
      "coreConflict": "大多数人以为内容不好，其实是开头前三秒没有任何情绪锚点。",
      "goldenQuote": "做短视频不是做汇报，开局不扎心，后面再干货也是独角戏！",
      "suggestedBgm": "轻快节奏鼓点/悬疑抓耳转欢快",
      "suggestedStickers": ["红叉警告", "倒计时数字", "重点高亮框"],
      "subtitles": [
        {"start": "00:00:00", "end": "00:00:03", "text": "别再第一秒说大家好我是XX了！"},
        {"start": "00:00:03", "end": "00:00:06", "text": "观众划走你的视频只需要零点八秒！"}
      ]
    },
    {
      "id": "clip-2",
      "clipIndex": 2,
      "title": "破局第2集：带货口播如何把成本压缩到零也能出单？",
      "targetDurationSec": 120,
      "startSec": 120,
      "endSec": 240,
      "hook3s": "很多人跟我说没钱拍实景，那是你根本没看懂爆款的底层结构！",
      "coreConflict": "高画质不等于高转化，真实生活痛点场景比影棚更能打动普通人。",
      "goldenQuote": "与其花三万块搭影棚，不如花三分钟搞懂你的用户到底在焦虑什么！",
      "suggestedBgm": "沉稳干货讲解/轻科技风",
      "suggestedStickers": ["省钱箭头", "对比分屏", "评论弹幕"],
      "subtitles": [
        {"start": "00:02:00", "end": "00:02:03", "text": "很多人跟我说没钱拍实景..."},
        {"start": "00:02:03", "end": "00:02:07", "text": "那是你根本没看懂爆款的底层结构！"}
      ]
    }
  ]
}`

  try {
    const raw = await callWorkBuddyGateway(prompt)
    // 容错提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('无法解析结构化分析结果')
    return JSON.parse(jsonMatch[0]) as VideoDeepDiagnosis
  } catch (err) {
    // 离线/服务异常时的自适应保底报告
    return {
      sourceNameOrUrl: source,
      category,
      originalDurationSec: durationMinutes * 60,
      overallPersona: {
        targetAudience: "跨境电商从业者、短视频内容团队",
        toneStyle: "直截了当、实战落地、数据驱动",
        emotionalDensity: "高强度抓眼球",
        speakingRate: "220-250字/分钟",
      },
      viralDNA: {
        hookPatterns: ["痛点开局", "反常识对比", "算账法"],
        corePainPoints: ["起号没播放", "完播率低", "转化断层"],
        commentControversies: ["低成本能否出奇迹", "脚本重要还是剪辑重要"],
      },
      hotNewsRelevance: {
        industryTopic: "出海短视频全平台规则演变与流量争夺",
        relevanceReason: "急需高信息密度、精简卡点的内容打破低播限制",
        suggestedHook: "90%做跨境短视频的人，都在前三秒犯了同一个致命错误！",
      },
      learnedExperienceSummary: "两分钟小视频必须保持单集讲透一个痛点，切忌长篇大论。",
      slices: [
        {
          id: "clip-fallback-1",
          clipIndex: 1,
          title: "精简切片 第1段：痛点抓取与破局关键",
          targetDurationSec: 120,
          startSec: 0,
          endSec: 120,
          hook3s: "90%做短视频的人，都在前三秒犯了同一个致命错误！",
          coreConflict: "盲目堆砌华丽素材，却忽略了观众停下的心理钩子。",
          goldenQuote: "没有停留，就没有成交；开头抓不住，内容再好也是徒劳！",
          suggestedBgm: "科技感快节奏鼓点",
          suggestedStickers: ["警示红标", "重点划线"],
          subtitles: [
            { start: "00:00:00", end: "00:00:03", text: "90%做短视频的人都在前三秒犯了错误！" }
          ]
        }
      ]
    }
  }
}
