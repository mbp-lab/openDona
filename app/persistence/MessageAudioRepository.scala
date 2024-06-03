package persistence

import models.domain.MessageAudio

import scala.concurrent.Future

trait MessageAudioRepository {
  def insertBatch(message: Seq[MessageAudio]): Future[Unit]
}
