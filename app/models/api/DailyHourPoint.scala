package models.api

import play.api.libs.json.{Format, Json}

case class DailyHourPoint(
                              year: Int,
                              month: Int,
                              date: Int,
                              hour: Int,
                              minute: Int,
                              wordCount: Int,
                              epochSeconds: Long,
                            ) extends Ordered[DailyHourPoint] {

  override def compare(x: DailyHourPoint): Int = {
    if (x.year < year) -1
    else if (x.year > year) 1
    else if (x.year == year && x.month < month) -1
    else if (x.year == year && x.month > month) 1
    else if (x.year == year && x.month == month && x.date < date) -1
    else if (x.year == year && x.month == month && x.date > date) 1
    else if (x.year == year && x.month == month && x.date == date && x.minute < minute) -1
    else if (x.year == year && x.month == month && x.date == date && x.minute > minute) 1
    else 0
  }
}

object DailyHourPoint {
  implicit val jsonFormat: Format[DailyHourPoint] = Json.format[DailyHourPoint]
}
