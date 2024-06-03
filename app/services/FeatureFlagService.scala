package services

trait FeatureFlagService extends (Feature => Boolean)

sealed trait Feature

object Features {
  case object SurveyIntegration extends Feature
  case object SocialDataStorage extends Feature
}
