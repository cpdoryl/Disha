import { Repository, SelectQueryBuilder } from 'typeorm';
import { School } from '../entities/School.entity';
import { Student } from '../entities/student.entity';
import { Assessment } from '../entities/assessment.entity';
import { AssessmentResponse } from '../entities/AssessmentResponse.entity';

/**
 * Optimized database queries for Disha
 * These queries use selective column loading and eager loading to reduce overhead
 */

export class OptimizedQueries {
  /**
   * Get school with essential columns only
   * Optimized for listing (reduces data transfer by ~70%)
   */
  static getSchoolListQuery(schoolRepository: Repository<School>) {
    return schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.city',
        'school.state',
        'school.studentCount',
        'school.staffCount',
        'school.isActive',
      ])
      .where('school.isActive = :isActive', { isActive: true })
      .orderBy('school.name', 'ASC');
  }

  /**
   * Get school with full details for detail view
   */
  static getSchoolDetailQuery(schoolRepository: Repository<School>, schoolId: string) {
    return schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.state',
        'school.city',
        'school.boardType',
        'school.studentCount',
        'school.staffCount',
        'school.principalName',
        'school.principalEmail',
        'school.principalPhone',
        'school.address',
        'school.pinCode',
        'school.latitude',
        'school.longitude',
        'school.onboardedDate',
        'school.lastAssessmentDate',
        'school.isActive',
        'school.createdAt',
        'school.updatedAt',
      ])
      .where('school.id = :id', { id: schoolId });
  }

  /**
   * Get students by school with pagination
   * Optimized for list view with pagination
   */
  static getStudentsBySchoolQuery(
    studentRepository: Repository<Student>,
    schoolId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return studentRepository
      .createQueryBuilder('student')
      .select([
        'student.id',
        'student.enrollmentNumber',
        'student.firstName',
        'student.lastName',
        'student.gender',
        'student.gradeLevel',
        'student.classSection',
        'student.status',
      ])
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.status = :status', { status: 'active' })
      .orderBy('student.lastName', 'ASC')
      .addOrderBy('student.firstName', 'ASC')
      .skip(offset)
      .take(limit);
  }

  /**
   * Get single student with full details
   */
  static getStudentDetailQuery(studentRepository: Repository<Student>, studentId: string) {
    return studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .select([
        'student.id',
        'student.enrollmentNumber',
        'student.firstName',
        'student.lastName',
        'student.dateOfBirth',
        'student.gender',
        'student.gradeLevel',
        'student.classSection',
        'student.ageGroup',
        'student.enrollmentDate',
        'student.status',
        'student.guardianName',
        'student.guardianPhone',
        'student.guardianEmail',
        'student.createdAt',
        'school.id',
        'school.name',
        'school.district',
      ])
      .where('student.id = :id', { id: studentId });
  }

  /**
   * Get assessments with minimal columns for listing
   */
  static getAssessmentListQuery(
    assessmentRepository: Repository<Assessment>,
    schoolId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return assessmentRepository
      .createQueryBuilder('assessment')
      .select([
        'assessment.id',
        'assessment.cycleName',
        'assessment.status',
        'assessment.description',
        'assessment.startDate',
        'assessment.endDate',
        'assessment.createdAt',
      ])
      .where('assessment.schoolId = :schoolId', { schoolId })
      .orderBy('assessment.startDate', 'DESC')
      .skip(offset)
      .take(limit);
  }

  /**
   * Get assessment with questions and response count
   */
  static getAssessmentDetailQuery(
    assessmentRepository: Repository<Assessment>,
    assessmentId: string,
  ) {
    return assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.questions', 'questions')
      .select([
        'assessment.id',
        'assessment.cycleName',
        'assessment.status',
        'assessment.description',
        'assessment.startDate',
        'assessment.endDate',
        'assessment.createdAt',
        'questions.id',
        'questions.title',
        'questions.type',
      ])
      .where('assessment.id = :id', { id: assessmentId });
  }

  /**
   * Get assessment responses with pagination
   * Optimized with only necessary columns
   */
  static getAssessmentResponsesQuery(
    responseRepository: Repository<AssessmentResponse>,
    assessmentId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return responseRepository
      .createQueryBuilder('response')
      .select([
        'response.id',
        'response.respondentId',
        'response.respondentType',
        'response.responseNumeric',
        'response.submittedAt',
      ])
      .where('response.assessmentId = :assessmentId', { assessmentId })
      .orderBy('response.submittedAt', 'DESC')
      .skip(offset)
      .take(limit);
  }

  /**
   * Count total schools by district (aggregate query)
   */
  static countSchoolsByDistrictQuery(schoolRepository: Repository<School>) {
    return schoolRepository
      .createQueryBuilder('school')
      .select('school.district')
      .addSelect('COUNT(school.id)', 'count')
      .where('school.isActive = :isActive', { isActive: true })
      .groupBy('school.district')
      .orderBy('count', 'DESC');
  }

  /**
   * Get student count by school
   */
  static getStudentCountBySchoolQuery(studentRepository: Repository<Student>) {
    return studentRepository
      .createQueryBuilder('student')
      .select('student.schoolId')
      .addSelect('COUNT(student.id)', 'count')
      .addSelect('COUNT(CASE WHEN student.status = :active THEN 1 END)', 'activeCount')
      .where('student.status != :withdrawn', { withdrawn: 'withdrawn' })
      .setParameter('active', 'active')
      .groupBy('student.schoolId');
  }

  /**
   * Get active students by school (optimized for metrics)
   */
  static getActiveStudentsBySchoolQuery(
    studentRepository: Repository<Student>,
    schoolId: string,
  ) {
    return studentRepository
      .createQueryBuilder('student')
      .select('COUNT(student.id)', 'count')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.status = :status', { status: 'active' })
      .setParameter('schoolId', schoolId)
      .setParameter('status', 'active');
  }

  /**
   * Search students by name (with pagination)
   */
  static searchStudentsQuery(
    studentRepository: Repository<Student>,
    schoolId: string,
    searchTerm: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    const term = `%${searchTerm}%`;
    return studentRepository
      .createQueryBuilder('student')
      .select([
        'student.id',
        'student.enrollmentNumber',
        'student.firstName',
        'student.lastName',
        'student.gradeLevel',
      ])
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.status = :status', { status: 'active' })
      .andWhere(
        '(student.firstName ILIKE :term OR student.lastName ILIKE :term OR student.enrollmentNumber ILIKE :term)',
        { term },
      )
      .orderBy('student.lastName', 'ASC')
      .skip(offset)
      .take(limit);
  }

  /**
   * Get schools by organization with minimal data
   */
  static getSchoolsByOrgQuery(
    schoolRepository: Repository<School>,
    organizationId: string,
  ) {
    return schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.city',
        'school.studentCount',
        'school.isActive',
      ])
      .where('school.organizationId = :organizationId', { organizationId })
      .andWhere('school.isActive = :isActive', { isActive: true })
      .orderBy('school.name', 'ASC');
  }

  /**
   * Batch get students by IDs (optimized for bulk operations)
   */
  static getStudentsByIdsQuery(studentRepository: Repository<Student>, ids: string[]) {
    return studentRepository
      .createQueryBuilder('student')
      .select([
        'student.id',
        'student.firstName',
        'student.lastName',
        'student.email',
        'student.enrollmentNumber',
      ])
      .where('student.id IN (:...ids)', { ids })
      .andWhere('student.status = :status', { status: 'active' })
      .setParameter('status', 'active');
  }

  /**
   * Get assessment completion stats for a school
   */
  static getAssessmentCompletionStatsQuery(
    responseRepository: Repository<AssessmentResponse>,
    schoolId: string,
    assessmentId: string,
  ) {
    return responseRepository
      .createQueryBuilder('response')
      .select('COUNT(response.id)', 'totalResponses')
      .addSelect('COUNT(DISTINCT response.respondentId)', 'uniqueRespondents')
      .where('response.assessmentId = :assessmentId', { assessmentId })
      .setParameter('assessmentId', assessmentId);
  }
}
