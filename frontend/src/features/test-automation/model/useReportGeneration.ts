import { useMemo } from 'react';
import { TestExecution, ReportData } from '../../../entities/test-execution';

export const useReportGeneration = (currentExecution: TestExecution[]) => {
  const generateReportData = (): ReportData | null => {
    const allExecutions = [...currentExecution];
    if (allExecutions.length === 0) return null;

    const totalTests = allExecutions.length;
    const successCount = allExecutions.filter(e => e.status === 'success').length;
    const failureCount = allExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
    
    const executionsWithResponseTime = allExecutions.filter(e => e.responseTime);
    const avgResponseTime = executionsWithResponseTime.length > 0 
      ? executionsWithResponseTime.reduce((sum, e) => sum + (e.responseTime || 0), 0) / executionsWithResponseTime.length
      : 0;

    const validationTests = allExecutions.filter(e => e.validationEnabled && e.type !== 'pipeline');
    const validationPassed = validationTests.filter(e => e.validationResult?.passed).length;
    const validationRate = validationTests.length > 0 ? (validationPassed / validationTests.length) * 100 : 0;

    const failedTests = allExecutions.filter(e => e.status === 'failed');
    
    const statusCodeStats = allExecutions.reduce((acc: Record<number, number>, e) => {
      if (e.type === 'pipeline' && e.stepExecutions) {
        e.stepExecutions.forEach(step => {
          if (step.statusCode) {
            acc[step.statusCode] = (acc[step.statusCode] || 0) + 1;
          }
        });
      } else if (e.statusCode) {
        acc[e.statusCode] = (acc[e.statusCode] || 0) + 1;
      }
      return acc;
    }, {});

    const pipelines = allExecutions.filter(e => e.type === 'pipeline');
    const pipelineStats = {
      totalPipelines: pipelines.length,
      successfulPipelines: pipelines.filter(p => p.status === 'success').length,
      failedPipelines: pipelines.filter(p => p.status === 'failed').length,
      totalSteps: pipelines.reduce((sum, p) => sum + (p.stepExecutions?.length || 0), 0),
      successfulSteps: pipelines.reduce((sum, p) => 
        sum + (p.stepExecutions?.filter(s => s.status === 'success').length || 0), 0),
      failedSteps: pipelines.reduce((sum, p) => 
        sum + (p.stepExecutions?.filter(s => s.status === 'failed').length || 0), 0)
    };

    return {
      summary: {
        totalTests,
        successCount,
        failureCount,
        successRate,
        avgResponseTime,
        validationTests: validationTests.length,
        validationPassed,
        validationRate
      },
      executions: allExecutions,
      failedTests,
      statusCodeStats,
      pipelineStats
    };
  };

  const reportData = useMemo(() => generateReportData(), [currentExecution]);

  return {
    reportData,
    generateReportData
  };
};