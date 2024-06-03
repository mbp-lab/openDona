package models.api

import play.api.libs.json.{Format, Json}

case class FromToYearMonthSentCount(
                                         from: String,
                                         to: String,
                                         year: Int,
                                         month: Int,
                                         sentCount: Int,
                                       ) extends Ordered[FromToYearMonthSentCount] {

  override def compare(x: FromToYearMonthSentCount): Int = {
    //if (x.friend != friend) -1 // smaller if friend is not the same...?
    if (x.year < year) -1
    else if (x.year > year) 1
    else if (x.year == year && x.month < month) -1
    else if (x.year == year && x.month > month) 1
    else 0
  }
}

object FromToYearMonthSentCount {
  implicit val jsonFormat: Format[FromToYearMonthSentCount] = Json.format[FromToYearMonthSentCount]
}
