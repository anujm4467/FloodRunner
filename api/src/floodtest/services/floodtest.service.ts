import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FloodTest } from '../repositories/schemas/flood-test.schema';
import { FloodTestResultSummary } from '../repositories/schemas/flood-test-result-summary.schema';
import { CreateFloodTestDto } from '../dtos/create-floodtest.dto';
import { AgendaService } from '../../scheduling/services/agenda.service';
import { FileService } from '../../storage/services/fileservice.service';
import { TestFileDto } from '../dtos/test-file.dto';
import { RabbitQueueService } from '../../messaging/services/rabbit-queue.service';
import { FloodTestRepository } from '../repositories/floodtest.repository';
import { User } from '../../auth/repositories/schemas/user.schema';
import { FloodTestResultSummaryRepository } from '../repositories/floodtest-result-summary.repository';
import * as mongoose from 'mongoose';

@Injectable()
export class FloodtestService {
  private _logger = new Logger('FloodTestService');
  private _maximumTestsAllowed = 1;

  constructor(
    @InjectModel('FloodTest') private floodTestModel: Model<FloodTest>,
    private floodTestRepository: FloodTestRepository,
    private floodTestResultSummaryRepository: FloodTestResultSummaryRepository,
    @InjectModel('FloodTestResultSummary')
    private floodTestResultSummaryModel: Model<FloodTestResultSummary>,
    private readonly agendaService: AgendaService,
    private readonly fileService: FileService,
    private readonly queueService: RabbitQueueService,
  ) {
    //setup job service
    agendaService.setup();

    //redefine all agenda jobs
    this.findAllIds().then(floodTestIds => {
      //re-define all agenda jobs here
      floodTestIds.forEach(floodTestId => {
        agendaService.defineJob(floodTestId);
      });

      //start job service
      agendaService.start();
    });
  }

  /**
   * Creates a Flood Element test
   * @param user the user entity
   * @param createFloodTestDto entity used to create a Flood Element test document
   * @param testFileDto entity that specifies the Flood Element test script
   */
  async create(
    user: User,
    createFloodTestDto: CreateFloodTestDto,
    testFileDto: TestFileDto,
  ): Promise<FloodTest> {
    //check user test quote
    const existingFloodTests = (await this.floodTestRepository.findAll(user))
      .length;
    if (existingFloodTests == this._maximumTestsAllowed) {
      this._logger.error('User test quota reached, cannot create new test.');
      throw new Error('User test quota reached, cannot create new test.');
    }

    const testId = new mongoose.Types.ObjectId().toHexString();
    this._logger.log(`Test id generated: ${testId}`);
    const testUri = await this.fileService.uploadFile(testId, testFileDto);
    const createdFloodTest = await this.floodTestRepository.create(
      testId,
      user,
      testUri,
      createFloodTestDto,
    );
    await this.agendaService.createJob(createdFloodTest);
    return createdFloodTest;
  }

  /**
   * Updates the Flood Element test
   * @param id id of flood element test
   * @param updateFloodTestDto update dto
   */
  async update(
    user: User,
    id: string,
    updateFloodTestDto: CreateFloodTestDto,
  ): Promise<FloodTest> {
    //update test
    var updatedFloodTest = await this.floodTestRepository.update(
      user,
      id,
      updateFloodTestDto,
    );

    //update scheduled job (optimization needed -> only update job if schedule is being updated)
    await this.agendaService.updateJob(updatedFloodTest);

    return updatedFloodTest;
  }

  /**
   * Deletes flood test from database and deletes Agenda job
   * @param user the user entity
   * @param floodTestId the id of the flood test
   */
  async delete(user: User, floodTestId: string) {
    var isDeleted = await this.floodTestRepository.delete(user, floodTestId);
    if (isDeleted) {
      await this.agendaService.deleteJob(floodTestId);
      await this.floodTestResultSummaryRepository.delete(floodTestId);
      await this.fileService.deleteContainer(floodTestId);
    }
  }

  /**
   * Finds all flood tests
   * @param user [optional] The user entity
   */
  async findAll(user?: User): Promise<FloodTest[]> {
    return this.floodTestRepository.findAll(user);
  }

  /**
   * Returns the ids of all created Flood Element tests
   */
  async findAllIds(): Promise<string[]> {
    const floodTests = await this.findAll();
    const floodTestIds = floodTests.map(floodTest => floodTest.id);
    return floodTestIds;
  }

  /**
   * Finds flood element test by id
   * @param user
   * @param id
   */
  async findById(user: User, id: string): Promise<FloodTest> {
    return await this.floodTestRepository.findById(user, id);
  }

  /**
   * Helper method to test sending to queue [DELETE]
   */
  async sendQueueMessage() {
    // this.queueService.sendQueueMessage('5eb5ba4427747c1693a29edb');
    this.queueService.sendQueueMessage('5eb696b37af25e011f37742d');
  }

  /**
   * Downloads the Flood Element test script with the specified id
   * @param id id of Flood Element test
   */
  async downloadTestScript(user: User, id: string): Promise<string> {
    return this.fileService.downloadFile(id);
  }

  /**
   * Returns the flood test result summaries
   * @param id id of Flood Element test
   * @param limit number of results to return (default: 72. Allows last 12 hours of results if interval set to minimum: 10 minutes)
   */
  async getTestResults(
    id: string,
    limit: number = 72,
  ): Promise<FloodTestResultSummary[]> {
    const testResults = await this.floodTestResultSummaryModel
      .find({
        testId: id,
      })
      .limit(limit)
      .sort({ runOn: -1 }); //sort by date ascending
    return testResults;
  }
}
