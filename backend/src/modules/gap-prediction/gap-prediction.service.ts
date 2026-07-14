import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentResponse } from 'src/database/entities';
import { GapPrediction, TrendDirection, ConfidenceTier } from 'src/database/entities/gap-prediction.entity';
import { Challenge } from 'src/database/entities/challenge.entity';

export interface PriorityGapResult {
  challengeId: string;
  challengeName: string;
  selfReportedSeverity: number;
  dataConfirmedSeverity: number | null;
  trendDirection: TrendDirection;
  confidenceTier: ConfidenceTier;
  combinedScore: number;
  priorityRank: number;
  urgencyFactor: number;
  evidence: string[];
}

@Injectable()
export class GapPredictionService {
  constructor(
    @InjectRepository(GapPrediction)
    private gapPredictionRepository: Repository<GapPrediction>,
    @InjectRepository(AssessmentResponse)
    private assessmentResponseRepository: Repository<AssessmentResponse>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  /**
   * Calculate self-reported severity from owner assessment responses
   * Analyzes owner's perception of challenge severity
   */
  private calculateSelfReportedSeverity(responses: AssessmentResponse[]): number {
    if (responses.length === 0) return 0;

    const numericAnswers = responses
      .filter((r) => r.responseNumeric !== undefined && r.responseNumeric !== null)
      .map((r) => r.responseNumeric);

    if (numericAnswers.length === 0) return 0;

    const average = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;
    return Math.min(1, average / 5); // Normalize 5-point scale to 0-1
  }

  /**
   * Calculate data-confirmed severity by comparing actual metrics to sector benchmarks
   * Returns null if no data available
   */
  private calculateDataConfirmedSeverity(): number | null {
    // Phase 1: Placeholder for full benchmark integration
    // In Phase 2+, this will compare against Business & Operations Market Survey benchmarks
    return null;
  }

  /**
   * Determine trend direction based on historical data
   * For Phase 1, returns UNKNOWN since we don't have historical data yet
   */
  private determineTrendDirection(): TrendDirection {
    // Phase 1: No historical data yet
    return TrendDirection.UNKNOWN;
  }

  /**
   * Determine confidence tier based on data sources
   */
  private determineConfidenceTier(sources: string[]): ConfidenceTier {
    if (!sources || sources.length === 0) return ConfidenceTier.TIER_C;
    if (sources.includes('hard_record')) return ConfidenceTier.TIER_A;
    if (sources.includes('estimated')) return ConfidenceTier.TIER_B;
    return ConfidenceTier.TIER_C;
  }

  /**
   * Calculate combined score = severity × urgency × confidence
   */
  private calculateCombinedScore(severity: number, urgency: number, confidence: number): number {
    return severity * urgency * confidence;
  }

  /**
   * Generate priority gap report for the first assessment
   * Returns top 1-3 ranked gaps
   */
  async generatePriorityGaps(
    schoolId: string,
    academicYear: string,
    selectedChallengeIds: string[],
    assessmentResponses: Map<string, AssessmentResponse[]>,
  ): Promise<PriorityGapResult[]> {
    // Get selected challenges
    const challenges = await this.challengeRepository.find({
      where: selectedChallengeIds.map((id) => ({ id })),
    });
    const challengeMap = new Map(challenges.map((c) => [c.id, c]));

    // Calculate gap for each selected challenge
    const gaps: GapPrediction[] = [];

    for (const challengeId of selectedChallengeIds) {
      const challenge = challengeMap.get(challengeId);
      if (!challenge) continue;

      const responses = assessmentResponses.get(challengeId) || [];

      // Calculate scores
      const selfReportedSeverity = this.calculateSelfReportedSeverity(responses);
      const dataConfirmedSeverity = this.calculateDataConfirmedSeverity();
      const trendDirection = this.determineTrendDirection();
      const confidenceTier = this.determineConfidenceTier(['survey']);

      // Default urgency for Phase 1
      const urgencyFactor = 1.0;

      // Confidence multiplier: A=1.0, B=0.7, C=0.4
      const confidenceMultiplier =
        confidenceTier === ConfidenceTier.TIER_A ? 1.0 : confidenceTier === ConfidenceTier.TIER_B ? 0.7 : 0.4;

      const usedSeverity = dataConfirmedSeverity !== null ? dataConfirmedSeverity : selfReportedSeverity;
      const combinedScore = this.calculateCombinedScore(usedSeverity, urgencyFactor, confidenceMultiplier);

      const gapData: Partial<GapPrediction> = {
        schoolId,
        academicYear,
        challengeId,
        selfReportedSeverity,
        dataConfirmedSeverity: dataConfirmedSeverity ?? undefined,
        trendDirection,
        confidenceTier,
        combinedScore,
        priorityRank: 0, // Will be set after sorting
        urgencyFactor,
        dataSources: ['assessment_survey'],
      };

      const gap = this.gapPredictionRepository.create(gapData);
      gaps.push(gap);
    }

    // Sort by combined score and assign ranks
    gaps.sort((a, b) => b.combinedScore - a.combinedScore);
    gaps.forEach((gap, index) => {
      gap.priorityRank = index + 1;
    });

    // Save gap predictions
    await this.gapPredictionRepository.save(gaps);

    // Return top 3 gaps as results
    const topGaps = gaps.slice(0, 3);
    const results: PriorityGapResult[] = [];

    for (const gap of topGaps) {
      const challenge = challengeMap.get(gap.challengeId)!;
      results.push({
        challengeId: gap.challengeId,
        challengeName: challenge.displayName,
        selfReportedSeverity: gap.selfReportedSeverity || 0,
        dataConfirmedSeverity: gap.dataConfirmedSeverity || null,
        trendDirection: gap.trendDirection,
        confidenceTier: gap.confidenceTier,
        combinedScore: gap.combinedScore || 0,
        priorityRank: gap.priorityRank || 0,
        urgencyFactor: gap.urgencyFactor || 1.0,
        evidence: gap.dataSources || ['Assessment responses'],
      });
    }

    return results;
  }

  /**
   * Get gap predictions for a school
   */
  async getSchoolGaps(schoolId: string, academicYear: string): Promise<GapPrediction[]> {
    return this.gapPredictionRepository.find({
      where: { schoolId, academicYear },
      relations: ['challenge'],
      order: { priorityRank: 'ASC' },
    });
  }
}
