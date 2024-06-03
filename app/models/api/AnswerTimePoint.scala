package models.api

import play.api.libs.json.{Format, Json}

case class AnswerTimePoint(
                            timeInMs: Int,
                            isDonor: Boolean,
                            epochMs: Long,
                          )

object AnswerTimePoint {
  implicit val jsonFormat: Format[AnswerTimePoint] = Json.format[AnswerTimePoint]

}
