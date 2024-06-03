package controllers

import play.api.data.Form
import play.api.data.Forms._
import play.api.data.validation.Constraints._

object SocialDataForm {
  case class SocialFormData(inputJson: String)

  val socialDataForm: Form[SocialFormData] = Form(
    mapping(
      "inputJson" -> text.verifying(nonEmpty),
    )(SocialFormData.apply)(SocialFormData.unapply)
  )
}
