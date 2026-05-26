import { inferGradeFromText } from "@/utils/gradeInference"
import type { ContextFields } from "@/utils/importStudents/types"

export function inferContextFromName(sourceName = ""): ContextFields {
  let text = sourceName.replace(/\.[^.]+$/, "")
  const context: ContextFields = {}

  const inferredGrade = inferGradeFromText(text)
  if (inferredGrade) {
    context.grade = inferredGrade
    text = text
      .replace(/(20\d{2}|19\d{2})\s*(级|届)/, "")
      .replace(/高\s*[一二三123](?:年级|级)?/, "")
      .replace(/初\s*[一二三123](?:年级|级)?/, "")
      .replace(/[七八九789]\s*年级/, "")
  }

  const courseMatch = text.match(/([\u4e00-\u9fa5A-Za-z0-9]+(?:课程|专业课|课))/)
  if (courseMatch) context.course = courseMatch[1].replace(/名单$/, "")

  const majorMatch = text.match(/([\u4e00-\u9fa5]{2,12}(?:工程|技术|科学|管理|设计|教育|医学|法学|文学|经济学|会计|金融|英语|数学))/)
  if (majorMatch) {
    context.major = majorMatch[1]
    text = text.replace(majorMatch[1], "")
  }

  const classMatch = text.match(/([\u4e00-\u9fa5A-Za-z]{1,8}(?:\(\d+\)|（\d+）|\d+)班)/)
  if (classMatch) context.className = classMatch[1]

  const departmentMatch = text.match(/([\u4e00-\u9fa5]{2,14}(?:学院|系|系部))/)
  if (departmentMatch) context.department = departmentMatch[1]

  return context
}
