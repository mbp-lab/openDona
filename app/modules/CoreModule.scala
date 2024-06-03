package modules

import com.google.inject.{AbstractModule, Provides, TypeLiteral}
import com.typesafe.config.Config
import config.{FeedbackConfig, SurveyConfig, FeedbackSurveyConfig}
import models.domain.ExternalDonorId
import persistence._
import services._

import scala.util.Random

final class CoreModule extends AbstractModule {
  override def configure(): Unit = {
    bind(classOf[SocialDataService]).toProvider(classOf[SocialDataServiceProvider])
    bind(classOf[ConversationParticipantRepository]).to(classOf[SlickConversationParticipantRepository])
    bind(classOf[ConversationRepository]).to(classOf[SlickConversationRepository])
    bind(classOf[MessageRepository]).to(classOf[SlickMessageRepository])
    bind(classOf[MessageAudioRepository]).to(classOf[SlickMessageAudioRepository])
    bind(new TypeLiteral[DonationService] {}).to(classOf[IdVerifyingDonationService])
    bind(new TypeLiteral[DonationRepository] {}).to(classOf[SlickDonationRepository])
    bind(new TypeLiteral[Random] {}).toInstance(new Random())
    bind(new TypeLiteral[DataSourceDescriptionService] {}).to(classOf[InMemoryDataSourceDescriptionService])
    bind(classOf[FeatureFlagService]).to(classOf[ConfigBasedFeatureFlagService])
  }

  @Provides
  def provideDonorIdGeneration(random: Random): () => ExternalDonorId = () => ExternalDonorId.generate(random)

  @Provides
  def provideSurveyConfig(config: Config, featureFlagService: FeatureFlagService): SurveyConfig =
    SurveyConfig(config.getConfig("donor-survey"), featureFlagService(Features.SurveyIntegration))

  @Provides
  def provideFeedbackSurveyConfig(config: Config): FeedbackSurveyConfig = 
    FeedbackSurveyConfig(config.getConfig("feedback-survey"))

  @Provides
  def provideFeedbackConfig(config: Config): FeedbackConfig = FeedbackConfig(config.getConfig("feedback"))
}
