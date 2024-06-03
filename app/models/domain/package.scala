package models

import play.api.libs.json._

import scala.language.implicitConversions

package object domain {

  /**
    * JSON formatter for enumerations.
    */
  object EnumFormat {

    implicit def format[E <: Enumeration](enum: E): Format[E#Value] = {
      Format(reads(enum), writes)
    }

    def reads[E <: Enumeration](enum: E): Reads[E#Value] = {
      case JsString(s) =>
        try {
          JsSuccess(enum.withName(s))
        } catch {
          case _: NoSuchElementException =>
            JsError(
              s"Enumeration expected of type: '${enum.getClass}', but it does not appear to contain the value: '$s'"
            )
        }
      case _ => JsError("String value expected")
    }

    implicit def writes[E <: Enumeration]: Writes[E#Value] = (v: E#Value) => JsString(v.toString)
  }
}
