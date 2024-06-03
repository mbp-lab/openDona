package services

import com.google.inject.Inject
import com.typesafe.config.Config

final class ConfigBasedFeatureFlagService @Inject()(config: Config) extends FeatureFlagService {

  override def apply(feature: Feature): Boolean = feature match {
    case Features.SurveyIntegration => config.getBoolean("feature-flags.survey-integration-enabled")
    case Features.SocialDataStorage => config.getBoolean("feature-flags.social-data-storage-enabled")
  }
}
