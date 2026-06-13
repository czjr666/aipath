// 双语字段取值：field 为 { zh, en } 对象时按 lang 取（缺失回退 zh）；
// 否则原样返回 —— 兼容尚未双语化的纯字符串字段，迁移期更平滑。
export const pick = (field, lang) =>
  field && typeof field === 'object' && !Array.isArray(field) && ('zh' in field || 'en' in field)
    ? field[lang] ?? field.zh
    : field
