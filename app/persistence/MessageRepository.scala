package persistence

import models.domain.Message

import scala.concurrent.Future

trait MessageRepository {
  def insertBatch(message: Seq[Message]): Future[Unit]
}
