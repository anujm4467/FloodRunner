import { Injectable, Logger } from '@nestjs/common';
import { IQueueService } from '../interfaces/queueservice.interface';
import * as Amqp from 'amqp-ts';
import { Keys } from '../../constants/keys';

@Injectable()
export class RabbitQueueService implements IQueueService {
  private _logger = new Logger('RabbitQueueService');
  private _connection;
  private _agendaQueue;
  public agendaJobQueueName = 'testScheduleQueue';
  public elementQueueName = Keys.rabbitMqElementQueueName;

  constructor() {
    try {
      this._connection = new Amqp.Connection(Keys.rabbitMqConnectionString);
      this._agendaQueue = this._connection.declareQueue(
        this.agendaJobQueueName,
      );
      this._connection.completeConfiguration().then(() => {
        this._logger.debug(`RabbitMq connection established successfully.`);
      });
    } catch (err) {
      this._logger.error(
        'Error occurred while setting up RabbitMq connection...',
        err,
      );
      throw err;
    }
  }

  sendQueueMessage(message: string): void {
    this._logger.log(
      `Sending message: ${message} to queue: ${this.agendaJobQueueName}`,
    );
    const msg = new Amqp.Message(message);
    this._agendaQueue.send(msg);
  }

  registerQueueListener(
    queueName: string,
    callbackFunction: (message: string) => void,
  ) {
    this._logger.log(`Registering queue callback function`);

    const queue = this._connection.declareQueue(queueName);
    queue.activateConsumer(
      async message => {
        this._logger.debug(`Calling queue callback function`);
        await callbackFunction(message.getContent());
        message.ack(); //acknowledge message processed successfully.
      },
      { noAck: false },
    );
  }
}
