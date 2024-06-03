package config

import com.typesafe.config.Config

import scala.concurrent.duration.Duration

case class FeedbackConfig(maximumResponseWait: Duration, maximumSampleSize: Int)

object FeedbackConfig {

  def apply(config: Config): FeedbackConfig = {
    val javaDuration = config.getDuration("maximumResponseTime")
    FeedbackConfig(Duration.fromNanos(javaDuration.toNanos), config.getInt("maximumSampleSize"))
  }

}
