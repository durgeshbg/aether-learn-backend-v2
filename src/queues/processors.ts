import { Job } from 'bullmq';
import QueueService from './queues';
import axios from 'axios';
import { Queues, type TestCaseExecutionJobData } from '../enums/queue';

export default class CodeExecutionProcessor {
  static async runTest(job: Job<TestCaseExecutionJobData>) {
    const queue = new QueueService().getQueue(Queues.CODE_EXECUTION);
    if (!queue) return;

    try {
      const { data } = await axios.post(
        'https://' + process.env.JUDGE0_HOST + '/submissions',
        {
          source_code: job.data.sourceCode,
          language_id: job.data.languageId,
          stdin: job.data.stdin,
          expected_output: job.data.expectedOutput,
          callback_url: `${process.env.JUDGE0_CB_BASE}/api/v1/courses/${job.data.courseId}/code-assessments/${job.data.codeAssessmentId}/code-solutions/${job.data.codeSolutionId}/test-cases/${job.data.testCaseId}/judge0-submission/${process.env.JUDGE0_AUTH_TOKEN}`,
        },
        {
          params: {
            base64_encoded: 'false',
          },
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-key': process.env.JUDGE0_AUTH_TOKEN || '',
            'x-rapidapi-host': process.env.JUDGE0_HOST || '',
          },
        },
      );

      console.log(`Process job with id ${job.id} from the ${Queues.CODE_EXECUTION} queue`);

      return data;
    } catch (error) {
      console.error(`Error running test: ${error}`);
    }
  }
}
