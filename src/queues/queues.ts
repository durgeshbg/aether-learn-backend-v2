import { Job, Queue, Worker, type QueueOptions } from 'bullmq';
import { JobType, Queues, type TestCaseExecutionJobData } from '../enums/queue.ts';
import CodeExecutionProcessor from './processors';

export default class QueueService {
  private queues!: Record<string, Queue>;

  private codeExecutionQueue!: Queue;
  private codeExecutionWorker!: Worker;

  private static instance: QueueService;

  private static QUEUE_OPTIONS: QueueOptions = {
    defaultJobOptions: {
      removeOnComplete: false, // this indicates if the job should be removed from the queue once it's complete
      removeOnFail: false, // this indicates if the job should be removed from the queue if it fails
    },
    connection: {
      url: process.env.REDIS_URL,
    },
  };

  constructor() {
    if (QueueService.instance instanceof QueueService) {
      return QueueService.instance;
    }

    this.queues = {};
    QueueService.instance = this;

    this.instantiateQueues();
    this.instantiateWorkers();
  }

  async instantiateQueues() {
    if (!process.env.REDIS_URL) {
      throw new Error(
        'REDIS_URL environment variable is not set. Please set it to connect to Redis.',
      );
    }

    this.codeExecutionQueue = new Queue(Queues.CODE_EXECUTION, QueueService.QUEUE_OPTIONS);
    this.queues[Queues.CODE_EXECUTION] = this.codeExecutionQueue;
  }

  getQueue(name: Queues) {
    return this.queues[name];
  }

  async instantiateWorkers() {
    this.codeExecutionWorker = new Worker(
      Queues.CODE_EXECUTION,
      async (job: Job<TestCaseExecutionJobData>) => {
        switch (job.name) {
          case JobType.TEST_CASE_EXECUTION:
            await CodeExecutionProcessor.runTest(job);
            break;
        }
      },

      { connection: QueueService.QUEUE_OPTIONS.connection },
    );

    this.codeExecutionWorker.on('completed', (job: Job<TestCaseExecutionJobData>, result) => {
      console.log(
        `[CODE EXECUTION QUEUE] Completed job with data\n
          Data: ${job.asJSON().data}\n
          ID: ${job.id}\n
          Result: ${JSON.stringify(result)}
        `,
      );
    });

    this.codeExecutionWorker.on(
      'failed',
      (job: Job<TestCaseExecutionJobData> | undefined, error) => {
        if (job) {
          console.error(
            `[CODE EXECUTION QUEUE] Failed job with data\n
            Data: ${job.asJSON().data}\n
            ID: ${job.id}\n
            Error: ${error}
          `,
          );
        } else {
          console.error(
            `[CODE EXECUTION QUEUE] Failed job\n
            Error: ${error}
          `,
          );
        }
      },
    );
  }
}
