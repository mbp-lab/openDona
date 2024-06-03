package models.api

import play.api.libs.json.{Format, Json}

case class FromToListYearMonthSentCount(
                                    from: String,
                                    to: List[String],
                                    year: Int,
                                    month: Int,
                                    sentCount: Int,
                                  ) extends Ordered[FromToListYearMonthSentCount] {

  override def compare(x: FromToListYearMonthSentCount): Int = {
      //if (x.friend != friend) -1 // smaller if friend is not the same...?
      if (x.year < year) -1
      else if (x.year > year) 1
      else if (x.year == year && x.month < month) -1
      else if (x.year == year && x.month > month) 1
      else 0
  }
}

object FromToListYearMonthSentCount {
  implicit val jsonFormat: Format[FromToListYearMonthSentCount] = Json.format[FromToListYearMonthSentCount]
}
