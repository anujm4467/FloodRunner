export class FloodTestResultSummaryDto {
  readonly testId: string;
  readonly testRunName: string;
  isCompleted: null | boolean;
  isSuccessful: null | boolean;
  logFileUris: null | string[];
  screenShotUris: null | string[];
  readonly runOn: Date;
}
