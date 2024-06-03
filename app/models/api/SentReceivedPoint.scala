package models.api

import play.api.libs.json.{Format, Json}

case class SentReceivedPoint(
  year: Int,
  month: Int,
  sentCount: Int,
  receivedCount: Int
) extends Ordered[SentReceivedPoint] {

  override def compare(x: SentReceivedPoint): Int = {
    if (x.year < year) -1
    else if (x.year > year) 1
    else if (x.year == year && x.month < month) -1
    else if (x.year == year && x.month > month) 1
    else 0
  }
}

object SentReceivedPoint {
  implicit val jsonFormat: Format[SentReceivedPoint] = Json.format[SentReceivedPoint]
}
