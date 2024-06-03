package models.api

import play.api.libs.json.{Format, Json}

case class DailySentReceivedPoint(
                                   year: Int,
                                   month: Int,
                                   date: Int,
                                   sentCount: Int,
                                   receivedCount: Int,
                                   epochSeconds: Long,
) extends Ordered[DailySentReceivedPoint] {

  override def compare(x: DailySentReceivedPoint): Int = {
    if (x.year < year) -1
    else if (x.year > year) 1
    else if (x.year == year && x.month < month) -1
    else if (x.year == year && x.month > month) 1
    else if (x.year == year && x.month == month && x.date < date) -1
    else if (x.year == year && x.month == month && x.date > date) 1
    else 0
  }

}

object DailySentReceivedPoint {
  implicit val jsonFormat: Format[DailySentReceivedPoint] = Json.format[DailySentReceivedPoint]
}
