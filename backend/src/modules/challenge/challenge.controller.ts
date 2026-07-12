import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { Challenge, ChallengeCategory } from 'src/database/entities/challenge.entity';

@Controller('challenges')
@ApiTags('Challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all challenges for selection menu' })
  @ApiResponse({ status: 200, description: 'List of all available challenges', type: [Challenge] })
  async getAllChallenges(): Promise<Challenge[]> {
    return this.challengeService.getAllChallenges();
  }

  @Get('by-category/:category')
  @ApiOperation({ summary: 'Get challenges filtered by category' })
  @ApiResponse({ status: 200, description: 'Challenges in the specified category', type: [Challenge] })
  async getChallengesByCategory(@Param('category') category: string): Promise<Challenge[]> {
    return this.challengeService.getChallengesByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details with questions' })
  @ApiResponse({ status: 200, description: 'Challenge details including questions', type: Challenge })
  async getChallengeById(@Param('id') id: string): Promise<Challenge> {
    return this.challengeService.getChallengeById(id);
  }

  @Post('selected')
  @ApiOperation({ summary: 'Get multiple selected challenges' })
  @ApiResponse({ status: 200, description: 'Selected challenges with their questions', type: [Challenge] })
  async getSelectedChallenges(@Body() body: { challengeIds: string[] }): Promise<Challenge[]> {
    return this.challengeService.getSelectedChallenges(body.challengeIds);
  }
}
