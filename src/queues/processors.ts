import { Job } from 'bullmq';
import QueueService from './queues';
import axios from 'axios';
import { Queues, type TestCaseExecutionJobData } from '../enums/queue';

export default class CodeExecutionProcessor {
  static async runTest(job: Job<TestCaseExecutionJobData>) {
    const queue = new QueueService().getQueue(Queues.CODE_EXECUTION);
    if (!queue) return;

    const { data } = await axios.post(
      process.env.JUDGE0_URL + '/submissions',
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
          'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN || '',
        },
      },
    );

    const testingCallbackUrl = `${process.env.JUDGE0_CB_BASE}/api/v1/courses/${job.data.courseId}/code-assessments/${job.data.codeAssessmentId}/code-solutions/${job.data.codeSolutionId}/test-cases/${job.data.testCaseId}/judge0-submission/${process.env.JUDGE0_AUTH_TOKEN}`;
    const { data: testingCallbackData } = await axios.get(testingCallbackUrl);
    console.log(`Testing callback data: ${JSON.stringify(testingCallbackData)}`);

    console.log(`Process job with id ${job.id} from the ${Queues.CODE_EXECUTION} queue`);

    return data;
  }
}
